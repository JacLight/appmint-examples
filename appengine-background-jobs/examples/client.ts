// Run using Node22.6+ with type stripping, or compile with tsc.
import fs from 'node:fs';
const operations: Record<string,{method:string;path:string;body?:unknown}>=JSON.parse(fs.readFileSync(new URL('./operations.json',import.meta.url),'utf8'));
const step=process.argv[2]||'inspect';
if(!operations[step])throw Error('Choose: '+Object.keys(operations).join(', '));
for(const key of ['APPMINT_BASE','ORG_ID','STAFF_TOKEN'])if(!process.env[key])throw Error('Set '+key);
const values: Record<string,string|undefined>={...process.env,PREFIX:process.env.PREFIX||'my-job-course',PAST_25H:new Date(Date.now()-25*3600000).toISOString(),FUTURE_1H:new Date(Date.now()+3600000).toISOString()};
const replace=(value:unknown): {method:string;path:string;body?:unknown}=>JSON.parse(JSON.stringify(value).replace(/\{\{([A-Z0-9_]+)\}\}/g,(_:string,key:string)=>{if(!values[key])throw Error('Set '+key);return JSON.stringify(values[key]).slice(1,-1)}));
const op=replace(operations[step]);
if(op.method!=='GET'&&step!=='get-tasks'&&!process.argv.includes('--write'))throw Error('Mutating action: review operations.json and add --write. Use an owned training fixture.');
const headers={orgid:process.env.ORG_ID,Authorization:'Bearer '+process.env.STAFF_TOKEN,'Content-Type':'application/json'};
const response=await fetch(process.env.APPMINT_BASE.replace(/\/$/,'')+op.path,{method:op.method,headers,...('body'in op?{body:JSON.stringify(op.body)}:{})});
const text=await response.text(),result=text?JSON.parse(text):null;
console.log(JSON.stringify({status:response.status,result},null,2));
if(!response.ok)process.exitCode=1;
