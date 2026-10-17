// Node20+: node operation.mjs json/operations/option-quote.json
import fs from'node:fs';
const file=process.argv[2];if(!file)throw Error('Pass a request JSON file');
const op=JSON.parse(fs.readFileSync(file,'utf8'));
const {APPENGINE_ENDPOINT,ORG_ID,CUSTOMER_TOKEN,STAFF_TOKEN}=process.env;
if(!APPENGINE_ENDPOINT||!ORG_ID)throw Error('Set APPENGINE_ENDPOINT and ORG_ID');
if(!['public','staff','customer'].includes(op.identity)||!op.path?.startsWith('/')||op.path.startsWith('//'))throw Error('Invalid operation identity or relative API path');
const token=op.identity==='public'?undefined:op.identity==='staff'?STAFF_TOKEN:CUSTOMER_TOKEN;
if(op.identity!=='public'&&!token)throw Error('Set the token for this operation identity: '+op.identity);
if(op.mutation&&process.env.CONFIRM_TEST_OPERATION!=='yes')throw Error('Review request and set CONFIRM_TEST_OPERATION=yes for this deliberate sandbox mutation');
const json=JSON.stringify(op);if(/YOUR_|SAVED_|SELECTED_|REPLACE_/.test(json))throw Error('Replace the marked request values from your own saved response');
const r=await fetch(APPENGINE_ENDPOINT.replace(/\/$/,'')+op.path,{method:op.method,headers:{orgid:ORG_ID,...(token?{Authorization:'Bearer '+token}:{}),...(op.body?{'Content-Type':'application/json'}:{})},body:op.body?JSON.stringify(op.body):undefined});
const text=await r.text();console.log(text?JSON.stringify(JSON.parse(text),null,2):'null');if(!r.ok)process.exitCode=1;
