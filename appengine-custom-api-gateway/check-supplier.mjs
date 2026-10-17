// Server-side example. Run once per intentional availability check.
const { APPENGINE_ENDPOINT, ORG_ID, STAFF_TOKEN, SUPPLIER_URL,
  SUPPLIER_KEY, RESERVATION_ID } = process.env;
for (const [name,value] of Object.entries({APPENGINE_ENDPOINT,ORG_ID,STAFF_TOKEN,SUPPLIER_URL,SUPPLIER_KEY,RESERVATION_ID})) {
  if (!value) throw new Error(`Missing ${name}`);
}
const sku = process.argv[2] || 'RS-TEA-24';
const url = new URL('/availability', SUPPLIER_URL);
url.searchParams.set('sku', sku);
const supplier = await fetch(url, {
  headers: {'x-supplier-key': SUPPLIER_KEY}, signal: AbortSignal.timeout(5000)
});
const answer = await supplier.json();
if (!supplier.ok) throw new Error(`Supplier HTTP ${supplier.status}: ${answer.error || 'request failed'}`);
if (answer.sku !== sku || !Number.isFinite(answer.available) || answer.available < 0 ||
    !Number.isFinite(answer.leadTimeWeeks) || answer.leadTimeWeeks < 0) {
  throw new Error('Supplier returned an unexpected availability contract');
}
if(answer.available===0){console.log(JSON.stringify({sku,available:0,noteWritten:false,reason:'Out of stock'}));process.exit(0);}
const checkedAt = new Date().toISOString();
const comment = `Tutorial Riverside Provisions check: ${sku}; ${answer.available} units available; lead time ${answer.leadTimeWeeks} weeks. Checked ${checkedAt}. Supplier fixture, not a placed order.`;
const headers = {orgid: ORG_ID, Authorization: `Bearer ${STAFF_TOKEN}`, 'Content-Type':'application/json'};
const path = `${APPENGINE_ENDPOINT.replace(/\/$/,'')}/notes/reservation/${encodeURIComponent(RESERVATION_ID)}`;
const saved = await fetch(path, {method:'POST',headers,body:JSON.stringify({comment}),signal:AbortSignal.timeout(15000)});
if (!saved.ok) throw new Error(`AppEngine note write failed: HTTP ${saved.status}`);
const read = await fetch(path,{headers,signal:AbortSignal.timeout(15000)});
if (!read.ok) throw new Error(`AppEngine note read failed: HTTP ${read.status}`);
const notes = await read.json();
if (!Array.isArray(notes) || !notes.some(n => n.comment === comment)) throw new Error('Saved note missing from readback');
console.log(JSON.stringify({sku,available:answer.available,leadTimeWeeks:answer.leadTimeWeeks,checkedAt,noteVerified:true},null,2));
