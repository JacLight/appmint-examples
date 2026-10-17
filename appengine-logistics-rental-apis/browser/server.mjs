import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const api=process.env.APPENGINE_API_ORIGIN;
const port=Number(process.env.PORT||4102);
const sandbox=process.env.APPENGINE_SANDBOX_DEMO==='1';
if(!api)throw Error('Set APPENGINE_API_ORIGIN to your assigned AppEngine backend origin.');
const allowed=/^\/(profile\/(signin|user\/signin|customer\/signin)|repository\/(create|find\/[^/]+|get\/[^/]+\/[^/]+)|storefront\/rental(?:\/[^?]*)?|client\/(stowbo|logistics)(?:\/[^?]*)?|logistics\/delivery(?:\/[^?]*)?|finance\/payments\/(charge|verify)|documentation(?:\/search|\/tag\/[^/]+\.md)?)$/;
http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,'http://sample.invalid');
 if(u.pathname.startsWith('/api/')){
  const route=u.pathname.slice(4);if(!allowed.test(route))throw Error('This example does not proxy that route.');
  let body='';for await(const c of req){body+=c;if(body.length>1e6)throw Error('Request too large');}
  const bodyJSON=body?JSON.parse(body):null;
  const takesTestPayment=route==='/finance/payments/charge'||bodyJSON?.paymentMethodId==='pm_card_visa';
  if(takesTestPayment&&!sandbox)throw Error('This sample only collects test payments. Verify the organization gateway is Stripe TEST, then start with APPENGINE_SANDBOX_DEMO=1.');
  if(route==='/finance/payments/charge'){
   const configCheck=await fetch(api.replace(/\/$/,'')+'/repository/find/config',{method:'POST',headers:{'content-type':'application/json',orgid:req.headers.orgid||'',authorization:req.headers.authorization||''},body:JSON.stringify({query:{'data.provider':'StripeProvider'},options:{pageSize:100}})});
   const configs=await configCheck.json();const active=(configs.data||[]).filter(c=>!c.data.status||c.data.status==='active');
   if(!configCheck.ok||active.length!==1||!active[0].data.secretKey?.startsWith('sk_test_'))throw Error('The configured Stripe connection is not exclusively TEST. Payment stopped.');
  }
  const upstream=await fetch(api.replace(/\/$/,'')+route+u.search,{method:req.method,headers:{'content-type':'application/json',...(req.headers.orgid?{orgid:req.headers.orgid}:{}),...(req.headers.authorization?{authorization:req.headers.authorization}:{})},...(body?{body}:{})});
  res.writeHead(upstream.status,{'Content-Type':upstream.headers.get('content-type')||'application/json','Cache-Control':'no-store'});res.end(await upstream.text());return;
 }
 const name=u.pathname==='/'?'index.html':u.pathname.slice(1);if(!['index.html','app.js','style.css'].includes(name)){res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html','Cache-Control':'no-store'});res.end(await fs.readFile(path.join(root,name)));
}catch(e){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({message:e.message}));}}).listen(port,'127.0.0.1',()=>console.log(`Course example: http://127.0.0.1:${port} — local development only. No stored credentials are supplied by this server.`));
