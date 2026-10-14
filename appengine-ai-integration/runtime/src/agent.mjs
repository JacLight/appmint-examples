// One AI employee, running: signs in as itself, says hello, reads its
// briefing, and works its queue — each job in a Claude Code session that can
// only act through `./ae`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AppEngine, SignInError } from './appengine.mjs';
import { runClaude } from './claude.mjs';
import { sessionForBriefing } from './session-briefing.mjs';
import { ChatLink } from './chat.mjs';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AE_BIN = path.join(ROOT, 'bin', 'ae');
const POLL_MS = Number(process.env.AIE_POLL_MS || 15000);
// Each employee's home: <store>/<orgId>/<its user sk>/ — where its Claude
// sessions run and its memory folder lives, kept across jobs and restarts.
const STORE_DIR = process.env.AIE_STORE ? path.resolve(process.env.AIE_STORE) : null;
const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
const clip = (s, n = 2000) => (String(s).length > n ? String(s).slice(0, n) + '…' : String(s));

export class Agent {
  constructor(rec, store) {
    this.rec = rec;
    this.store = store;
    this.state = 'stopped';
    this.detail = 'Not started.';
    this.lastActivityAt = null;
    this.currentJob = null;
    this.greeted = false;
    this.briefing = null;
    this.logLines = [];
    this.dir = path.join(store.dir, 'agents', rec.agentId);
    fs.mkdirSync(path.join(this.dir, 'jobs'), { recursive: true });
    // The session runs `./ae` from its own folder.
    fs.writeFileSync(path.join(this.dir, 'ae'), `#!/bin/sh\nexec node "${AE_BIN}" "$@"\n`, { mode: 0o755 });
    this.connect();
  }

  connect() {
    this.ae = new AppEngine({ apiBaseUrl: this.rec.apiBaseUrl, orgId: this.rec.orgId, signIn: this.rec.signIn, log: (m) => this.log(m) });
    this.chat?.close();
    this.chat = new ChatLink({ apiBaseUrl: this.rec.apiBaseUrl, orgId: this.rec.orgId, log: (m) => this.log(m) });
    // What its sessions show to send a chat message through this agent's own connection.
    this.chatSecret = crypto.randomBytes(18).toString('hex');
    this.greeted = false;
    this.briefing = null;
  }

  log(line) {
    const entry = `${new Date().toISOString()} ${line}`;
    this.logLines.push(entry);
    if (this.logLines.length > 300) this.logLines.shift();
    if (this.removed) return;
    // A log line must never take the server down (the folder goes when the agent is removed).
    try {
      fs.appendFileSync(path.join(this.dir, 'log.txt'), entry + '\n');
    } catch {}
  }

  set(state, detail) {
    if (state !== this.state || detail !== this.detail) this.log(`${state}: ${detail}`);
    this.state = state;
    this.detail = detail;
  }

  status() {
    return {
      agentId: this.rec.agentId,
      orgId: this.rec.orgId,
      employee: this.rec.name,
      title: this.rec.title,
      desired: this.rec.desired,
      state: this.rec.desired === 'stopped' ? 'stopped' : this.state,
      detail: this.rec.desired === 'stopped' ? 'Stopped here.' : this.detail,
      lastActivityAt: this.lastActivityAt,
      currentJob: this.currentJob,
      lastJob: this.lastJob || null,
      chat: this.chat?.online ? 'online' : 'offline',
      rememberedSessions: Object.values(this.rec.jobs || {}).filter((j) => j?.sessionId).length + (this.rec.lastSessionId ? 1 : 0),
      model: this.rec.model || process.env.AIE_MODEL || 'sonnet',
      createdAt: this.rec.createdAt,
      updatedAt: this.rec.updatedAt,
    };
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.set('starting', 'Signing in.');
    const loop = async () => {
      while (this.running && this.rec.desired === 'running') {
        try {
          await this.tick();
        } catch (e) {
          this.set('error', e.message);
        }
        await new Promise((r) => setTimeout(r, POLL_MS));
      }
      this.running = false;
      this.set('stopped', 'Stopped here.');
    };
    loop();
  }

  /** `now`: end the job it is on too, rather than letting it finish. */
  stop({ now = false } = {}) {
    this.rec.desired = 'stopped';
    this.running = false;
    this.chat?.close();
    if (now && this.child && this.child.exitCode === null) {
      this.child.kill('SIGTERM');
      this.set('stopped', 'Shut down.');
    }
  }

