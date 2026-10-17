// Node.js20+. Never log Authorization. Diagnose reads before considering any retry.
export class ApiFailure extends Error {
 constructor(status, body, path) { super(`AppEngine HTTP ${status}: ${typeof body==='string'?body:body.error||body.message||'Request failed'}`);Object.assign(this,{status,body,path}); }
}
export async function request(method, path, body, config={}) {
 const base=config.endpoint||process.env.APPENGINE_ENDPOINT,org=config.org||process.env.ORG_ID,token=config.token??process.env.CUSTOMER_TOKEN;
 if(!base||!org) throw new Error('Set APPENGINE_ENDPOINT and ORG_ID from your account.');
 const response=await fetch(base.replace(/\/$/,'')+path,{method,headers:{orgid:org,'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(config.timeoutMs||10000)});
 const raw=await response.text();let result;try{result=JSON.parse(raw)}catch{result=raw}
 if(!response.ok) throw new ApiFailure(response.status,result,path);
 return {status:response.status,body:result};
}
export function bookingView(record){
 if(!record||typeof record.sk!=='string'||!record.data||typeof record.data.service!=='string'||typeof record.data.status!=='string')throw new Error('Unexpected booking response shape');
 return {id:record.sk,code:record.data.name,service:record.data.service,status:record.data.status,startTime:record.data.startTime,timezone:record.data.timezone,customer:record.data.customer?.name};
}
export async function diagnose(id){
 if(!/^[a-f0-9]{24}$/i.test(id||''))throw new Error('BOOKING_ID must be an actual saved record ID.');
 const version=await request('GET','/version');
 const profile=await request('GET','/client-data/profile');
 const booking=await request('GET','/client-data/reservations/'+encodeURIComponent(id));
 return {version:version.body,customer:profile.body.data?.firstName,booking:bookingView(booking.body)};
}
