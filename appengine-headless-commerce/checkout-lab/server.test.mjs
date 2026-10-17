import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createLab} from './server.mjs';
function backend(){
 const carts=new Map(),counts={intent:0,checkout:0};let timeout=false,deny=false,live=false,mismatch=false,unpaid=false;
 const fetcher=async(url,opts)=>{
  const route=new URL(url).pathname.slice(1),b=opts.body?JSON.parse(opts.body):{},bearer=opts.headers.Authorization?.slice(7);
  const json=(d,status=200)=>new Response(JSON.stringify(d),{status,headers:{'Content-Type':'application/json'}});
  if(route==='profile/customer/signin')return json(b.password==='temporary'?{token:'setup',requiresPasswordChange:true}:b.password==='challenge'?{requiresTwoFactor:true,challengeToken:'challenge'}:{token:b.email});
  if(route==='profile/security/challenge/verify')return json({token:'a@example.test'});
  if(!bearer||deny)return json({message:'Session expired'},401);
  if(route==='client-data/profile')return json({sk:bearer,data:{email:bearer,firstName:'Test'}});
  if(route.startsWith('storefront/product/'))return route.endsWith('/bad')?json({message:'Missing'},404):json({sk:'p',data:{sku:'test',status:'active'}});
  if(route==='storefront/cart/mine'){const saved=carts.get(bearer);return json(saved&&mismatch?{...saved,data:{...saved.data,shippingAddress:{...saved.data.shippingAddress,zip:'wrong'}}}:saved||null);}
  if(route==='storefront/pricing/calculate-cart')return json({cartId:'cart-'+bearer,productItems:b.productItems,rentalItems:[],total:10,shippingMethod:'manual',...(b.shippingAddress.country==='XX'?{shippingBlocked:'Not served'}:{})});
  if(route.startsWith('storefront/cart/update/')){const c={sk:'cart-'+bearer,data:b.data};carts.set(bearer,c);return json(c);}
  if(route==='storefront/payment-gateways')return json([{configured:true,data:{provider:'StripeProvider',publishableKey:live?'pk_live_mock':'pk_test_mock'}}]);
  if(route==='storefront/stripe/intent'){counts.intent++;if(timeout)throw Error('Simulated timeout');return json({id:'pi_'+bearer,client_secret:'secret',publishableKey:'pk_test_mock',livemode:false});}
  if(route==='storefront/checkout-cart'){counts.checkout++;assert.equal(b.paymentRef,'pi_'+bearer);assert.equal(b.email,bearer);return json({sk:'order-'+bearer,data:{number:'ORDER-1',email:bearer}});}
  if(route==='client-data/orders/ORDER-1')return json({sk:'order-'+bearer,data:{number:'ORDER-1',email:bearer,status:unpaid?'new':'paid',amount:10,currency:'usd',payments:unpaid?[]:[{ref:'pi_'+bearer,amount:10}]}});
  if(route==='client-data/orders')return json({data:[]});
  throw Error('Unexpected route '+route);
 };
 return {fetcher,counts,setTimeout:v=>timeout=v,setDeny:v=>deny=v,setLive:v=>live=v,setMismatch:v=>mismatch=v,setUnpaid:v=>unpaid=v};
}
async function fixture(fn){
 const storeDir=await mkdtemp(path.join(tmpdir(),'checkout-course-')),port=43000+Math.floor(Math.random()*15000),mock=backend();
 const {server,origin}=createLab({endpoint:'https://mock.invalid',org:'training',port,storeDir,fetcher:mock.fetcher});
 await new Promise((r,j)=>{server.once('error',j);server.listen(port,'127.0.0.1',r);});
 function client(){let cookie='',csrf='';return {async call(route,body,override={}){const res=await fetch(origin+'/api/'+route,{method:body===undefined?'GET':'POST',headers:{Cookie:cookie,...(body===undefined?{}:{Origin:origin,'Content-Type':'application/json','X-CSRF-Token':csrf}),...override},body:body===undefined?undefined:JSON.stringify(body)});const set=res.headers.get('set-cookie');if(set)cookie=set.split(';')[0];const data=await res.json();if(data.csrf)csrf=data.csrf;return {status:res.status,data};},async login(email='a@example.test',password='normal'){await this.call('state');const result=await this.call('signin',{email,password});await this.call('state');return result;}};}
 try{await fn({client,mock,origin,storeDir});}finally{await new Promise(r=>server.close(r));await rm(storeDir,{recursive:true,force:true});}
}
const cart={sku:'test',quantity:1,address:{street1:'Training',city:'Test',zip:'78701',country:'US'}};
test('write rejects missing CSRF before any business request',()=>fixture(async({client,mock})=>{const c=client();await c.login();assert.equal((await c.call('quote',cart,{'X-CSRF-Token':''})).status,403);assert.equal(mock.counts.intent,0);}));
test('temporary password token never becomes customer session',()=>fixture(async({client})=>{const c=client();assert.equal((await c.login(undefined,'temporary')).status,409);assert.equal((await c.call('state')).data.profile,null);}));
test('challenge completes before protected state',()=>fixture(async({client})=>{const c=client();await c.login(undefined,'challenge');assert.equal((await c.call('cart')).status,401);await c.login(undefined,'challenge');assert.equal((await c.call('challenge',{code:'controlled'})).status,200);assert.equal((await c.call('state')).data.profile.email,'a@example.test');}));
test('unknown product and excluded destination cannot create intent',()=>fixture(async({client,mock})=>{const c=client();await c.login();assert.equal((await c.call('quote',{...cart,sku:'bad'})).status,404);assert.equal((await c.call('quote',{...cart,address:{...cart.address,country:'XX'}})).status,400);assert.equal(mock.counts.intent,0);}));
test('same owned intent and completed order are reused; supplied paymentRef ignored',()=>fixture(async({client,mock})=>{const c=client();await c.login();assert.equal((await c.call('quote',cart)).status,200);await c.call('intent',{});await c.call('intent',{});assert.equal(mock.counts.intent,1);assert.equal((await c.call('quote',cart)).status,409);const r=await c.call('finalize',{paymentRef:'attacker'});assert.equal(r.data.stage,'complete');await c.call('finalize',{});assert.equal(mock.counts.checkout,1);}));
test('another customer and unauthenticated browser cannot read attempt',()=>fixture(async({client})=>{const a=client(),b=client(),guest=client();await a.login();await a.call('quote',cart);await a.call('intent',{});assert.equal((await guest.call('state')).data.attempt,null);await b.login('b@example.test');assert.equal((await b.call('state')).data.attempt,null);}));
test('intent timeout locks attempt instead of issuing another intent',()=>fixture(async({client,mock})=>{const c=client();await c.login();await c.call('quote',cart);mock.setTimeout(true);assert.equal((await c.call('intent',{})).status,502);assert.equal((await c.call('intent',{})).data.stage,'reconciliation-required');assert.equal(mock.counts.intent,1);assert.equal((await c.call('finalize',{})).status,409);}));
test('upstream auth denial clears private session data',()=>fixture(async({client,mock})=>{const c=client();await c.login();mock.setDeny(true);assert.equal((await c.call('cart')).status,401);assert.equal((await c.call('state')).data.profile,null);}));

