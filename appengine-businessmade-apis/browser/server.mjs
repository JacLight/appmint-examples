import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const api=process.env.APPENGINE_API_ORIGIN;
const port=Number(process.env.PORT||4108);
if(!api)throw Error('Set APPENGINE_API_ORIGIN to your assigned AppEngine backend origin.');
const allowed=/^\/(profile\/user\/signin|repository\/(?:find\/(?:location|service_point|sf_product|bm_employee)|get\/(?:location|service_point|sf_product|bm_employee)\/[^/]+)|business-made\/(?:setup\/status|employees|work-orders(?:\/(?:active|customer\/[^/]+|[^/]+(?:\/(?:assign|status|items|time-entries|materials))?))?)|checkin\/(?:walk-in|queue(?:\/history|\/position\/[^/]+)?|service-point(?:\/available|\/[^/]+\/clear)?|[^/]+\/(?:assign|leave|no-show))|notes\/bm_work_order\/[^/]+|storefront\/(?:pos\/(?:readiness|tabs(?:\/closed)?|tab(?:\/[^/]+\/(?:breakdown|settle|close|receipt-payload|print-receipt))?)|order\/[^/]+\/items))$/;
http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,'http://sample.invalid');
 if(u.pathname.startsWith('/api/')){
  const route=u.pathname.slice(4);if(!allowed.test(route))throw Error('This example does not proxy that route.');
  let body='';for await(const c of req){body+=c;if(body.length>1e6)throw Error('Request too large');}
  const upstream=await fetch(api.replace(/\/$/,'')+route+u.search,{method:req.method,headers:{'content-type':'application/json',...(req.headers.orgid?{orgid:req.headers.orgid}:{}),...(req.headers.authorization?{authorization:req.headers.authorization}:{})},...(body?{body}:{})});
  res.writeHead(upstream.status,{'Content-Type':upstream.headers.get('content-type')||'application/json','Cache-Control':'no-store'});res.end(Buffer.from(await upstream.arrayBuffer()));return;
 }
 const name=u.pathname==='/'?'index.html':u.pathname.slice(1);if(!['index.html','app.js','style.css'].includes(name)){res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html','Cache-Control':'no-store'});res.end(await fs.readFile(path.join(root,name)));
}catch(e){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({message:e.message}));}}).listen(port,'127.0.0.1',()=>console.log(`Course example: http://127.0.0.1:${port} — local development only. No stored credentials are supplied by this server.`));
