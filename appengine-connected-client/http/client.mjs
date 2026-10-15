/** Ordinary customer API sample. Node 20+. No staff credentials in this client. */
export class AppEngineCustomer {
  constructor(base, org) { this.base=base.replace(/\/$/,''); this.org=org; this.token=''; this.refreshToken=''; }
  async request(method,path,body,authenticated=true) {
    const response=await fetch(this.base+path,{method,headers:{'Content-Type':'application/json',orgid:this.org,...(authenticated&&this.token?{Authorization:`Bearer ${this.token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});
    const text=await response.text();let value;try{value=JSON.parse(text)}catch{value={message:text}}
    if(!response.ok)throw Object.assign(new Error(value.error||value.message||'Request refused'),{status:response.status,data:value});
    return value;
  }
  async signIn(email,password) {
    const value=await this.request('POST','/profile/customer/signin',{email,password},false);
    if(!value.token&&!value.access_token)return {signedIn:false,challenge:value};
    this.token=value.token||value.access_token;this.refreshToken=value.refresh_token||value.refreshToken;
    return {signedIn:true};
  }
  async refresh(){const v=await this.request('POST','/profile/customer/refresh',{refresh_token:this.refreshToken},false);this.token=v.token||v.access_token;this.refreshToken=v.refresh_token||v.refreshToken||this.refreshToken;return Boolean(this.token);}
  definitions(){return this.request('GET','/crm/reservations/definitions',undefined,false)}
  slots(definition,service,day){return this.request('POST','/crm/reservations/slots',{reservationDefinitionId:definition,serviceName:service,serviceDate:day})}
  book(definition,service,startTime,answers,endTime){return this.request('POST','/client-data/reservations',{reservationDefinitionId:definition,service,startTime,...(endTime?{endTime}:{}),...(answers?{form:answers}:{})})}
  schema(name){return this.request('GET',`/repository/collections/${encodeURIComponent(name)}`)}
  mine(){return this.request('GET','/client-data/reservations')}
  read(id){return this.request('GET',`/client-data/reservations/${encodeURIComponent(id)}`)}
  move(id,startTime){return this.request('POST',`/crm/reservations/reschedule/${encodeURIComponent(id)}`,{startTime,reason:'Customer requested change',notify:false})}
  async cancel(id){const row=await this.read(id);const d=row.data;return this.request('DELETE',`/crm/reservations/cancel/${encodeURIComponent(d.customer.email)}/${encodeURIComponent(d.name)}`)}
  signOut(){this.token='';this.refreshToken=''}
}
// Cancellation's public email+code route is capability-style. This owned-read
// preflight protects this client; it does not change direct API authorization.
// Never automatically retry a failed network write; inspect saved state first.
