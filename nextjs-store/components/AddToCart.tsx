'use client';

import { useRouter } from 'next/navigation';
import { addLine } from '@/lib/cart-storage';

/**
 * The cart lives in the browser only as a list of what was chosen — sku, name
 * and quantity. No money is kept here: the price shown at checkout comes from
 * the server every time, so a stale unit price cannot become a stale total.
 */
export function AddToCart({ sku, name, unitPrice }: { sku: string; name: string; unitPrice: number }) {
  const router = useRouter();
  return (
    <button
      className="primary"
      onClick={() => {
        addLine({ sku, name, quantity: 1, unitPrice });
        router.push('/cart');
      }}
    >
      Add to cart
    </button>
  );
}
