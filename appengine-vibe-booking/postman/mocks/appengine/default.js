/** Source-backed test stand-in, not course data. See README for provenance. */
const http = require('http');
const customer = { datatype: 'customer', sk: 'customer1', data: { email: 'customer@example.test', firstName: 'Casey', lastName: 'Test' } };
const definition = { sk: 'definition1', data: { name: 'test-consultations', status: 'active', form: 'test_intake', officeHours: { timezone: 'America/Chicago' }, services: [{ name: 'Room planning', duration: 30 }] } };
const schema = { type: 'object', required: ['brief'], properties: { brief: { type: 'string', minLength: 12 }, consent: { type: 'boolean', const: true } } };
const send = (res, status, value) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(value)); };
http.createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  const b = req.body || {};
  const records = await pm.state.get('appengine:records') || [];
  if (path === '/profile/customer/signup') return send(res, 201, { customer: { ...customer, data: { ...customer.data, email: b.email, firstName: b.firstName } }, token: 'customer-access', refreshToken: 'customer-refresh' });
  if (path === '/profile/security/challenge/verify') return b.code === '123456' ? send(res, 201, { user: customer, token: 'customer-access', refreshToken: 'customer-refresh' }) : send(res, 400, { message: 'Invalid code' });
  if (path === '/profile/customer/password/change') return b.password && b.newPassword ? send(res, 201, { ...customer, data: { ...customer.data, temporaryPassword: false } }) : send(res, 400, { message: 'Invalid password' });
  if (path === '/profile/customer/signin') {
    if (b.email === 'verify@example.test') return send(res, 201, { requiresTwoFactor: true, challengeToken: 'challenge-fixture', twoFactorMethod: 'email', message: 'Verification code sent to your email' });
    if (b.email === 'temporary@example.test') return send(res, 201, { token: 'temporary-password-token', requiresPasswordChange: true, message: 'Please set a new password.' });
    if (b.email === 'expired@example.test') return send(res, 201, { customer, token: 'expired', refreshToken: 'invalid' });
    return send(res, 201, { customer, token: 'customer-access', refreshToken: 'customer-refresh' });
  }
  if (path === '/profile/customer/refresh') return b.refresh_token === 'invalid' ? send(res, 401, { message: 'Expired session' }) : send(res, 201, { user: customer, token: 'customer-renewed', refreshToken: 'customer-refresh' });
  if (path === '/crm/reservations/definitions') return send(res, 200, { data: [definition] });
  if (req.headers.authorization === 'Bearer expired') return send(res, 401, { message: 'Expired session' });
  if (path === '/repository/collections/test_intake') return send(res, 200, [{ data: { name: 'test_intake', schema } }]);
  if (path === '/crm/reservations/slots') return send(res, 200, { slots: [{ startTime: '2027-01-04T15:00:00.000Z', endTime: '2027-01-04T15:30:00.000Z', businessTimezone: 'America/Chicago', spotsAvailable: 1 }, { startTime: '2027-01-04T16:00:00.000Z', endTime: '2027-01-04T16:30:00.000Z', businessTimezone: 'America/Chicago', spotsAvailable: 1 }] });
  if (path === '/client-data/reservations' && req.method === 'GET') return send(res, 200, { data: records });
  if (path === '/client-data/reservations' && req.method === 'POST') {
    if (b.startTime === 'conflict') return send(res, 409, { reason: 'slot_unavailable', message: 'Slot unavailable' });
    if (b.startTime === 'unknown') { res.writeHead(502, { 'content-type': 'text/html' }); return res.end('<html>upstream lost</html>'); }
    if (b.startTime === 'hang') return setTimeout(() => send(res, 201, {}), 500);
    if (b.reservationDefinitionId !== 'definition1' || b.service !== 'Room planning' || typeof b.form?.brief !== 'string') return send(res, 400, { message: 'Bad contract' });
    const row = { sk: `booking${records.length + 1}`, data: { ...b, name: `REF${records.length + 1}`, status: 'new', timezone: 'America/Chicago', customerId: customer.sk } };
    records.push(row); await pm.state.set('appengine:records', records); return send(res, 201, row);
  }
  if (path.startsWith('/client-data/reservations/')) return send(res, records.some(x => x.sk === path.split('/').pop()) ? 200 : 404, records.find(x => x.sk === path.split('/').pop()) || { message: 'Not found' });
  if (path.startsWith('/crm/reservations/reschedule/')) {
    const row = records.find(x => x.sk === path.split('/').pop());
    if (!row) return send(res, 404, { message: 'Not found' });
    if (b.startTime === 'conflict') return send(res, 409, { reason: 'slot_unavailable', message: 'Slot unavailable' });
    row.data.startTime = b.startTime; row.data.endTime = new Date(Date.parse(b.startTime) + 1800000).toISOString();
    await pm.state.set('appengine:records', records); return send(res, 201, row);
  }
  return send(res, 501, { message: 'Endpoint not modeled by this test stand-in' });
}).listen(process.env.PORT || 4500);
