import fs from'node:fs';import os from'node:os';import path from'node:path';
const base=(process.env.GATEWAY_BASE||'http://127.0.0.1:4320').replace(/\/$/,'');
const file=process.env.COOKIE_JAR||path.join(os.homedir(),'.appengine-gateway-node-cookie');
let cookie=fs.existsSync(file)?fs.readFileSync(file,'utf8'):'';
const cmd=process.argv[2]||'profile';let route:string,method='GET',body;
if(cmd==='signin'){route='/auth/signin';method='POST';if(!process.env.CUSTOMER_EMAIL||!process.env.CUSTOMER_PASSWORD)throw Error('Set CUSTOMER_EMAIL and CUSTOMER_PASSWORD privately');body={email:process.env.CUSTOMER_EMAIL,password:process.env.CUSTOMER_PASSWORD};}
else if(cmd==='logout'){route='/auth/logout';method='POST';body={};}
else if(cmd==='reservation'){if(!process.argv[3])throw Error('Provide reservation ID');route='/api/reservations/'+process.argv[3];}
else if(['profile','reservations'].includes(cmd))route='/api/'+cmd;else throw Error('Unknown command');
const response:Response=await fetch(base+route,{method,headers:{Cookie:cookie,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
const next=response.headers.get('set-cookie');if(next){cookie=next.includes('Max-Age=0')?'':next.split(';')[0];fs.writeFileSync(file,cookie,{mode:0o600});fs.chmodSync(file,0o600);}
console.log(JSON.stringify({status:response.status,body:await response.json()},null,2));if(!response.ok)process.exitCode=1;
