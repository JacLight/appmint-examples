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
