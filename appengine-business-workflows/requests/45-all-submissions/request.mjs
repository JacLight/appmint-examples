// Node18+; environment variables keep credentials outside this source.
import fs from 'node:fs';
const base=process.env.APPENGINE_URL, org=process.env.APPENGINE_ORG;
if(!base||!org)throw Error('Set APPENGINE_URL and APPENGINE_ORG');
const route="/crm/forms/submissions?formId=wf-usecase-1011-warranty&page=1&pageSize=20";
const headers={'orgid':org,'Content-Type':'application/json'};
headers.Authorization='Bearer '+process.env.APPENGINE_TOKEN;
const body=JSON.parse(fs.readFileSync(new URL('./request.json',import.meta.url)));
const response=await fetch(base+route,{method:"GET",headers,});
const raw=await response.text();
console.log(response.status,raw?JSON.parse(raw):null);
if(!response.ok)process.exitCode=1;
