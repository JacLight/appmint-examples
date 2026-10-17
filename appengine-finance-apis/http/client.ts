export type Actor = 'staff'|'customer';
export type Session = {origin:string;orgId:string;token:string};
export type Operation = {actor:Actor;method:string;path:string;body?:unknown;note:string;testOnly?:boolean};
export type Envelope<T> = {sk:string;data:T};
export class FinanceClient {
 constructor(private sessions:Partial<Record<Actor,Session>>,private operations:Record<string,Operation>,private verifiedTest=false){}
 async run<T>(name:string,values:Record<string,string>={}):Promise<T>{
  const op=this.operations[name];if(!op)throw Error('Unknown operation');
  const session=this.sessions[op.actor];if(!session)throw Error('Missing '+op.actor+' session');
  if(op.testOnly&&!this.verifiedTest)throw Error('Verify the sandbox provider and original payment reference before this operation');
  const replace=(s:string,url=false)=>s.replace(/\{([A-Z_]+)\}/g,(_,key)=>{if(!values[key])throw Error('Missing '+key);return url?encodeURIComponent(values[key]):values[key]});
  const expand=(v:unknown):unknown=>typeof v==='string'?replace(v):Array.isArray(v)?v.map(expand):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,expand(x)])):v;
  const r=await fetch(session.origin.replace(/\/$/,'')+replace(op.path,true),{method:op.method,headers:{orgid:session.orgId,Authorization:`Bearer ${session.token}`,'Content-Type':'application/json'},...(op.body===undefined?{}:{body:JSON.stringify(expand(op.body))})});
  const result=await r.json();if(!r.ok)throw Object.assign(new Error('AppEngine '+r.status),{status:r.status,result});return result as T;
 }
}
// Load operations.json from your bundled source. Staff sessions belong only in your secured
// staff application/server. A customer uses their own authenticated session.
// Browser, React or React Native can use this client with native fetch; never bundle credentials.
