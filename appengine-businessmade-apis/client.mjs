import fs from 'node:fs';
const operations=JSON.parse(fs.readFileSync(new URL('operations.json',import.meta.url)));
const id=process.argv[2]||'setup-status',op=operations.find(x=>x.id===id);if(!op)throw Error('Choose: '+operations.map(x=>x.id).join(', '));
const env=process.env,required=k=>{if(!env[k])throw Error('Set '+k);return env[k]};
const replace=(s,path=false)=>s.replace(/\{\{([A-Z_]+)\}\}/g,(_,k)=>path?encodeURIComponent(required(k)):required(k));
const bind=v=>typeof v==='string'?replace(v):Array.isArray(v)?v.map(bind):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,bind(x)])):v;
const r=await fetch(required('APPENGINE_API_ORIGIN').replace(/\/$/,'')+replace(op.path,true),{method:op.method,headers:{orgid:required('APPENGINE_ORG_ID'),authorization:'Bearer '+required('STAFF_TOKEN'),'content-type':'application/json'},body:op.body===undefined?undefined:JSON.stringify(bind(op.body))});
if(!r.ok)throw Error(`${r.status}: ${await r.text()}`);
console.log(JSON.stringify(await r.json(),null,2));
