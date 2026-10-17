#!/usr/bin/env node
// Node 20+. Default mode is read-only. --book explicitly enables one booking.
import {createInterface} from 'node:readline/promises';
import {stdin,stdout} from 'node:process';
const base=(process.env.BASE || 'https://appengine.appmint.io').replace(/\/$/,'');
const orgid=process.env.ORG_ID;
const token=process.env.TOKEN;
const clientInfo=process.env.CLIENT_INFO || 'appengine-api-reference-course';
if (!orgid) throw Error('Set ORG_ID to your organization from API Foundations.');
const rl=createInterface({input:stdin,output:stdout});
async function call(method,path,body,authenticated=false){
 if(authenticated&&!token)throw Error('Set TOKEN privately to your completed customer sign-in access token.');
 const headers={orgid,'x-client-info':clientInfo};
 if(authenticated)headers.Authorization=`Bearer ${token}`;
 if(body!==undefined)headers['Content-Type']='application/json';
 const r=await fetch(new URL(path,base),{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
 const text=await r.text();let result;try{result=JSON.parse(text)}catch{result=text}
 if(!r.ok)throw Error(`${method} ${path}: HTTP ${r.status}\n${JSON.stringify(result)}`);
 console.log(`${method} ${path}: HTTP ${r.status}`);return result;
}
try{
 const search=await call('GET','/documentation/search?q=reservations%20slots&limit=5');
 const hit=search.results.find(x=>x.method==='POST'&&x.path==='/crm/reservations/slots');
 if(!hit)throw Error('Your deployment does not publish the expected slots operation. Inspect its reference.');
 console.log('Selected operation:',hit.method,hit.path);
 const detail=new URL(hit.detail,base);detail.searchParams.set('format','json');
 const contract=await call('GET',detail.href);console.log('Required body fields:',contract.operation?.requestBody?.content?.['application/json']?.schema?.required);
 const definitions=await call('GET','/crm/reservations/definitions');
 const rows=definitions.data || [];if(!rows.length)throw Error('No active booking definitions. Complete Reservations setup first.');
 rows.forEach((d,i)=>console.log(`${i+1}: ${d.data.title||d.data.name} (${d.sk})`));
 const index=Number(await rl.question('Choose a definition number: '))-1;const definition=rows[index];if(!definition)throw Error('Invalid definition.');
 const services=definition.data.services||[];if(!services.length)throw Error('No configured service on this definition.');
 services.forEach((s,i)=>console.log(`${i+1}: ${s.name} (${s.duration} minutes)`));
 const service=services[Number(await rl.question('Choose a service number: '))-1];if(!service)throw Error('Invalid service.');
 const date=await rl.question('Future service date in business timezone (YYYY-MM-DD): ');
 const criteria={reservationDefinitionId:definition.sk,serviceName:service.name,serviceDate:date};
 const available=await call('POST','/crm/reservations/slots',criteria);
 if(available.closed||available.inactive||!available.slots?.length){console.log(available.error||'No available slots.');process.exitCode=0;}
 else{
  console.log(`${available.slots.length} slots`);available.slots.forEach((s,i)=>console.log(`${i+1}: ${s.startTime} → ${s.endTime}, places ${s.spotsAvailable}, timezone ${s.businessTimezone}`));
  if(!process.argv.includes('--book'))console.log('Read-only run finished. To create one real booking, run again with --book.');
  else{
   const slot=available.slots[Number(await rl.question('Choose a slot number to book: '))-1];if(!slot)throw Error('Invalid slot.');
   const customer=await call('GET','/client-data/profile',undefined,true);
   if(customer.datatype!=='customer'||!customer.data?.email)throw Error('Expected a customer profile with email.');
   const body={reservationDefinitionId:definition.sk,service:service.name,startTime:slot.startTime,customer:{name:[customer.data.firstName,customer.data.lastName].filter(Boolean).join(' '),email:customer.data.email}};
   if(!body.customer.name)throw Error('The customer profile needs a name.');
   console.log('This creates a booking and may send its configured notifications.');
   if(await rl.question('Type BOOK to submit: ')!=='BOOK')throw Error('Booking cancelled.');
   const booking=await call('POST','/client-data/reservations',body,true);console.log('Reservation:',booking.sk,booking.data?.name);
   const own=await call('GET','/client-data/reservations',undefined,true);if(!own.data?.some(r=>r.sk===booking.sk))throw Error('New reservation not found in own list.');
   const saved=await call('GET','/client-data/reservations/'+encodeURIComponent(booking.sk),undefined,true);
   if(saved.sk!==booking.sk)throw Error('Readback ID mismatch.');
   console.log('Verified:',JSON.stringify({sk:saved.sk,name:saved.data.name,status:saved.data.status,startTime:saved.data.startTime,endTime:saved.data.endTime,timezone:saved.data.timezone},null,2));
   const after=await call('POST','/crm/reservations/slots',criteria);console.log(`Available slots after booking: ${after.slots?.length}`);
  }
 }
} finally {rl.close()}
