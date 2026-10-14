/** Typed AppEngine workflows; accepts official AppmintClient.request unchanged. */
export interface Client {request<T=unknown>(method:string,path:string,body?:unknown,query?:Record<string,unknown>):Promise<T>}
export interface Fixture {name:string;workspaceId:string;conversationId:string;assistantId?:string}
export interface Work {sk:string;data:{employee:string;status:string;source:string;ref?:{datatype:string;id:string};pendingApproval?:{action:string;summary:string;amountUsd?:number};result?:unknown}}
export interface Approval {action:'calls'|'delete'|'bulkSend'|'money'|'usersAndPermissions'|'other';summary:string;detail?:unknown;amountUsd?:number}
export type Lease={job?:Work|null;reason?:string;[key:string]:unknown};
const E=encodeURIComponent;
export class Employees {
 constructor(private client:Client,private f:Fixture){}
 detail(){return this.client.request('GET',`/ai-employees/${E(this.f.name)}`)}
 config(){return this.client.request('GET','/ai-employees/config')}
 templates(){return this.client.request('GET','/ai-employees/templates')}
 instructions(){return this.client.request('GET',`/ai-employees/${E(this.f.name)}/instructions`)}
 create(profile:Record<string,unknown>){return this.client.request('POST','/ai-employees',profile)}
 access(groups?:string[]){return this.client.request(groups?'PUT':'GET',`/ai-employees/${E(this.f.name)}/access`,groups?{groups}:undefined)}
 update(changes:Record<string,unknown>){return this.client.request('PUT',`/ai-employees/${E(this.f.name)}`,changes)}
 provision(){return this.client.request('POST',`/ai-employees/${E(this.f.name)}/provision`,{})}
 providerStatus(){return this.client.request('GET',`/ai-employees/${E(this.f.name)}/provider-status`)}
 switchOn(){return this.client.request('POST',`/ai-employees/${E(this.f.name)}/switch-on`,{})}
 pause(){return this.client.request('POST',`/ai-employees/${E(this.f.name)}/pause`,{})}
 work(){return this.client.request<{data:Work[]}>('GET','/ai-employees/work',undefined,{employee:this.f.name,pageSize:50})}
 workDetail(id:string){return this.client.request<Work>('GET',`/ai-employees/work/${E(id)}`)}
 giveWork(title:string,instructions:string){return this.client.request<Work>('POST',`/ai-employees/${E(this.f.name)}/work`,{title,instructions})}
 assignTask(title:string,description:string,email:string){return this.client.request('POST',`/workspace/${E(this.f.workspaceId)}/item`,{type:'task',title,task:{title,description,assignTo:[email]}})}
 taskResult(id:string){return this.client.request('GET',`/workspace/${E(this.f.workspaceId)}/tasks/${E(id)}`)}
 messages(shared=false){return this.client.request('GET',`/workspace/${E(shared?this.f.workspaceId:this.f.conversationId)}/items`,undefined,{limit:50})}
 say(message:string,options:{shared?:boolean;email?:string}={}){if(options.shared&&!options.email)throw Error('Mention the selected employee');return this.client.request('POST',`/workspace/${E(options.shared?this.f.workspaceId:this.f.conversationId)}/item`,{type:'message',message,...(options.shared?{mentions:[options.email]}:{})})}
 decide(id:string,decision:'approved'|'rejected',note?:string){return this.client.request('POST',`/ai-employees/work/${E(id)}/decide`,{decision,note})}
 retry(id:string){return this.client.request('POST',`/ai-employees/work/${E(id)}/retry`,{})}
 cancel(id:string){return this.client.request('POST',`/ai-employees/work/${E(id)}/cancel`,{})}
 summary(since:string){return this.client.request('GET',`/ai-employees/worker/${E(this.f.name)}/summary`,undefined,{since})}
 assistant(task:string){if(!this.f.assistantId)throw Error('Select an existing configured Assistant');return this.client.request('POST',`/crm/ai-assistant/${E(this.f.assistantId)}/execute`,{task})}
 assistantActivities(){if(!this.f.assistantId)throw Error('Select an Assistant');return this.client.request('GET',`/crm/ai-assistant/${E(this.f.assistantId)}/activities`)}
}
/** Use own employee session, never the supervisor session. */
export class EmployeeWorker {
 constructor(private client:Client,private name:string,private worker:string){}
 hello(runtime:Record<string,unknown>){return this.client.request('POST','/ai-employees/me/hello',runtime)}
 briefing(){return this.client.request('GET','/ai-employees/me/briefing')}
 lease(){return this.client.request<Lease>('POST',`/ai-employees/worker/${E(this.name)}/lease`,{worker:this.worker})}
 step(id:string,text:string){return this.client.request('POST',`/ai-employees/worker/work/${E(id)}/step`,{worker:this.worker,kind:'note',text})}
 approval(id:string,input:Approval){return this.client.request<{allowed:boolean}>('POST',`/ai-employees/worker/work/${E(id)}/approval`,{...input,worker:this.worker})}
 complete(id:string,result:unknown,costUsd?:number){return this.client.request('POST',`/ai-employees/worker/work/${E(id)}/complete`,{worker:this.worker,result,costUsd})}
 fail(id:string,error:string,retry=false){return this.client.request('POST',`/ai-employees/worker/work/${E(id)}/fail`,{worker:this.worker,error,retry})}
}
