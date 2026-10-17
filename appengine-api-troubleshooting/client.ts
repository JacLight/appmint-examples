/** TypeScript5+, Node20+. Ordinary customer session; never print private headers. */
declare const process: {env: Record<string,string|undefined>};
export type JsonRecord = Record<string,unknown>;
export interface RequestConfig {endpoint?:string;org?:string;token?:string;timeoutMs?:number}
export interface BookingView {id:string;code:unknown;service:string;status:string;startTime:unknown;timezone:unknown;customer:unknown}
const object=(v:unknown):v is JsonRecord=>typeof v==='object'&&v!==null&&!Array.isArray(v);
export class ApiFailure extends Error {
 constructor(public status:number,public body:unknown,public path:string){super(`AppEngine HTTP ${status}: ${typeof body==='string'?body:object(body)?String(body.error||body.message||'Request failed'):'Request failed'}`)}
}
export async function request(method:string,path:string,body?:unknown,config:RequestConfig={}) {
 const base=config.endpoint||process.env.APPENGINE_ENDPOINT,org=config.org||process.env.ORG_ID,token=config.token??process.env.CUSTOMER_TOKEN;
 if(!base||!org)throw new Error('Set APPENGINE_ENDPOINT and ORG_ID from your account.');
 const response=await fetch(base.replace(/\/$/,'')+path,{method,headers:{orgid:org,'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(config.timeoutMs||10000)});
 const raw=await response.text();let result:unknown;try{result=JSON.parse(raw)}catch{result=raw}
 if(!response.ok)throw new ApiFailure(response.status,result,path);
 return {status:response.status,body:result};
}
export function bookingView(record:unknown):BookingView {
 if(!object(record)||typeof record.sk!=='string'||!object(record.data))throw new Error('Unexpected booking response shape');
 const d=record.data;
 if(typeof d.service!=='string'||typeof d.status!=='string')throw new Error('Unexpected booking response shape');
 return {id:record.sk,code:d.name,service:d.service,status:d.status,startTime:d.startTime,timezone:d.timezone,customer:object(d.customer)?d.customer.name:undefined};
}
export async function diagnose(id:string){
 if(!/^[a-f0-9]{24}$/i.test(id||''))throw new Error('BOOKING_ID must be an actual saved record ID.');
 const version=await request('GET','/version'),profile=await request('GET','/client-data/profile'),booking=await request('GET','/client-data/reservations/'+encodeURIComponent(id));
 return {version:version.body,customer:object(profile.body)&&object(profile.body.data)?profile.body.data.firstName:undefined,booking:bookingView(booking.body)};
}
