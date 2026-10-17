/** A connection/authentication example; not proof of a physical scan or event headcount push. */
import {io} from 'socket.io-client';
for(const key of ['APPMINT_URL','APPMINT_ORG','STAFF_TOKEN','HUB_NAME'])if(!process.env[key])throw Error('Set '+key);
const socket=io(new URL('/device-events',process.env.APPMINT_URL).href,{transports:['websocket'],auth:{token:process.env.STAFF_TOKEN,orgId:process.env.APPMINT_ORG,hub:process.env.HUB_NAME},reconnectionAttempts:2});
let authenticated=false;
socket.on('authenticate',message=>{authenticated=message.success===true;console.log(authenticated?'Staff stream authenticated':'Authentication refused');if(!authenticated)socket.disconnect();});
socket.on('disconnect',()=>{authenticated=false;console.log('Disconnected; refresh the ticket/count after reconnect.');});
socket.on('connect_error',()=>console.error('Connection failed; inspect endpoint and completed staff session.'));
socket.on('event',message=>{
 if(!authenticated)return;
 // Inspect the current maintained device message shape before wiring an action.
 // Select your exact hub/endpoint and explicitly confirm an admission action.
 console.log('Authenticated device event received; handler intentionally does not admit or actuate.',Object.keys(message||{}));
});
setTimeout(()=>socket.disconnect(),20000); // bounded demonstration