  /** Drop the conversations it would resume after an approval — its working memory of past jobs. */
  forget() {
    const n = Object.values(this.rec.jobs || {}).filter((j) => j?.sessionId).length + (this.rec.lastSessionId ? 1 : 0);
    for (const j of Object.values(this.rec.jobs || {})) if (j) delete j.sessionId;
    delete this.rec.lastSessionId;
    // Its memory goes too: a clean start.
    if (this.rec.home) {
      fs.rmSync(path.join(this.rec.home, 'memory'), { recursive: true, force: true });
      this.home(this.rec.home);
    }
    return n;
  }

  /**
   * Its home, made ready: the memory folder (the one place it may write),
   * which Claude loads into every session as its own memory, and ./ae (read-only
   * to it). Its token stays in the job folder, outside the home.
   */
  home(dir) {
    fs.mkdirSync(path.join(dir, 'memory'), { recursive: true });
    const index = path.join(dir, 'memory', 'MEMORY.md');
    if (!fs.existsSync(index)) fs.writeFileSync(index, '');
    // Claude loads the memory folder itself (autoMemoryDirectory) — no import here, or it loads twice.
    fs.rmSync(path.join(dir, 'CLAUDE.md'), { force: true });
    const ae = path.join(dir, 'ae');
    fs.rmSync(ae, { force: true });
    fs.writeFileSync(ae, `#!/bin/sh\nexec node "${AE_BIN}" "$@"\n`, { mode: 0o555 });
    return dir;
  }

  /** One look at the queue, the way a person checks in. */
  async tick() {
    try {
      if (!this.greeted) {
        await this.ae.login();
        const hi = await this.ae.call('POST', 'ai-employees/me/hello', { provider: 'session-manager', agentId: this.rec.agentId, model: this.rec.model || process.env.AIE_MODEL || 'sonnet', version: VERSION });
        if (!hi.ok) throw new Error(`hello refused: ${hi.status} ${hi.json?.error || ''}`);
        const b = await this.ae.call('GET', 'ai-employees/me/briefing');
        if (!b.ok) throw new Error(`briefing refused: ${b.status} ${b.json?.error || ''}`);
        this.briefing = b.json;
        this.greeted = true;
        this.chat.connect(this.ae.token);
        this.log(`hello sent; briefing read (${b.json?.work?.open?.length || 0} open jobs)`);
      }
    } catch (e) {
      if (e instanceof SignInError && e.status === 403) {
        this.chat?.close();
        return this.set('locked', 'Its login is locked — switch it on in AI Employees.');
      }
      if (e instanceof SignInError) return this.set('error', `Cannot sign in: ${e.message}`);
      throw e;
    }

    const l = await this.ae.call('POST', `ai-employees/worker/${this.rec.name}/lease`, { worker: this.rec.agentId });
    this.lastActivityAt = new Date().toISOString();
    if (l.status === 403 || l.status === 401) {
      this.greeted = false;
      this.chat?.close();
      return this.set('locked', l.json?.error || 'Refused — it may have been paused.');
    }
    if (!l.ok) return this.set('error', `Lease refused: ${l.status} ${l.json?.error || ''}`);
    // A new sign-in means a new token: the chat connection follows it.
    if (this.chat.token !== this.ae.token || !this.chat.socket) this.chat.connect(this.ae.token);
    if (!l.json?.job) return this.set('idle', l.json?.reason || 'Nothing to do.');
    await this.work(l.json.job);
  }

