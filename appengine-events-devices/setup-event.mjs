/** Explicit, resumable training setup. Each invocation performs at most one write. */
import fs from 'node:fs';
import {staffClient} from './sdk-host.mjs';
const step=process.argv[2];
if(!['create','type','publish','live','issue'].includes(step)||!process.argv.includes('--apply'))throw Error('Usage: node setup-event.mjs create|type|publish|live|issue --apply. Read README first.');
const config=JSON.parse(fs.readFileSync(process.env.VENUE_CONFIG||'venue-config.json'));
const statePath=process.env.VENUE_STATE||'venue-state.json';
const state=fs.existsSync(statePath)?JSON.parse(fs.readFileSync(statePath)):{};
if(state.pending)throw Error(`Uncertain prior ${state.pending} write. Inspect saved records and reconcile venue-state.json before another action; do not blindly retry.`);
if(state[step])throw Error(`${step} already saved. Reuse its result instead of repeating the action.`);
if(config.confirmIsolatedDisabledDelivery!==true)throw Error('Use an owned training organization and verify disabled outbound delivery first.');
const client=await staffClient({baseUrl:process.env.APPMINT_URL,orgId:process.env.APPMINT_ORG,token:process.env.STAFF_TOKEN});
const providers=await client.request('POST','/repository/find/config',{query:{},options:{pageSize:100}});
const rows=(providers.data||providers).map(x=>x.data||{});
if(!rows.some(x=>x.provider==='SMTPProvider'&&x.status==='inactive'&&x.sendOutgoing===false)||rows.some(x=>/SMTP|Twilio/i.test(x.provider)&&x.status==='active'&&x.sendOutgoing!==false))throw Error('Disabled outbound delivery preflight failed; do not run this isolated rehearsal in a production organization.');
if(step==='live'&&!state.publish)throw Error('Publish the saved event before going live.');
if(step==='issue'&&!state.live)throw Error('Complete the chosen live-event sequence before issuing this sample ticket.');
const eventId=state.create?.sk;
if(step!=='create'&&!eventId)throw Error('Create the event first and retain its returned sk.');
const event=config.event;
if(step==='create'&&(!(Date.parse(event.startTime)>Date.now())||!(Date.parse(event.endTime)>Date.parse(event.startTime))))throw Error('Choose a future start and an end after it.');
if(step==='issue'&&!state.type?.sk)throw Error('Create the ticket type first.');
const requests={
 create:['/crm/events/create',{data:{...event,attendees:[]}}],
 type:['/repository/create',{datatype:'event_ticket_type',isNew:true,data:{...config.ticketType,event:eventId,price:0,soldCount:0,isActive:true}}],
 publish:[`/events/${eventId}/publish`,{}], live:[`/events/${eventId}/live`,{}],
 issue:[`/events/${eventId}/tickets`,{ticketTypeId:state.type?.sk,holderName:config.holderName,skipNotification:true}],
};
state.pending=step;fs.writeFileSync(statePath,JSON.stringify(state,null,2),{mode:0o600});
const [route,body]=requests[step];
const result=await client.request('POST',route,body);
state[step]=result;delete state.pending;fs.writeFileSync(statePath,JSON.stringify(state,null,2),{mode:0o600});
console.log(JSON.stringify({step,result},null,2));
