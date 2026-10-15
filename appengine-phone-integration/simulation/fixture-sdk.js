/* Explicit offline SDK-interface fixture. No microphone, Twilio or network carrier. */
(()=>{
 const event=async(type,payload={})=>{const r=await fetch('/fixture/event',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type,payload})});const j=await r.json();if(!r.ok)throw Error(j.error);return j;};
 class Emitter{constructor(){this.handlers={}}on(k,fn){(this.handlers[k]??=[]).push(fn);return this}emit(k,...args){for(const f of this.handlers[k]||[])f(...args)}}
 class Call extends Emitter{
  constructor(id,sid,from,to){super();this.id=id;this.parameters={From:from,To:to,CallSid:sid};this.phase='pending';this.muted=false;this.started=0;}
  status(){return this.phase}isMuted(){return this.muted}
  async accept(){if(this.phase==='closed')return;await event('call-status',{id:this.id,status:'in-progress'});this.phase='open';this.started=Date.now();this.emit('accept',this)}
  async finish(status,name){if(this.phase==='closed')return;this.phase='closed';await event('call-status',{id:this.id,status,duration:this.started?Math.round((Date.now()-this.started)/1000):0});this.emit(name,this)}
  disconnect(){return this.finish(this.started?'completed':'canceled','disconnect')}
  reject(){return this.finish('busy','reject')}
  mute(value){this.muted=value;event('mute',{id:this.id,muted:value}).catch(console.error);this.emit('mute',value,this)}
  sendDigits(digits){event('digits',{id:this.id,digits}).catch(console.error)}
 }
 class Device extends Emitter{
  constructor(token){super();if(token!=='SIMULATION_ONLY_NOT_A_JWT')throw Error('Simulator refuses real voice credentials');window.phoneFixture.device=this;this.dead=false;this.active=null;}
  async register(){await event('sdk-register');if(!this.dead)this.emit('registered')}
  async connect({params}){if(this.dead)throw Error('Device stopped');const r=await event('call-start',{from:params.CallerIdOverride,to:params.To,direction:'outbound'});return this.active=new Call(r.id,r.sid,params.CallerIdOverride,params.To)}
  updateToken(token){if(token!=='SIMULATION_ONLY_NOT_A_JWT')throw Error('Simulator only');event('token-updated').catch(console.error)}
  destroy(){this.dead=true;this.active?.disconnect();this.emit('unregistered')}
 }
 window.phoneFixture={device:null,async incoming(){const d=this.device;if(!d||d.dead)throw Error('Connect the SDK first');const r=await event('call-start',{from:'+12025550118',to:'+12025550110',direction:'inbound'});d.active=new Call(r.id,r.sid,'+12025550118','+12025550110');d.emit('incoming',d.active)},async answer(){if(!this.device?.active)throw Error('Place a call first');await this.device.active.accept()},renew(){this.device?.emit('tokenWillExpire')},offline(){this.device?.emit('unregistered')},error(){this.device?.emit('error',{code:31005,message:'Simulated connection interrupted. Reconnect before placing another call.'})}};
 window.Twilio={Device};
})();
