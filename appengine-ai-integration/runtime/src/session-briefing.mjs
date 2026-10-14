import { createHash } from 'node:crypto';

// Claude Code restores the original system prompt on --resume. A changed
// trusted briefing must therefore start a new session, preserving disk memory.
export function sessionForBriefing({ prompt, sessionId, savedHash }) {
  const hash = createHash('sha256').update(prompt || '').digest('hex');
  return { hash, resume: sessionId && savedHash === hash ? sessionId : null };
}
