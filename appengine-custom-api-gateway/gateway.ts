import http, {type IncomingMessage, type ServerResponse} from 'node:http';
import {randomBytes} from 'node:crypto';
import fs from 'node:fs';
const base=process.env.APPENGINE_ENDPOINT?.replace(/\/$/,'');
const org=process.env.ORG_ID,port=Number(process.env.PORT||4320);
if(!base||!org)throw Error('Set APPENGINE_ENDPOINT and ORG_ID');
const sessions=new Map<string,{token:string;expires:number}>(),ttl=30*60*1000;
const origin=process.env.PUBLIC_ORIGIN||`http://127.0.0.1:${port}`;
const secure=origin.startsWith('https:');
const cookie=(value:string,age:number)=>`gateway_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${secure?'; Secure':''}`;
function json(res:ServerResponse,status:number,body:unknown,headers:Record<string,string>={}){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store',...headers});res.end(JSON.stringify(body));}
async function body(req:IncomingMessage):Promise<any>{let text='';for await(const part of req){text+=part;if(Buffer.byteLength(text)>8192)throw Error('Body too large');}return JSON.parse(text||'{}');}
async function upstream(path:string,method='GET',data?:unknown,token?:string){const r=await fetch(base+path,{method,headers:{orgid:org,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(data?{body:JSON.stringify(data)}:{}),signal:AbortSignal.timeout(10000)});const text=await r.text();return{status:r.status,body:text?JSON.parse(text):null};}
export const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,origin),path=url.pathname;
 if(req.method==='GET'&&path==='/'){res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});return res.end(fs.readFileSync(new URL('./portal.html',import.meta.url)));}
 if(['POST','PUT','PATCH','DELETE'].includes(req.method)&&req.headers.origin&&req.headers.origin!==origin)return json(res,403,{error:'Origin rejected'});
 const raw=req.headers.cookie||'',sid=raw.split(';').map(x=>x.trim()).find(x=>x.startsWith('gateway_session='))?.slice(16);
 if(req.method==='POST'&&path==='/auth/signin'){
  const data=await body(req);if(typeof data.email!=='string'||typeof data.password!=='string')return json(res,400,{error:'Email and password required'});
  const answer=await upstream('/profile/customer/signin','POST',{email:data.email,password:data.password});
  if(answer.status>=400)return json(res,answer.status,{error:'Sign-in failed'});
  if(answer.body?.requiresTwoFactor||answer.body?.requires2FA||answer.body?.requiresPasswordChange)return json(res,409,{error:'Complete the AppEngine verification or password-change flow before continuing'});
  if(!answer.body?.token)return json(res,502,{error:'No customer session returned'});
  if(sid)sessions.delete(sid);const next=randomBytes(32).toString('hex');sessions.set(next,{token:answer.body.token,expires:Date.now()+ttl});
  return json(res,200,{signedIn:true},{'Set-Cookie':cookie(next,ttl/1000)});
 }
 if(req.method==='POST'&&path==='/auth/logout'){if(sid)sessions.delete(sid);return json(res,200,{signedIn:false},{'Set-Cookie':cookie('',0)});}
 let target;
 if(req.method==='GET'&&path==='/api/profile')target='/client-data/profile';
 if(req.method==='GET'&&path==='/api/reservations')target='/client-data/reservations';
 const match=path.match(/^\/api\/reservations\/([a-f0-9]{24})$/i);if(req.method==='GET'&&match)target='/client-data/reservations/'+match[1];
 if(!target)return json(res,404,{error:'Route not available'});
 const session=sessions.get(sid);if(!session||session.expires<=Date.now()){if(sid)sessions.delete(sid);return json(res,401,{error:'Sign in required'},{'Set-Cookie':cookie('',0)});}
 const result=await upstream(target,'GET',undefined,session.token);
 if(result.status===401){sessions.delete(sid);return json(res,401,{error:'Session expired; sign in again'},{'Set-Cookie':cookie('',0)});}
 return json(res,result.status,result.body);
 }catch(error){json(res,error.message==='Body too large'?413:502,{error:'Request could not be completed'});}
});
setInterval(()=>{for(const[k,v]of sessions)if(v.expires<=Date.now())sessions.delete(k);},60000).unref();
server.listen(port,'127.0.0.1',()=>console.log('Course gateway ready on configured loopback port'));
