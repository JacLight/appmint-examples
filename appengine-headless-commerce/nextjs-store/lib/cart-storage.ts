'use client';

import type { CartLine } from './types';

/**
 * What the visitor chose — nothing more.
 *
 * `unitPrice` is carried only so the cart can show a line while the server
 * price is still loading. It is never summed, never sent as authoritative, and
 * never used for a total. Money comes from `storefront/pricing/calculate-cart`.
 */
const KEY = 'appmint.demo.cart';

export function readCart(): CartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

export const lineKey = (l: Pick<CartLine,'sku'|'options'>) => l.sku + JSON.stringify([...(l.options||[])].sort((a,b)=>a.name.localeCompare(b.name)));

function write(lines: CartLine[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lines));
    window.dispatchEvent(new Event('appmint:cart'));
  } catch {
    /* private browsing — the cart simply does not persist */
  }
}

export function addLine(line: CartLine) {
  const lines = readCart();
  const found = lines.find((l) => lineKey(l) === lineKey(line));
  if (found) found.quantity += line.quantity;
  else lines.push(line);
  write(lines);
}

export function setQuantity(key: string, quantity: number) {
  const lines = readCart().filter((l) => (lineKey(l) === key ? quantity > 0 : true));
  const found = lines.find((l) => lineKey(l) === key);
  if (found) found.quantity = quantity;
  write(lines);
}

export function clearCart() {
  write([]);
}
