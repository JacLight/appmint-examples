// A support agent at a terminal: signs in as staff, sits in the /chat
// namespace, picks the next queued customer, greets them, and answers
// every message they send. Stands in for the admin dashboard.
import { io } from 'socket.io-client';
// Run:  APPMINT_URL=… APPMINT_ORG=… APPMINT_APP_ID=… APPMINT_APP_KEY=… APPMINT_APP_SECRET=… \
//       AGENT_EMAIL=… AGENT_PASSWORD=… node tool/agent.mjs
// Needs socket.io-client:  npm install socket.io-client
const env = (k) => { const v = process.env[k]; if (!v) { console.error(`missing ${k}`); process.exit(1); } return v; };
const BASE = env('APPMINT_URL');
const ORG = env('APPMINT_ORG');
const H = { 'content-type': 'application/json', orgid: ORG, 'shared-org-id': ORG };
const app = await (await fetch(`${BASE}/profile/app/key`, { method: 'POST', headers: H, body: JSON.stringify({ appId: env('APPMINT_APP_ID'), key: env('APPMINT_APP_KEY'), secret: env('APPMINT_APP_SECRET') }) })).json();
const AH = { ...H, authorization: `Bearer ${app.token}` };
let u = await (await fetch(`${BASE}/profile/user/signin`, { method: 'POST', headers: AH, body: JSON.stringify({ email: env('AGENT_EMAIL'), password: env('AGENT_PASSWORD') }) })).json();
if (u.requiresTwoFactor) u = await (await fetch(`${BASE}/profile/security/challenge/verify`, { method: 'POST', headers: AH, body: JSON.stringify({ challengeToken: u.challengeToken, code: process.env.AGENT_2FA_CODE || '000000', trustDevice: false }) })).json();
if (!u.token) { console.log('AGENT sign-in failed', JSON.stringify(u).slice(0, 300)); process.exit(1); }
const me = u.user?.data?.email || process.env.AGENT_EMAIL;
console.log('AGENT signed in as', me);

const s = io(`${BASE}/chat`, { transports: ['websocket'], auth: { token: u.token, orgId: ORG } });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), 'AGENT', ...a);
let current = null; // { chatId, customerEmail }
const say = (content) => s.emit('sendMessage', { to: current.customerEmail, chatId: current.chatId, content, type: 'user' }, (ack) => log('sendMessage ack', JSON.stringify(ack)));
const pick = () => s.emit('pick-next', {}, (r) => {
  log('pick-next →', JSON.stringify(r).slice(0, 200));
  if (r?.chat) {
    current = { chatId: r.chat.chatId, customerEmail: r.chat.customerEmail };
    setTimeout(() => say(`Hi ${r.chat.customerName || ''}! This is ${me} from support. How can I help?`), 800);
  }
});
s.on('authenticate', (r) => { log('authenticate', JSON.stringify(r).slice(0, 160)); if (r.success) { s.emit('set-status', { status: 'online' }); pick(); } });
s.on('queue-notification', (q) => { log('queue-notification', JSON.stringify(q).slice(0, 200)); if (!current) pick(); });
s.on('message', (m) => {
  const d = m?.data || m;
  log('message from', d.from, '→', d.to, ':', JSON.stringify(d.content).slice(0, 120));
  if (current && d.from === current.customerEmail && d.type !== 'system') {
    setTimeout(() => say(`You said "${d.content}" — noted. Anything else?`), 600);
  }
});
s.on('status', (x) => log('status', JSON.stringify(x).slice(0, 120)));
s.on('update', (x) => log('update', JSON.stringify(x).slice(0, 120)));
s.on('chat-ended', (x) => { log('chat-ended', JSON.stringify(x)); current = null; });
s.on('connect_error', (e) => log('connect_error', e.message));
s.on('disconnect', (r) => log('disconnected', r));
