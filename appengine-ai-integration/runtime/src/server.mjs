// The session manager: the provider appengine provisions AI employees on.
//
// appengine only knows this contract — create, status, start, stop, update,
// remove an agent. What runs the agent is ours to decide: here, each one works
// through a headless Claude Code session (src/agent.mjs).
//
//   GET    /v1/health
//   GET    /v1/agents
//   POST   /v1/agents            { orgId, apiBaseUrl, employee: { name, title }, signIn: { email, password, authenticatorSecret }, brief?, model?, start? }
//   GET    /v1/agents/:id
//   PUT    /v1/agents/:id        { signIn?, brief?, model?, apiBaseUrl? }
//   POST   /v1/agents/:id/start
//   POST   /v1/agents/:id/stop          { now? } — now: end the job it is on too
//   POST   /v1/agents/:id/restart       { forget? } — stop now, start fresh
//   POST   /v1/agents/:id/forget        drop the conversations it would resume
//   DELETE /v1/agents/:id
//   GET    /v1/agents/:id/jobs                   the jobs it has worked, newest first
//   GET    /v1/agents/:id/jobs/:jobId/transcript?after=N   the session, event by event
//   GET    /console                              watch the agents work (open /console?key=… once)
//
// Every call carries `authorization: Bearer <AIE_PROVIDER_KEY>`.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Agent } from './agent.mjs';
import { running } from './claude.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.AIE_PORT || 3400);
// Where it listens: 0.0.0.0 (all interfaces) by default; 127.0.0.1 when only a local appengine calls it.
const HOST = process.env.AIE_HOST || '0.0.0.0';
// Agents, their sign-ins and job transcripts. On a server, a persistent (backed-up) volume.
const DATA_DIR = path.resolve(process.env.AIE_DATA_DIR || path.join(ROOT, 'data'));
const KEY = process.env.AIE_PROVIDER_KEY;
if (!KEY || !KEY.trim()) {
  console.error('Set AIE_PROVIDER_KEY privately before starting the runtime.');
  process.exit(1);
}

class Store {
  constructor(dir) {
    this.dir = dir;
    this.file = path.join(dir, 'agents.json');
    fs.mkdirSync(dir, { recursive: true });
    this.data = fs.existsSync(this.file) ? JSON.parse(fs.readFileSync(this.file, 'utf8')) : { agents: {} };
  }
  save() {
    const tmp = this.file + '.tmp';
    // Holds sign-ins: readable by this user only.
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), { mode: 0o600 });
    fs.renameSync(tmp, this.file);
  }
}

process.on('uncaughtException', (e) => console.error('uncaught:', e));
// Stopping the server stops its sessions; their jobs are picked back up on the next start.
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => {
    for (const child of running) child.kill('SIGTERM');
    process.exit(0);
  });
}
process.on('unhandledRejection', (e) => console.error('unhandled:', e));

const store = new Store(DATA_DIR);
const agents = new Map();
for (const rec of Object.values(store.data.agents)) {
  rec.jobs ||= {};
  const a = new Agent(rec, store);
  agents.set(rec.agentId, a);
  if (rec.desired === 'running') a.start();
}

const idFor = (orgId, name) => `${orgId}--${name}`.replace(/[^a-zA-Z0-9_.-]/g, '-');
const need = (body, fields) => {
  const missing = fields.filter((f) => !f.split('.').reduce((o, k) => (o ? o[k] : undefined), body));
  if (missing.length) throw Object.assign(new Error(`Missing: ${missing.join(', ')}`), { status: 400 });
};

