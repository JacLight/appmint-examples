// Optional bridge to the existing @appmint/js-client package, server side only.
// APPMINT_SDK_ENTRY may name its built dist/index.js file in your checkout.
import {pathToFileURL} from 'node:url';
const entry=process.env.APPMINT_SDK_ENTRY;
const {createClient}=await import(entry?pathToFileURL(entry).href:'@appmint/js-client');
const token=process.env.APPENGINE_TOKEN;
if(!token||!process.env.CLAIM_ID)throw Error('Set APPENGINE_TOKEN and CLAIM_ID');
const client=createClient({baseUrl:process.env.APPENGINE_URL,orgId:process.env.APPENGINE_ORG,
  // These are staff workflow endpoints. Do not misuse setCustomerToken or an app token.
  fetch:async(url,options={})=>{
    const headers=new Headers(options.headers);
    headers.set('Authorization','Bearer '+token);
    return fetch(url,{...options,headers});
  }
});
const id=encodeURIComponent(process.env.CLAIM_ID);
const source=await client.get('repository/get/form_submission/'+id);
const position=await client.get('workflow/position/form_submission/'+id);
console.log(JSON.stringify({claimId:process.env.CLAIM_ID,status:source.data.status,isFinal:position.isFinal,history:position.history},null,2));
