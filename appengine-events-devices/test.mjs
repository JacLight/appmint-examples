import test from 'node:test';import assert from 'node:assert/strict';import {Venue} from './events.mjs';
const ctx={eventId:'owned-event',zone:'main',entrance:'front',benefitPoint:'lunch'};
function fake(responses){const calls=[];return{calls,request:async(...args)=>{calls.push(args);return responses.shift();}};}
test('admission does not use outside-ineligible benefit preflight; denial still refreshes occupancy',async()=>{
 const c=fake([{success:false,reason:'At capacity'},{occupancy:{main:{currentOccupancy:1}}}]);
 const r=await new Venue(c,ctx).admit('ticket-code');assert.equal(r.decision.success,false);assert.deepEqual(c.calls.map(x=>x[1]),['/events/checkin','/events/owned-event/occupancy']);assert.equal(c.calls[0][2].checkpoint,'front');
});
test('benefit preview is explicitly non-redeeming and uses distinct checkpoint',async()=>{
 const c=fake([{eligible:true,claimed:false}]);await new Venue(c,ctx).benefit('code');assert.deepEqual(c.calls[0][2],{eventId:'owned-event',zone:'main',checkpoint:'lunch',code:'code',redeem:false});
});
test('uncertain write does not silently retry or report a saved outcome',async()=>{
 let n=0;const c={request:async()=>{n++;throw Error('Connection lost');}};await assert.rejects(new Venue(c,ctx).admit('code'),/Connection lost/);assert.equal(n,1);
});
test('console print result never marks the badge physically printed',async()=>{
 const c=fake([{badgeData:{holderName:'Guest',eventTitle:'Summit',code:'ABC'}},{ok:true,ref:'console-test'}]);const v=new Venue(c,ctx);const r=await v.previewBadgeDispatch('ticket');assert.equal(r.physicalOutputVerified,false);assert.equal(c.calls.length,2);assert.deepEqual(c.calls[1][3],{adapter:'console'});assert.equal(c.calls[1][2].data.ticketType,'label');assert.deepEqual(c.calls[1][2].data.lines[2],{kind:'barcode',data:'ABC',type:'CODE128'});assert.throws(()=>v.confirmBadgePrinted('ticket'),/actual paper/);assert.equal(c.calls.length,2);
});
test('CRM create has future-times contract, not Repository event writes',async()=>{
 const c=fake([{sk:'event'}]);await Venue.create(c,{title:'Summit',startTime:'2030-01-01T10:00:00Z',endTime:'2030-01-01T11:00:00Z',timezone:'UTC',zones:[],scanPoints:[]});assert.equal(c.calls[0][1],'/crm/events/create');assert.equal(c.calls[0][2].data.startTime,'2030-01-01T10:00:00Z');
});
test('saved admission remains known if only occupancy read fails',async()=>{
 let calls=[];const c={request:async(method,path)=>{calls.push([method,path]);if(method==='GET')throw Error('Read unavailable');return {success:true,ticket:{sk:'saved'}};}};
 const r=await new Venue(c,ctx).admit('code');assert.equal(r.decision.success,true);assert.equal(r.occupancy,null);assert.match(r.refreshError,/retry the read/);assert.equal(calls.filter(x=>x[0]==='POST').length,1);
});
test('credential entrance uses configured credential matcher, not ticket-only front gate',async()=>{
 const c=fake([{success:true},{}]);await new Venue(c,{...ctx,credentialEntrance:'wristband-gate'}).admitCredential('owned-band');assert.equal(c.calls[0][2].checkpoint,'wristband-gate');
 await assert.rejects(new Venue(fake([]),ctx).admitCredential('owned-band'),/credential_code/);
});
