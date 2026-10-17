/** Venue workflows on the official AppmintClient.request interface. No automatic retries. */
const enc = value => encodeURIComponent(String(value));
export class Venue {
  constructor(client, {eventId, zone, entrance, benefitPoint, credentialEntrance}) {
    this.client=client; this.eventId=eventId; this.zone=zone;
    this.entrance=entrance; this.benefitPoint=benefitPoint; this.credentialEntrance=credentialEntrance;
  }
  call(method,path,body,query) { return this.client.request(method,path,body,query); }
  static create(client,{title,startTime,endTime,timezone,zones,scanPoints}) {
    return client.request('POST','/crm/events/create',{data:{title,startTime,endTime,timezone,zones,scanPoints}});
  }
  event() {return this.call('GET',`/events/${enc(this.eventId)}`);}
  ticketTypes() {return this.call('GET',`/events/${enc(this.eventId)}/ticket-types`);}
  tickets() {return this.call('GET',`/events/${enc(this.eventId)}/tickets`);}
  occupancy() {return this.call('GET',`/events/${enc(this.eventId)}/occupancy`);}
  history() {return this.call('POST','/repository/find/event_checkin',{query:{'data.event':this.eventId},options:{pageSize:50,sort:'modifydate',sortType:-1}});}
  stats() {return this.call('GET',`/events/${enc(this.eventId)}/checkin-stats`);}
  issue({ticketTypeId,holderId,holderName}) {
    // This bounded rehearsal omits email entirely; first admission has separate notification behavior.
    return this.call('POST',`/events/${enc(this.eventId)}/tickets`,{ticketTypeId,holderId,holderName,skipNotification:true});
  }
  freshQr(ticketId) {return this.call('GET',`/events/tickets/${enc(ticketId)}/qr`);}
  scanInput(code,checkpoint=this.entrance) {return {eventId:this.eventId,code,zone:this.zone,checkpoint};}
  async admit(code) {
    // verify-scan is NOT admission preflight: it requires an already admitted holder.
    const decision=await this.call('POST','/events/checkin',this.scanInput(code));
    return this.readback(decision); // HTTP success alone does not mean decision.success === true.
  }
  async admitCredential(code) {
    if(!this.credentialEntrance)throw Error('Choose an entrance configured with matchField credential_code');
    return this.readback(await this.call('POST','/events/checkin',this.scanInput(code,this.credentialEntrance)));
  }
  async exit(code) {
    const decision=await this.call('POST','/events/checkout',this.scanInput(code));
    return this.readback(decision);
  }
  async readback(decision) {
    try{return {decision,occupancy:await this.occupancy()};}
    catch(error){return {decision,occupancy:null,refreshError:'Count refresh failed; retry the read, not the saved action.'};}
  }
  benefit(code,{redeem=false}={}) {
    if(!this.benefitPoint) throw Error('Select the configured benefit scan point first');
    return this.call('POST','/events/verify-scan',{...this.scanInput(code,this.benefitPoint),redeem});
  }
  perks(ticketId) {return this.call('GET',`/events/tickets/${enc(ticketId)}/perks`);}
  importCredential(code) {return this.call('POST',`/events/${enc(this.eventId)}/credentials/import`,{codes:[code],type:'wristband',codeFormat:'barcode'});}
  assignCredential(code,ticketId) {
    // Use the selected ticket ID. Do not interpret the assign-by-QR helper as signature validation.
    return this.call('POST','/events/credentials/assign',{credentialCode:code,ticketId});
  }
  revokeCredential(code) {return this.call('POST',`/events/credentials/${enc(code)}/revoke`,{reason:'Training credential retired'});}
  badge(ticketId) {return this.call('GET',`/events/tickets/${enc(ticketId)}/badge`);}
  async previewBadgeDispatch(ticketId) {
    const badge=await this.badge(ticketId);
    const dispatch=await this.call('POST','/device-integrations/call',{capability:'print',data:{ticketType:'label',lines:[{kind:'text',text:badge.badgeData.holderName||'Guest'},{kind:'text',text:badge.badgeData.eventTitle},{kind:'barcode',data:badge.badgeData.code,type:'CODE128'}]}},{adapter:'console'});
    return {badge,dispatch,physicalOutputVerified:false}; // never marks badge printed
  }
  confirmBadgePrinted(ticketId,{operatorConfirmedPhysicalOutput=false}={}) {
    if(!operatorConfirmedPhysicalOutput) throw Error('Confirm actual paper output before marking a badge printed');
    return this.call('POST',`/events/tickets/${enc(ticketId)}/badge/printed`,{});
  }
}
