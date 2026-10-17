// AppEngine integration adapter. Node 20+. Run on your server, never in a browser.
import {mkdir,rmdir,writeFile,readFile,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
export async function importShipment(id,env=process.env,observe=()=>{}) {
const {APPENGINE_ENDPOINT,ORG_ID,STAFF_TOKEN,SUPPLIER_URL,SUPPLIER_KEY,LOCATION_ID}=env;
for(const [name,value] of Object.entries({APPENGINE_ENDPOINT,ORG_ID,STAFF_TOKEN,SUPPLIER_URL,SUPPLIER_KEY,LOCATION_ID}))if(!value)throw Error('Missing '+name);
if(!id||id.length>100)throw Error('Shipment ID required, up to 100 characters');
const ref='northwind:'+id, dir=env.STATE_DIR||'.supplier-state', stateKey=createHash('sha256').update(JSON.stringify([ORG_ID,ref])).digest('hex'), lock=dir+'/'+stateKey+'.lock';
await mkdir(dir,{recursive:true});try{await mkdir(lock)}catch(e){if(e.code==='EEXIST')throw Error('This shipment already has an active or interrupted worker. Reconcile its intake before clearing the lock.');throw e;}
const send=async(method,path,body)=>{const r=await fetch(APPENGINE_ENDPOINT.replace(/\/$/,'')+path,{method,headers:{orgid:ORG_ID,Authorization:'Bearer '+STAFF_TOKEN,'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});const v=await r.json();observe({scope:'AppEngine',method,path,body,status:r.status,result:v});if(!r.ok){const e=Error('AppEngine '+r.status+' '+(v.message||v.error||path));e.status=r.status;throw e;}return v;};
const findExisting=async()=>{let page=1;const matches=[];for(;;){const r=await send('GET','/storefront/inventory/intakes?q='+encodeURIComponent(ref)+'&p='+page+'&ps=50');const match=r.data.filter(x=>x.data.reference===ref&&x.data.status!=='cancelled');matches.push(...match);if(matches.length>1)throw Error('Duplicate intake references need manual review');if(page*50>=r.total||!r.data.length)return matches[0]||null;page++;}};
try {
let existing=await findExisting();if(existing)return {action:'reused',intake:existing};
const outcome=dir+'/'+stateKey+'.json';
let previous;try{previous=JSON.parse(await readFile(outcome,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e;}
if(previous?.status==='dispatching'||previous?.status==='uncertain')throw Error('Previous intake creation outcome is uncertain. Reconcile with AppEngine before an operator clears this job marker.');
const response=await fetch(SUPPLIER_URL.replace(/\/$/,'')+'/shipments/'+encodeURIComponent(id),{headers:{'x-supplier-key':SUPPLIER_KEY},signal:AbortSignal.timeout(Number(env.SUPPLIER_TIMEOUT_MS)||5000)});
const n=await response.json();observe({scope:'Teaching supplier',method:'GET',path:'/shipments/'+id,status:response.status,result:n});if(!response.ok)throw Error('Supplier HTTP '+response.status);
if(n.shipmentId!==id||!Array.isArray(n.lines)||!n.lines.length)throw Error('Unexpected supplier shipment contract');
if(n.currency!== (env.CURRENCY||'USD'))throw Error('Supplier currency differs from receiving location; do not silently convert');
const items=[],seen=new Set();for(const line of n.lines){if(!line.supplierSku||!Number.isFinite(line.quantity)||line.quantity<=0||!Number.isFinite(line.unitPrice)||line.unitPrice<0)throw Error('Invalid supplier SKU, quantity or cost');
const found=await send('POST','/repository/find/sf_product',{query:{'data.supplierSku':line.supplierSku},options:{page:1,pageSize:2}});
if(found.data.length!==1)throw Error(line.supplierSku+': expected exactly one mapped product; found '+found.data.length);
const sku=found.data[0].data.sku;if(seen.has(sku))throw Error('Two supplier lines map to the same SKU; consolidate explicitly');seen.add(sku);items.push({sku,quantity:line.quantity,unitCost:line.unitPrice});}
const payload={vendorName:'Northwind Timber — teaching supplier',locationId:LOCATION_ID,items,reference:ref,expectedDate:n.estimatedArrival,notes:'Synthetic course shipment. Source purchase order '+n.purchaseOrder+'; '+n.lines.map((l,i)=>l.supplierSku+' → '+items[i].sku).join('; ')};
await writeFile(outcome,JSON.stringify({reference:ref,status:'dispatching'},null,2));
let intake;try{intake=await send('POST','/storefront/inventory/intakes',payload)}catch(e){
 if(e.status>=400&&e.status<500){await unlink(outcome);throw e;}
 existing=await findExisting();if(existing){await writeFile(outcome,JSON.stringify({reference:ref,status:'verified',intakeId:existing.sk}));return {action:'reconciled',intake:existing};}
 await writeFile(outcome,JSON.stringify({reference:ref,status:'uncertain'}));throw Error('Intake creation outcome uncertain; reconcile before retrying.');
}
await writeFile(outcome,JSON.stringify({reference:ref,status:'verified',intakeId:intake.sk,intakeNumber:intake.data.intakeNumber},null,2));return {action:'created',intake};
} finally {await rmdir(lock)}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{const r=await importShipment(process.argv[2]);console.log(JSON.stringify({action:r.action,intakeId:r.intake.sk,...r.intake.data},null,2))}catch(e){console.error(e.message);process.exitCode=1}}