  /** The work's image attachments, fetched as the employee: images only, up to 6, each under 5 MB. Anything else stays a link in the text. */
  async imagesOf(job) {
    const out = [];
    for (const a of (job.data?.attachments || []).filter((x) => x?.kind === 'file').slice(0, 6)) {
      try {
        let url = a.url;
        if (a.path) {
          const r = await this.ae.call('POST', 'repository/file/signurl', { location: a.path, options: { expiry: 300 } });
          const j = r?.json;
          url = (typeof j === 'string' ? j : j?.signedUrl || j?.url || j?.data?.signedUrl || j?.data?.url) || url;
        }
        if (!/^https?:\/\//i.test(url || '')) continue;
        const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
        const type = String(res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
        if (!res.ok || !/^image\/(png|jpeg|gif|webp)$/.test(type)) continue;
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 5_000_000) continue;
        out.push({ mediaType: type, data: buf.toString('base64') });
      } catch (e) {
        this.log(`could not fetch attachment ${a.label || ''}: ${e.message}`);
      }
    }
    return out;
  }

  async work(job) {
    const jobId = String(job.sk);
    const jobDir = path.join(this.dir, 'jobs', jobId);
    fs.mkdirSync(jobDir, { recursive: true });
    const outcomeFile = path.join(jobDir, 'outcome.json');
    fs.rmSync(outcomeFile, { force: true });
    // What it is told can change at any time; read it fresh for every job.
    const fresh = await this.ae.call('GET', 'ai-employees/me/briefing').catch(() => null);
    if (fresh?.ok) this.briefing = fresh.json;
    const me = this.briefing?.identity || {};
    const homeDir = STORE_DIR || path.join(this.store.dir, 'store');
    this.rec.home = this.home(path.join(homeDir, String(this.rec.orgId), String(me.userId || this.rec.agentId)));
    const statePath = path.join(jobDir, 'state.json');
    fs.writeFileSync(statePath, JSON.stringify({ apiBaseUrl: this.ae.base, orgId: this.rec.orgId, token: this.ae.token, worker: this.rec.agentId, jobId, outcomeFile, fileAttachments: (job.data?.attachments || []).filter(a => a?.kind === 'file').map(a => ({ path: a.path, mime: a.mime })), me: this.rec.signIn.email, name: me.handle || null, userId: me.userId || null, local: { url: `http://127.0.0.1:${process.env.AIE_PORT || 3400}/local/agents/${encodeURIComponent(this.rec.agentId)}`, secret: this.chatSecret } }), { mode: 0o600 });
    const mem = (this.rec.jobs[jobId] ||= {});
    const decision = (job.data?.decisions || []).slice(-1)[0];
    const resuming = !!(mem.sessionId && decision && decision.at !== mem.lastDecisionAt);
    this.currentJob = { jobId, title: job.data?.title, since: new Date().toISOString() };
    this.lastJob = this.currentJob;
    const metaFile = path.join(jobDir, 'meta.json');
    const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, 'utf8')) : { jobId, title: job.data?.title, instructions: job.data?.instructions || '', firstStartedAt: new Date().toISOString() };
    fs.writeFileSync(metaFile, JSON.stringify({ ...meta, lastStartedAt: new Date().toISOString(), turns: (meta.turns || 0) + 1 }));
    // What the console follows: one line per turn, then the session's own events.
    fs.appendFileSync(path.join(jobDir, 'transcript.jsonl'), JSON.stringify({ at: new Date().toISOString(), type: 'turn', resuming, prompt: resuming ? 'Resumed after a decision' : job.data?.title }) + '\n');
    this.set('working', `On “${job.data?.title}”${resuming ? ' (after a decision)' : ''}.`);

    const step = (kind, text, extra = {}) => this.ae.call('POST', `ai-employees/worker/work/${jobId}/step`, { worker: this.rec.agentId, kind, text: clip(text), ...extra }).catch(() => null);

    // Someone is waiting in a chat for this: they see "… is thinking" for as long as the job runs.
    const chatId = job.data?.ref?.datatype === 'chat' ? String(job.data.ref.id || '') : '';
    const myEmail = String(this.rec.signIn?.email || '').toLowerCase();
    const waiting = chatId ? chatId.split('|').find((p) => p && p.toLowerCase() !== myEmail) : '';
    const showThinking = () => waiting && this.chat.status({ to: waiting, chatId, status: 'thinking' });
    showThinking();
    const thinking = waiting
      ? setInterval(() => (this.currentJob?.jobId === jobId ? showThinking() : clearInterval(thinking)), 2500)
      : null;

