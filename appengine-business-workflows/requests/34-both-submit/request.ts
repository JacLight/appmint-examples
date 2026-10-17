// Node18+; environment variables keep credentials outside this source.
import fs from 'node:fs';
const base=process.env.APPENGINE_URL, org=process.env.APPENGINE_ORG;
if(!base||!org)throw Error('Set APPENGINE_URL and APPENGINE_ORG');
const route="/client/forms/wf-usecase-1011-warranty-both/submit";
const headers: Record<string,string>={'orgid':org,'Content-Type':'application/json'};
const body=JSON.parse(fs.readFileSync(new URL('./request.json',import.meta.url)));
const response=await fetch(base+route,{method:"POST",headers,body:JSON.stringify(body)});
const raw=await response.text();
console.log(response.status,raw?JSON.parse(raw):null);
if(!response.ok)process.exitCode=1;
