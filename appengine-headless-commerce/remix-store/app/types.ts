/** A stored record — platform fields at the top, your payload under `data`. */
export interface BaseModel<T> {
  sk: string;
  pk: string;
  datatype: string;
  data: T;
}

export interface Paged<T> {
  data: BaseModel<T>[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

export interface Product {
  sku: string;
  name: string;
  title?: string;
  price?: number;
  images?: Array<{ url?: string } | string>;
  /**
   * What THIS customer pays, after price lists and rules. Show `finalPrice` —
   * `price` is the list price and may not be what they are charged.
   */
  calculatedPrice?: {
    originalPrice?: number;
    finalPrice?: number;
    discount?: number;
    discountPercent?: number;
  };
}

/**
 * The cart, priced by the server.
 *
 * `total` ALREADY includes tax and shipping. Adding the parts back together
 * gives a different number, and that number is not what the customer is
 * charged — so render these, never recompute them.
 */
export interface CartSummary {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  productShipping?: number;
  shippingMethod?: string;
  freeShipping?: boolean;
  /** False when a coupon was sent and rejected. `message` says why. */
  valid?: boolean;
  reason?: string;
  message?: string;
  cartId?: string;
}

export interface CartLine {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export const money = (n: number | undefined, currency = 'USD') =>
  typeof n === 'number'
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)
    : '—';

export const imageOf = (p: Product): string | undefined => {
  const first = p.images?.[0];
  return typeof first === 'string' ? first : first?.url;
};

/* ------------------------------------------------------------------ *
 * Reservations
 * ------------------------------------------------------------------ */

/**
 * A bookable thing — a consultation, a table, a screening. The organization
 * defines these in AppMint; the storefront only reads them.
 *
 * `services` is optional: a definition with no services list is itself the
 * single service, and the server falls back to the definition's own name.
 */
export interface ReservationDefinition {
  name: string;
  title?: string;
  description?: string;
  type?: string;
  status?: string;
  venue?: string;
  image?: { url?: string } | string;
  paymentRequired?: boolean;
  /** Days the business accepts bookings, e.g. ['Monday','Tuesday']. */
  workDays?: string[];
  officeHours?: { startTime?: string; endTime?: string; timezone?: string };
  services?: Array<{ name: string; duration?: number; price?: number }>;
  meetingLink?: string;
}

/**
 * One offered appointment window.
 *
 * `startTime`/`endTime` are UTC instants and `businessTimezone` is the zone
 * they mean something in. Render them in that zone — a visitor in Lagos
 * booking a Chicago clinic must see the clinic's 9am, not their own.
 */
export interface Slot {
  startTime: string;
  endTime: string;
  spotsAvailable: number;
  businessTimezone: string;
}

/** What `crm/reservations/slots` answers with. */
export interface SlotsResponse {
  service?: { name: string; duration?: number; price?: number };
  location?: unknown;
  slots: Slot[];
}

export interface Reservation {
  name?: string;
  service?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  timezone?: string;
  note?: string;
  meetingLink?: string;
  locationType?: string;
  customer?: { email?: string; name?: string; phone?: string };
}

/**
 * Format a server instant in the BUSINESS's timezone.
 *
 * Every reservation time crossing the wire is UTC; the zone it belongs to
 * arrives alongside it. Passing that zone to Intl is the whole job — there is
 * no arithmetic to do, and doing any would be a way to get it wrong.
 */
export const atBusiness = (
  iso: string | undefined,
  timeZone: string | undefined,
  opts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' },
) =>
  iso
    ? new Intl.DateTimeFormat('en-US', { ...opts, timeZone: timeZone || 'UTC' }).format(new Date(iso))
    : '—';

/** Today in the business's timezone, as the YYYY-MM-DD the slots API wants. */
export const todayAt = (timeZone = 'UTC') =>
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
