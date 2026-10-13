import test from 'node:test';
import assert from 'node:assert/strict';
import {Portal} from './portal.mjs';
import {customerClient,defaultSdkModule} from './sdk-host.mjs';
const row={sk:'123456789012345678901234',data:{reservationDefinitionId:'def',service:'Assessment',name:'BOOK42',customer:{email:'dana+test@training.local'}}};
function mock(answer){const calls=[];return{calls,request:async(...args)=>{calls.push(args);return answer(...args);},setCustomerToken(t){this.token=t;}};}
test('failed owned read blocks capability cancellation entirely',async()=>{
 const client=mock(()=>{throw Object.assign(Error('Not found'),{status:404});});
 await assert.rejects(new Portal(client).cancel(row.sk),{status:404});assert.equal(client.calls.length,1);
});
test('cancellation derives email/code only after owned read then verifies saved result',async()=>{
 const client=mock(method=>method==='GET'?row:{success:true});await new Portal(client).cancel(row.sk);
 assert.equal(client.calls[1][1],'/crm/reservations/cancel/dana%2Btest%40training.local/BOOK42');assert.equal(client.calls[2][0],'GET');
});
test('availability preserves source definition/service and frees own seat',async()=>{
 const c=mock(method=>method==='GET'?row:{slots:[]});await new Portal(c).availability(row.sk,'2026-11-06');
 assert.deepEqual(c.calls[1][2],{reservationDefinitionId:'def',serviceName:'Assessment',from:'2026-11-06',days:7,excludeReservationId:row.sk});
});
test('full destination refuses move without blind retry or cancellation',async()=>{
 const c=mock(method=>{if(method==='POST')throw Object.assign(Error('Full'),{status:409});return row;});await assert.rejects(new Portal(c).move(row.sk,'2026-11-06T16:00:00Z'),{status:409});assert.equal(c.calls.length,2);assert.equal(c.calls[1][1],'/crm/reservations/reschedule/'+row.sk);
});
test('switch replaces full stored session and token before subsequent call',async()=>{
 const replacement={token:'new',refreshToken:'new-refresh',customer:{data:{sharedAccountId:'company'}}};const c=mock(()=>replacement);let saved;
 await new Portal(c,async s=>{saved=s;}).switchAccount('company');assert.equal(saved,replacement);assert.equal(c.token,'new');
});
test('order number and ticket page contracts remain distinct',async()=>{
 const c=mock(()=>({data:[]}));const p=new Portal(c);await p.order('ORD/42');assert.equal(c.calls[0][1],'/client-data/orders/ORD%2F42');assert.deepEqual(await p.ticket('T42'),{data:[]});
});
test('profile rejects protected fields before network',async()=>{const c=mock(()=>{});await assert.rejects(new Portal(c).updateProfile({email:'changed@invalid'}));assert.equal(c.calls.length,0);});
test('SDK injected fetch sends ordinary bearer with org and no bootstrap credentials',async()=>{
 const sdk=process.env.APPMINT_SDK_MODULE || defaultSdkModule;const seen=[];
 const c=await customerClient({baseUrl:'https://appengine.example',orgId:'owned-lab',token:'customer-only',sdkModule:sdk,fetchImpl:async(url,init)=>{seen.push({url,init});return new Response(JSON.stringify(row),{status:200});}});
 await new Portal(c).reservation(row.sk);assert.equal(seen.length,1);assert.equal(seen[0].init.headers.get('Authorization'),'Bearer customer-only');assert.equal(seen[0].init.headers.get('orgid'),'owned-lab');assert.equal(seen[0].init.headers.get('x-client-authorization'),null);
});
import {InvitationHandles} from './invitations.mjs';
test('invitation handles contain no token and require fresh session-owned pending record',()=>{
 const profile={data:{sharedAccountInvites:[{token:'secret-capability',accountId:'company',accountName:'Company',role:'buyer'}]}};
 const h=new InvitationHandles(),other=new InvitationHandles();const [row]=h.list(profile);
 assert.equal(row.token,undefined);assert.notEqual(row.inviteId,'secret-capability');assert.equal(h.resolve(profile,row.inviteId),'secret-capability');
 assert.throws(()=>other.resolve(profile,row.inviteId),{status:404});
 assert.throws(()=>h.resolve({data:{sharedAccountInvites:[]}},row.inviteId),{status:404});
});
test('cart reads existing selected-context cart without autocreate endpoint',async()=>{const c=mock(()=>null);assert.equal(await new Portal(c).cart(),null);assert.equal(c.calls[0][1],'/storefront/cart/mine');});
test('raw empty order response becomes SDK undefined, host explicitly normalizes null',async()=>{
 const sdk=process.env.APPMINT_SDK_MODULE || defaultSdkModule;
 const c=await customerClient({baseUrl:'https://appengine.example',orgId:'owned-lab',token:'customer-only',sdkModule:sdk,fetchImpl:async()=>new Response('',{status:200})});
 const result=await new Portal(c).order('OTHER');assert.equal(result,undefined);assert.deepEqual({data:result??null},{data:null});
});
