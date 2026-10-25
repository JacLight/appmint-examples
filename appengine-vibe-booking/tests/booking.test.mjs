import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { createServer, loadConfig } from '../server.mjs';

const upstream = process.env.SIMULATION_URL || 'http://127.0.0.1:4917/appengine';
let server, base, temporary, createBookingApi;
const storage = () => { const map = new Map(); return { getItem: k => map.get(k) || null, setItem: (k, v) => map.set(k, v), removeItem: k => map.delete(k) }; };
before(async () => {
  const probe = await fetch(upstream + '/crm/reservations/definitions').catch(() => null);
  assert.equal(probe?.status, 200, 'Start the local Postman simulation from README before running tests.');
  server = createServer({ baseUrl: upstream, orgId: 'testorg', definitionId: 'definition1' }, { timeoutMs: 200 });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  temporary = await mkdtemp(join(tmpdir(), 'atelier-adapter-'));
  const source = await readFile(new URL('../web/src/appengine-api.ts', import.meta.url), 'utf8');
  await writeFile(join(temporary, 'adapter.mjs'), ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
  ({ createBookingApi } = await import(pathToFileURL(join(temporary, 'adapter.mjs'))));
});
after(async () => { if (server) await new Promise(resolve => server.close(resolve)); if (temporary) await rm(temporary, { recursive: true }); });
const post = (path, body, token = 'customer-access') => fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify(body) });

test('customer signs in, loads configured form, books, reads and reschedules over real HTTP', async () => {
  const memory = storage(), api = createBookingApi({ base, storage: memory });
  const customer = await api.signIn({ email: 'customer@example.test', password: 'fixture-password' });
  assert.equal(customer.email, 'customer@example.test');
  const [service] = await api.services();
  assert.equal(service.definitionId, 'definition1');
  const schema = await api.intakeSchema(service.id);
  assert.deepEqual(schema.required, ['brief']);
  const slots = await api.availability({ serviceId: service.id, date: '2027-01-04', timeZone: service.timeZone });
  const created = await api.createBooking({ serviceId: service.id, slotId: slots[0].id, answers: { brief: 'A practical room plan', consent: true } });
  assert.equal(created.status, 'new'); assert.equal(created.answers.consent, true);
  assert.equal((await api.booking(created.id)).reference, created.reference);
  const moved = await api.rescheduleBooking(created.id, { slotId: slots[1].id });
  assert.equal(moved.start, slots[1].start); assert.equal(moved.reference, created.reference);
  assert.equal(moved.answers.brief, 'A practical room plan');
  assert((await api.bookings()).some(row => row.id === created.id));
  const restored = createBookingApi({ base, storage: memory });
  assert.equal((await restored.session()).id, customer.id);
  await restored.signOut(); assert.equal(await restored.session(), null);
});

test('expired refresh clears the session and rejects a mutation without replaying it', async () => {
  const memory = storage(), api = createBookingApi({ base, storage: memory });
  await api.signIn({ email: 'expired@example.test', password: 'fixture-password' });
  await assert.rejects(api.bookings(), error => error.status === 401);
  assert.equal(await api.session(), null);
  await assert.rejects(api.createBooking({ serviceId: 'definition1:Room planning', slotId: 'unknown', answers: {} }));
});

test('slot conflict, upstream HTML and timeout preserve controlled error outcomes', async () => {
  for (const [startTime, status, code] of [['conflict', 409, 'UPSTREAM_ERROR'], ['unknown', 502, 'WRITE_OUTCOME_UNKNOWN'], ['hang', 502, 'WRITE_OUTCOME_UNKNOWN']]) {
    const response = await post('/api/bookings', { service: 'Room planning', startTime, form: { brief: 'Test details' } });
    assert.equal(response.status, status); assert.equal((await response.json()).code, code);
  }
});

test('allowlist, fixed organization/definition and body boundary reject unwanted requests', async () => {
  assert.equal((await post('/api/proxy', { url: 'https://example.test' })).status, 404);
  assert.equal((await post('/api/bookings/missing/reschedule', { startTime: 'conflict' })).status, 404);
  assert.equal((await post('/api/bookings', { payload: 'x'.repeat(70000) })).status, 413);
  const response = await fetch(base + '/api/config'); assert.deepEqual(await response.json(), { orgId: 'testorg', definitionId: 'definition1' });
  assert.equal((await fetch(base + '/api/bookings', { headers: { origin: 'https://untrusted.test', authorization: 'Bearer customer-access' } })).status, 403);
  await assert.rejects(loadConfig({ APPENGINE_BASE_URL: 'http://external.test', APPENGINE_ORG_ID: 'org', APPENGINE_DEFINITION_ID: 'id' }), /HTTPS/);
});


test('signup, verification and temporary-password flows do not accept unfinished authentication', async () => {
  const api = createBookingApi({ base, storage: storage() });
  const registered = await api.signUp({ email: 'new@example.test', password: 'new-fixture-password', firstName: 'New', lastName: 'Customer' });
  assert.equal(registered.email, 'new@example.test');
  await api.signOut();
  const challenge = await api.signIn({ email: 'verify@example.test', password: 'fixture-password' });
  assert.equal(challenge.kind, 'challenge'); assert.equal(await api.session(), null);
  await assert.rejects(api.verifyChallenge({ challengeToken: challenge.challengeToken, code: 'invalid' }));
  const verified = await api.verifyChallenge({ challengeToken: challenge.challengeToken, code: '123456', rememberDevice: true });
  assert.equal(verified.id, 'customer1');
  const temporary = await api.signIn({ email: 'temporary@example.test', password: 'temporary' });
  assert.equal(temporary.kind, 'passwordChangeRequired'); assert.equal(await api.session(), null);
  await api.changePassword({ password: 'temporary', newPassword: 'replacement-fixture' });
  assert.equal(await api.session(), null);
});
