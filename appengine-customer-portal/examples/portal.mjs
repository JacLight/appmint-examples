/** Portal-specific workflows over the official AppmintClient.request contract.
 * Run on a trusted server for cancellation/address ownership preflights.
 * Authentication/session cookies belong to the linked API Foundations and Custom API Gateway courses.
 */
export class Portal {
  constructor(client, saveSession = async () => {}) { this.client = client; this.saveSession = saveSession; }
  call(method, path, body, query) { return this.client.request(method, path, body, query); }
  profile() { return this.call('GET', '/client-data/profile'); }
  async updateProfile(patch) {
    if (!Object.keys(patch).length || Object.keys(patch).some(k => !['firstName','lastName','phone'].includes(k))) throw new Error('Use only firstName, lastName, phone');
    await this.call('PUT','/client-data/profile',patch);
    return this.profile();
  }
  reservations() { return this.call('GET','/client-data/reservations'); }
  reservation(sk) { return this.call('GET',`/client-data/reservations/${encodeURIComponent(sk)}`); }
  cart() { return this.call('GET','/storefront/cart/mine'); } // Read only; null means no saved cart in selected context.
  orders() { return this.call('GET','/client-data/orders'); }
  order(number) { return this.call('GET',`/client-data/orders/${encodeURIComponent(number)}`); }
  tickets(status) { return this.call('GET','/client-data/tickets',undefined,{status}); }
  ticket(number) { return this.call('GET',`/client-data/tickets/${encodeURIComponent(number)}`); }
  forms(page=1,limit=20) { return this.call('GET','/client-data/forms',undefined,{page,limit}); }
  async openTicket(title,description,collectionId) {
    const record=await this.call('POST','/client-data/tickets',{data:{title,description},...(collectionId?{collectionId}:{})});
    if (!record?.data?.name) throw new Error('Ticket number missing; inspect saved result before retrying');
    return this.ticket(record.data.name); // Returns a page, not a single record.
  }
  async availability(sk,from,days=7) {
    const row=await this.reservation(sk);
    const definition=row.data?.reservationDefinitionId || row.owner?.id;
    if (!definition || !row.data?.service) throw new Error('Booking lacks definition/service; inspect its saved configuration');
    return this.call('POST','/crm/reservations/availability',{reservationDefinitionId:definition,serviceName:row.data.service,from,days,excludeReservationId:row.sk});
  }
  async move(sk,startTime,reason='Customer requested change') {
    await this.reservation(sk);
    // ID route checks customer ownership itself. Never use override for customer moves.
    await this.call('POST',`/crm/reservations/reschedule/${encodeURIComponent(sk)}`,{startTime,reason,notify:false});
    return this.reservation(sk); // 409 leaves old booking; refresh availability, do not blindly retry.
  }
  async cancel(sk) {
    // This is a SERVER-side ownership gate, not a browser-only check.
    const row=await this.reservation(sk);
    const email=row.data?.customer?.email || row.data?.email || row.data?.customerEmail;
    const number=row.data?.name;
    if (!email || !number) throw new Error('Verified booking has no email/code; do not accept them from browser input');
    await this.call('DELETE',`/crm/reservations/cancel/${encodeURIComponent(email)}/${encodeURIComponent(number)}`);
    return this.reservation(sk);
  }
  members(accountId) { return this.call('GET',`/client-data/shared-accounts/${encodeURIComponent(accountId)}/members`); }
  companyOrders(accountId,page=1,limit=20) { return this.call('GET',`/client-data/shared-accounts/${encodeURIComponent(accountId)}/orders`,undefined,{page,limit}); }
  invite(accountId,email,role='buyer') {
    if (!['manager','buyer'].includes(role)) throw new Error('Role must be manager or buyer');
    // BOTH new and existing customer paths can generate notifications. Use a controlled lab.
    return this.call('POST',`/client-data/shared-accounts/${encodeURIComponent(accountId)}/invites`,{email,role});
  }
  member(accountId,associationId,patch) {
    if (!Object.keys(patch).length || Object.keys(patch).some(k=>!['role','status'].includes(k)) || (patch.role&&!['manager','buyer'].includes(patch.role)) || (patch.status&&!['active','suspended'].includes(patch.status))) throw new Error('Use valid role/status only');
    return this.call('PUT',`/client-data/shared-accounts/${encodeURIComponent(accountId)}/members/${encodeURIComponent(associationId)}`,patch);
  }
  async switchAccount(accountId) {
    const result=await this.call('POST','/profile/customer/shared-account',accountId?{accountId}:{});
    if (!result?.token) throw new Error('Account switch returned no token');
    // Persist token AND refresh token; next request must use the new account context.
    await this.saveSession(result);
    this.client.setCustomerToken(result.token);
    return result.customer;
  }
  validateInvite(token) { return this.call('GET',`/client-data/shared-accounts/invites/validate/${encodeURIComponent(token)}`); }
  acceptInvite(token) { return this.call('POST',`/client-data/shared-accounts/invites/accept/${encodeURIComponent(token)}`); }
  addresses() { return this.call('GET','/client-data/addresses'); }
  saveAddress(address) { return this.call('POST','/client-data/addresses',address); }
  async deleteAddress(id) {
    const page=await this.addresses();
    if (!page?.data?.some(row=>row.sk===id)) throw new Error('Address not in signed-in customer list');
    return this.call('DELETE',`/client-data/addresses/${encodeURIComponent(id)}`);
  }
  wishlists() { return this.call('GET','/client-data/wishlist'); }
  createWishlist(name) { return this.call('POST','/client-data/wishlist',{name}); }
  saveProduct(sku,wishlistId) { return this.call('POST',`/client-data/wishlist/${encodeURIComponent(sku)}`,{wishlistId}); }
  removeProduct(sku,wishlistId) { return this.call('DELETE',`/client-data/wishlist/${encodeURIComponent(sku)}`,undefined,{wishlistId}); }
}
