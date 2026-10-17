// Local read-only reference client. Runs on loopback; keep debug controls off public deployments.
import http from 'node:http';import fs from 'node:fs';import {request,bookingView} from './client.mjs';
const root=new URL('./',import.meta.url);const port=Number(process.env.PORT||4376);
const bookingId=process.env.BOOKING_ID;if(!/^[a-f0-9]{24}$/i.test(bookingId||''))throw Error('Set a real BOOKING_ID.');
http.createServer(async(req,res)=>{const u=new URL(req.url,'http://reference.invalid');
 if(u.pathname==='/api/booking'){
  let body={},status=200,clientError=null;const orgMode=u.searchParams.get('org')||'correct',authMode=u.searchParams.get('auth')||'current',mapping=u.searchParams.get('mapping')||'current';
  const org=orgMode==='wrong'?'diag-usecase-1011-nonexistent':process.env.ORG_ID,token=authMode==='invalid'?'invalid-controlled-diagnostic-session':process.env.CUSTOMER_TOKEN;
  try{const result=await request('GET','/client-data/reservations/'+bookingId,undefined,{org,token});status=result.status;body=result.body}catch(e){status=e.status||0;body=e.body||{error:e.message};}
  let booking=null;if(status>=200&&status<300){try{booking=bookingView(mapping==='old'?body.booking:body)}catch(e){clientError=e.message}}
  res.statusCode=status||502;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify({request:{method:'GET',path:'/client-data/reservations/'+bookingId,headers:{orgid:org,Authorization:'Bearer [private customer session]'}},status,body,booking,clientError}));return;
 }
 const f=u.pathname==='/'?'index.html':u.pathname.slice(1);if(!['index.html','app.js','style.css','Inter.woff2'].includes(f)){res.writeHead(404).end();return}res.setHeader('Content-Type',f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'font/woff2');res.end(fs.readFileSync(new URL(f,root)));
}).listen(port,'127.0.0.1',()=>console.log(`Read-only customer reference client: http://127.0.0.1:${port}`));
