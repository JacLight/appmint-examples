/** Crew policy is separate from event tickets. No actuator trigger is supplied. */
export class Crew {
 constructor(client,{zone,point,reader,staffId}) {Object.assign(this,{client,zone,point,reader,staffId});}
 createZone(){return this.client.request('POST','/repository/create',{datatype:'access_zone',isNew:true,data:{name:this.zone,title:'Controlled crew area',allow:{users:[this.staffId]}}});}
 createPoint(){return this.client.request('POST','/repository/create',{datatype:'access_point',isNew:true,data:{name:this.point,title:'Crew door',zone:this.zone}});}
 createReader(){return this.client.request('POST','/repository/create',{datatype:'access_device',isNew:true,data:{name:this.reader,title:'Decision-only reader',kind:'card-reader',status:'active',accessPoint:this.point,triggers:[]}});}
 // Returned apiKey is a secret. Store privately, never display/log or send to browser.
 mintReaderKey(){return this.client.request('POST',`/access-control/devices/${encodeURIComponent(this.reader)}/key`,{});}
 issueCredential(code){return this.client.request('POST','/access-control/credentials',{type:'card',code,holder:{datatype:'user',id:this.staffId},label:'Controlled crew card'});}
 setCredentialStatus(id,active){return this.client.request('POST',`/access-control/credentials/${encodeURIComponent(id)}/status`,{status:active?'active':'suspended',note:'Controlled crew exercise'});}
 history(id){return this.client.request('GET',`/access-control/credentials/${encodeURIComponent(id)}/history`);}
 async read({baseUrl,orgId,deviceKey,code}) {
  const r=await fetch(new URL('/access-control/read',baseUrl),{method:'POST',redirect:'error',headers:{orgid:orgId,'x-device-key':deviceKey,'Content-Type':'application/json'},body:JSON.stringify({device:this.reader,code,method:'card'})});
  const result=await r.json();if(!r.ok)throw Error(`Reader HTTP ${r.status}`);return result; // inspect result and unlocked separately
 }
}
