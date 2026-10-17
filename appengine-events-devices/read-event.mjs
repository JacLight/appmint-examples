import {staffClient} from './sdk-host.mjs';
import {Venue} from './events.mjs';
const client=await staffClient({baseUrl:process.env.APPMINT_URL,orgId:process.env.APPMINT_ORG,token:process.env.STAFF_TOKEN});
const app=new Venue(client,{eventId:process.env.EVENT_ID});
console.log(JSON.stringify({event:await app.event(),ticketTypes:await app.ticketTypes(),occupancy:await app.occupancy()},null,2));
