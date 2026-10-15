/** Offline contract fixture. NOT an AppEngine server or provider implementation.
 * The production Phone client is unchanged; this transport supplies documented shapes.
 * All IDs, tokens, phone numbers, call events and message outcomes here are simulated.
 */
export class ContractFixture {
 constructor(){this.line={id:'fixture-line',phoneNumber:'+12025550110',friendlyName:'Harbor support',assignment:'direct'};this.devices=new Map();this.calls=[];this.messages=[];this.events=[];this.serial=0;}
 log(type,detail){this.events.push({sequence:++this.serial,type,detail,at:new Date().toISOString()});}
 async request(method,path,body,query={}){
  this.log('contract request',{method,path,body,query});
  const get=new Set(['/phone/user-phones','/phone/numbers','/phone/voice/app','/phone/voice/devices','/crm/communications/calls']);
  const expected=get.has(path)?'GET':'POST';if(method!==expected)throw Error('Expected '+expected+' '+path);
  if(path==='/phone/user-phones')return [this.line];
  if(path==='/phone/numbers')return [this.line];
  if(path==='/phone/voice/app')return {ready:true,needsSetup:false,needsAgreement:false,message:'Configured service fixture. No carrier connection.'};
  if(path==='/phone/voice/devices')return {devices:[...this.devices.values()]};
  if(path==='/crm/communications/calls')return {data:this.calls.map(c=>({...c.data,sid:c.data.callSid,callLogSk:c.sk,hasCallLog:true})),count:this.calls.length,total:this.calls.length,page:1};
  if(path==='/phone/voice/register-device'){
   if(!body?.deviceId||body.platform!=='web')throw Error('This fixture demonstrates web device registration');
   const identity='fixture-staff-voice';this.devices.set(body.deviceId,{...body,identity,lastSeen:new Date().toISOString()});
   return {identity,deviceId:body.deviceId,token:'SIMULATION_ONLY_NOT_A_JWT',expiresIn:3600,voiceAvailable:true,outboundReady:true,capabilities:body.capabilities,assignedPhones:[this.line]};
  }
  if(path==='/phone/voice/heartbeat'){
   const d=this.devices.get(body.deviceId);if(!d)throw Error('Unknown fixture device');d.lastSeen=new Date().toISOString();return {identity:d.identity,deviceId:body.deviceId,ok:true};
  }
  if(path==='/phone/voice/unregister-device'){this.devices.delete(body.deviceId);return {deviceId:body.deviceId,ok:true};}
  if(path==='/crm/inbox/update'){
   const d=body?.data;if(d?.from!==this.line.phoneNumber||!Array.isArray(d.to)||!d.to.length||!d.text)throw Error('Use assigned sender, recipient and message');
   const record={sk:'fixture-message-'+this.serial,data:{...d,direction:'outbound',status:query.send?'pending':'draft'}};this.messages.push(record);return structuredClone(record);
  }
  throw Error('No fixture for '+method+' '+path);
 }
 event(type,payload={}){
  this.log('simulated event',{type,...payload});
  if(type==='call-start'){
   const c={sk:'fixture-call-'+this.serial,data:{callSid:'SIMULATED-'+this.serial,from:payload.from,to:payload.to,direction:payload.direction,status:'ringing',duration:0}};this.calls.unshift(c);return {id:c.sk,sid:c.data.callSid};
  }
  if(type==='call-status'){
   const c=this.calls.find(x=>x.sk===payload.id);if(!c)throw Error('Unknown simulated call');c.data.status=payload.status;c.data.duration=payload.duration??c.data.duration;return structuredClone(c);
  }
  if(type==='message-status'){
   const m=this.messages.find(x=>x.sk===payload.id);if(!m||m.data.status==='draft')throw Error('Select a sent message');
   if(!['sent','delivered','failed','undelivered'].includes(payload.status))throw Error('Invalid fixture message outcome');
   m.data.status=payload.status;return structuredClone(m);
  }
  return {recorded:true};
 }
}
