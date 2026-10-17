/** Server job; never bundle into a public browser/mobile application. */
import {writeFile} from 'node:fs/promises';
import {csvCell} from '../browser/csv.mjs';
const origin=(process.env.APPENGINE_API_ORIGIN||'').replace(/\/$/,''),org=process.env.APPENGINE_ORG,key=process.env.APPENGINE_JOB_KEY;
const from=process.env.EXPORT_FROM,to=process.env.EXPORT_BEFORE;
if(!origin||!org||!key||!from||!to)throw Error('Set APPENGINE_API_ORIGIN, APPENGINE_ORG, APPENGINE_JOB_KEY, EXPORT_FROM and EXPORT_BEFORE');
if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)||from>=to)throw Error('Use YYYY-MM-DD dates with from before the exclusive end');
const rows=[];let page=1;
for(;;){const r=await fetch(origin+'/repository/find/reservation',{method:'POST',headers:{orgid:org,'x-api-key':key,'Content-Type':'application/json'},body:JSON.stringify({query:{'data.status':'confirmed','data.startTime':{$gte:from+'T00:00:00.000Z',$lt:to+'T00:00:00.000Z'}},options:{page,pageSize:50}})});if(!r.ok)throw Error('Export refused: HTTP '+r.status);const j=await r.json();if(!Array.isArray(j.data))throw Error('Unexpected repository response');rows.push(...j.data);if(!j.hasNext)break;if(++page>100)throw Error('Safety limit reached; narrow dates or use durable checkpoints');}
const csv=['id,title,start,status',...rows.map(r=>[r.sk,r.data.title||r.data.serviceName||r.data.name,r.data.startTime,r.data.status].map(csvCell).join(','))].join('\r\n');
await writeFile(process.env.EXPORT_FILE||'confirmed-bookings.csv',csv,{mode:0o600});console.log('Exported',rows.length,'bookings across',page,'API pages');
