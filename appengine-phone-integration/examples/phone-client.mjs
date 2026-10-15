/** Platform operations; pass official AppmintClient.request as the transport.
 * Calls, messages, provisioning and routing are explicit actions, never automatic retries.
 */
export class Phone {
 constructor(client){this.client=client;}
 request(method,path,body,options){return this.client.request(method,path,body,options);}
 userPhones(){return this.request('GET','/phone/user-phones');}
 numbers(){return this.request('GET','/phone/numbers');}
 voiceApp(){return this.request('GET','/phone/voice/app');}
 devices(){return this.request('GET','/phone/voice/devices');}
 callHistory(query={}){return this.request('GET','/crm/communications/calls',undefined,query);}
 smsStatus(id){return this.request('GET','/phone/numbers/sms-status/'+encodeURIComponent(id));}
 smsRequirements(id){return this.request('GET','/phone/numbers/'+encodeURIComponent(id)+'/sms-requirements');}
 register({deviceId,platform='web',label,capabilities=['voice'],apnsEnvironment}={}){
  if(!deviceId)throw Error('Persist a device ID before registration');
  if(!['web','ios','android'].includes(platform))throw Error('Unsupported platform');
  if(apnsEnvironment&&platform!=='ios')throw Error('APNs environment is iOS-only');
  return this.request('POST','/phone/voice/register-device',{deviceId,platform,...(label?{label}:{}),capabilities,...(apnsEnvironment?{apnsEnvironment}:{})});
 }
 heartbeat(deviceId){if(!deviceId)throw Error('Use the registered device ID');return this.request('POST','/phone/voice/heartbeat',{deviceId});}
 unregister(deviceId){if(!deviceId)throw Error('Use the registered device ID');return this.request('POST','/phone/voice/unregister-device',{deviceId});}
 enableOutbound(force=false){return this.request('POST','/phone/voice/app',{force});}
 routeNumber(id,mode){if(!['voice','ivr'].includes(mode))throw Error('Choose voice or ivr');return this.request('POST','/phone/numbers/'+encodeURIComponent(id)+'/routing',{mode});}
 sendSms({from,to,text}){if(!from||!to?.length||!text)throw Error('Select an authorized sender, recipient and message');return this.request('POST','/crm/inbox/update',{data:{deliveryType:'sms',from,to,text}},{send:true});}
 callAI({to,reason,...optional}){if(!to||!reason?.trim())throw Error('Select controlled recipient and explicit purpose');return this.request('POST','/phone/calls/ai',{to,reason,...optional});}
}