test('live gateway is refused before provider intent creation',()=>fixture(async({client,mock})=>{const c=client();await c.login();await c.call('quote',cart);mock.setLive(true);assert.equal((await c.call('intent',{})).status,409);assert.equal(mock.counts.intent,0);assert.equal((await c.call('state')).data.attempt.stage,'quoted');}));
test('saved address mismatch stops the quote and intent',()=>fixture(async({client,mock})=>{const c=client();await c.login();mock.setMismatch(true);assert.equal((await c.call('quote',cart)).status,409);assert.equal((await c.call('intent',{})).status,400);assert.equal(mock.counts.intent,0);}));
test('completed attempt is resumed until an explicit new quote',()=>fixture(async({client,mock})=>{const c=client();await c.login();await c.call('quote',cart);await c.call('intent',{});await c.call('finalize',{});assert.equal((await c.call('intent',{})).data.stage,'complete');assert.equal(mock.counts.intent,1);await c.call('quote',cart);await c.call('intent',{});assert.equal(mock.counts.intent,2);}));

test('saved order alone is insufficient for paid completion',()=>fixture(async({client,mock})=>{const c=client();await c.login();await c.call('quote',cart);await c.call('intent',{});mock.setUnpaid(true);assert.equal((await c.call('finalize',{})).status,409);assert.equal((await c.call('state')).data.attempt.stage,'reconciliation-required');assert.equal(mock.counts.checkout,1);}));