    // Images that came with the work (a customer's screenshot, a file given with a task) go in with it — she sees them.
    const images = resuming ? [] : await this.imagesOf(job);
    if (images.length) this.log(`sending ${images.length} image(s) with ${jobId}`);
    // It carries on its own conversation: the one this job waits in (after a
    // decision), else its last one. The briefing is always sent fresh.
    // A check-in (ping) does not: it starts short, with its briefing and its
    // memory folder. Resuming the whole working conversation on every
    // check-in re-read all of it each time — dollars per ping, rising forever.
    const isPing = job.data?.source === 'ping';
    const briefingPrompt = systemPrompt(this.briefing);
    const { hash: briefingHash, resume: resumeId } = sessionForBriefing({
      prompt: briefingPrompt,
      sessionId: resuming ? mem.sessionId : isPing ? null : this.rec.lastSessionId || null,
      savedHash: resuming ? mem.briefingHash : this.rec.lastSessionBriefingHash,
    });
    const decisionPrompt = decision
      ? `A person answered what you asked for (“${decision.summary}”): ${decision.decision.toUpperCase()} by ${decision.by}${decision.note ? ` — “${decision.note}”` : ''}. Carry on with the job accordingly, then finish it with ./ae complete or ./ae fail.`
      : '';
    // When new instructions require a fresh session during an approval,
    // include the original job and reported steps so it does not repeat work.
    const continuation = resuming && !resumeId
      ? `${jobPrompt({ ...job, data: { ...job.data, interrupted: true } }, this.briefing)}\n${decisionPrompt}`
      : resuming ? decisionPrompt : jobPrompt(job, this.briefing);
    const opts = {
      images,
      onChild: (child) => (this.child = child),
      cwd: this.rec.home,
      memoryDir: path.join(this.rec.home, 'memory'),
      model: this.rec.model || process.env.AIE_MODEL || 'sonnet',
      resume: resumeId,
      systemPrompt: briefingPrompt,
      prompt: continuation,
      env: { AE_STATE: statePath },
      transcriptFile: path.join(jobDir, 'transcript.jsonl'),
      onText: (t) => step('thinking', t),
      onTool: (cmd) => this.log(`ran: ${clip(cmd, 200)}`),
    };
    let run = await runClaude(opts);
    // A conversation that cannot be found (started in its old folder, or cleared) — start fresh with the whole job.
    if (!run.ok && resumeId && /no conversation found|session.*not found/i.test(String(run.error || ''))) {
      this.log(`could not resume ${resumeId}; starting fresh`);
      const tried = run.costUsd || 0;
      run = await runClaude({ ...opts, resume: null, prompt: jobPrompt(job, this.briefing), images: await this.imagesOf(job) });
      run.costUsd += tried;
    }

    if (thinking) clearInterval(thinking);
    mem.sessionId = run.sessionId || mem.sessionId;
    if (run.sessionId) mem.briefingHash = briefingHash;
    // A check-in's short session is not the working conversation to carry on.
    if (!isPing && run.sessionId) {
      this.rec.lastSessionId = run.sessionId;
      this.rec.lastSessionBriefingHash = briefingHash;
    }
    // A working conversation that has grown expensive to carry on starts fresh
    // next time — what it learnt is in its memory folder, not only in the transcript.
    const ROTATE_USD = Number(process.env.AIE_ROTATE_SESSION_USD || 1);
    if (!isPing && !resuming && run.costUsd > ROTATE_USD) {
      this.log(`job cost $${run.costUsd.toFixed(2)} — next job starts a fresh conversation (memory kept)`);
      delete this.rec.lastSessionId;
    }
    if (decision) mem.lastDecisionAt = decision.at;
    mem.costUsd = (mem.costUsd || 0) + run.costUsd;
    this.store.save();

    const out = fs.existsSync(outcomeFile) ? JSON.parse(fs.readFileSync(outcomeFile, 'utf8')) : null;
    const worker = this.rec.agentId;
    if (out?.type === 'waiting') {
      this.log(`waiting for a person on ${jobId}: ${out.summary}`);
    } else if (out?.type === 'complete') {
      await this.ae.call('POST', `ai-employees/worker/work/${jobId}/complete`, { worker, result: out.result, costUsd: mem.costUsd });
      delete this.rec.jobs[jobId];
    } else if (out?.type === 'fail') {
      await this.ae.call('POST', `ai-employees/worker/work/${jobId}/fail`, { worker, error: out.error, costUsd: mem.costUsd });
      delete this.rec.jobs[jobId];
    } else if (run.ok) {
      await step('note', 'The session ended without saying it was done; its last words are the result.');
      await this.ae.call('POST', `ai-employees/worker/work/${jobId}/complete`, { worker, result: run.result, costUsd: mem.costUsd });
      delete this.rec.jobs[jobId];
    } else {
      await this.ae.call('POST', `ai-employees/worker/work/${jobId}/fail`, { worker, error: `The session stopped: ${run.error}`, costUsd: mem.costUsd });
      delete this.rec.jobs[jobId];
    }
    this.store.save();
    this.currentJob = null;
    this.lastActivityAt = new Date().toISOString();
    this.set('idle', `Last: “${job.data?.title}” — ${out?.type || (run.ok ? 'complete' : 'failed')}. Cost $${run.costUsd.toFixed(4)}.`);
  }
}

