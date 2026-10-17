/**
 * The AppEngine client — server only.
 *
 * The `.server.ts` suffix is Remix's guarantee: this module is never bundled
 * into the browser build. Importing it from client code is a build error, not
 * a runtime surprise, which is a stronger promise than the `typeof window`
 * check a framework-agnostic client has to rely on.
 *
 * So there is no browser transport here. Loaders and actions call AppEngine;
 * the browser calls loaders and actions. That is the whole architecture.
 */

const HOST = process.env.APPENGINE_ENDPOINT ?? '';
const ORG_ID = process.env.ORG_ID ?? '';

export class AppmintError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'AppmintError';
  }
}

let appToken: string | null = null;
let pending: Promise<string | null> | null = null;

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
  const body = (await res.json().catch(() => null)) as { token?: string } | null;
  return body?.token ?? null;
}

/** Concurrent loaders share one in-flight fetch rather than all storming it. */
async function getAppToken(): Promise<string | null> {
  if (appToken) return appToken;
  pending ??= fetchAppToken().finally(() => { pending = null; });
  appToken = await pending;
  return appToken;
}

export async function appmint<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  customerToken?: string,
  retried = false,
): Promise<T> {
  const token = await getAppToken();
  const headers: Record<string, string> = { orgid: ORG_ID };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  // `Authorization` is the APPLICATION's identity. The person's token rides
  // separately — they answer different questions.
  if (token) headers.Authorization = `Bearer ${token}`;
  if (customerToken) headers['x-client-authorization'] = customerToken;

  const res = await fetch(`${HOST}/${path.replace(/^\/+/, '')}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  // A 401 is ambiguous — the app token may simply have aged out. Renew once
  // before concluding anything about the visitor.
  if (res.status === 401 && !retried) {
    appToken = null;
    return appmint<T>(method, path, body, customerToken, true);
  }

  const text = await res.text();
  let payload: any;
  try { payload = text ? JSON.parse(text) : undefined; } catch { payload = text; }

  if (!res.ok) {
    throw new AppmintError(payload?.error ?? payload?.message ?? res.statusText, res.status, payload?.code);
  }
  return payload as T;
}
