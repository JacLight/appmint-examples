export const defaultSdkModule = new URL('../../../appmint-client/appmint_js_client/dist/index.js', import.meta.url).href;

/** Host adapter for ordinary customer bearer access; official SDK remains unchanged. */
export async function customerClient({baseUrl,orgId,token,sdkModule=process.env.APPMINT_SDK_MODULE || defaultSdkModule,fetchImpl=fetch}) {
  if (!sdkModule) throw new Error('Set APPMINT_SDK_MODULE to the built official appmint_js_client/dist/index.js file URL');
  const {AppmintClient}=await import(sdkModule);
  const client=new AppmintClient({baseUrl,orgId,fetch:async (url,init={})=>{
    if(new URL(url).origin!==new URL(baseUrl).origin) throw new Error('Unexpected upstream origin');
    const headers=new Headers(init.headers);
    const customer=headers.get('x-client-authorization');
    headers.delete('x-client-authorization');
    if(customer) headers.set('Authorization',`Bearer ${customer}`);
    return fetchImpl(url,{...init,headers,redirect:'error'});
  }});
  client.setCustomerToken(token);
  return client;
}
