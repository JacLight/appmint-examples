// Node.js20+ command client. Direct customer-token transport, no application secret.
import fs from'node:fs';import os from'node:os';import path from'node:path';
const base=process.env.APPENGINE_ENDPOINT?.replace(/\/$/,''),org=process.env.ORG_ID;
if(!base||!org)throw Error('Set APPENGINE_ENDPOINT and ORG_ID');
const sessionFile=process.env.SESSION_FILE||path.join(os.homedir(),'.appengine-commerce-session.json');
let token=process.env.CUSTOMER_TOKEN;try{token||=JSON.parse(fs.readFileSync(sessionFile)).token}catch{}
async function request(method,route,body){const r=await fetch(base+'/'+route,{method,headers:{orgid:org,...(token?{Authorization:'Bearer '+token}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{})},body:body===undefined?undefined:JSON.stringify(body)});const t=await r.text(),v=t?JSON.parse(t):null;if(!r.ok)throw Object.assign(Error(JSON.stringify(v)),{status:r.status});return v;}
const [cmd='products',value]=process.argv.slice(2);let result;
if(cmd==='signin'){const v=await request('POST','profile/customer/signin',{email:process.env.CUSTOMER_EMAIL,password:process.env.CUSTOMER_PASSWORD});if(v.requiresPasswordChange||v.requiresTwoFactor||!v?.token)throw Error('Complete verification/password change through API Foundations before this CLI exercise.');fs.writeFileSync(sessionFile,JSON.stringify({token:v.token}),{mode:0o600});fs.chmodSync(sessionFile,0o600);result={signedIn:true,sessionFile};}
else if(cmd==='products')result=await request('GET','storefront/products?p=1&ps=12');
else if(cmd==='product')result=await request('GET','storefront/product/'+encodeURIComponent(value));
else if(cmd==='profile')result=await request('GET','client-data/profile');
else if(cmd==='shipping')result=await request('POST','shipping/options',JSON.parse(fs.readFileSync(value)));
else if(cmd==='quote')result=await request('POST','storefront/pricing/calculate-cart',JSON.parse(fs.readFileSync(value)));
else if(cmd==='cart')result=await request('GET','storefront/cart/mine');
else if(cmd==='save'){const quote=JSON.parse(fs.readFileSync(value));const profile=await request('GET','client-data/profile');const address=JSON.parse(fs.readFileSync(process.argv[4]));if(!quote.cartId)throw Error('Quote JSON must include returned cartId');result=await request('POST','storefront/cart/update/'+encodeURIComponent(quote.cartId),{datatype:'sf_cart',data:{...quote,shippingAddress:address,email:profile.data.email,source:'website'}});}
else if(cmd==='gateways')result=await request('GET','storefront/payment-gateways');
else if(cmd==='orders')result=await request('GET','client-data/orders');
else if(cmd==='order')result=await request('GET','client-data/orders/'+encodeURIComponent(value));
else if(cmd==='logout'){if(fs.existsSync(sessionFile))fs.unlinkSync(sessionFile);result={localSessionRemoved:true};}
else throw Error('Commands: signin, profile, products, product SKU, shipping FILE, quote FILE, save QUOTE ADDRESS, cart, gateways, orders, order NUMBER, logout. Payment/order mutation uses the explicit browser companion.');
console.log(JSON.stringify(result,null,2));
