import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createLab} from './server.mjs';
const reference='PAYPALORDER123';
const cart={sku:'course',quantity:2,address:{street1:'Training',city:'Test',state:'TX',zip:'78701',country:'US'}};
async function fixture(fn){
 const dir=await mkdtemp(path.join(tmpdir(),'paypal-companion-')),port=43000+Math.floor(Math.random()*14000),state={sandbox:true,carts:new Map(),orders:[],checkout:0,uncertain:false,wrongAmount:false,wrongCurrency:false,wrongCustomer:false,addressChanged:false};
 const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
 const fetcher=async(url,o)=>{
  const r=new URL(url).pathname.slice(1),b=o.body?JSON.parse(o.body):{},owner=o.headers.Authorization?.slice(7);
  if(r==='profile/customer/signin')return response({token:b.email});
  if(r==='client-data/profile')return response({sk:owner,data:{email:owner,firstName:'Course'}});
  if(r==='storefront/product/course')return response({sk:'p',data:{sku:'course',name:'Course',status:'available',price:24}});
  if(r==='shipping/options')return response({served:true,options:[{name:'flat',amount:6.5}]});
  if(r==='storefront/pricing/calculate-cart')return response({cartId:'cart-'+owner,productItems:b.productItems,rentalItems:[],total:54.5,shippingMethod:'flat'});
  if(r.startsWith('storefront/cart/update/')){let v={sk:'cart-'+owner,data:b.data};state.carts.set(owner,v);return response(v)}
  if(r==='storefront/cart/mine'){const v=state.carts.get(owner);return response(state.addressChanged?{...v,data:{...v.data,shippingAddress:{...v.data.shippingAddress,zip:'changed'}}}:v||null)}
  if(r==='storefront/payment-gateways')return response([{sk:'paypal-config',configured:true,data:{provider:'PayPalProvider',sandbox:state.sandbox,clientId:'sandbox-public-client'}}]);
  if(r==='storefront/checkout-cart'){
   state.checkout++;assert.equal(b.paymentRef,reference);assert.equal(b.paymentGateway,'paypal');assert.equal(b.email,owner);
   const order={sk:'order-'+owner,data:{number:'COURSEORDER',email:state.wrongCustomer?'other@example.test':owner,status:'paid',amount:state.wrongAmount?1:54.5,currency:state.wrongCurrency?'eur':'USD',payments:[{ref:reference,amount:54.5}]}};
   state.orders=[order];if(state.uncertain)throw Error('Simulated response lost after write');return response(order);
  }
  if(r==='client-data/orders')return response({data:state.orders});
  if(r==='client-data/orders/COURSEORDER')return response(state.orders[0]);
  throw Error('Unhandled mock route '+r);
 };
 const{server,origin}=createLab({endpoint:'https://mock.invalid',org:'course',storeDir:dir,port,fetcher});await new Promise((r,j)=>{server.once('error',j);server.listen(port,'127.0.0.1',r)});
 let cookie='',csrf='';async function call(route,body){const r=await fetch(origin+'/api/'+route,{method:body===undefined?'GET':'POST',headers:{Cookie:cookie,...(body===undefined?{}:{Origin:origin,'Content-Type':'application/json','X-CSRF-Token':csrf})},body:body===undefined?undefined:JSON.stringify(body)});if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];const data=await r.json();if(data.csrf)csrf=data.csrf;return{status:r.status,data}}
 async function ready(){await call('state');await call('signin',{email:'customer@example.test',password:'mock'});await call('state');assert.equal((await call('quote',cart)).status,200)}
 async function start(){await ready();assert.equal((await call('paypal',{})).status,200);assert.equal((await call('paypal/order',{orderId:reference})).status,200)}
 try{await fn({state,call,ready,start})}finally{await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true})}
}
test('PayPal refuses explicitly live configuration before provider order',()=>fixture(async({state,call,ready})=>{await ready();state.sandbox=false;assert.equal((await call('paypal',{})).status,409);assert.equal(state.checkout,0)}));
test('PayPal detects a changed saved delivery address',()=>fixture(async({state,call,ready})=>{await ready();state.addressChanged=true;assert.equal((await call('paypal',{})).status,409);assert.equal(state.checkout,0)}));
test('PayPal attempt cannot replace its recorded provider order',()=>fixture(async({call,start})=>{await start();assert.equal((await call('paypal/order',{orderId:'OTHERORDER123'})).status,409);assert.equal((await call('state')).data.attempt.paypalOrderId,reference)}));
test('capture begins durably and uncertain state refuses another capture',()=>fixture(async({call,start,state})=>{await start();assert.equal((await call('paypal/capturing',{})).status,200);assert.equal((await call('state')).data.attempt.stage,'paypal-capturing');assert.equal((await call('paypal/capturing',{})).status,409);assert.equal((await call('quote',cart)).status,409);assert.equal(state.checkout,0)}));
for(const flag of ['wrongAmount','wrongCurrency','wrongCustomer'])test('paid readback rejects '+flag,()=>fixture(async({state,call,start})=>{await start();state[flag]=true;assert.equal((await call('finalize',{})).status,409);assert.equal((await call('state')).data.attempt.stage,'reconciliation-required');assert.equal((await call('finalize',{})).status,409);assert.equal(state.checkout,1)}));
test('lost checkout response reconciles exact saved payment without another write',()=>fixture(async({state,call,start})=>{await start();state.uncertain=true;assert.equal((await call('finalize',{})).status,502);assert.equal((await call('reconcile',{})).data.stage,'complete');assert.equal(state.checkout,1);assert.equal((await call('finalize',{})).data.stage,'complete');assert.equal(state.checkout,1)}));
test('no matching order leaves uncertain capture locked and never creates an order',()=>fixture(async({state,call,start})=>{await start();await call('paypal/capturing',{});const r=await call('reconcile',{});assert.equal(r.data.stage,'paypal-capturing');assert.match(r.data.message,/No matching customer order/);assert.equal(state.checkout,0)}));
