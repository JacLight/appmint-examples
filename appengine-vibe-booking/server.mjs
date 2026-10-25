import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve, extname, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const BODY_LIMIT = 64 * 1024;
const RESPONSE_LIMIT = 2 * 1024 * 1024;
export class HttpError extends Error {
  constructor(status, message, code) { super(message); this.status = status; this.code = code; }
}
export async function loadConfig(env = process.env) {
  let file = {};
  try { file = JSON.parse(await readFile(resolve(ROOT, env.APPENGINE_CONFIG || 'config.json'), 'utf8')); }
  catch (e) { if (e.code !== 'ENOENT') throw new Error('AppEngine config must be valid JSON.'); }
  const config = { baseUrl: env.APPENGINE_BASE_URL || file.baseUrl, orgId: env.APPENGINE_ORG_ID || file.orgId, definitionId: env.APPENGINE_DEFINITION_ID || file.definitionId };
  if (!config.baseUrl || !config.orgId || !config.definitionId) throw new Error('Set APPENGINE_BASE_URL, APPENGINE_ORG_ID and APPENGINE_DEFINITION_ID, or supply config.json.');
  const url = new URL(config.baseUrl);
  if (url.username || url.password || url.search || url.hash || !['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid fixed AppEngine URL.');
  if (url.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('AppEngine requires HTTPS outside localhost.');
  config.baseUrl = config.baseUrl.replace(/\/+$/, '');
  if (!/^[\w-]+$/.test(config.orgId) || !/^[\w-]+$/.test(config.definitionId)) throw new Error('Invalid organization or definition identifier.');
  return config;
}
function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(JSON.stringify(body));
}
async function bodyOf(req) {
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) throw new HttpError(415, 'Send JSON.');
  let size = 0; const chunks = [];
  for await (const chunk of req) { size += chunk.length; if (size > BODY_LIMIT) throw new HttpError(413, 'Request is too large.'); chunks.push(chunk); }
  try { const body = JSON.parse(Buffer.concat(chunks).toString()); if (!body || Array.isArray(body) || typeof body !== 'object') throw new Error(); return body; }
  catch { throw new HttpError(400, 'Send a JSON object.'); }
}
function requiredString(value, name, max = 500) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new HttpError(400, `Invalid ${name}.`);
  return value;
}
export function createServer(config, { timeoutMs = 12000, staticDir = resolve(ROOT, 'web/dist') } = {}) {
  async function upstream(path, method = 'GET', body, bearer, write = false) {
    try {
      const response = await fetch(config.baseUrl + path, { method, headers: { accept: 'application/json', orgid: config.orgId, ...(body ? { 'content-type': 'application/json' } : {}), ...(bearer ? { authorization: bearer } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(timeoutMs), redirect: 'error' });
      let size = 0; const chunks = [];
      for await (const chunk of response.body) { size += chunk.length; if (size > RESPONSE_LIMIT) throw new Error('Response limit'); chunks.push(chunk); }
      let data;
      try { data = JSON.parse(Buffer.concat(chunks).toString()); } catch { throw new Error('Invalid upstream JSON'); }
      if (!response.ok) {
        // Do not echo arbitrary upstream internals, stack traces, or HTML to the browser.
        const messages = { 400: 'Please check your booking details or choose another available time.', 401: 'Your session has expired. Please sign in again.', 403: 'This action is not available for your account.', 404: 'This booking could not be found.', 409: 'That time was just taken. Please choose another time.', 429: 'Too many requests. Please try again shortly.' };
        if (response.status === 400 && path === '/profile/customer/signin') messages[400] = 'Unable to sign in. Please check your email and password.';
        if (response.status === 400 && path === '/profile/customer/signup') messages[400] = 'Unable to create this account. Check your details, or sign in if you already have an account.';
        if (response.status === 400 && path === '/profile/security/challenge/verify') messages[400] = 'That verification code could not be accepted. Please check the code and try again.';
        if (response.status === 400 && path === '/profile/customer/password/change') messages[400] = 'Unable to change your password. Check your current password and the new password requirements.';
        if (write && response.status >= 500) throw new HttpError(502, 'The booking result could not be confirmed. Check My appointments before trying again.', 'WRITE_OUTCOME_UNKNOWN');
        throw new HttpError(response.status, messages[response.status] || 'Appointments are temporarily unavailable.', 'UPSTREAM_ERROR');
      }
      return { status: response.status, data };
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(502, write ? 'The booking result could not be confirmed. Check My appointments before trying again.' : 'Appointments are temporarily unavailable. Please try again shortly.', write ? 'WRITE_OUTCOME_UNKNOWN' : 'UPSTREAM_UNAVAILABLE');
    }
  }
  async function definition() {
    const result = await upstream('/crm/reservations/definitions');
    const row = result.data?.data?.find(row => String(row.sk || row.id || row._id) === config.definitionId);
    if (!row) throw new HttpError(503, 'Appointments have not been configured for this site.');
    return row;
  }
  async function owned(id, bearer) {
    const result = await upstream(`/client-data/reservations/${encodeURIComponent(id)}`, 'GET', undefined, bearer);
    if (String(result.data?.data?.reservationDefinitionId) !== config.definitionId) throw new HttpError(404, 'This booking could not be found.');
    return result;
  }
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.search) throw new HttpError(400, 'Query parameters are not supported.');
      const path = url.pathname, method = req.method;
      if (path === '/healthz' && method === 'GET') return json(res, 200, { status: 'ok' });
      if (path === '/api/config' && method === 'GET') return json(res, 200, { orgId: config.orgId, definitionId: config.definitionId });
      if (path.startsWith('/api/')) {
        // No cookies or arbitrary destinations/headers are forwarded. The browser sends its own customer bearer.
        if (req.headers.origin && req.headers.origin !== `https://${req.headers.host}` && req.headers.origin !== `http://${req.headers.host}`) throw new HttpError(403, 'Cross-origin requests are not allowed.');
        const publicRoute = path === '/api/definitions' || /^\/api\/auth\/(signin|signup|refresh|verify)$/.test(path);
        const bearer = req.headers.authorization;
        if (!publicRoute && (!bearer || !/^Bearer [^\s]+$/.test(bearer) || bearer.length > 16384)) throw new HttpError(401, 'Please sign in to continue.');
        let result;
        if (path === '/api/auth/signin' && method === 'POST') {
          const b = await bodyOf(req);
          result = await upstream('/profile/customer/signin', 'POST', { email: requiredString(b.email, 'email', 254), password: requiredString(b.password, 'password', 1024) });
        } else if (path === '/api/auth/signup' && method === 'POST') {
          const b = await bodyOf(req);
          result = await upstream('/profile/customer/signup', 'POST', { email: requiredString(b.email, 'email', 254), password: requiredString(b.password, 'password', 1024), firstName: requiredString(b.firstName, 'first name', 100), lastName: typeof b.lastName === 'string' ? b.lastName.slice(0, 100) : '' });
        } else if (path === '/api/auth/verify' && method === 'POST') {
          const b = await bodyOf(req);
          result = await upstream('/profile/security/challenge/verify', 'POST', { challengeToken: requiredString(b.challengeToken, 'challenge token', 16384), code: requiredString(b.code, 'verification code', 100), trustDevice: b.rememberDevice === true });
        } else if (path === '/api/auth/password' && method === 'POST') {
          const b = await bodyOf(req);
          result = await upstream('/profile/customer/password/change', 'POST', { password: requiredString(b.password, 'current password', 1024), newPassword: requiredString(b.newPassword, 'new password', 1024) }, bearer);
        } else if (path === '/api/auth/refresh' && method === 'POST') {
          const b = await bodyOf(req);
          result = await upstream('/profile/customer/refresh', 'POST', { refresh_token: requiredString(b.refresh_token, 'refresh token', 16384) });
        } else if (path === '/api/definitions' && method === 'GET') {
          result = { status: 200, data: { data: [await definition()] } };
        } else if (path === '/api/intake-schema' && method === 'GET') {
          const def = await definition(), form = def.data?.form;
          let schema = { type: 'object', properties: {} };
          if (form && typeof form === 'object') schema = form.data?.schema || form.schema;
          else if (form) {
            const rows = (await upstream(`/repository/collections/${encodeURIComponent(form)}`, 'GET', undefined, bearer)).data;
            schema = rows.find(row => row.data?.name === form)?.data?.schema;
          }
          if (!schema?.properties) throw new HttpError(503, 'The configured booking form is unavailable.');
          result = { status: 200, data: schema };
        } else if (path === '/api/slots' && method === 'POST') {
          const b = await bodyOf(req);
          result = await upstream('/crm/reservations/slots', 'POST', { reservationDefinitionId: config.definitionId, serviceName: requiredString(b.serviceName, 'service'), serviceDate: requiredString(b.serviceDate, 'date', 10) }, bearer);
        } else if (path === '/api/bookings' && method === 'GET') {
          result = await upstream('/client-data/reservations', 'GET', undefined, bearer);
          result.data = { ...result.data, data: result.data.data.filter(row => String(row.data?.reservationDefinitionId) === config.definitionId) };
        } else if (path === '/api/bookings' && method === 'POST') {
          const b = await bodyOf(req);
          if (b.form !== undefined && (!b.form || typeof b.form !== 'object' || Array.isArray(b.form))) throw new HttpError(400, 'Invalid booking answers.');
          result = await upstream('/client-data/reservations', 'POST', { reservationDefinitionId: config.definitionId, service: requiredString(b.service, 'service'), startTime: requiredString(b.startTime, 'start time'), ...(b.endTime ? { endTime: requiredString(b.endTime, 'end time') } : {}), ...(b.form ? { form: b.form } : {}) }, bearer, true);
        } else {
          const match = /^\/api\/bookings\/([\w-]+)(\/reschedule)?$/.exec(path);
          if (!match || (match[2] ? method !== 'POST' : method !== 'GET')) throw new HttpError(404, 'Route not found.');
          result = await owned(match[1], bearer);
          if (match[2]) {
            const b = await bodyOf(req);
            result = await upstream(`/crm/reservations/reschedule/${encodeURIComponent(match[1])}`, 'POST', { startTime: requiredString(b.startTime, 'start time'), reason: 'Customer requested change', notify: false }, bearer, true);
          }
        }
        return json(res, result.status, result.data);
      }
      if (!['GET', 'HEAD'].includes(method)) throw new HttpError(405, 'Method not allowed.');
      const decoded = decodeURIComponent(path);
      let file = resolve(staticDir, '.' + decoded);
      if (!file.startsWith(resolve(staticDir) + sep)) file = resolve(staticDir, 'index.html');
      try { if (!(await stat(file)).isFile()) file = resolve(staticDir, 'index.html'); }
      catch { if (extname(decoded)) throw new HttpError(404, 'File not found.'); file = resolve(staticDir, 'index.html'); }
      let data;
      try { data = await readFile(file); } catch { throw new HttpError(503, 'Build the frontend with npm run build before starting this application.'); }
      const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
      res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream', 'cache-control': extname(file) === '.html' ? 'no-cache' : 'public, max-age=3600', 'x-content-type-options': 'nosniff', 'referrer-policy': 'same-origin', 'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'" });
      res.end(method === 'HEAD' ? undefined : data);
    } catch (e) { json(res, e.status || 500, { message: e.status ? e.message : 'Appointments are temporarily unavailable.', ...(e.code ? { code: e.code } : {}) }); }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const config = await loadConfig();
  const server = createServer(config);
  server.requestTimeout = 20000; server.headersTimeout = 15000;
  server.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('Atelier booking server is ready.'));
}
