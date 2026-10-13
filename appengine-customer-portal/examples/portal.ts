import {AppmintClient} from '@appmint/js-client';
// The runtime implementation is shared with JavaScript; TypeScript consumers get
// explicit record identifiers and session replacement at the integration boundary.
// @ts-ignore JavaScript companion intentionally shares this workflow implementation.
import {Portal} from './portal.mjs';
export interface CustomerSession {token:string;refreshToken?:string;refresh_token?:string;customer:unknown;orgId:string}
export function createPortal(client:AppmintClient,saveSession:(session:CustomerSession)=>Promise<void>){
  return new Portal(client,saveSession);
}
export interface ProfilePatch {firstName?:string;lastName?:string;phone?:string}
export interface MemberPatch {role?:'manager'|'buyer';status?:'active'|'suspended'}
// Server handler: obtain SDK client from your authenticated cookie session.
export async function changeAppointment(client:AppmintClient,bookingSk:string,chosenStartTime:string){
  const portal=createPortal(client,async()=>{});
  await portal.availability(bookingSk,chosenStartTime.slice(0,10),1);
  return portal.move(bookingSk,chosenStartTime);
}
