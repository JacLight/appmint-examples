import {customerClient} from './sdk-host.mjs';
import {Portal} from './portal.mjs';
if(!process.env.ORG || !process.env.CUSTOMER_TOKEN) throw new Error('Set ORG and CUSTOMER_TOKEN');
const portal=new Portal(await customerClient({baseUrl:process.env.API || 'https://appengine.appmint.io',orgId:process.env.ORG,token:process.env.CUSTOMER_TOKEN}));
// Read-only entry point. Never log tokens; do not commit customer output.
for(const [label,read] of [['profile',()=>portal.profile()],['reservations',()=>portal.reservations()],['orders',()=>portal.orders()],['tickets',()=>portal.tickets()],['forms',()=>portal.forms()]]) console.log(label,JSON.stringify(await read(),null,2));
