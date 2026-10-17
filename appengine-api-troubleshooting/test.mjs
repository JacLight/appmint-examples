import assert from'node:assert/strict';import{request,bookingView,ApiFailure}from'./client.mjs';
const record={sk:'000000000000000000000001',data:{name:'OWNED-BOOKING',service:'Private session',status:'cancelled',startTime:'2026-10-20T17:00:00.000Z',timezone:'America/Los_Angeles',customer:{name:'Owned customer'}}};
assert.equal(bookingView(record).code,'OWNED-BOOKING');assert.throws(()=>bookingView({booking:record}),/response shape/);assert.throws(()=>bookingView({sk:record.sk,data:{status:'cancelled'}}),/response shape/);
const config={endpoint:'https://training.invalid',org:'owned-training',token:'not-a-real-token'};const real=globalThis.fetch;let calls=0;
try{
 globalThis.fetch=async()=>{calls++;return new Response('Not Found',{status:404})};await assert.rejects(request('GET','/version',undefined,config),e=>e instanceof ApiFailure&&e.status===404&&e.body==='Not Found');assert.equal(calls,1);
 globalThis.fetch=async()=>{calls++;return new Response(JSON.stringify({error:'Unavailable'}),{status:503})};await assert.rejects(request('GET','/client-data/profile',undefined,config),e=>e.status===503);assert.equal(calls,2,'Diagnostic client must not retry a failure silently');
 globalThis.fetch=async()=>new Response(JSON.stringify(record),{status:200});assert.equal(bookingView((await request('GET','/client-data/reservations/'+record.sk,undefined,config)).body).status,'cancelled');
 globalThis.fetch=async()=>{throw new TypeError('Network request failed')};await assert.rejects(request('GET','/version',undefined,config),e=>e instanceof TypeError&&!(e instanceof ApiFailure));
}finally{globalThis.fetch=real}
console.log('Passed: record contract, plain-text error, non-retrying HTTP failure, successful mapping and transport distinction.');
