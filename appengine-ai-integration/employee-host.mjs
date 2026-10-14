/** Loopback teaching host. Ordinary staff session stays on this trusted host. */
import http from 'node:http';import fs from 'node:fs';import crypto from 'node:crypto';
import {Employees} from './employees.mjs';import {staffClient} from './sdk-host.mjs';
const PORT=Number(process.env.PORT||4075),ORIGIN=`http://localhost:${PORT}`;
const ROOT=new URL('./',import.meta.url).pathname,UI=process.env.AI_CLIENT_DIR||ROOT+'client',ASSETS=process.env.AI_ASSET_DIR||ROOT+'assets';
const fixture=()=>JSON.parse(fs.readFileSync(process.env.AI_FIXTURE));
const credentials=()=>process.env.AI_PRIVATE_FILE?JSON.parse(fs.readFileSync(process.env.AI_PRIVATE_FILE)):{org:process.env.APPMINT_ORG,staff:process.env.STAFF_TOKEN};
const clean=v=>Array.isArray(v)?v.map(clean):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([k])=>!/password|token|secret|authorization|apiKey/i.test(k)).map(([k,x])=>[k,clean(x)])):v;
const cookie=crypto.randomBytes(32).toString('hex');
async function app(){const s=credentials(),f=fixture();if(!s.org||!s.staff)throw Error('Configure completed organization staff sign-in');const c=await staffClient({baseUrl:process.env.APPMINT_URL,orgId:s.org,token:s.staff,sdkModule:process.env.APPMINT_SDK_MODULE||undefined});return new Employees(c,f);}
const send=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(clean(value)));};
const methods=new Set(['providerStatus','effectiveInstructions','updateEmployee','pause','switchOn','chatMessages','sendChat','giveWork','workDetail','workspaceMessages','sendWorkspace','teamContext','decide','executeAssistant','assistantActivities','assignTask','summary','memory','retry','cancel','nativeMessages','sendNative','accessOptions','setAccess','saveInstruction']);
http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,ORIGIN);
 if(req.method==='GET'&&u.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store','Set-Cookie':`ai_course=${cookie}; HttpOnly; SameSite=Strict; Path=/`});res.end(fs.readFileSync(UI+'/index.html'));return;}
 const assets={'/assets/Inter.woff2':['Inter.woff2','font/woff2'],'/assets/appmint-logo-black.png':['appmint-logo-black.png','image/png']};
 if(req.method==='GET'&&assets[u.pathname]){const [file,type]=assets[u.pathname];res.writeHead(200,{'Content-Type':type});res.end(fs.readFileSync(ASSETS+'/'+file));return;}
 if(!String(req.headers.cookie||'').split(';').some(x=>x.trim()===`ai_course=${cookie}`)){send(res,401,{error:'Open the course client first'});return;}
 const a=await app(),f=fixture();
 if(req.method==='GET'&&u.pathname==='/api/state'){
  const employee=await a.detail(),config=await a.config(),instructions=await a.call('GET','/ai-employees/instructions'),templates=await a.templates(),team=await a.team(),work=await a.work(),allApprovals=await a.approvals();
  const approvals={...allApprovals,data:(allApprovals.data||[]).filter(x=>x.data?.employee===f.name)};
  const assistant=f.assistantId?await a.call('GET','/crm/ai-assistant/'+encodeURIComponent(f.assistantId)):null;
  const tools=await a.assistantTools(),capabilities=await a.assistantCapabilities(),triggers=await a.assistantTriggers();
  const tasks=f.workspaceId?await a.call('GET',`/workspace/${encodeURIComponent(f.workspaceId)}/tasks`):[];
  send(res,200,{employee,config,instructions,templates,team,work,approvals,assistant,tools,capabilities,triggers,tasks});return;
 }
 if(req.method==='POST'&&u.pathname==='/api/action'){
  if(req.headers.origin!==ORIGIN)throw Error('Same-origin action required');
  let raw='';for await(const x of req){raw+=x;if(raw.length>20000)throw Error('Request too large');}
  const {method,args=[]}=JSON.parse(raw);if(!methods.has(method)||!Array.isArray(args))throw Error('Unsupported course action');
  if(['workDetail','decide','retry','cancel'].includes(method)){const owned=await a.workDetail(args[0]);if(owned.data?.employee!==f.name)throw Error('Select this employee’s work');}
  let result;
  switch(method){
   case'saveInstruction':{const before=await a.call('GET','/ai-employees/instructions');const id=f.instructionId||f.name+'-internal-updates';const incoming=args[0]||{};const own={id,title:String(incoming.title||'Internal updates'),content:String(incoming.content||'Keep internal updates to one sentence; use exact saved record statuses.'),enabled:incoming.enabled!==false,who:'only',employees:[f.name]};result=await a.call('PUT','/ai-employees/instructions',{instructions:[...(before.data||[]).filter(x=>x.id!==id),own]});break;}
   case'accessOptions':result=await a.access();break;
   case'setAccess':{const groups=args[0];if(!Array.isArray(groups)||groups.some(x=>x!=='User'))throw Error('This sample permits only the User group');result=await a.access(groups);break;}
   case'providerStatus':result=await a.providerStatus();break;
   case'effectiveInstructions':result=await a.instructions();break;
   case'updateEmployee':{const v=args[0]||{};const changes={};for(const key of ['jobTitle','jobDescription'])if(v[key]!==undefined)changes[key]=String(v[key]);for(const [key,fields]of [['workingHours',['alwaysOn','timezone','days','start','end']],['limits',['dailyBudgetUsd','maxConcurrentJobs']],['runtime',['model','provider']]])if(v[key]){const before=(await a.detail()).record.data[key]||{};changes[key]={...before,...Object.fromEntries(Object.entries(v[key]).filter(([k])=>fields.includes(k)))}}result=await a.update(changes);break;}
   case'pause':result=await a.pause();break;case'switchOn':result=await a.switchOn();break;
   case'nativeMessages':if(!f.chatId)throw Error('Open the owned native Chat first');result=await a.call('GET','/chat/history/'+encodeURIComponent(f.chatId));break;
   case'sendNative':{const {nativeChat}=await import('./native-chat.mjs');const {io}=await import(process.env.SOCKET_IO_MODULE||'socket.io-client');const c=credentials();result=await nativeChat({io,baseUrl:process.env.APPMINT_URL,orgId:c.org,token:c.staff,to:f.email,content:String(args[0])});break;}
   case'chatMessages':result=await a.messages();break;case'sendChat':result=await a.say(String(args[0]));break;
   case'giveWork':result=await a.assignDirect(args[0]);break;case'workDetail':result=await a.workDetail(args[0]);break;
   case'workspaceMessages':result=await a.messages(f.workspaceId);break;case'sendWorkspace':result=await a.say(String(args[0]),{shared:true,email:f.email});break;
   case'teamContext':result={team:await a.team(),agenda:await a.call('GET',`/workspace/${encodeURIComponent(f.workspaceId)}/agenda`),calendar:await a.call('GET',`/workspace/${encodeURIComponent(f.workspaceId)}/calendar`)};break;
   case'decide':result=await a.decide(args[0],args[1]?.decision,args[1]?.note);break;
   case'assignTask':result=await a.assignTask({...args[0],email:f.email});break;
   case'summary':result=await a.summary(args[0]);break;case'memory':result=await a.memory();break;
   case'retry':result=await a.retry(args[0]);break;case'cancel':result=await a.cancel(args[0]);break;
   case'executeAssistant':if(!f.assistantId)throw Error('Create the owned assistant first');result=await a.call('POST',`/crm/ai-assistant/${encodeURIComponent(f.assistantId)}/execute`,{task:String(args[0])});break;
   case'assistantActivities':if(!f.assistantId)throw Error('Create the owned assistant first');result=await a.call('GET',`/crm/ai-assistant/${encodeURIComponent(f.assistantId)}/activities`);break;
  }
  if(process.env.AI_ACTION_LOG)fs.appendFileSync(process.env.AI_ACTION_LOG,JSON.stringify({at:new Date().toISOString(),method,args:clean(args),result:clean(result)})+'\n');
  send(res,200,{result});return;
 }
 send(res,404,{error:'Not found'});
}catch(e){send(res,e.status||400,{error:e.message});}}).listen(PORT,'127.0.0.1',()=>console.log('AI course client ready at '+ORIGIN));
