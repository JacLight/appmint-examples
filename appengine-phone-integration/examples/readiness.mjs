import {staffClient} from './sdk-host.mjs';import {Phone} from './phone-client.mjs';
const p=new Phone(await staffClient({baseUrl:process.env.APPMINT_URL,orgId:process.env.APPMINT_ORG,token:process.env.STAFF_TOKEN}));
for(const method of ['userPhones','voiceApp','devices','callHistory'])console.log(JSON.stringify({operation:method,result:await p[method]()},null,2));
