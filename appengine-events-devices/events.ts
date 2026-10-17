// The same course-owned workflow layer works with the official TypeScript SDK.
import type {AppmintClient} from '@appmint/js-client';
export type VenueContext={eventId:string;zone:string;entrance:string;benefitPoint?:string;credentialEntrance?:string};
export type AdmissionDecision={success:boolean;reason?:string;ticket?:unknown;zoneOccupancy?:unknown};
export async function admit(client:Pick<AppmintClient,'request'>,ctx:VenueContext,code:string) {
  const decision=await client.request<AdmissionDecision>('POST','/events/checkin',{
    eventId:ctx.eventId,zone:ctx.zone,checkpoint:ctx.entrance,code,
  });
  try {const occupancy=await client.request('GET',`/events/${encodeURIComponent(ctx.eventId)}/occupancy`);return {decision,occupancy};}
  catch {return {decision,occupancy:null,refreshError:'Count refresh failed; retry the read, not the saved action.'};}
}
export function benefit(client:Pick<AppmintClient,'request'>,ctx:VenueContext,code:string,redeem=false) {
  if(!ctx.benefitPoint) throw Error('Choose a configured benefit point');
  return client.request('POST','/events/verify-scan',{eventId:ctx.eventId,zone:ctx.zone,checkpoint:ctx.benefitPoint,code,redeem});
}
export async function exit(client:Pick<AppmintClient,'request'>,ctx:VenueContext,code:string) {
  const decision=await client.request<AdmissionDecision>('POST','/events/checkout',{eventId:ctx.eventId,zone:ctx.zone,checkpoint:ctx.entrance,code});
  try{return {decision,occupancy:await client.request('GET',`/events/${encodeURIComponent(ctx.eventId)}/occupancy`)};}
  catch{return {decision,occupancy:null,refreshError:'Count refresh failed; retry the read, not the saved action.'};}
}
export function freshQr(client:Pick<AppmintClient,'request'>,ticketId:string){return client.request('GET',`/events/tickets/${encodeURIComponent(ticketId)}/qr`);}
export function perks(client:Pick<AppmintClient,'request'>,ticketId:string){return client.request('GET',`/events/tickets/${encodeURIComponent(ticketId)}/perks`);}
export function assignCredential(client:Pick<AppmintClient,'request'>,credentialCode:string,ticketId:string){return client.request('POST','/events/credentials/assign',{credentialCode,ticketId});}
export function revokeCredential(client:Pick<AppmintClient,'request'>,code:string){return client.request('POST',`/events/credentials/${encodeURIComponent(code)}/revoke`,{reason:'Training credential retired'});}
export async function previewBadgeDispatch(client:Pick<AppmintClient,'request'>,ticketId:string){
 const badge=await client.request<{badgeData:{holderName?:string;eventTitle:string;code:string};template:unknown}>('GET',`/events/tickets/${encodeURIComponent(ticketId)}/badge`);
 const dispatch=await client.request('POST','/device-integrations/call',{capability:'print',data:{ticketType:'label',lines:[{kind:'text',text:badge.badgeData.holderName||'Guest'},{kind:'text',text:badge.badgeData.eventTitle},{kind:'barcode',data:badge.badgeData.code,type:'CODE128'}]}},{adapter:'console'});
 return {badge,dispatch,physicalOutputVerified:false};
}

export async function admitCredential(client:Pick<AppmintClient,'request'>,ctx:VenueContext,code:string){
 if(!ctx.credentialEntrance)throw Error('Choose an entrance configured with matchField credential_code');
 return admit(client,{...ctx,entrance:ctx.credentialEntrance},code);
}