/**
 * Its session's instructions. What it is told comes from its briefing — who it
 * is, and everything the business wrote for it (instructions, company
 * settings, approval policy). The only words of our own are its core: how its
 * one tool works.
 */
function systemPrompt(b) {
  if (!b) return '';
  const y = b.identity || {};
  const json = (v) => (v && Object.keys(v).length ? JSON.stringify(v, null, 2) : '');
  return [
    `You are ${y.name}${y.jobTitle ? `, ${y.jobTitle}` : ''}, an AI employee of ${y.organization?.name}, signed in as ${y.signInEmail}${y.supervisor ? `, reporting to ${y.supervisor}` : ''}.`,
    y.jobDescription,
    (y.listensTo || []).length && `You listen to: ${y.listensTo.map((c) => ({ chat_queue: 'the customer chat queue (a customer waiting for a person)', email: 'customer email', sms: 'customer SMS', social: 'social DMs, comments and mentions', ticket: 'new support tickets', order: 'new orders', form: 'form submissions' })[c] || c).join('; ')} — you are alerted when one comes in.`,
    ...(b.instructions || []).map((i) => `## ${i.title}\n${i.content}`),
    json(b.company) && `Company:\n${json(b.company)}`,
    json(b.knowledge) && `Knowledge:\n${json(b.knowledge)}`,
    json(b.escalation) && `Escalation:\n${json(b.escalation)}`,
    b.team?.id && `Your team workspace: "${b.team.title}" (id ${b.team.id}).`,
    (b.meetings || []).length && `Your meetings in the next day:\n${b.meetings.map((m) => `- ${m.startTime} ${m.title}${m.workspace ? ` (workspace ${m.workspace})` : ''}`).join('\n')}`,
    (b.notes || []).length && `Your own notes (newest last):\n${b.notes.map((n) => `- ${String(n.date || '').slice(0, 16)} ${n.comment}`).join('\n')}`,
    json(y.approvals) && `Approval policy ("require" = ask a person first with ./ae approval):\n${json(y.approvals)}`,
    'Read small UTF-8 text files attached to the current job with ./ae file <file-attachment-number> (1-based, counting only file attachments in their listed order). It reads privately through Appmint as you; it does not require a local copy. Do not use curl, wget, WebFetch, signed-URL downloads or shell scripts. If file reading is refused, report the error and finish with ./ae fail; do not make a private file public or ask for a shell permission bypass.',
    `Your tool is ./ae (run it with Bash; ./ae with no arguments lists its commands). The API reference: ${b.functions?.reference}. Finish every job with ./ae complete or ./ae fail; when ./ae approval answers WAIT, end your turn.`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

function jobPrompt(job, b) {
  const d = job.data || {};
  const now = b?.now;
  const open = b?.work?.open?.filter((w) => String(w.sk || w.id) !== String(job.sk)).length;
  const done = (d.steps || []).filter((x) => !['status'].includes(x.kind)).map((x) => `- [${x.kind}] ${String(x.text).slice(0, 300)}`);
  return [
    d.interrupted && `You started this job before and were interrupted. What you had already reported:\n${done.join('\n') || '(nothing)'}\nCarry on from there — check what was actually done before repeating anything; before messaging anyone, read that conversation (./ae read <id>): you may already have said it.`,
    now && `Now: ${now.local || now.iso}${now.timezone ? ` (${now.timezone})` : ''}.`,
    d.source === 'ping' && `Ping.${open !== undefined ? ` Other open work: ${open}.` : ''}`,
    d.source !== 'ping' && `New job (${d.source || 'direct'}${d.priority && d.priority !== 'normal' ? `, ${d.priority} priority` : ''}): ${d.title}`,
    d.instructions && `Details: ${d.instructions}`,
    d.ref?.id && `It is about ${d.ref.label || d.ref.id} — record: ${d.ref.datatype} ${d.ref.id}.`,
    (d.attachments || []).length &&
      `Attached:\n${d.attachments.map((x) => `- ${x.kind === 'file' ? `document ${x.label || ''} (${x.url || x.path})` : `${x.datatype} ${x.label || ''}${x.summary ? ` [${x.summary}]` : ''} (id ${x.id})`}${x.comment ? ` — ${x.comment}` : ''}`).join('\n')}`,
    'Do it now. Report your steps with ./ae step note "what you checked" (the kind argument is required). Other kinds: thinking, action, check, screen, error. Finish with ./ae complete "result" or ./ae fail "reason".',
  ]
    .filter(Boolean)
    .join('\n');
}
