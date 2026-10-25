import type { BookingApi, Booking, Customer, Service, Slot, Schema, AuthResult } from './api';

type Session = { token: string; refreshToken: string; customer: Customer };
type Config = { orgId: string; definitionId: string };
type SelectedSlot = Slot & { serviceId: string };
export class BookingError extends Error {
  constructor(message: string, public status?: number, public code?: string) { super(message); this.name = 'BookingError'; }
}
// Exported factory allows the real HTTP adapter to be exercised without replacing its transport.
export function createBookingApi({ base = '', storage = globalThis.sessionStorage }: { base?: string; storage?: Storage } = {}): BookingApi {
  let configPromise: Promise<Config> | undefined;
  let current: Session | null = null;
  let restored = false;
  let pendingPasswordToken = '';
  let refreshPromise: Promise<void> | undefined;
  let serviceCache: Service[] = [];
  const slots = new Map<string, SelectedSlot>();
  const config = () => configPromise ||= raw('/api/config') as Promise<Config>;
  const key = async () => { const c = await config(); return `atelier:customer:${c.orgId}:${c.definitionId}`; };
  async function raw(path: string, method = 'GET', body?: unknown, token?: string, write = false): Promise<any> {
    let response: Response;
    try {
      response = await fetch(base + path, { method, headers: { ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(16000) });
    } catch {
      throw new BookingError(write ? 'The booking result could not be confirmed. Check My appointments before trying again.' : 'Appointments are temporarily unavailable. Please try again shortly.', undefined, write ? 'WRITE_OUTCOME_UNKNOWN' : 'NETWORK_ERROR');
    }
    let value: any;
    try { value = await response.json(); } catch { throw new BookingError(write ? 'The booking result could not be confirmed. Check My appointments before trying again.' : 'The service returned an unreadable response.', response.status, write ? 'WRITE_OUTCOME_UNKNOWN' : 'INVALID_RESPONSE'); }
    if (!response.ok) throw new BookingError(value.message || 'Appointments are temporarily unavailable.', response.status, value.code);
    return value;
  }
  async function persist() { const k = await key(); if (current) storage?.setItem(k, JSON.stringify(current)); else storage?.removeItem(k); }
  function customerOf(value: any): Customer {
    const row = value.customer || value.user;
    if (!row || row.datatype !== 'customer' || !row.data?.email) throw new BookingError('A customer account is required to book appointments.', 403);
    return { id: String(row.sk || row.id || row._id), email: row.data.email, name: row.data.name || [row.data.firstName, row.data.lastName].filter(Boolean).join(' ') };
  }
  async function accept(value: any, previousRefresh?: string): Promise<AuthResult> {
    if (value.requiresPasswordChange) {
      pendingPasswordToken = value.token || value.access_token || '';
      return { kind: 'passwordChangeRequired', message: value.message };
    }
    if (value.requiresTwoFactor || value.challengeToken) return { kind: 'challenge', challengeToken: value.challengeToken, twoFactorMethod: value.twoFactorMethod, message: value.message, isNewDevice: value.isNewDevice };
    const token = value.token || value.access_token;
    if (!token) throw new BookingError('Sign-in did not return a customer session.', 401);
    current = { token, refreshToken: value.refresh_token || value.refreshToken || previousRefresh || '', customer: customerOf(value) };
    pendingPasswordToken = ''; restored = true; await persist(); return current.customer;
  }
  async function restore() {
    if (restored) return;
    restored = true;
    try { const saved = JSON.parse(storage?.getItem(await key()) || 'null'); if (saved?.token && saved?.customer?.email) current = saved; } catch { current = null; }
  }
  async function clear() { current = null; pendingPasswordToken = ''; slots.clear(); await persist(); }
  async function refresh() {
    if (!current?.refreshToken) { await clear(); throw new BookingError('Your session has expired. Please sign in again.', 401); }
    if (!refreshPromise) refreshPromise = (async () => {
      try { await accept(await raw('/api/auth/refresh', 'POST', { refresh_token: current!.refreshToken }), current!.refreshToken); }
      catch (error) { if (error instanceof BookingError && [400, 401, 403].includes(error.status || 0)) await clear(); throw error; }
    })().finally(() => { refreshPromise = undefined; });
    return refreshPromise;
  }
  async function request(path: string, method = 'GET', body?: unknown, write = false) {
    await restore();
    if (!current) throw new BookingError('Please sign in to continue.', 401);
    // Renew a known-expiring JWT before any mutation. JWT payload is only a scheduling hint; AppEngine validates it.
    try { const payload = JSON.parse(atob(current.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); if (payload.exp && payload.exp * 1000 < Date.now() + 30000) await refresh(); }
    catch (error) { if (error instanceof BookingError) throw error; }
    try { return await raw(path, method, body, current!.token, write); }
    catch (error) {
      if (error instanceof BookingError && error.status === 401) {
        await refresh();
        // A rejected mutation is never replayed by the adapter; the customer explicitly submits again.
        if (write) throw new BookingError('Your session was renewed. Please review and submit your appointment again.', 401, 'SESSION_RENEWED');
        try { return await raw(path, method, body, current!.token); }
        catch (retryError) { if (retryError instanceof BookingError && retryError.status === 401) await clear(); throw retryError; }
      }
      throw error;
    }
  }
  const serviceId = (definitionId: string, name: string) => `${definitionId}:${name}`;
  async function services(): Promise<Service[]> {
    const result = await raw('/api/definitions');
    serviceCache = result.data.flatMap((row: any) => (row.data?.services || []).map((service: any) => ({ id: serviceId(String(row.sk || row.id || row._id), service.name), definitionId: String(row.sk || row.id || row._id), name: service.name, description: service.description, durationMinutes: Number(service.duration), timeZone: row.data?.officeHours?.timezone || 'UTC' })));
    return serviceCache;
  }
  async function service(id: string): Promise<Service> {
    if (!serviceCache.length) await services();
    const found = serviceCache.find(item => item.id === id);
    if (!found) throw new BookingError('This service is no longer available. Please select a service again.');
    return found;
  }
  function selected(id: string, expectedService?: string): SelectedSlot {
    const found = slots.get(id);
    if (!found || !found.available || (expectedService && found.serviceId !== expectedService)) throw new BookingError('Please select an available appointment time again.');
    return found;
  }
  function normalize(row: any, written = false): Booking {
    const d = row.data;
    if (!d || !d.startTime) throw new BookingError('The saved appointment could not be read. Open My appointments to check it.', undefined, written ? 'WRITE_OUTCOME_UNKNOWN' : 'INVALID_RESPONSE');
    const status = d.status || 'new';
    return { id: String(row.sk || row.id || row._id), reference: d.name || row.name, serviceId: serviceId(String(d.reservationDefinitionId), d.service), serviceName: d.service, start: d.startTime, end: d.endTime, timeZone: d.timezone || 'UTC', status, answers: d.form, canReschedule: !['cancelled', 'canceled', 'completed', 'no-show', 'attended'].includes(status.toLowerCase()) && new Date(d.startTime).getTime() > Date.now() };
  }
  async function booking(id: string) { return normalize(await request(`/api/bookings/${encodeURIComponent(id)}`)); }
  return {
    async session() { await restore(); if (!current) return null; try { await refresh(); return current?.customer || null; } catch (e) { if (e instanceof BookingError && [400, 401, 403].includes(e.status || 0)) return null; throw e; } },
    async signIn(input) { await clear(); return accept(await raw('/api/auth/signin', 'POST', input)); },
    async signUp(input) { await clear(); return accept(await raw('/api/auth/signup', 'POST', input)); },
    async verifyChallenge(input) { return accept(await raw('/api/auth/verify', 'POST', input)); },
    async changePassword(input) {
      if (!pendingPasswordToken) throw new BookingError('Please sign in again before changing your password.', 401);
      await raw('/api/auth/password', 'POST', input, pendingPasswordToken);
      await clear();
    },
    async signOut() { await clear(); }, services,
    async availability(input) {
      const chosen = await service(input.serviceId);
      const value = await request('/api/slots', 'POST', { serviceName: chosen.name, serviceDate: input.date });
      return (value.slots || []).map((row: any) => {
        const slot: SelectedSlot = { id: `${chosen.id}:${row.startTime}`, serviceId: chosen.id, start: row.startTime, end: row.endTime, timeZone: row.businessTimezone || chosen.timeZone, available: (row.spotsAvailable ?? 1) > 0 };
        slots.set(slot.id, slot); return slot;
      });
    },
    async intakeSchema(id): Promise<Schema> { await service(id); return request('/api/intake-schema'); },
    async createBooking(input) {
      const chosen = await service(input.serviceId), slot = selected(input.slotId, chosen.id);
      const created = await request('/api/bookings', 'POST', { service: chosen.name, startTime: slot.start, ...(slot.end ? { endTime: slot.end } : {}), form: input.answers }, true);
      // The successful create response is already persisted truth. Failure of a later refresh must not invite duplicate creation.
      return normalize(created, true);
    },
    async bookings() { return (await request('/api/bookings')).data.map((row: any) => normalize(row)); }, booking,
    async rescheduleBooking(id, input) {
      const existing = await booking(id), slot = selected(input.slotId, existing.serviceId);
      const moved = await request(`/api/bookings/${encodeURIComponent(id)}/reschedule`, 'POST', { startTime: slot.start }, true);
      return normalize(moved, true);
    },
  };
}
export const api = createBookingApi();
