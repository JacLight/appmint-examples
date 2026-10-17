import fs from 'node:fs';
const name=process.argv[2]; if(!name) throw Error('Supply a request envelope JSON');
const q=JSON.parse(fs.readFileSync(name,'utf8'));
const readOnly=q.method==='GET'||/^\/repository\/(find|search)\//.test(q.path);
if(!readOnly&&!process.argv.includes('--write'))throw Error('Mutation requires --write after reviewing your IDs/body');
const base=process.env.APPENGINE_BASE, orgid=process.env.APPENGINE_ORG, token=process.env.APPENGINE_TOKEN;
if(!base||!orgid)throw Error('Set APPENGINE_BASE and APPENGINE_ORG');
const headers={...q.headers,orgid}; if(headers.Authorization){if(!token)throw Error('Set APPENGINE_TOKEN');headers.Authorization='Bearer '+token;}
if(JSON.stringify(q.body).includes('YOUR_'))throw Error('Replace body placeholders in your local request file');
const r=await fetch(base.replace(/\/$/,'')+q.path,{method:q.method,headers,...(q.body!==null?{body:JSON.stringify(q.body)}:{})});
const text=await r.text();let result;try{result=JSON.parse(text)}catch{result=text}
console.log(JSON.stringify({status:r.status,result},null,2));
