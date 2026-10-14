/** Platform workflows on official AppmintClient.request. No automatic write retry. */
const E=encodeURIComponent;
export class Employees {
 constructor(client,{name,workspaceId,conversationId}={}){this.client=client;this.name=name;this.workspaceId=workspaceId;this.conversationId=conversationId;}
 call(method,path,body,query){return this.client.request(method,path,body,query);}
 list(){return this.call('GET','/ai-employees');}
 config(){return this.call('GET','/ai-employees/config');}
 templates(){return this.call('GET','/ai-employees/templates');}
 create(profile){return this.call('POST','/ai-employees',profile);}
 detail(){return this.call('GET',`/ai-employees/${E(this.name)}`);}
 instructions(){return this.call('GET',`/ai-employees/${E(this.name)}/instructions`);}
 access(groups){return this.call(groups?'PUT':'GET',`/ai-employees/${E(this.name)}/access`,groups?{groups}:undefined);}
 update(changes){return this.call('PUT',`/ai-employees/${E(this.name)}`,changes);}
 provision(){return this.call('POST',`/ai-employees/${E(this.name)}/provision`,{});}
 providerStatus(){return this.call('GET',`/ai-employees/${E(this.name)}/provider-status`);}
 switchOn(){return this.call('POST',`/ai-employees/${E(this.name)}/switch-on`,{});}
 pause(){return this.call('POST',`/ai-employees/${E(this.name)}/pause`,{});}
 team(){return this.call('GET','/ai-employees/team');}
 work(){return this.call('GET','/ai-employees/work',undefined,{employee:this.name,pageSize:50,pings:'true'});}
 workDetail(id){return this.call('GET',`/ai-employees/work/${E(id)}`);}
 approvals(){return this.call('GET','/ai-employees/work/approvals');}
 assignDirect({title,instructions,priority='normal'}){return this.call('POST',`/ai-employees/${E(this.name)}/work`,{title,instructions,priority});}
 decide(id,decision,note){if(!['approved','rejected'].includes(decision))throw Error('Choose approved or rejected');return this.call('POST',`/ai-employees/work/${E(id)}/decide`,{decision,note});}
 retry(id){return this.call('POST',`/ai-employees/work/${E(id)}/retry`,{});}
 cancel(id){return this.call('POST',`/ai-employees/work/${E(id)}/cancel`,{});}
 directConversation(email){return this.call('POST','/workspace',{type:'conversation',direct:true,members:[{email}]});}
 messages(id=this.conversationId){return this.call('GET',`/workspace/${E(id)}/items`,undefined,{limit:50});}
 say(message,{shared=false,email}={}){const id=shared?this.workspaceId:this.conversationId;if(!id)throw Error('Select the actual conversation or team workspace');return this.call('POST',`/workspace/${E(id)}/item`,{type:'message',message,...(shared?{mentions:[email]}:{})});}
 assignTask({title,description,email}){if(!this.workspaceId)throw Error('Select the team workspace');return this.call('POST',`/workspace/${E(this.workspaceId)}/item`,{type:'task',title,task:{title,description,assignTo:[email]}});}
 summary(since){return this.call('GET',`/ai-employees/worker/${E(this.name)}/summary`,undefined,{since});}
 memory(){return this.call('GET',`/ai-employees/${E(this.name)}/memory`);}
 executeAssistant(id,task){return this.call('POST',`/crm/ai-assistant/${E(id)}/execute`,{task});}
 assistantActivities(id){return this.call('GET',`/crm/ai-assistant/${E(id)}/activities`);}
 assistants(){return this.call('GET','/crm/ai-assistant');}
 assistantTools(){return this.call('GET','/crm/ai-assistant/tools');}
 assistantCapabilities(){return this.call('GET','/crm/ai-assistant/capabilities');}
 assistantTriggers(){return this.call('GET','/crm/ai-assistant/triggers');}
}
/** Worker client uses the AI employee's own completed staff session, never supervisor's. */
export class EmployeeWorker {
 constructor(client,{name,worker}){this.client=client;this.name=name;this.worker=worker;}
 hello(runtime){return this.client.request('POST','/ai-employees/me/hello',runtime);}
 briefing(){return this.client.request('GET','/ai-employees/me/briefing');}
 lease(){return this.client.request('POST',`/ai-employees/worker/${E(this.name)}/lease`,{worker:this.worker});}
 action(id,action,body){return this.client.request('POST',`/ai-employees/worker/work/${E(id)}/${action}`,{...body,worker:this.worker});}
 step(id,text,detail){return this.action(id,'step',{kind:'progress',text,detail});}
 approval(id,{action,summary,detail,amountUsd}){return this.action(id,'approval',{action,summary,detail,amountUsd});}
 complete(id,result,costUsd){return this.action(id,'complete',{result,costUsd});}
 fail(id,error,{retry=false,costUsd}={}){return this.action(id,'fail',{error,retry,costUsd});}
}