const routes = {
  'GET /v1/health': () => ({ ok: true, version: JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version, agents: agents.size }),

  'GET /v1/agents': () => ({ data: [...agents.values()].map((a) => a.status()) }),

  'POST /v1/agents': (_p, body) => {
    need(body, ['orgId', 'apiBaseUrl', 'employee.name', 'signIn.email', 'signIn.password', 'signIn.authenticatorSecret']);
    const agentId = idFor(body.orgId, body.employee.name);
    const now = new Date().toISOString();
    const existing = agents.get(agentId);
    const rec = {
      ...(existing?.rec || { jobs: {}, createdAt: now }),
      agentId,
      orgId: body.orgId,
      name: body.employee.name,
      title: body.employee.title || body.employee.name,
      apiBaseUrl: String(body.apiBaseUrl).replace(/\/+$/, ''),
      signIn: body.signIn,
      brief: body.brief ?? existing?.rec?.brief ?? null,
      model: body.model || existing?.rec?.model || null,
      desired: body.start === false ? 'stopped' : 'running',
      updatedAt: now,
    };
    store.data.agents[agentId] = rec;
    store.save();
    let a = existing;
    if (a) {
      a.rec = rec;
      a.connect();
    } else {
      a = new Agent(rec, store);
      agents.set(agentId, a);
    }
    a.log(existing ? 'provisioned again (new sign-in)' : 'provisioned');
    if (rec.desired === 'running') a.start();
    return { status: existing ? 200 : 201, body: a.status() };
  },

  'GET /v1/agents/:id': (p) => {
    const a = agents.get(p.id);
    if (!a) throw Object.assign(new Error('No such agent here.'), { status: 404 });
    return { ...a.status(), exists: true, log: a.logLines.slice(-40) };
  },

  'PUT /v1/agents/:id': (p, body) => {
    const a = agents.get(p.id);
    if (!a) throw Object.assign(new Error('No such agent here.'), { status: 404 });
    for (const k of ['signIn', 'brief', 'model', 'apiBaseUrl']) if (body[k] !== undefined) a.rec[k] = body[k];
    a.rec.updatedAt = new Date().toISOString();
    store.save();
    a.connect();
    a.log('updated');
    return a.status();
  },

  'POST /v1/agents/:id/start': (p) => {
    const a = agents.get(p.id);
    if (!a) throw Object.assign(new Error('No such agent here.'), { status: 404 });
    a.rec.desired = 'running';
    store.save();
    a.start();
    return a.status();
  },

  'POST /v1/agents/:id/stop': (p, body) => {
    const a = agents.get(p.id);
    if (!a) throw Object.assign(new Error('No such agent here.'), { status: 404 });
    a.stop({ now: !!body?.now });
    store.save();
    return a.status();
  },

  // Stop now and start fresh: a new session, a freshly read briefing.
  'POST /v1/agents/:id/restart': (p, body) => {
    const a = agents.get(p.id);
    if (!a) throw Object.assign(new Error('No such agent here.'), { status: 404 });
    a.stop({ now: true });
    const forgotten = body?.forget ? a.forget() : 0;
    a.rec.desired = 'running';
    store.save();
    // Let the killed session's loop wind down before the new one begins.
    setTimeout(() => a.start(), 1500);
    return { ...a.status(), forgotten };
  },

  // Forget the conversations it would resume after an approval.
  'POST /v1/agents/:id/forget': (p) => {
    const a = agents.get(p.id);
    if (!a) throw Object.assign(new Error('No such agent here.'), { status: 404 });
    const forgotten = a.forget();
    store.save();
    return { ...a.status(), forgotten };
  },

  'GET /v1/agents/:id/jobs': (p) => {
    const a = agents.get(p.id);
    if (!a) throw Object.assign(new Error('No such agent here.'), { status: 404 });
    const dir = path.join(a.dir, 'jobs');
    const jobs = fs.existsSync(dir)
      ? fs.readdirSync(dir).map((jobId) => {
          const f = path.join(dir, jobId, 'meta.json');
          return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : { jobId };
        })
      : [];
    return { data: jobs.sort((x, y) => String(y.lastStartedAt || '').localeCompare(String(x.lastStartedAt || ''))), current: a.currentJob };
  },

  'GET /v1/agents/:id/jobs/:jobId/transcript': (p, _b, q) => {
    const a = agents.get(p.id);
    if (!a) throw Object.assign(new Error('No such agent here.'), { status: 404 });
    const f = path.join(a.dir, 'jobs', path.basename(p.jobId), 'transcript.jsonl');
    const lines = fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean) : [];
    const after = Number(q.get('after')) || 0;
    return { total: lines.length, events: lines.slice(after).map((l) => JSON.parse(l)), working: a.currentJob?.jobId === p.jobId };
  },

  'DELETE /v1/agents/:id': (p) => {
    const a = agents.get(p.id);
    if (!a) return { removed: false, detail: 'No such agent here.' };
    a.stop();
    a.removed = true;
    agents.delete(p.id);
    delete store.data.agents[p.id];
    store.save();
    fs.rmSync(a.dir, { recursive: true, force: true });
    return { removed: true, detail: 'Stopped and removed, with its sessions and logs.' };
  },
};

