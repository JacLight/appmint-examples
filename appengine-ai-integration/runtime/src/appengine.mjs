// appengine, as the AI employee sees it: a normal API it signs in to as itself.
import { authenticator } from 'otplib';

export class AppEngine {
  /** signIn: { email, password, authenticatorSecret }. */
  constructor({ apiBaseUrl, orgId, signIn, log = () => {} }) {
    this.base = String(apiBaseUrl).replace(/\/+$/, '');
    this.orgId = orgId;
    this.signIn = signIn;
    this.log = log;
    this.token = null;
    this.tokenAt = 0;
  }

  async raw(method, path, body, token = this.token) {
    const res = await fetch(`${this.base}/${String(path).replace(/^\/+/, '')}`, {
      method,
      headers: { orgid: this.orgId, 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body === undefined || body === null ? undefined : JSON.stringify(body),
    });
    let json = null;
    const text = await res.text();
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { text };
    }
    return { status: res.status, ok: res.ok, json };
  }

  /** Sign in exactly as a person does: password, then a code from the authenticator. */
  async login() {
    const s = await this.raw('POST', 'profile/user/signin', { email: this.signIn.email, password: this.signIn.password }, null);
    let session = s.json;
    if (!s.ok) throw new SignInError(s.status, session?.error || session?.message || 'sign-in refused');
    if (session?.requiresTwoFactor) {
      const code = authenticator.generate(this.signIn.authenticatorSecret);
      const v = await this.raw('POST', 'profile/security/challenge/verify', { challengeToken: session.challengeToken, code, trustDevice: true }, null);
      if (!v.ok) throw new SignInError(v.status, v.json?.error || v.json?.message || 'second factor refused');
      session = v.json;
    }
    const token = session?.token || session?.data?.token || session?.accessToken;
    if (!token) throw new SignInError(500, 'signed in but no token came back');
    this.token = token;
    this.tokenAt = Date.now();
    this.log('signed in');
    return token;
  }

  /** A call as the employee; signs in (again) when there is no token or it has expired. */
  async call(method, path, body) {
    if (!this.token || Date.now() - this.tokenAt > 50 * 60_000) await this.login();
    let r = await this.raw(method, path, body);
    // Refused for its token — expired (401) or too big to send (431): sign in again for a fresh one.
    if (r.status === 401 || r.status === 431) {
      await this.login();
      r = await this.raw(method, path, body);
    }
    return r;
  }
}

export class SignInError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
