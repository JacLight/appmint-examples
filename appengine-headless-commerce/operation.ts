// Node20+: compile this file, then run the generated JavaScript with a request JSON file.
import fs from 'node:fs';
type Operation = {method: string; path: string; identity: 'public' | 'staff' | 'customer'; mutation?: boolean; body?: unknown};
const file = process.argv[2];
if (!file) throw Error('Pass a request JSON file');
const op: Operation = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!['public', 'staff', 'customer'].includes(op.identity) || !op.path?.startsWith('/') || op.path.startsWith('//')) throw Error('Invalid operation identity or relative API path');
const {APPENGINE_ENDPOINT, ORG_ID, CUSTOMER_TOKEN, STAFF_TOKEN} = process.env;
if (!APPENGINE_ENDPOINT || !ORG_ID) throw Error('Set APPENGINE_ENDPOINT and ORG_ID');
const token = op.identity === 'public' ? undefined : op.identity === 'staff' ? STAFF_TOKEN : CUSTOMER_TOKEN;
if (op.identity !== 'public' && !token) throw Error('Set the token for this operation identity: ' + op.identity);
if (op.mutation && process.env.CONFIRM_TEST_OPERATION !== 'yes') throw Error('Review request and set CONFIRM_TEST_OPERATION=yes for this deliberate sandbox mutation');
if (/YOUR_|SAVED_|SELECTED_|REPLACE_/.test(JSON.stringify(op))) throw Error('Replace the marked request values from your own saved response');
const headers: Record<string, string> = {orgid: ORG_ID};
if (token) headers.Authorization = 'Bearer ' + token;
if (op.body !== undefined) headers['Content-Type'] = 'application/json';
const r = await fetch(APPENGINE_ENDPOINT.replace(/\/$/, '') + op.path, {method: op.method, headers, body: op.body !== undefined ? JSON.stringify(op.body) : undefined});
const text = await r.text();
if (!text) console.log('null');
else { try { console.log(JSON.stringify(JSON.parse(text), null, 2)); } catch { console.log(text); } }
if (!r.ok) process.exitCode = 1;
