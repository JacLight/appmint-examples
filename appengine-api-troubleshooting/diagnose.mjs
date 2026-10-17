import {diagnose} from './client.mjs';
try { console.log(JSON.stringify(await diagnose(process.env.BOOKING_ID),null,2)); }
catch(e){console.error(JSON.stringify({status:e.status||null,error:e.message,response:e.body||null},null,2));process.exitCode=1;}
