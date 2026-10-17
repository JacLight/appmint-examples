// AppEngine teaching reference. Single-process loopback lab; not a production host.
import http from 'node:http';
import {randomBytes, createHash} from 'node:crypto';
import {mkdir, readFile, writeFile, rename, appendFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const here=path.dirname(fileURLToPath(import.meta.url));
const error=(message,status=400)=>Object.assign(new Error(message),{status});
export function createLab({endpoint,org,storeDir=path.join(here,'.private'),fetcher=fetch,port=4310,publicOrigin}={}) {
  if(!endpoint||!org)throw error('Set APPENGINE_ENDPOINT and ORG_ID');
  endpoint=endpoint.replace(/\/$/,'');
  const backendUrl=new URL(endpoint);
  if(backendUrl.protocol!=='https:'&&!(backendUrl.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(backendUrl.hostname)))throw error('Use HTTPS for a remote AppEngine endpoint');
  const origin=publicOrigin||`http://127.0.0.1:${port}`,sessions=new Map(),locks=new Map();
  const token=()=>randomBytes(32).toString('hex');
  const file=owner=>path.join(storeDir,createHash('sha256').update(org+'\0'+owner).digest('hex')+'.json');
  async function load(owner){try{return JSON.parse(await readFile(file(owner),'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}}
  async function save(owner,value){await mkdir(storeDir,{recursive:true,mode:0o700});const temp=file(owner)+'.tmp';await writeFile(temp,JSON.stringify(value),{mode:0o600});await rename(temp,file(owner));return value;}
  async function serial(owner,work){const previous=locks.get(owner)||Promise.resolve();const next=previous.catch(()=>{}).then(work);locks.set(owner,next);try{return await next;}finally{if(locks.get(owner)===next)locks.delete(owner);}}
  async function api(route,s,body){
    const res=await fetcher(endpoint+'/'+route,{method:body===undefined?'GET':'POST',headers:{orgid:org,...(s?.bearer?{Authorization:'Bearer '+s.bearer}:{}),...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
    const text=await res.text();let data;try{data=text?JSON.parse(text):null;}catch{throw error('AppEngine returned a non-JSON response',502);}
    if(process.env.COURSE_AUDIT_FILE){const clean=v=>Array.isArray(v)?v.map(clean):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,/password|secret|token|authorization/i.test(k)?'[redacted]':clean(x)])):v;await appendFile(process.env.COURSE_AUDIT_FILE,JSON.stringify(clean({at:new Date().toISOString(),request:{method:body===undefined?'GET':'POST',path:'/'+route,body},response:{status:res.status,body:data}}))+'\n');}
    if(!res.ok)throw error(typeof data?.message==='string'?data.message:'AppEngine request failed ('+res.status+')',res.status);
    return data;
  }
  const publicAttempt=a=>a?{id:a.id,stage:a.stage,cartId:a.cartId,total:a.total,currency:a.currency,gateway:a.gateway||'stripe',paypalClientId:a.paypalClientId,paypalOrderId:a.paypalOrderId,publishableKey:a.intent?.publishableKey,clientSecret:a.intent?.client_secret,paymentId:a.intent?.id,orderId:a.order?.sk,orderNumber:a.order?.data?.number,orderStatus:a.order?.data?.status,paid:a.order?.data?.paid,balance:a.order?.data?.balance,message:a.message}:null;
  const server=http.createServer(async(req,res)=>{
    const reply=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
    let activeSession;
    try {
      if(![`127.0.0.1:${port}`,new URL(origin).host].includes(req.headers.host))throw error('Use the documented loopback address',403);
      const url=new URL(req.url,origin);
      url.pathname=url.pathname.replace(/^\/api\/checkout\//,'/api/');
      if(req.method==='GET'&&['/','/checkout','/return'].includes(url.pathname)){res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store','Referrer-Policy':'no-referrer'});res.end(await readFile(path.join(here,'index.html')));return;}
      if(!url.pathname.startsWith('/api/'))throw error('Not found',404);
      const cookie=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('course_session='))?.slice(15);
      let s=cookie&&sessions.get(cookie);
      if(s&&s.expires<Date.now()){sessions.delete(cookie);s=null;}
      if(!s){const sid=token();s={sid,csrf:token(),expires:Date.now()+3600000};sessions.set(sid,s);res.setHeader('Set-Cookie',`course_session=${sid}; HttpOnly; SameSite=Lax; Path=/; Max-Age=3600`);}
      activeSession=s;
      // Same-origin Next storefront session: validate the existing customer token
      // on the server instead of asking the shopper to sign in for a second time.
      const shopToken=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('appmint_token='))?.slice(14);
      if(!s.profile&&shopToken&&url.pathname==='/api/state'){
        const bridge={bearer:decodeURIComponent(shopToken)};const profile=await api('client-data/profile',bridge);
        if(!profile?.sk)throw error('Storefront customer session is incomplete',401);
        s.bearer=bridge.bearer;s.profile=profile;
      }
      let body={};
      if(req.method==='POST'){
        if(req.headers.origin!==origin||req.headers['x-csrf-token']!==s.csrf)throw error('Request origin or session check failed',403);
        if(!String(req.headers['content-type']).startsWith('application/json'))throw error('JSON required',415);
        let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>32000)throw error('Request too large',413);}
        try{body=JSON.parse(raw||'{}');}catch{throw error('Invalid JSON');}
      }
      if(url.pathname==='/api/state'&&req.method==='GET'){reply(200,{csrf:s.csrf,profile:s.profile?{email:s.profile.data.email,firstName:s.profile.data.firstName}:null,challenge:!!s.challenge,attempt:s.profile?publicAttempt(await load(s.profile.sk)):null});return;}
      if(req.method==='POST'&&['/api/signin','/api/challenge'].includes(url.pathname)){
        let result;
        if(url.pathname==='/api/signin'){s.challenge=null;delete s.bearer;delete s.profile;result=await api('profile/customer/signin',null,{email:body.email,password:body.password});}
        else {if(!s.challenge)throw error('Start sign-in again');result=await api('profile/security/challenge/verify',null,{challengeToken:s.challenge,code:body.code,trustDevice:false});}
        if(result?.requiresPasswordChange){s.challenge=null;throw error('Complete the temporary-password setup in the Authentication course before this checkout exercise.',409);}
        if(result?.requiresTwoFactor&&result.challengeToken){s.challenge=result.challengeToken;reply(200,{challenge:true});return;}
        if(!result?.token)throw error('Sign-in is incomplete; follow the Authentication response procedure',409);
        const next={sid:token(),csrf:token(),bearer:result.token,expires:Date.now()+3600000};next.profile=await api('client-data/profile',next);
        if(!next.profile?.sk||!next.profile?.data?.email)throw error('Expected a customer profile',502);
        sessions.delete(s.sid);sessions.set(next.sid,next);res.setHeader('Set-Cookie',`course_session=${next.sid}; HttpOnly; SameSite=Lax; Path=/; Max-Age=3600`);reply(200,{signedIn:true});return;
      }
      if(req.method==='POST'&&url.pathname==='/api/signout'){sessions.delete(s.sid);res.setHeader('Set-Cookie',['course_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0','appmint_token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0']);reply(200,{signedOut:true});return;}
      if(!s.bearer||!s.profile)throw error('Sign in as the customer first',401);
      if(req.method==='GET'&&url.pathname==='/api/products'){reply(200,await api('storefront/products?p=1&ps=12',s));return;}
      if(req.method==='GET'&&url.pathname==='/api/cart'){reply(200,await api('storefront/cart/mine',s));return;}
      if(req.method==='GET'&&url.pathname==='/api/orders'){reply(200,await api('client-data/orders?page=1&limit=20',s));return;}
      if(req.method==='GET'&&url.pathname==='/api/order'){const id=url.searchParams.get('id');if(!id)throw error('Order number required');reply(200,await api('client-data/orders/'+encodeURIComponent(id),s));return;}
      if(req.method!=='POST')throw error('Not found',404);
      await serial(s.profile.sk,async()=>{
        let attempt=await load(s.profile.sk);
        if(url.pathname==='/api/quote'){
          if(attempt&&!['complete','quoted','unpaid'].includes(attempt.stage))throw error('An existing payment attempt must be resolved before changing the cart.',409);
          const requested=body.items||[{sku:body.sku,quantity:body.quantity}];
          if(!Array.isArray(requested)||requested.length<1||requested.length>20)throw error('Select 1–20 product lines');
          const lines=[];
          for(const item of requested){const quantity=Number(item.quantity);if(!Number.isInteger(quantity)||quantity<1||quantity>20)throw error('Quantity must be 1–20');
            const product=await api('storefront/product/'+encodeURIComponent(String(item.sku||'')),s);
            if(!product?.data?.sku||!['available','active'].includes(product.data.status))throw error('Select a saved available product');
            const options=Array.isArray(item.options)?item.options.map(o=>({name:String(o.name),value:String(o.value)})):[];
            for(const o of options){const a=product.data.attributes?.find(a=>a.name===o.name);if(!a?.options?.some(v=>String(v.value)===o.value))throw error('Select a saved product option');}
            lines.push({sku:product.data.sku,quantity,itemType:'product',name:product.data.name,image:product.data.image,...(options.length?{options}:{})});
          }
          const address={};for(const k of ['street1','city','state','zip','country'])address[k]=String(body.address?.[k]||'').trim();
          address.country=address.country.toUpperCase();
          for(const k of ['street1','city','zip','country'])if(!address[k])throw error('Complete address '+k);
          address.name=[s.profile.data.firstName,s.profile.data.lastName].filter(Boolean).join(' ');address.email=s.profile.data.email;
          if(s.profile.data.phone)address.phone=s.profile.data.phone;
          const old=await api('storefront/cart/mine',s);

          const result=await api('storefront/pricing/calculate-cart',s,{cartId:old?.sk,productItems:lines,rentalItems:[],shippingAddress:address,couponCode:body.couponCode||undefined});
          const quote=result?.cartId?result:result?.data;
          if(!quote?.cartId||!Number.isFinite(quote.total)||quote.total<=0||quote.valid===false||quote.shippingBlocked)throw error(quote?.shippingBlocked||quote?.message||'No usable positive quote');
          await api('storefront/cart/update/'+encodeURIComponent(quote.cartId),s,{datatype:'sf_cart',data:{...quote,email:s.profile.data.email,source:'website',shippingAddress:address,couponCode:body.couponCode||undefined}});
          const saved=await api('storefront/cart/mine',s);
          if(saved?.sk!==quote.cartId||JSON.stringify(saved.data.productItems?.map(v=>[v.sku,v.quantity,v.options||[]]))!==JSON.stringify(lines.map(v=>[v.sku,v.quantity,v.options||[]])))throw error('Saved cart readback differs; do not pay',409);
          if(Number(saved.data.total)!==Number(quote.total)||Object.entries(address).some(([k,v])=>saved.data.shippingAddress?.[k]!==v))throw error('Saved amount or delivery address differs; recalculate before paying',409);
          await save(s.profile.sk,{id:token(),stage:'quoted',cartId:saved.sk,total:Number(saved.data.total),currency:'usd',cart:saved.data,createdAt:new Date().toISOString()});
          reply(200,saved);return;
        }
        if(url.pathname==='/api/unpaid'){
          if(attempt?.stage==='unpaid'){reply(200,publicAttempt(attempt));return;}
          if(attempt?.stage!=='quoted')throw error('Calculate and inspect a saved quote first',409);
          const current=await api('storefront/cart/mine',s);
          if(current?.sk!==attempt.cartId||Number(current.data.total)!==attempt.total)throw error('Cart changed; recalculate',409);
          attempt.stage='creating-unpaid';await save(s.profile.sk,attempt);
          try{
            const d=attempt.cart;
            const order=await api('storefront/checkout-cart',s,{cartId:attempt.cartId,productItems:d.productItems,rentalItems:[],email:s.profile.data.email,name:[s.profile.data.firstName,s.profile.data.lastName].filter(Boolean).join(' '),shippingAddress:d.shippingAddress,billingAddress:d.shippingAddress,shippingMethod:d.shippingMethod,currency:'USD'});
            if(!order?.sk)throw error('No saved order identity',502);
            const saved=await api('client-data/orders/'+encodeURIComponent(order.data.number),s);
            if(saved?.sk!==order.sk||saved.data?.status!=='new')throw error('Verify order before retrying',409);
            attempt.order=saved;attempt.stage='unpaid';await save(s.profile.sk,attempt);reply(200,publicAttempt(attempt));
          }catch(e){attempt.stage='reconciliation-required';attempt.message='Inspect customer orders before retrying; no payment was requested.';await save(s.profile.sk,attempt);throw e;}
          return;
        }
        if(url.pathname==='/api/paypal'){
          if(attempt&&attempt.stage!=='quoted'){reply(200,publicAttempt(attempt));return;}
          if(!attempt)throw error('Calculate and save the basket first');
          const cart=await api('storefront/cart/mine',s);
          if(cart?.sk!==attempt.cartId||Number(cart.data.total)!==attempt.total||JSON.stringify(cart.data.productItems)!==JSON.stringify(attempt.cart.productItems)||JSON.stringify(cart.data.shippingAddress)!==JSON.stringify(attempt.cart.shippingAddress))throw error('Basket changed; calculate it again',409);
          const gateways=await api('storefront/payment-gateways',s);
          const gateway=Array.isArray(gateways)&&gateways.find(g=>g.data?.provider==='PayPalProvider');
          if(!gateway?.configured||!gateway.data.clientId||gateway.data.sandbox===false)throw error('Configure a PayPal sandbox gateway first',409);
          attempt={...attempt,stage:'paypal-ready',gateway:'paypal',paypalClientId:gateway.data.clientId,paypalConfig:gateway.sk};
          await save(s.profile.sk,attempt);reply(200,publicAttempt(attempt));return;
        }
        if(url.pathname==='/api/paypal/order'){
          if(!attempt||!['paypal-ready','paypal-payment'].includes(attempt.stage))throw error('Start the saved PayPal attempt first',409);
          if(!/^[A-Z0-9]{8,32}$/.test(String(body.orderId||'')))throw error('Invalid PayPal order ID');
          if(attempt.paypalOrderId&&attempt.paypalOrderId!==body.orderId)throw error('A provider order already belongs to this attempt',409);
          attempt.paypalOrderId=body.orderId;attempt.stage='paypal-payment';await save(s.profile.sk,attempt);reply(200,publicAttempt(attempt));return;
        }
        if(url.pathname==='/api/paypal/capturing'){
          if(attempt?.stage!=='paypal-payment')throw error('Inspect the existing PayPal capture before retrying',409);
          attempt.stage='paypal-capturing';await save(s.profile.sk,attempt);reply(200,publicAttempt(attempt));return;
        }
        if(url.pathname==='/api/reconcile'){
          if(!attempt)throw error('No saved payment attempt');
          const reference=attempt.gateway==='paypal'?attempt.paypalOrderId:attempt.intent?.id;
          if(!reference)throw error('No provider reference has been created');
          const result=await api('client-data/orders?page=1&limit=100',s);
          const orders=Array.isArray(result)?result:result?.data||[];
          const match=orders.find(o=>o.data?.payments?.some(t=>t.ref===reference)||o.data?.paymentRef===reference);
          if(!match){reply(200,{...publicAttempt(attempt),message:'No matching customer order was found. Keep this payment reference and ask the merchant to inspect provider status. Do not pay again.'});return;}
          const order=await api('client-data/orders/'+encodeURIComponent(match.data.number),s);
          const tenders=order.data?.payments||[];
          if(order.data?.status!=='paid'||Math.abs(Number(order.data.amount)-attempt.total)>.005||String(order.data.currency).toLowerCase()!==attempt.currency.toLowerCase()||!tenders.some(t=>t.ref===reference)||tenders.reduce((n,t)=>n+Number(t.amount||0),0)+.005<attempt.total)throw error('Order exists but paid amount/reference requires merchant review',409);
          attempt.order=order;attempt.stage='complete';await save(s.profile.sk,attempt);reply(200,publicAttempt(attempt));return;
        }
        if(url.pathname==='/api/intent'){
          if(attempt&&attempt.stage!=='quoted'){reply(200,publicAttempt(attempt));return;}
          if(!attempt)throw error('Calculate, save and read back the cart first');
          const cart=await api('storefront/cart/mine',s);
          if(!cart?.sk||!cart.data?.productItems?.length)throw error('Quote and save the cart first');
          if(cart.sk!==attempt.cartId||Number(cart.data.total)!==attempt.total||JSON.stringify(cart.data.productItems)!==JSON.stringify(attempt.cart.productItems)||JSON.stringify(cart.data.shippingAddress)!==JSON.stringify(attempt.cart.shippingAddress))throw error('The stored basket changed since your quote. Calculate and inspect it again.',409);
          // No amount/currency query: gateway discovery must not eagerly create an intent.
          const gateways=await api('storefront/payment-gateways',s);
          const gateway=Array.isArray(gateways)&&gateways.find(g=>g.data?.provider==='StripeProvider');
          if(!gateway?.configured||!String(gateway.data.publishableKey||'').startsWith('pk_test_'))throw error('Configure an active Stripe test gateway before starting this lab payment.',409);
          // Freeze the inspected basket before provider work; no browser amount/reference is accepted.
          attempt={...attempt,stage:'creating-intent',cart:cart.data};
          if(!Number.isFinite(attempt.total)||attempt.total<=0||cart.data.shippingBlocked)throw error('Cart total/delivery is unusable');
          await save(s.profile.sk,attempt);
          try {
            const intent=await api('storefront/stripe/intent',s,{cartId:cart.sk,amount:attempt.total,currency:'usd',email:s.profile.data.email,paymentMethodTypes:['card'],idempotencyKey:'course-'+attempt.id,metadata:{courseAttemptId:attempt.id}});
            if(!intent?.id||!intent.client_secret||!intent.publishableKey)throw error('Incomplete payment intent',502);
            if(intent.livemode!==false||!intent.publishableKey.startsWith('pk_test_'))throw error('This lab accepts Stripe test mode only',409);
            attempt.intent=intent;attempt.stage='payment';await save(s.profile.sk,attempt);reply(200,publicAttempt(attempt));
          }catch(e){attempt.stage='reconciliation-required';attempt.message='Intent creation was uncertain or refused. Check the provider and saved cart before any new attempt.';await save(s.profile.sk,attempt);throw e;}
          return;
        }
        if(url.pathname==='/api/finalize'){
          if(!attempt)throw error('No saved checkout attempt');
          if(attempt.stage==='complete'){reply(200,publicAttempt(attempt));return;}
          if(!['payment','paypal-payment','paypal-capturing'].includes(attempt.stage))throw error('Inspect the existing payment/order before retrying; this attempt is locked for reconciliation.',409);
          attempt.stage='finalizing';await save(s.profile.sk,attempt);
          try {
            const d=attempt.cart, reference=attempt.gateway==='paypal'?attempt.paypalOrderId:attempt.intent.id;
            const order=await api('storefront/checkout-cart',s,{cartId:attempt.cartId,productItems:d.productItems,rentalItems:d.rentalItems||[],email:s.profile.data.email,name:[s.profile.data.firstName,s.profile.data.lastName].filter(Boolean).join(' '),phone:s.profile.data.phone,shippingAddress:d.shippingAddress,billingAddress:d.shippingAddress,shippingMethod:d.shippingMethod,paymentGateway:attempt.gateway||'stripe',paymentRef:reference,currency:attempt.currency});
            if(!order?.sk)throw error('Checkout returned no order identity',502);
            const readback=await api('client-data/orders/'+encodeURIComponent(order.data.number),s);if(readback?.sk!==order.sk)throw error('Order readback failed; reconcile before retrying',409);if(Math.abs(Number(readback.data?.amount)-attempt.total)>.005||String(readback.data?.currency).toLowerCase()!==attempt.currency.toLowerCase()||readback.data?.email!==s.profile.data.email)throw error('Order amount, currency or customer differs from saved attempt',409);const tenders=readback.data?.payments||[];const paid=tenders.reduce((sum,t)=>sum+Number(t.amount||0),0);if(readback.data?.status!=='paid'||!tenders.some(t=>t.ref===reference)||paid+0.005<Number(readback.data.amount))throw error('Order payment not fully verified; reconcile before retrying',409);attempt.order=readback;attempt.stage='complete';await save(s.profile.sk,attempt);reply(200,publicAttempt(attempt));
          }catch(e){attempt.stage='reconciliation-required';attempt.message='Payment may have succeeded. Inspect this saved payment ID and the customer orders; do not pay again.';await save(s.profile.sk,attempt);throw e;}
          return;
        }
        throw error('Not found',404);
      });
    }catch(e){if([401,403].includes(e.status)&&activeSession){delete activeSession.bearer;delete activeSession.profile;activeSession.challenge=null;}reply(e.status||502,{message:e.status?e.message:'Connection or local processing failed. Check saved state before retrying.'});}
  });
  return {server,origin};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT||4310);
 const {server,origin}=createLab({endpoint:process.env.APPENGINE_ENDPOINT,org:process.env.ORG_ID,storeDir:process.env.PRIVATE_STORE_DIR,port,publicOrigin:process.env.PUBLIC_ORIGIN});
 server.listen(port,'127.0.0.1',()=>console.log('Checkout course lab: '+origin));
}
