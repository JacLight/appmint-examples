import test from 'node:test';
import assert from 'node:assert/strict';
import { Transport } from '../dist/transport.js';
import { resolveConfig } from '../dist/config.js';

for (const legacyKey of [undefined, '', 'legacy-key']) {
  test(`server authenticates newly registered credentials (legacy key ${JSON.stringify(legacyKey)})`, async () => {
    const calls = [];
    const client = new Transport(resolveConfig({
      baseUrl: 'https://backend.example.test', orgId: 'training',
      appId: 'course-client', appSecret: 'test-secret', appKey: legacyKey,
      fetch: async (url, init) => {
        calls.push({url, ...init});
        return Response.json(url.endsWith('/profile/app/key') ? {token: 'test-app-token'} : {sk: 'customer-a'});
      },
    }));
    client.setCustomerToken('Bearer test-person-token');
    await client.request('GET', '/client-data/profile');
    await client.request('GET', '/client-data/profile');
    assert.equal(calls.length, 3, 'one token exchange, then two protected reads');
    assert.equal(calls[0].url, 'https://backend.example.test/profile/app/key');
    assert.equal(calls[0].headers.orgid, 'training');
    assert.deepEqual(JSON.parse(calls[0].body), {
      appId: 'course-client', secret: 'test-secret',
      ...(legacyKey === undefined ? {} : {key: legacyKey}),
    });
    assert.equal(calls[1].headers.Authorization, 'Bearer test-app-token');
    assert.equal(calls[1].headers['x-client-authorization'], 'Bearer test-person-token');
  });
}

test('missing app secret does not attempt credential exchange', async () => {
  const calls = [];
  const client = new Transport(resolveConfig({
    baseUrl: 'https://backend.example.test', orgId: 'training', appId: 'course-client',
    fetch: async (url, init) => { calls.push({url, ...init}); return Response.json({ok: true}); },
  }));
  await client.request('GET', '/health');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].headers.Authorization, undefined);
});
