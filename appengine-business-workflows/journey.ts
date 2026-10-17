// End-to-end AppEngine integration. Run only in your training organization.
// Set API/organization/admin token plus the actual assigned reviewer's token/email.
const base=process.env.APPENGINE_URL,org=process.env.APPENGINE_ORG;
const admin=process.env.APPENGINE_TOKEN, reviewer=process.env.REVIEWER_TOKEN,email=process.env.REVIEWER_EMAIL;
if(![base,org,admin,reviewer,email].every(Boolean))throw Error('Set APPENGINE_URL, APPENGINE_ORG, APPENGINE_TOKEN, REVIEWER_TOKEN, REVIEWER_EMAIL');
const name=process.env.FORM_NAME||'warranty-'+Date.now();
async function call(method:string,path:string,body?:unknown,token?:string){const headers:Record<string,string>={'orgid':org!,'Content-Type':'application/json'};if(token)headers.Authorization='Bearer '+token;const r=await fetch(base+path,{method,headers,...(body!==undefined?{body:JSON.stringify(body)}:{})});const raw=await r.text(),data=raw?JSON.parse(raw):null;if(!r.ok)throw Error(JSON.stringify({status:r.status,data}));return data;}
const definition={name,title:'Warranty Claim Approval',enabled:true,notificationTemplate:[],stages:[{id:0,type:'start',name:'Waiting for approval',modelState:'inprogress',modelStatus:'new',assignRule:{type:'users',users:[email]},notificationTemplate:[]},{id:1,type:'done',name:'Approved',modelState:'completed',modelStatus:'approved',notificationTemplate:[]},{id:2,type:'done',name:'Rejected',modelState:'completed',modelStatus:'rejected',notificationTemplate:[]}]};
const workflow=await call('POST','/workflow/definition',definition,admin);
const properties={fullName:{type:'string',title:'Full name'},email:{type:'string',format:'email',title:'Email'},orderNumber:{type:'string',title:'Order number'},bikeModel:{type:'string',title:'Bike model'},problem:{type:'string',title:'Problem'}};
const form=await call('PUT','/repository/create',{datatype:'crm_form',isNew:true,data:{name,title:'Warranty claim',status:'open',authenticationType:'email',workflow:name,schema:{type:'object',properties,required:Object.keys(properties)}}},admin);
const answers={fullName:'Dana Ruiz',email:process.env.CLAIM_EMAIL||'dana@example.invalid',orderNumber:'HC-1042',bikeModel:'Harbor Trail 2',problem:'Frame crack after three weeks'};
await call('GET','/client/forms/'+name+'?email='+encodeURIComponent(answers.email));
const submission=await call('POST','/client/forms/'+name+'/submit',answers);
const route='/workflow/position/form_submission/'+submission.sk;
const waiting=await call('GET',route,undefined,admin);
if(!waiting?.taskSk)throw Error('Submission saved but workflow missing. Retain ID '+submission.sk+' and follow recovery; do not resubmit.');
const tray=await call('GET','/approval/tray',undefined,reviewer);
if(!tray.waitingOnMe.some((t:{id:string})=>t.id===waiting.taskSk))throw Error('The supplied reviewer token is not assigned to this task');
const decision=await call('POST','/approval/task/'+waiting.taskSk+'/approve',{note:'Frame defect confirmed. Replacement approved.'},reviewer);
const source=await call('GET','/repository/get/form_submission/'+submission.sk,undefined,admin);
const position=await call('GET',route,undefined,admin);
if(!position.isFinal||source.data.status!=='approved')throw Error('The process has not reached its final approved state');
console.log(JSON.stringify({workflowId:workflow.sk,formId:form.sk,claimId:submission.sk,taskId:waiting.taskSk,decision:decision.decision,status:source.data.status,history:position.history},null,2));
