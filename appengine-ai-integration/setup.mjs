/** Explicit stages, never automatic all-stages startup. Run only in your owned training org. */
import fs from 'node:fs';import {staffClient} from './sdk-host.mjs';import {Employees} from './employees.mjs';
const stage=process.argv[2],file=process.env.AI_FIXTURE;
if(!file)throw Error('Set AI_FIXTURE to your private configuration path');
const c=await staffClient({baseUrl:process.env.APPMINT_URL,orgId:process.env.APPMINT_ORG,token:process.env.STAFF_TOKEN});
const f=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):{};const a=new Employees(c,f);
const save=()=>fs.writeFileSync(file,JSON.stringify(f,null,2));
if(stage==='create'){
 if(f.name)throw Error('Fixture already has an employee; inspect before creating another');
 const p=JSON.parse(fs.readFileSync(process.env.EMPLOYEE_PROFILE||'employee-profile.example.json'));
 if(p.supervisor==='YOUR_EXISTING_STAFF_EMAIL')throw Error('Set the actual existing supervisor');
 const e=await a.create(p);Object.assign(f,{name:e.data.name,email:e.data.userEmail,employeeId:e.sk});save();
 const team=await a.team();f.workspaceId=team.workspace?.id;save();
}else if(stage==='access'){console.log(JSON.stringify(await a.access(['User']),null,2));}
else if(stage==='provision'){console.log(JSON.stringify(await a.provision(),null,2));}
else if(stage==='activate'){console.log(JSON.stringify(await a.switchOn(),null,2));}
else if(stage==='conversation'){const v=await a.directConversation(f.email);f.conversationId=v.id;save();}
else if(stage==='native-chat'){const {io}=await import('socket.io-client');const {nativeChat}=await import('./native-chat.mjs');const r=await nativeChat({io,baseUrl:process.env.APPMINT_URL,orgId:process.env.APPMINT_ORG,token:process.env.STAFF_TOKEN,to:f.email});f.chatId=r.chatId;save();}
else if(stage==='assistant'){if(f.assistantId)throw Error('Assistant already configured');const v=await c.request('POST','/crm/ai-assistant',JSON.parse(fs.readFileSync(process.env.ASSISTANT_PROFILE||'assistant.example.json')));f.assistantId=v.sk;save();}
else if(stage==='read'){console.log(JSON.stringify({employee:await a.detail(),provider:await a.providerStatus()},null,2));}
else throw Error('Choose create, access, provision, activate, conversation, native-chat, assistant or read');
