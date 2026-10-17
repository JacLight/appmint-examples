/** Server-side AppEngine job. Supply the secret through a secret manager. */
import {writeFile} from 'node:fs/promises';
type Booking={sk:string;data:{title?:string;serviceName?:string;name?:string;startTime:string;status:string}};
type Page={data:Booking[];hasNext?:boolean};
function env(name:string):string{const v=process.env[name];if(!v)throw Error(`Set ${name}`);return v;}
const origin=env('APPENGINE_API_ORIGIN').replace(/\/$/,''),org=env('APPENGINE_ORG'),key=env('APPENGINE_JOB_KEY'),from=env('EXPORT_FROM'),to=env('EXPORT_BEFORE');
if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)||from>=to)throw Error('Use YYYY-MM-DD dates with from before the exclusive end');
function cell(v:unknown):string{let s=String(v??'');if(/^[\s]*[=+\-@]/.test(s)||/^[\t\r\n]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
const rows:Booking[]=[];let page=1;
for(;;){const r=await fetch(origin+'/repository/find/reservation',{method:'POST',headers:{orgid:org,'x-api-key':key,'Content-Type':'application/json'},body:JSON.stringify({query:{'data.status':'confirmed','data.startTime':{$gte:from+'T00:00:00.000Z',$lt:to+'T00:00:00.000Z'}},options:{page,pageSize:50}})});if(!r.ok)throw Error(`Export refused: HTTP ${r.status}`);const j=await r.json() as Page;if(!Array.isArray(j.data))throw Error('Unexpected repository response');rows.push(...j.data);if(!j.hasNext)break;if(++page>100)throw Error('Safety page limit; narrow dates or add durable checkpoints');}
await writeFile(process.env.EXPORT_FILE||'confirmed-bookings.csv',['id,title,start,status',...rows.map(r=>[r.sk,r.data.title||r.data.serviceName||r.data.name,r.data.startTime,r.data.status].map(cell).join(','))].join('\r\n'),{mode:0o600});console.log(`Exported ${rows.length} bookings across ${page} API pages`);
