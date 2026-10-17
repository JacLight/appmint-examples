import fs from 'node:fs';
const operations=JSON.parse(fs.readFileSync(new URL('./operations.json',import.meta.url)));
const op=operations[process.argv[2]];if(!op)throw Error('Choose an operation from operations.json');
const env=process.env,origin=env.APPENGINE_API_ORIGIN,org=env.APPENGINE_ORG_ID;
const token=env['APPENGINE_'+op.actor.toUpperCase()+'_TOKEN'];
const replace=s=>s.replace(/\{([A-Z_]+)\}/g,(_,key)=>{if(!env[key])throw Error('Set '+key);return env[key]});
const body=v=>typeof v==='string'?replace(v):Array.isArray(v)?v.map(body):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,v])=>[k,body(v)])):v;
const path=op.path.replace(/\{([A-Z_]+)\}/g,(_,key)=>encodeURIComponent(replace('{'+key+'}'))),payload=body(op.body);
if(process.argv.includes('--plan')){console.log(JSON.stringify({actor:op.actor,method:op.method,path,body:payload,note:op.note,testOnly:!!op.testOnly},null,2));process.exit(0)}
if(!origin||!org||!token)throw Error('Set APPENGINE_API_ORIGIN, APPENGINE_ORG_ID and the operation actor token.');
if(op.testOnly&&env.APPENGINE_VERIFIED_TEST!=='1')throw Error('Verify the configured sandbox provider and original reference, then set APPENGINE_VERIFIED_TEST=1.');
const r=await fetch(origin.replace(/\/$/,'')+path,{method:op.method,headers:{orgid:org,Authorization:'Bearer '+token,'Content-Type':'application/json'},...(payload===undefined?{}:{body:JSON.stringify(payload)})});
const raw=await r.text();let result;try{result=JSON.parse(raw)}catch{result=raw}console.log(JSON.stringify({status:r.status,result},null,2));if(!r.ok)process.exitCode=1;
