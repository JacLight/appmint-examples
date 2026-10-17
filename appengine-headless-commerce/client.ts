import { createClient } from './sdk/dist/index.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const baseUrl=process.env.APPENGINE_ENDPOINT, orgId=process.env.ORG_ID;
if(!baseUrl||!orgId)throw new Error('Set APPENGINE_ENDPOINT and ORG_ID');
const sessionFile=process.env.SESSION_FILE||path.join(os.homedir(),'.appengine-commerce-typescript.json');
let token=process.env.CUSTOMER_TOKEN;try{token||=JSON.parse(fs.readFileSync(sessionFile,'utf8')).token}catch{}
const client=createClient({baseUrl,orgId,fetch:(input,init)=>{
 const headers=new Headers(init?.headers);
 if(token)headers.set('Authorization','Bearer '+token);
 return fetch(input,{...init,headers});
}});
const [command='products',id,addressFile]=process.argv.slice(2);
let result:unknown;
if(command==='signin'){
 const v:any=await client.post('profile/customer/signin',{email:process.env.CUSTOMER_EMAIL,password:process.env.CUSTOMER_PASSWORD});
 if(v.requiresTwoFactor||v.requiresPasswordChange||!v.token)throw Error('Complete API Foundations verification/password setup first');
 fs.writeFileSync(sessionFile,JSON.stringify({token:v.token}),{mode:0o600});fs.chmodSync(sessionFile,0o600);result={signedIn:true,sessionFile};
}else if(command==='products')result=await client.products.list({p:1,ps:12});
else if(command==='product')result=await client.products.get(id);
else if(command==='profile')result=await client.get('client-data/profile');
else if(command==='orders')result=await client.get('client-data/orders');
else if(command==='order')result=await client.get('client-data/orders/'+encodeURIComponent(id));
else if(command==='cart')result=await client.get('storefront/cart/mine');
else if(command==='gateways')result=await client.get('storefront/payment-gateways');
else if(command==='shipping'||command==='quote')result=await client.post(command==='shipping'?'shipping/options':'storefront/pricing/calculate-cart',JSON.parse(fs.readFileSync(id,'utf8')));
else if(command==='save'){
 const quote=JSON.parse(fs.readFileSync(id,'utf8')),address=JSON.parse(fs.readFileSync(addressFile,'utf8')),profile:any=await client.get('client-data/profile');
 if(!quote.cartId)throw Error('Missing returned cartId');
 result=await client.post('storefront/cart/update/'+encodeURIComponent(quote.cartId),{datatype:'sf_cart',data:{...quote,shippingAddress:address,email:profile.data.email,source:'website'}});
}else if(command==='logout'){if(fs.existsSync(sessionFile))fs.unlinkSync(sessionFile);result={localSessionRemoved:true};}
else throw new Error('signin | profile | products | product SKU | shipping FILE | quote FILE | save QUOTE ADDRESS | cart | gateways | orders | order NUMBER | logout');
console.log(JSON.stringify(result,null,2));
