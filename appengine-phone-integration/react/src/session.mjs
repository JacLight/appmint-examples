import {startSoftphone, persistentDeviceId} from '../../examples/browser-softphone.mjs';

export async function action(method,...args){
 const response=await fetch('/api/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({method,args})});
 const body=await response.json();if(!response.ok)throw Error(body.error||'Request failed');return body.result;
}
export async function snapshot(){const r=await fetch('/api/state');const b=await r.json();if(!r.ok)throw Error(b.error||'Refresh failed');return b;}
export async function fixtureEvent(type,payload){const r=await fetch('/fixture/event',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type,payload})});const b=await r.json();if(!r.ok)throw Error(b.error||'Simulation event failed');return b;}

/** React owns rendering. The existing tested helper owns SDK registration, renewal and heartbeat. */
export class PhoneSession {
 constructor({onState=()=>{},onIncoming=()=>{},start=startSoftphone,Device=globalThis.Twilio?.Device,deviceId,api}={}){
  Object.assign(this,{onState,onIncoming,start,Device,deviceId,api:api||{register:body=>action('register',body),heartbeat:id=>action('heartbeat',{deviceId:id}),unregister:id=>action('unregister',{deviceId:id})}});
  this.sdkReady=false;this.callState=null;this.epoch=0;this.pending=null;this.phone=null;this.active=null;this.callPending=false;this.stopping=null;
 }
 connect(){
  if(this.stopping)return this.stopping.then(()=>this.connect());
  if(this.pending)return this.pending;
  if(this.phone)return Promise.resolve(this.phone);
  const epoch=++this.epoch;this.onState({state:'connecting'});
  const pending=(async()=>{
   const owner=this;
   // Reject an extra incoming call BEFORE the shared helper observes it, so its
   // reject event cannot overwrite the active call's UI state.
   const BaseDevice=this.Device;
   const GuardedDevice=class extends BaseDevice {
    on(name,listener){return super.on(name,(...args)=>{
     if(epoch!==owner.epoch){if(name==='incoming')args[0].reject();return;}
     if(name==='incoming'&&(owner.active||owner.callPending)){args[0].reject();return;}
     listener(...args);
    });}
   };
   const phone=await this.start({api:this.api,Device:GuardedDevice,deviceId:this.deviceId||persistentDeviceId(),label:'React browser',onState:s=>{
    if(epoch!==this.epoch)return;
    if(s.state==='ready')this.sdkReady=true;
    if(['offline','error','renewal-failed'].includes(s.state))this.sdkReady=false;
    if(['dialing','ringing','connected'].includes(s.state))this.callState=s.state;
    if(s.state==='ended'){this.active=null;this.callState=null;this.onIncoming(null);this.onState({...s,state:this.sdkReady?'ready':'offline'});return;}
    if(s.state==='ready'&&this.callState){this.onState({...s,state:this.callState});return;}
    this.onState(s);
   },onIncoming:call=>{
    if(epoch!==this.epoch||this.active||this.callPending){call.reject();return;}
    this.active=call;this.onIncoming(call);
   }});
   if(epoch!==this.epoch){await phone.stop?.();return null;}
   if(phone.available)this.phone=phone;
   return phone;
  })().catch(error=>{if(epoch===this.epoch)this.onState({state:'error',reason:error.message});throw error;});this.pending=pending;
  pending.finally(()=>{if(this.pending===pending)this.pending=null}).catch(()=>{});
  return pending;
 }
 async dial(to,from){
  if(!this.phone)throw Error('Connect first');if(this.active||this.callPending)throw Error('Finish the current call first');
  const epoch=this.epoch;this.callPending=true;
  try{const call=await this.phone.call(to,from);if(epoch!==this.epoch){await call.hangUp();return;}this.active=call;return call;}
  finally{this.callPending=false;}
 }
 disconnect(){
  if(this.stopping)return this.stopping;
  ++this.epoch;this.sdkReady=false;this.callState=null;const phone=this.phone;this.phone=null;this.active=null;
  // Keep pending until it compensates its own late registration; block new connection meanwhile.
  const stopping=(async()=>{try{await phone?.stop();}finally{this.onIncoming(null);this.onState({state:'offline'});}})();
  this.stopping=stopping;
  stopping.finally(()=>{if(this.stopping===stopping)this.stopping=null}).catch(()=>{});
  return stopping;
 }
}
