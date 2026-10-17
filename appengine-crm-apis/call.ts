import fs from 'node:fs';
const dir=process.argv[2];if(!dir)throw Error('Pass one operation directory');
const r=JSON.parse(fs.readFileSync(dir+'/route.json'));const body=JSON.parse(fs.readFileSync(dir+'/request.json'));
const base=process.env.APPENGINE_ENDPOINT?.replace(/\/$/,'');const org=process.env.ORG_ID;if(!base||!org)throw Error('Set APPENGINE_ENDPOINT and ORG_ID');
const headers: Record<string,string>={'Content-Type':'application/json',orgid:org};
if(r.identity!=='public'){const token=process.env[r.identity==='customer'?'CUSTOMER_TOKEN':'STAFF_TOKEN'];if(!token)throw Error('Set the required '+r.identity+' token');headers.Authorization='Bearer '+token;}
const response=await fetch(base+r.path,{method:r.method,headers,...(body===null?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(30000)});
const text=await response.text();let result;try{result=text?JSON.parse(text):null}catch{result=text}console.log(JSON.stringify({status:response.status,result},null,2));if(!response.ok)process.exitCode=1;
