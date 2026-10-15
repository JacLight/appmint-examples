/** Local teaching host. Completed staff session stays private; initial mode is read-only. */
import http from 'node:http';import fs from 'node:fs';import crypto from 'node:crypto';
import {staffClient} from './sdk-host.mjs';import {Phone} from './phone-client.mjs';
const PORT=Number(process.env.PORT||4078),ORIGIN=`http://localhost:${PORT}`;
const ROOT=new URL('../',import.meta.url).pathname,UI=process.env.PHONE_CLIENT_DIR||ROOT+'client',ASSETS=process.env.PHONE_ASSET_DIR||ROOT+'assets';
const session=()=>process.env.PHONE_PRIVATE_FILE?JSON.parse(fs.readFileSync(process.env.PHONE_PRIVATE_FILE)):{org:process.env.APPMINT_ORG,staff:process.env.STAFF_TOKEN};
const safe=v=>Array.isArray(v)?v.map(safe):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([k])=>!/password|token|secret|authorization|apiKey|api_key|credential/i.test(k)).map(([k,x])=>[k,safe(x)])):v;
const registrationEnabled=process.env.PHONE_ALLOW_DEVICE_REGISTRATION==='true',actionsEnabled=process.env.PHONE_ALLOW_CONTROLLED_ACTIONS==='true';
const recipients=new Set((process.env.PHONE_ALLOWED_RECIPIENTS||'').split(',').map(x=>x.trim()).filter(Boolean));
const cookie=crypto.randomBytes(32).toString('hex');const locked='This operation is not enabled by the local teaching host. Configure the intended provider, owned line and controlled recipient before deliberately enabling the matching sample action.';
const json=(res,status,data,voiceToken)=>{const output=safe(data);if(voiceToken&&output.result)output.result.token=voiceToken;res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(output));};
const reads=new Set(['userPhones','numbers','voiceApp','devices','callHistory']);
http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,ORIGIN);
 if(req.method==='GET'&&u.pathname==='/'){const body=fs.readFileSync(UI+'/index.html');res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store','Set-Cookie':`phone_course=${cookie}; HttpOnly; SameSite=Strict; Path=/`});res.end(body);return;}
 const modules={'/vendor/twilio.min.js':'vendor/twilio/twilio.min.js','/client/browser-softphone.mjs':'browser-softphone.mjs'};
 if(req.method==='GET'&&modules[u.pathname]){const body=fs.readFileSync(new URL(modules[u.pathname],import.meta.url));res.writeHead(200,{'Content-Type':'application/javascript','Cache-Control':'no-store'});res.end(body);return;}
 const assets={'/assets/logo.svg':['logo.svg','image/svg+xml'],'/assets/Inter.woff2':['Inter.woff2','font/woff2'],'/assets/appmint-logo-black.png':['appmint-logo-black.png','image/png']};
 if(req.method==='GET'&&assets[u.pathname]){const[f,t]=assets[u.pathname];const body=fs.readFileSync(ASSETS+'/'+f);res.writeHead(200,{'Content-Type':t});res.end(body);return;}
 if(!String(req.headers.cookie||'').split(';').some(x=>x.trim()===`phone_course=${cookie}`)){json(res,401,{error:'Open the local sample client first'});return;}
 const s=session();const p=new Phone(await staffClient({baseUrl:process.env.APPMINT_URL,orgId:s.org,token:s.staff,sdkModule:process.env.APPMINT_SDK_MODULE||undefined}));
 if(req.method==='GET'&&u.pathname==='/api/state'){
  const [phones,userPhones,voiceApp,devices,callHistory]=await Promise.all([p.numbers(),p.userPhones(),p.voiceApp(),p.devices(),p.callHistory({limit:20})]);
  json(res,200,{user:{orgId:s.org,label:'Signed-in staff'},phones,userPhones,voiceApp,devices:devices.devices||[],callHistory,capabilities:{mode:registrationEnabled||actionsEnabled?'explicit-opt-in':'read-only',deviceRegistration:registrationEnabled,register:registrationEnabled,call:registrationEnabled&&actionsEnabled&&recipients.size>0,draft:actionsEnabled&&recipients.size>0,sms:actionsEnabled&&recipients.size>0,externalActions:actionsEnabled,reason:locked}});return;
 }
 if(req.method==='POST'&&u.pathname==='/api/action'){
  if(req.headers.origin!==ORIGIN){json(res,403,{error:'Same-origin action required'});return;}
  let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>15000)throw Error('Request too large');}
  const{method,args=[]}=JSON.parse(raw);if(!Array.isArray(args))throw Error('Expected args array');
  if(reads.has(method)){json(res,200,{result:await p[method](...args)});return;}
  if(registrationEnabled&&['register','heartbeat','unregister'].includes(method)){
   const input=args[0]||{},id=input.deviceId;
   if(typeof id!=='string'||id.length<8||id.length>160)throw Error('Use a stable installation ID');
   if(method==='register'){
    if(input.platform!=='web')throw Error('This local host enables browser registration only; native push needs its own configuration');
    const result=await p.register({deviceId:id,platform:'web',label:String(input.label||'Browser').slice(0,80),capabilities:['voice','sms']});
    json(res,200,{result},result.voiceAvailable?result.token:undefined);return;
   }
   json(res,200,{result:await p[method](id)});return;
  }
  if(actionsEnabled&&['authorizeCall','saveDraft','sendSms'].includes(method)){
   const payload=method==='authorizeCall'?{to:[args[0]],from:args[1]}:args[0];
   if(!payload||!Array.isArray(payload.to)||!payload.to.length||payload.to.some(x=>!recipients.has(x)))throw Error('Choose a configured controlled recipient');
   const assigned=await p.userPhones();
   if(!Array.isArray(assigned)||!assigned.some(x=>x.phoneNumber===payload.from))throw Error('Choose a caller ID assigned to this staff session');
   if(method==='authorizeCall'){if(!registrationEnabled)throw Error('Enable the owned browser registration first');json(res,200,{result:{authorized:true}});return;}
   if(typeof payload.text!=='string'||!payload.text.trim())throw Error('Enter the intended message');
   const body={from:payload.from,to:payload.to,text:payload.text};
   const result=method==='sendSms'?await p.sendSms(body):await p.request('POST','/crm/inbox/update',{data:{deliveryType:'sms',...body}});
   json(res,200,{result});return;
  }
  json(res,409,{disabled:true,source:'teaching-host-policy',reason:locked,message:locked});return;
 }
 json(res,404,{error:'Unknown local route'});
}catch(e){if(res.headersSent){res.destroy();return;}json(res,e.code==='ENOENT'?404:500,{error:e.code==='ENOENT'?'Sample asset not found':String(e.message||e)});}}).listen(PORT,'127.0.0.1',()=>console.log(`Phone teaching client: ${ORIGIN} (read-only)`));
