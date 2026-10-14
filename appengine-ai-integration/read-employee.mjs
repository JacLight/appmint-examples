import fs from 'node:fs';import {staffClient} from './sdk-host.mjs';import {Employees} from './employees.mjs';
const client=await staffClient({baseUrl:process.env.APPMINT_URL,orgId:process.env.APPMINT_ORG,token:process.env.STAFF_TOKEN});
const fixture=JSON.parse(fs.readFileSync(process.env.AI_FIXTURE));
const employee=new Employees(client,fixture);
console.log(JSON.stringify(await employee.detail(),null,2));
