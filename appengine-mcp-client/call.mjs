import fs from 'node:fs';
const folder=process.argv[2]; if(!folder)throw Error('Pass one request folder');
const meta=JSON.parse(fs.readFileSync(folder+'/route.json','utf8'));
const body=JSON.parse(fs.readFileSync(folder+'/request.json','utf8'));
if(meta.write&&!process.argv.includes('--allow-write'))throw Error('Inspect the target; intentional writes require --allow-write');
const base=process.env.APPENGINE_ENDPOINT?.replace(/\/$/,'');
const org=process.env.ORG_ID,token=process.env.STAFF_TOKEN;
if(!base||!org||!token)throw Error('Set APPENGINE_ENDPOINT, ORG_ID and STAFF_TOKEN privately');
try{
 const response=await fetch(base+meta.path,{method:meta.method,headers:{orgid:org,Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body!==null?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
 const text=await response.text(),result=text?JSON.parse(text):null;
 console.log(JSON.stringify({status:response.status,result},null,2));
 if(!response.ok||result?.error||result?.result?.isError)process.exitCode=1;
}catch(error){console.error('Outcome unresolved. Read the exact target before retrying any write.');throw error;}
