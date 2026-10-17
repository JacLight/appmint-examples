/** Local trusted-host sample. Supply your own isolated fixtures/session. Not production authentication. */
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const QRCode=require('qrcode');
import {Venue} from './events.mjs';import {staffClient} from './sdk-host.mjs';
const P=new URL('./client/',import.meta.url).pathname,PORT=Number(process.env.PORT||4073),ORIGIN=`http://localhost:${PORT}`;
const API=process.env.APPMINT_URL;if(!API||!process.env.STAFF_TOKEN||!process.env.VENUE_FIXTURE||!process.env.APPMINT_ORG)throw Error('Set APPMINT_URL, APPMINT_ORG, STAFF_TOKEN and VENUE_FIXTURE; read README first');
const fixture=()=>{const f=JSON.parse(fs.readFileSync(process.env.VENUE_FIXTURE));if(f.org!==process.env.APPMINT_ORG)throw Error('Fixture organization does not match selected host organization');return f;};
const privateState=()=>({staff:process.env.STAFF_TOKEN,crewKey:process.env.CREW_DEVICE_KEY});
const clean=v=>Array.isArray(v)?v.map(clean):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([k])=>!/password|token|secret|authorization|apiKey/i.test(k)).map(([k,x])=>[k,clean(x)])):v;
const sdkModule=process.env.APPMINT_SDK_MODULE;
const cookie=crypto.randomBytes(24).toString('hex');
async function app(){const f=fixture();const c=await staffClient({baseUrl:API,orgId:f.org,token:privateState().staff,sdkModule});return new Venue(c,f);}
const methods=new Set(['admit','admitCredential','exit','benefit','freshQr','perks','importCredential','assignCredential','revokeCredential','badge','previewBadgeDispatch','crewRead','crewCredential','stats','history','crewHistory']);
function validate(method,args,f){
 const tickets=[f.ada,f.noah,f.qrTicket,...Object.values(f.capture||{})].filter(Boolean);const ids=new Set(tickets.map(x=>x.id));
 const codes=new Set(tickets.map(x=>x.code));const code=args[0];
 if(['freshQr','perks','badge','previewBadgeDispatch'].includes(method)&&!ids.has(code))throw Error('Select an owned training ticket');
 if(['admit','admitCredential','exit','benefit'].includes(method)&&!codes.has(code)&&!String(code).startsWith(f.prefix+'-')&&!tickets.some(t=>String(code).startsWith(t.id+':')))throw Error('Use an owned teaching code');
 if(['importCredential','assignCredential','revokeCredential'].includes(method)&&!String(code).startsWith(f.prefix+'-'))throw Error('Use the course credential prefix');
 if(method==='assignCredential'&&!ids.has(args[1]))throw Error('Select an owned training ticket');
}
function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(clean(data)));}
const srv=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,ORIGIN);
  if(req.method==='GET'&&url.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html','Set-Cookie':`venue_session=${cookie}; HttpOnly; SameSite=Strict; Path=/`,'Cache-Control':'no-store'});res.end(fs.readFileSync(P+'venue/index.html'));return;}
  const assets={'/assets/Inter.woff2':['assets/Inter.woff2','font/woff2'],'/assets/logo.svg':['assets/logo.svg','image/svg+xml']};
  if(req.method==='GET'&&assets[url.pathname]){const [file,type]=assets[url.pathname];res.writeHead(200,{'Content-Type':type});res.end(fs.readFileSync(P+file));return;}
  if(!String(req.headers.cookie||'').split(';').some(x=>x.trim()===`venue_session=${cookie}`)){send(res,401,{error:'Open the local course client first'});return;}
  const v=await app();const f=fixture();
  if(req.method==='GET'&&url.pathname==='/api/state'){
   const event=await v.event(),tickets=await v.tickets(),ticketTypes=await v.ticketTypes(),occupancy=await v.occupancy(),credentials=await v.call('GET',`/events/${encodeURIComponent(f.eventId)}/credentials`);
   const keep=new Set([...Object.values(f.capture||{}),f.qrTicket].filter(Boolean).map(x=>x.id));
   const visibleTickets=Array.isArray(tickets)?tickets.filter(x=>keep.has(x.sk)):{...tickets,data:(tickets.data||[]).filter(x=>keep.has(x.sk))};
   const crew={};
   for(const [key,datatype,name] of [['reader','access_device',f.crew.reader],['point','access_point',f.crew.point],['zone','access_zone',f.crew.zone]]){if(!name){crew[key]=null;continue;}const rows=await v.call('POST',`/repository/find/${datatype}`,{query:{'data.name':name},options:{pageSize:1}});crew[key]=(rows.data||rows)[0]||null;}
   send(res,200,{fixture:f,event,tickets:visibleTickets,ticketTypes,occupancy,credentials,crew});return;
  }
  if(req.method==='POST'&&url.pathname==='/api/action'){
   if(req.headers.origin!==ORIGIN)throw Error('Same-origin action required');
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>16000)throw Error('Request too large');}
   const {method,args=[]}=JSON.parse(raw);if(!methods.has(method)||!Array.isArray(args))throw Error('Unsupported course action');validate(method,args,f);
   let result;
   if(method==='crewHistory'){
    result=await v.call('GET',`/access-control/credentials/${encodeURIComponent(f.crew.credentialId)}/history`);
   }else if(method==='crewRead'){
    if(!privateState().crewKey||!f.crew.reader||!f.crew.code)throw Error('Configure your owned decision-only reader and key first');
    const response=await fetch(API.replace(/\/$/,'')+'/access-control/read',{method:'POST',headers:{orgid:f.org,'Content-Type':'application/json','x-device-key':privateState().crewKey},body:JSON.stringify({device:f.crew.reader,code:f.crew.code,method:'card'})});
    result=await response.json();if(!response.ok)throw Error(result.message||'Crew read failed');
   }else if(method==='crewCredential'){
    if(typeof args[0]!=='boolean')throw Error('Pass true to activate or false to suspend the owned credential');
    result=await v.call('POST',`/access-control/credentials/${encodeURIComponent(f.crew.credentialId)}/status`,{status:args[0]?'active':'suspended',note:'Controlled course demonstration'});
   }else{result=await v[method](...args);}
   if(method==='freshQr')result={ticket:result,qrSvg:await QRCode.toString(result.data.code,{type:'svg',margin:2,width:320})};
   const log={at:new Date().toISOString(),method,args,result:clean(result)};
   // Keep local response records only if explicitly requested; never log bearer/key.
   if(process.env.VENUE_ACTION_LOG)fs.appendFileSync(process.env.VENUE_ACTION_LOG,JSON.stringify(log)+'\n');send(res,200,{result});return;
  }
  send(res,404,{error:'Not found'});
 }catch(error){send(res,Number(error.status)||400,{error:error.message});}
});srv.listen(PORT,'127.0.0.1',()=>console.log(`Venue sample ready at http://localhost:${PORT}`));
