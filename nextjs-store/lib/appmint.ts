/**
 * The AppEngine client.
 *
 * It runs in two places and behaves differently in each, which is the whole
 * point of this file:
 *
 *   In the browser  → calls this app's own `/api/*` proxy. No credentials.
 *   On the server   → calls appengine directly, with the app token attached.
 *
 * So browser code can never reach appengine, and the application credentials
 * can never reach a bundle. Everything else here follows from that.
 */

const HOST = process.env.APPENGINE_ENDPOINT ?? '';
const ORG_ID = process.env.ORG_ID ?? '';

const isBrowser = () => typeof window !== 'undefined';

/** An API failure carrying the server's stable `code`. Branch on that, not the message. */
export class AppmintError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'AppmintError';
  }
}

// ── The application's own identity ─────────────────────────────────────────
// Fetched once per process and reused. Renewed on a 401, because the only way
// to find out a token aged out is to have one refused.

let appToken: string | null = null;
let pendingToken: Promise<string | null> | null = null;

async function fetchAppToken(): Promise<string | null> {
  const res = await fetch(`${HOST}/profile/app/key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', orgid: ORG_ID },
    body: JSON.stringify({
      appId: process.env.APP_ID,
      key: process.env.APP_KEY,
      secret: process.env.APP_SECRET,
    }),
  });
  if (!res.ok) return null;
  const body = await res.json().catch(() => null);
  return body?.token ?? null;
}

/** Concurrent callers share one in-flight fetch rather than all storming the endpoint. */
async function getAppToken(): Promise<string | null> {
  if (appToken) return appToken;
  pendingToken ??= fetchAppToken().finally(() => { pendingToken = null; });
  appToken = await pendingToken;
  return appToken;
}

async function readBody(res: Response) {
  const text = await res.text();
  try { return text ? JSON.parse(text) : undefined; } catch { return text; }
}

function fail(payload: any, res: Response): never {
  throw new AppmintError(
    payload?.error ?? payload?.message ?? res.statusText,
    res.status,
    payload?.code,
    payload,
  );
}

// ── The two transports ─────────────────────────────────────────────────────

/** Browser → this app's own proxy. Carries the visitor's session cookie, nothing else. */
async function viaProxy<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/${path.replace(/^\/+/, '')}`, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'same-origin',
  });
  const payload = await readBody(res);
  if (!res.ok) fail(payload, res);
  return payload as T;
}

/** Server → appengine. Carries the app token, and the visitor's token when there is one. */
export async function viaServer<T>(
  method: string,
  path: string,
  body?: unknown,
  customerToken?: string,
  retried = false,
): Promise<T> {
  const token = await getAppToken();
  const headers: Record<string, string> = { orgid: ORG_ID };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  // The header called Authorization is the APPLICATION's. The person's token
  // rides separately — they answer different questions.
  if (customerToken) headers['x-client-authorization'] = customerToken;

  const res = await fetch(`${HOST}/${path.replace(/^\/+/, '')}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });

  // A 401 is ambiguous — the app token may simply have aged out. Renew it once
  // and try again before concluding anything about the visitor.
  if (res.status === 401 && !retried) {
    appToken = null;
    return viaServer<T>(method, path, body, customerToken, true);
  }

  const payload = await readBody(res);
  if (!res.ok) fail(payload, res);
  return payload as T;
}

/** Same call from either side — the transport is chosen for you. */
export function request<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  return isBrowser() ? viaProxy<T>(method, path, body) : viaServer<T>(method, path, body);
}

export const get = <T = unknown>(path: string) => request<T>('GET', path);
export const post = <T = unknown>(path: string, body?: unknown) => request<T>('POST', path, body);
