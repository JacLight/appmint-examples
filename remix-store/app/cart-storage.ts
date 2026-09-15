import type { CartLine } from './types';

/**
 * What the visitor chose — nothing more.
 *
 * `unitPrice` is carried only so a line can render while the server price is
 * loading. It is never summed and never treated as authoritative. Money comes
 * from the pricing action.
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
  const found = lines.find((l) => l.sku === line.sku);
  if (found) found.quantity += line.quantity;
  else lines.push(line);
  write(lines);
}

export function setQuantity(sku: string, quantity: number) {
  const lines = readCart().filter((l) => (l.sku === sku ? quantity > 0 : true));
  const found = lines.find((l) => l.sku === sku);
  if (found) found.quantity = quantity;
  write(lines);
}

export function clearCart() { write([]); }
