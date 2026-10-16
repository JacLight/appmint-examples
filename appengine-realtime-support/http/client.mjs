import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const folder=path.dirname(fileURLToPath(import.meta.url));
const required=name=>{const value=process.env[name];if(!value)throw Error('Set '+name);return value;};
const operations=JSON.parse(fs.readFileSync(path.join(folder,'operations.json'),'utf8'));
const action=process.argv[2];const op=operations[action];
if(!op)throw Error('Choose '+Object.keys(operations).join(', '));
const base=required('APPENGINE_URL').replace(/\/$/,'');
const route=op.path.replace(/\{([A-Z_]+)\}/g,(_,name)=>encodeURIComponent(required(name)));
const headers={orgid:required('APPENGINE_ORG')};
if(op.staff)headers.Authorization='Bearer '+required('APPENGINE_STAFF_TOKEN');
if(op.guestToken)headers.Authorization='Bearer '+required('APPENGINE_GUEST_TOKEN');
if(op.guest){headers.appId=required('APPENGINE_APP_ID');console.error('Guest auth: existing app identity required. This may create a guest customer record.');}
let body;
if(op.multipart){const file=process.argv[3];if(!file)throw Error('Provide the local attachment filename');const form=new FormData();form.append('files',new Blob([Uint8Array.from(fs.readFileSync(file))]),path.basename(file));body=form;}
else if(op.body){headers['Content-Type']='application/json';const value=JSON.parse(fs.readFileSync(path.join(folder,'json',op.body),'utf8'));const expand=v=>typeof v==='string'?v.replace(/\$\{([A-Z_]+)\}/g,(_,name)=>required(name)):Array.isArray(v)?v.map(expand):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,expand(x)])):v;body=JSON.stringify(expand(value));}
const response=await fetch(base+route,{method:op.method,headers,body});
const raw=await response.text();let result;try{result=raw?JSON.parse(raw):null;}catch{result=raw;}
console.log(JSON.stringify({status:response.status,body:result},null,2));
if(!response.ok)process.exitCode=1;
