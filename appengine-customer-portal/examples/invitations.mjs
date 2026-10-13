import crypto from 'node:crypto';
/** Per-browser-session opaque handles. Never serialize this object to a client. */
export class InvitationHandles {
 constructor(){this.byToken=new Map();}
 list(profile){
  const invites=profile?.data?.sharedAccountInvites||[];
  const active=new Set(invites.map(i=>i.token).filter(Boolean));
  for(const token of this.byToken.keys())if(!active.has(token))this.byToken.delete(token);
  return invites.filter(i=>i.token).map(({token,...safe})=>{
   if(!this.byToken.has(token))this.byToken.set(token,crypto.randomBytes(18).toString('base64url'));
   return {...safe,inviteId:this.byToken.get(token)};
  });
 }
 resolve(profile,inviteId){
  this.list(profile); // Refresh membership against the freshly read signed-in profile.
  const entry=[...this.byToken].find(([,id])=>id===inviteId);
  if(!entry)throw Object.assign(Error('Invitation is not pending for this customer session'),{status:404});
  return entry[0];
 }
}
