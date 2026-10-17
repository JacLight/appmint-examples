// Staff-only one-shot fixture creation. Review the JSON files before running.
import fs from 'node:fs';
if(!process.argv.includes('--create'))throw Error('Review json/shipping-config.json and json/product.json; run node prepare.mjs --create once.');
const {APPENGINE_ENDPOINT,ORG_ID,STAFF_TOKEN}=process.env;
if(!APPENGINE_ENDPOINT||!ORG_ID||!STAFF_TOKEN)throw Error('Set endpoint, organization and private staff token');
for(const name of ['shipping-config','product']){
 const body=JSON.parse(fs.readFileSync(new URL('./json/'+name+'.json',import.meta.url)));
 if(JSON.stringify(body).includes('YOUR_OWN_'))throw Error('Replace the product image URL before creating either fixture.');
}
for(const name of ['shipping-config','product']){
 const body=JSON.parse(fs.readFileSync(new URL('./json/'+name+'.json',import.meta.url)));
 const r=await fetch(APPENGINE_ENDPOINT.replace(/\/$/,'')+'/repository/create',{method:'POST',headers:{orgid:ORG_ID,Authorization:'Bearer '+STAFF_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(body)});
 const result=await r.json();if(!r.ok)throw Error(JSON.stringify(result));console.log(JSON.stringify({created:name,sk:result.sk,name:result.data.name,sku:result.data.sku},null,2));
}
