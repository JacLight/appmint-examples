/** Trusted Node host only. Official SDK request/transport is preserved. */
export async function staffClient({baseUrl,orgId,token,sdkModule=process.env.APPMINT_SDK_MODULE,fetchImpl=fetch}) {
  if(typeof window!=='undefined') throw Error('Keep the staff session on the trusted host');
  if(!sdkModule || !token) throw Error('Provide the official built SDK module URL and completed staff session');
  const {AppmintClient}=await import(sdkModule);
  return new AppmintClient({baseUrl,orgId,fetch:async(url,init={})=>{
    if(new URL(url).origin!==new URL(baseUrl).origin) throw Error('Unexpected upstream origin');
    const headers=new Headers(init.headers);headers.set('Authorization',`Bearer ${token}`);
    return fetchImpl(url,{...init,headers,redirect:'error'});
  }});
}
