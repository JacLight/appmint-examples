/** Run node simulation/server.mjs. All communication remains local and simulated. */
import http from 'node:http';import fs from 'node:fs';import {ContractFixture} from './contract-fixture.mjs';import {Phone} from '../examples/phone-client.mjs';
const port=Number(process.env.PORT||4079),origin=`http://localhost:${port}`,root=new URL('../',import.meta.url),fixture=new ContractFixture(),phone=new Phone(fixture);
const send=(r,s,x)=>{r.writeHead(s,{'content-type':'application/json','cache-control':'no-store'});r.end(JSON.stringify(x))};
const actions=new Set(['userPhones','numbers','voiceApp','devices','callHistory','register','heartbeat','unregister','sendSms']);
const server=http.createServer(async(req,res)=>{try{
 const path=new URL(req.url,origin).pathname;
 if(req.method==='GET'&&path==='/'){
  let html=fs.readFileSync(new URL('client/index.html',root),'utf8');html=html.replace('<script src="/vendor/twilio.min.js"></script>','<script src="/fixture-sdk.js"></script>');
  res.writeHead(200,{'content-type':'text/html','cache-control':'no-store'});res.end(html);return;
 }
 const files={'/source':['client/source.html','text/html'],'/fixture-sdk.js':['simulation/fixture-sdk.js','application/javascript'],'/assets/Inter.woff2':['assets/Inter.woff2','font/woff2'],'/assets/appmint-logo-black.png':['assets/appmint-logo-black.png','image/png'],'/assets/logo.svg':['assets/logo.svg','image/svg+xml']};
 if(req.method==='GET'&&files[path]){const[f,t]=files[path],b=fs.readFileSync(new URL(f,root));res.writeHead(200,{'content-type':t});res.end(b);return;}
 if(req.method==='GET'&&path==='/api/state'){send(res,200,{simulation:true,user:{label:'Simulated staff session'},userPhones:await phone.userPhones(),phones:await phone.numbers(),voiceApp:await phone.voiceApp(),devices:(await phone.devices()).devices,callHistory:await phone.callHistory(),messages:fixture.messages,fixtureEvents:fixture.events.slice(-12),capabilities:{register:true,call:true,sms:true,draft:true,mode:'simulation'}});return;}
 if(req.method==='GET'&&path==='/fixture/evidence'){send(res,200,{simulation:true,events:fixture.events,calls:fixture.calls,messages:fixture.messages});return;}
 if(req.method!=='POST'||req.headers.origin!==origin){send(res,403,{error:'Local same-origin actions only'});return;}
 let raw='';for await(const b of req){raw+=b;if(raw.length>20000)throw Error('Too large')};const body=JSON.parse(raw);
 if(path==='/fixture/event'){send(res,200,fixture.event(body.type,body.payload));return;}
 if(path==='/api/action'){
  const{method,args=[]}=body;let result;
  if(method==='authorizeCall'){if(args[1]!==fixture.line.phoneNumber)throw Error('Choose assigned caller ID');result={authorized:true};}
  else if(method==='saveDraft')result=await phone.request('POST','/crm/inbox/update',{data:{deliveryType:'sms',...args[0]}});
  else if(actions.has(method))result=await phone[method](...(['heartbeat','unregister'].includes(method)?[args[0].deviceId]:args));
  else throw Error('Method unavailable in client simulation');send(res,200,{result});return;
 }
 send(res,404,{error:'Unknown local route'});
 }catch(e){send(res,400,{error:e.message})}});
server.listen(port,'127.0.0.1',()=>console.log('Labelled phone client simulation '+origin));