const match = (method, url) => {
  for (const [key, fn] of Object.entries(routes)) {
    const [m, pattern] = key.split(' ');
    if (m !== method) continue;
    const names = [];
    const rx = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, n) => (names.push(n), '([^/]+)')) + '$');
    const hit = url.match(rx);
    if (hit) return { fn, params: Object.fromEntries(names.map((n, i) => [n, decodeURIComponent(hit[i + 1])])) };
  }
  return null;
};

http
  .createServer(async (req, res) => {
    const send = (status, body) => {
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(body));
    };
    try {
      const [url, qs] = req.url.split('?');
      const query = new URLSearchParams(qs || '');
      const cookieKey = /(?:^|; )aie_key=([^;]+)/.exec(req.headers.cookie || '')?.[1];
      if (req.method === 'GET' && url === '/console') {
        // Opened once with ?key=…; the key is kept in a cookie for the page's own calls.
        const key = query.get('key') || decodeURIComponent(cookieKey || '');
        if (key !== KEY) {
          res.writeHead(401, { 'content-type': 'text/plain' });
          return res.end('Open /console?key=<provider key>');
        }
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'set-cookie': `aie_key=${encodeURIComponent(KEY)}; HttpOnly; SameSite=Strict; Path=/` });
        return res.end(fs.readFileSync(path.join(ROOT, 'src', 'console.html')));
      }
      // A session asking its own agent to say something in Chat, on the agent's connection (local, per-agent secret).
      const local = /^\/local\/agents\/([^/]+)\/chat$/.exec(url);
      if (local && req.method === 'POST') {
        const a = agents.get(decodeURIComponent(local[1]));
        if (!a || req.headers['x-agent-secret'] !== a.chatSecret) return send(401, { error: 'Not this agent.' });
        let raw = '';
        for await (const chunk of req) raw += chunk;
        const b = raw ? JSON.parse(raw) : {};
        const me = String(a.rec.signIn.email).toLowerCase();
        const to = b.to || String(b.chatId || '').split('|').find((e) => e && e.toLowerCase() !== me);
        if (!b.chatId || !to || !b.content) return send(400, { error: 'chatId, the other person and content are needed.' });
        const r = await a.chat.send({ chatId: b.chatId, to, content: b.content });
        a.log(`chat → ${to}: ${r.ok ? 'sent' : r.error}`);
        return send(r.ok ? 200 : 502, r);
      }
      // The same agent's Agent Desk actions: the queue, picking, taking over, handing back, transferring, closing.
      const desk = /^\/local\/agents\/([^/]+)\/desk$/.exec(url);
      if (desk && req.method === 'POST') {
        const a = agents.get(decodeURIComponent(desk[1]));
        if (!a || req.headers['x-agent-secret'] !== a.chatSecret) return send(401, { error: 'Not this agent.' });
        let raw = '';
        for await (const chunk of req) raw += chunk;
        const b = raw ? JSON.parse(raw) : {};
        const EVENTS = ['queue-stats', 'pick-next', 'takeover-chat', 'resume-ai', 'transfer-chat', 'close-chat'];
        if (!EVENTS.includes(b.event)) return send(400, { error: `Not an Agent Desk action: ${b.event}` });
        const r = await a.chat.desk(b.event, b.data || {});
        a.log(`desk ${b.event}: ${r.ok ? 'ok' : r.error}`);
        return send(r.ok ? 200 : 502, r);
      }
      const authorized = (req.headers.authorization || '') === `Bearer ${KEY}` || decodeURIComponent(cookieKey || '') === KEY;
      if (!authorized) return send(401, { error: 'Provider key required.' });
      const hit = match(req.method, url);
      if (!hit) return send(404, { error: `No route ${req.method} ${url}` });
      let raw = '';
      for await (const chunk of req) raw += chunk;
      const body = raw ? JSON.parse(raw) : {};
      const out = await hit.fn(hit.params, body, query);
      if (out && typeof out.status === 'number' && out.body) return send(out.status, out.body);
      send(200, out);
    } catch (e) {
      send(e.status || 500, { error: e.message });
    }
  })
  .listen(PORT, HOST, () => console.log(`AI employee session manager on ${HOST}:${PORT} — ${agents.size} agent(s), data in ${DATA_DIR}`));
