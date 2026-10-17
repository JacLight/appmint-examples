// Exact AppEngine request runner. Keep credentials only in your environment.
import fs from'node:fs';
const [method,path,bodyFile]=process.argv.slice(2);if(!method||!path)throw Error('node client.mjs METHOD /route [request.json]');
const r=await fetch(process.env.APPENGINE_ENDPOINT.replace(/\/$/,'')+path,{method,headers:{orgid:process.env.ORG_ID,Authorization:'Bearer '+process.env.STAFF_TOKEN,'content-type':'application/json'},body:bodyFile?fs.readFileSync(bodyFile):undefined});const text=await r.text();console.log(JSON.stringify({status:r.status,body:text?JSON.parse(text):null},null,2));if(!r.ok)process.exitCode=1;
