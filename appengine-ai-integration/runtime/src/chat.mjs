// The employee in Chat, the way a person is: one chat connection signed in as
// itself, set to "available" (that is what shows it Online to staff), kept
// alive with a heartbeat. Replies go out on it as ordinary chat messages.
import { io } from 'socket.io-client';

export class ChatLink {
  constructor({ apiBaseUrl, orgId, log = () => {} }) {
    this.base = String(apiBaseUrl).replace(/\/+$/, '');
    this.orgId = orgId;
    this.log = log;
    this.socket = null;
    this.token = null;
  }

  get online() {
    return !!this.socket?.connected && this.ready;
  }

  /** Connect (or reconnect with a fresh token). */
  connect(token) {
    if (this.socket && this.token === token && this.socket.connected) return;
    this.close();
    this.token = token;
    this.ready = false;
    const s = io(`${this.base}/chat`, { auth: { token, orgId: this.orgId }, transports: ['websocket'], reconnection: true, reconnectionDelay: 3000 });
    // The server signs the connection in from the handshake, then says so; only then may it set its status.
    s.on('authenticate', (res) => {
      if (!res?.success) return this.log(`chat: sign-in refused (${res?.error || res?.message || 'no reason'})`);
      s.emit('set-status', { status: 'available' }, (ack) => {
        this.ready = !!ack?.success;
        this.log(this.ready ? 'chat: online' : `chat: not accepted (${ack?.error || 'no answer'})`);
      });
    });
    s.on('disconnect', (reason) => {
      this.ready = false;
      this.log(`chat: offline (${reason})`);
    });
    s.on('token_expired', () => this.log('chat: token expired — reconnecting on the next sign-in'));
    this.heartbeat = setInterval(() => s.connected && s.emit('heartbeat'), 45_000);
    this.socket = s;
  }

  /** Say something in a chat, as the employee. `to` is the other person in a one-to-one chat. */
  send({ chatId, to, content }) {
    return new Promise((resolve) => {
      if (!this.online) return resolve({ ok: false, error: 'Not connected to Chat right now.' });
      this.socket.timeout(10000).emit('sendMessage', { chatId, to, content, type: 'text', sentTime: new Date().toISOString() }, (err, ack) => {
        if (err) return resolve({ ok: false, error: 'Chat did not answer.' });
        resolve(ack?.success ? { ok: true } : { ok: false, error: ack?.error || 'Chat refused the message.' });
      });
    });
  }

  /** Show the person in a chat what the employee is doing ("thinking", "typing") — as people's own typing shows. Fire and forget. */
  status({ to, chatId, status }) {
    if (!this.online || !to) return;
    this.socket.emit('shareStatus', { to, chatId, status });
  }

  /** An Agent Desk action on its own connection, as staff do it: pick from the queue, take over, hand back, transfer, close. */
  desk(event, data) {
    return new Promise((resolve) => {
      if (!this.online) return resolve({ ok: false, error: 'Not connected to Chat right now.' });
      this.socket.timeout(15000).emit(event, data || {}, (err, ack) => {
        if (err) return resolve({ ok: false, error: 'Chat did not answer.' });
        resolve(ack?.success === false ? { ok: false, error: ack?.error || 'Chat refused.' } : { ok: true, ...ack });
      });
    });
  }

  close() {
    clearInterval(this.heartbeat);
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }
    this.socket = null;
    this.ready = false;
  }
}
