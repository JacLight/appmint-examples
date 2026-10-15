import test from 'node:test';import assert from 'node:assert/strict';
import {PhoneSession,action} from './session.mjs';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}};
class Device{constructor(){this.events={}}on(n,f){this.events[n]=f;return this}emit(n,...a){this.events[n]?.(...a)}}
const options={Device,deviceId:'react-test',api:{}};
test('duplicate connects share one registration; late initial completion is stopped',async()=>{
 const wait=deferred();let starts=0,stops=0;const states=[];
 const s=new PhoneSession({...options,onState:x=>states.push(x.state),start:async()=>{starts++;await wait.promise;return {available:true,stop:async()=>stops++}}});
 const a=s.connect(),b=s.connect();assert.equal(a,b);await s.disconnect();wait.resolve();await a;assert.equal(starts,1);assert.equal(stops,1);assert.equal(s.phone,null);assert.equal(states.at(-1),'offline');
});
test('callbacks from stopped session cannot mutate current UI',async()=>{
 let c;const states=[];const s=new PhoneSession({...options,onState:x=>states.push(x.state),start:async x=>{c=x;return {available:true,stop:async()=>{}}}});
 await s.connect();await s.disconnect();c.onState({state:'connected'});assert.equal(states.at(-1),'offline');
});
test('second incoming call is rejected before helper state changes',async()=>{
 let device;let first=null;const states=[];
 const s=new PhoneSession({...options,onState:x=>states.push(x.state),onIncoming:c=>first=c,start:async config=>{
  device=new config.Device();device.on('incoming',c=>{config.onState({state:'ringing'});config.onIncoming(c)});return {available:true,stop:async()=>{}};
 }});await s.connect();const accepted={reject(){throw Error('unexpected')}};device.emit('incoming',accepted);let rejects=0;device.emit('incoming',{reject(){rejects++}});assert.equal(first,accepted);assert.equal(rejects,1);assert.equal(states.filter(s=>s==='ringing').length,1);
});
test('outgoing call resolving after disconnect is hung up',async()=>{
 const wait=deferred();let ends=0;const s=new PhoneSession({...options,start:async()=>({available:true,stop:async()=>{},call:()=>wait.promise})});await s.connect();const pending=s.dial('to','from');await assert.rejects(s.dial('to','from'),/current call/);await s.disconnect();wait.resolve({hangUp:async()=>ends++});await pending;assert.equal(ends,1);assert.equal(s.active,null);
});
test('send adapter keeps successful response independent from later snapshot failure',async()=>{
 const original=globalThis.fetch;try{globalThis.fetch=async()=>({ok:true,json:async()=>({result:{sk:'saved',data:{status:'pending'}}})});const saved=await action('sendSms',{from:'line',to:['destination'],text:'hello'});assert.equal(saved.sk,'saved');assert.equal(saved.data.status,'pending');}finally{globalThis.fetch=original;}
});
test('failed connection is retryable; stop completes before a new registration',async()=>{
 const stop=deferred();let starts=0;const states=[];
 const s=new PhoneSession({...options,onState:x=>states.push(x.state),start:async()=>{starts++;if(starts===1)throw Error('offline');return {available:true,stop:()=>stop.promise}}});
 await assert.rejects(s.connect(),/offline/);assert.equal(states.at(-1),'error');await s.connect();const stopping=s.disconnect();const retry=s.connect();assert.equal(starts,2);stop.resolve();await stopping;await retry;assert.equal(starts,3);
});

test('call end restores ready state; renewal does not replace an active call state',async()=>{
 let emit;const states=[];const s=new PhoneSession({...options,onState:x=>states.push(x.state),start:async config=>{emit=config.onState;emit({state:'ready'});return {available:true,stop:async()=>{}};}});
 await s.connect();emit({state:'connected'});emit({state:'ready'});assert.equal(states.at(-1),'connected');emit({state:'ended'});assert.equal(states.at(-1),'ready');await s.disconnect();
});
