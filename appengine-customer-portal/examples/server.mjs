/** Local course host, not a deployable authentication service.
 * Browser gets HttpOnly session only; AppEngine customer tokens stay in memory.
 * The already-completed API Foundations and Custom API Gateway courses supplies production login/CSRF/session design.
 */
import http from 'node:http';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {Portal} from './portal.mjs';
import {InvitationHandles} from './invitations.mjs';
import {customerClient,defaultSdkModule} from './sdk-host.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(dir,'..');
const port=Number(process.env.PORT || 4069);
const origin=`http://localhost:${port}`;
const api=process.env.API || 'https://appengine.appmint.io';
const secretsPath=process.env.PORTAL_PRIVATE_FILE;
if(!secretsPath)throw new Error('Set PORTAL_PRIVATE_FILE to your private demonstration identities JSON file. See README.md.');
const fixturePath=process.env.PORTAL_FIXTURE_FILE || path.join(root,'fixture.json');
const sdk=process.env.APPMINT_SDK_MODULE || defaultSdkModule;
const sessions=new Map();
const allowed=new Set(['profile','cart','updateProfile','reservations','reservation','orders','order','tickets','ticket','forms','openTicket','availability','move','cancel','members','companyOrders','invite','member','switchAccount','addresses','saveAddress','deleteAddress','wishlists','createWishlist','saveProduct','removeProduct']);
const jsonFile=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const clean=v=>Array.isArray(v)?v.map(clean):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([k])=>!(/password|token|secret|authorization|passwordhash/i.test(k))).map(([k,x])=>[k,clean(x)])):v;
const readBody=async req=>{let body='';for await(const part of req){body+=part;if(body.length>65536)throw Object.assign(Error('Body too large'),{status:413});}return body?JSON.parse(body):{};};
const cookie=req=>(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('portal_session='))?.slice(15);
const send=(res,status,value,headers={})=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store',...headers});res.end(JSON.stringify(clean(value)));};
const fail=(message,status=400)=>Object.assign(Error(message),{status});
async function login(persona){
 if(!['dana','priya','noah','elli'].includes(persona))throw fail('Choose a configured demonstration customer');
 const privateData=await jsonFile(secretsPath), fixture=await jsonFile(fixturePath);
 let org=process.env.ORG || fixture.org;
 if(!org)throw fail('Set ORG or configure org in fixture.json',503);
 const identity=privateData[persona];if(!identity?.email||!identity?.password)throw fail('This demonstration customer is not prepared',503);
 const response=await fetch(api+'/profile/customer/signin',{method:'POST',headers:{orgid:org,'Content-Type':'application/json'},body:JSON.stringify({email:identity.email,password:identity.password}),redirect:'error'});
 const value=await response.json();if(!response.ok)throw fail(value.error||value.message||'Customer sign-in failed',response.status);
 const token=value.token||value.access_token;if(!token)throw fail('Complete customer authentication challenge in the linked API Foundations lesson',409);
 const state={persona,invites:new InvitationHandles(),expires:Date.now()+60*60*1000,session:value};
 const client=await customerClient({baseUrl:api,orgId:org,token,sdkModule:sdk});
 state.portal=new Portal(client,async replacement=>{state.session=replacement;});
 return state;
}
const server=http.createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,origin);
  if(u.pathname.startsWith('/api/')){
   if(!['GET','POST'].includes(req.method))throw fail('Method not allowed',405);
   if(req.method==='POST' && req.headers.origin!==origin)throw fail('Origin check failed',403);
   const key=cookie(req), session=sessions.get(key);
   if(u.pathname==='/api/signin'&&req.method==='POST'){
    const body=await readBody(req),state=await login(body.persona);
    if(key)sessions.delete(key);
    const id=crypto.randomBytes(32).toString('base64url');sessions.set(id,state);
    return send(res,200,{persona:state.persona,profile:await state.portal.profile()},{'Set-Cookie':`portal_session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600`});
   }
   if(u.pathname==='/api/signout'&&req.method==='POST'){if(key)sessions.delete(key);return send(res,200,{signedOut:true},{'Set-Cookie':'portal_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});}
   if(!session||session.expires<Date.now()){if(key)sessions.delete(key);throw fail('Sign in to the demonstration portal',401);}
   if(u.pathname==='/api/session'&&req.method==='GET'){
    const fixture=await jsonFile(fixturePath);
    const selected=session.session.customer?.data;
    const accountName=selected?.sharedAccounts?.find(a=>a.id===selected.sharedAccountId)?.name || (selected?.sharedAccountId?'Company account':null);
    const profile=await session.portal.profile();
    const pendingInvites=session.invites.list(profile);
    return send(res,200,{persona:session.persona,accountName,profile,pendingInvites,fixture:{accountId:fixture.accountId,bookingId:fixture.bookingId,definitionId:fixture.definitionId,orderNumber:fixture.orderNumber,ticketNumber:fixture.ticketNumber}});
   }
   if(u.pathname==='/api/action'&&req.method==='POST'){
    const {method,args=[]}=await readBody(req);
    if(['pendingInvites','validatePendingInvite','acceptPendingInvite'].includes(method)){
     if(!Array.isArray(args)||args.length>1)throw fail('Invalid invitation request');
     const profile=await session.portal.profile();
     if(method==='pendingInvites')return send(res,200,{data:session.invites.list(profile)});
     const token=session.invites.resolve(profile,args[0]);
     const result=method==='validatePendingInvite'?await session.portal.validateInvite(token):await session.portal.acceptInvite(token);
     return send(res,200,{data:result});
    }
    if(!allowed.has(method)||!Array.isArray(args)||args.length>4)throw fail('Unsupported portal action');
    // Portal.cancel/deleteAddress execute the ownership preflight HERE, never on a browser assertion.
    const result=await session.portal[method](...args);
    return send(res,200,{data:result??null});
   }
   throw fail('Portal route not found',404);
  }
  if(req.method==='GET' && ['/assets/Inter.woff2'].includes(u.pathname)){
   const asset=await fs.readFile(path.join(root,'public',u.pathname));
   res.writeHead(200,{'Content-Type':u.pathname.endsWith('.woff2')?'font/woff2':'image/svg+xml'});return res.end(asset);
  }
  if(req.method!=='GET'||!['/','/index.html'].includes(u.pathname))throw fail('Not found',404);
  const html=await fs.readFile(path.join(root,'public/index.html'));
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);
 }catch(error){send(res,error.status||500,{error:error.status?error.message:'Portal operation failed',details:error.data||error.body||undefined});}
});
server.listen(port,'127.0.0.1',()=>console.log(`Portal course host on port ${port}; private credentials and tokens remain server-side.`));
