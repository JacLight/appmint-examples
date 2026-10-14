// One turn of an employee's Claude Code session, headless.
//
// The session is walled in: it starts in the agent's own folder, reads none of
// this machine's Claude settings, hooks or MCP servers, and may run exactly one
// tool — `./ae`, which acts as the employee. Everything it says streams back
// through onText as it goes; the run ends with its session id (to resume it
// after an approval) and what it cost.
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CLAUDE = process.env.AIE_CLAUDE_BIN || 'claude';

/** Sessions running now — stopped with the server, never left orphaned. */
export const running = new Set();

/** transcriptFile: every event of the session is appended there as it happens — what the console shows live. */
/** images: [{ mediaType, data (base64) }] — sent with the prompt as one message, so the employee sees them as a person would. */
export function runClaude({ cwd, memoryDir, prompt, systemPrompt, resume, model, env, onText, onTool, onChild, transcriptFile, images = [], maxTurns = Number(process.env.AIE_MAX_TURNS || 40), timeoutMs = Number(process.env.AIE_JOB_TIMEOUT_MIN || 20) * 60_000 }) {
  const withImages = images.length > 0;
  const args = [
    '-p',
    ...(withImages ? ['--input-format', 'stream-json'] : [prompt]),
    '--output-format',
    'stream-json',
    '--verbose',
    // Restrict availability as well as automatic permission: allowedTools alone
    // does not remove Read/Grep/Glob and other default tools.
    // Bash for ./ae; Read/Write/Edit only inside its own memory folder (a
    // rule with // is an absolute path). Anything else is denied, not asked.
    '--tools',
    memoryDir ? 'Bash,Read,Write,Edit' : 'Bash',
    '--allowedTools',
    'Bash(./ae:*)',
    ...(memoryDir ? [`Read(/${memoryDir}/**)`, `Write(/${memoryDir}/**)`, `Edit(/${memoryDir}/**)`] : []),
    '--disallowedTools',
    ...(memoryDir ? [] : ['Write', 'Edit']),
    'NotebookEdit',
    'WebFetch',
    'WebSearch',
    'Task',
    '--setting-sources',
    'project',
    '--strict-mcp-config',
    '--mcp-config',
    '{"mcpServers":{}}',
    '--max-turns',
    String(maxTurns),
    // Claude's own memory (what it saves and reloads every session) lives in
    // its memory folder, not in ~/.claude under the machine user.
    ...(memoryDir ? ['--settings', JSON.stringify({ autoMemoryEnabled: true, autoMemoryDirectory: memoryDir })] : []),
  ];
  if (model) args.push('--model', model);
  if (resume) args.push('--resume', resume);
  // Always the fresh briefing: what it is told can change between jobs.
  if (systemPrompt) args.push('--append-system-prompt', systemPrompt);

  return new Promise((resolve) => {
    const child = spawn(CLAUDE, args, { cwd, env: { ...process.env, ...env }, stdio: [withImages ? 'pipe' : 'ignore', 'pipe', 'pipe'] });
    if (withImages) {
      const content = [{ type: 'text', text: prompt }, ...images.map((i) => ({ type: 'image', source: { type: 'base64', media_type: i.mediaType, data: i.data } }))];
      child.stdin.end(JSON.stringify({ type: 'user', message: { role: 'user', content } }) + '\n');
    }
    running.add(child);
    // The owner can end this session early (a shut down or restart).
    onChild?.(child);
    let buf = '';
    let sessionId = resume || null;
    let final = null;
    let stderr = '';
    const timer = setTimeout(() => child.kill('SIGTERM'), timeoutMs);

    child.stdout.on('data', (chunk) => {
      buf += chunk.toString();
      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line) continue;
        let ev;
        try {
          ev = JSON.parse(line);
        } catch {
          continue;
        }
        if (transcriptFile) {
          try {
            fs.appendFileSync(transcriptFile, JSON.stringify({ at: new Date().toISOString(), ...ev }) + '\n');
          } catch {}
        }
        if (ev.session_id) sessionId = ev.session_id;
        if (ev.type === 'assistant') {
          for (const block of ev.message?.content || []) {
            if (block.type === 'text' && block.text?.trim()) onText?.(block.text.trim());
            if (block.type === 'tool_use') onTool?.(block.input?.command || JSON.stringify(block.input || {}));
          }
        }
        if (ev.type === 'result') final = ev;
      }
    });
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('close', (code) => {
      running.delete(child);
      clearTimeout(timer);
      resolve({
        ok: code === 0 && final && !final.is_error,
        code,
        sessionId,
        result: final?.result || '',
        costUsd: Number(final?.total_cost_usd) || 0,
        turns: final?.num_turns || 0,
        error: final?.is_error ? final?.result || final?.subtype : code !== 0 ? stderr.trim().slice(-500) || `exited ${code}` : null,
      });
    });
  });
}
