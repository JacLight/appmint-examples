import fs from 'node:fs';
const base=process.env.APPENGINE_ENDPOINT?.replace(/\/$/,'');
const org=process.env.ORG_ID,token=process.env.STAFF_TOKEN;
if(!base||!org)throw Error('Set APPENGINE_ENDPOINT and ORG_ID');
const dir=process.argv[2];if(!dir)throw Error('Pass a request directory');
const meta=JSON.parse(fs.readFileSync(dir+'/route.json'));const body=JSON.parse(fs.readFileSync(dir+'/request.json'));
const headers: Record<string,string>={'Content-Type':'application/json',orgid:org};
if(meta.headers.Authorization){if(!token)throw Error('Set STAFF_TOKEN');headers.Authorization='Bearer '+token;}
const response=await fetch(base+meta.path,{method:meta.method,headers,...(body!==null?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
const text=await response.text();const result=text?JSON.parse(text):null;
console.log(JSON.stringify({status:response.status,result},null,2));
if(!response.ok||result?.error||result?.result?.isError)process.exitCode=1;
