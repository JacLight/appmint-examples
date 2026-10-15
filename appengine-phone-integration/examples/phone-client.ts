export interface AppmintTransport {request<T=unknown>(method:string,path:string,body?:unknown,query?:Record<string,unknown>):Promise<T>}
export interface AssignedPhone{id:string;phoneNumber:string;friendlyName?:string;assignment:'direct'|'group'}
export interface Registration{identity:string;deviceId:string;token:string|null;voiceAvailable:boolean;outboundReady?:boolean;expiresIn?:number;reason?:string;assignedPhones:AssignedPhone[];capabilities:('voice'|'sms')[]}
export interface DeviceInput{deviceId:string;platform:'web'|'ios'|'android';label?:string;capabilities?:('voice'|'sms')[];apnsEnvironment?:'sandbox'|'production'}
export class Phone{
 constructor(private client:AppmintTransport){}
 userPhones(){return this.client.request<AssignedPhone[]>('GET','/phone/user-phones');}
 numbers(){return this.client.request('GET','/phone/numbers');}
 voiceApp(){return this.client.request<{ready:boolean;needsSetup?:boolean;needsAgreement?:boolean;message?:string}>('GET','/phone/voice/app');}
 devices(){return this.client.request<{devices:unknown[]}>('GET','/phone/voice/devices');}
 callHistory(query:Record<string,unknown>={}){return this.client.request('GET','/crm/communications/calls',undefined,query);}
 register(input:DeviceInput){if(!input.deviceId)throw Error('Persist device ID');return this.client.request<Registration>('POST','/phone/voice/register-device',input);}
 heartbeat(deviceId:string){return this.client.request<{ok:boolean}>('POST','/phone/voice/heartbeat',{deviceId});}
 unregister(deviceId:string){return this.client.request<{ok:boolean}>('POST','/phone/voice/unregister-device',{deviceId});}
 enableOutbound(force=false){return this.client.request('POST','/phone/voice/app',{force});}
 routeNumber(id:string,mode:'voice'|'ivr'){return this.client.request('POST',`/phone/numbers/${encodeURIComponent(id)}/routing`,{mode});}
 smsStatus(id:string){return this.client.request('GET',`/phone/numbers/sms-status/${encodeURIComponent(id)}`);}
 smsRequirements(id:string){return this.client.request('GET',`/phone/numbers/${encodeURIComponent(id)}/sms-requirements`);}
 sendSms(from:string,to:string[],text:string){return this.client.request('POST','/crm/inbox/update',{data:{deliveryType:'sms',from,to,text}},{send:true});}
 callAI(input:{to:string;reason:string;from?:string;assistantId?:string;greeting?:string}){return this.client.request('POST','/phone/calls/ai',input);}
}
