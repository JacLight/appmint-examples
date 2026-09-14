import Link from 'next/link';
import { viaServer } from '@/lib/appmint';
import { imageOf, money, type BaseModel, type Product } from '@/lib/types';
import { AddToCart } from '@/components/AddToCart';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ sku: string }> }) {
  const { sku } = await params;

  let product: Product | null = null;
  let error: string | null = null;
  try {
    const row = await viaServer<BaseModel<Product> | Product>('GET', `storefront/product/${encodeURIComponent(sku)}`);
    product = (row as BaseModel<Product>).data ?? (row as Product);
  } catch (e) {
    error = (e as Error).message;
  }

  if (!product) {
    return (
      <>
        <h1>Not found</h1>
        <p className="note">{error ?? `No product with sku ${sku}.`}</p>
        <p><Link href="/">← Back to catalog</Link></p>
      </>
    );
  }

  const img = imageOf(product);
  // `finalPrice` is what this customer pays. `price` is the list price and is
  // shown struck through only when the two differ.
  const finalPrice = product.calculatedPrice?.finalPrice ?? product.price ?? 0;
  const original = product.calculatedPrice?.originalPrice;
  const discounted = typeof original === 'number' && original > finalPrice;

  return (
    <>
      <p className="muted"><Link href="/">← Catalog</Link></p>
      <div className="row" style={{ alignItems: 'flex-start', gap: 28 }}>
        <div style={{ flex: '1 1 320px', maxWidth: 420 }}>
          {img ? <img src={img} alt={product.name} style={{ width: '100%', borderRadius: 10 }} /> : null}
        </div>
        <div style={{ flex: '1 1 320px' }}>
          <h1>{product.title || product.name}</h1>
          <p className="muted">{product.sku}</p>
          <p className="price" style={{ fontSize: 22 }}>
            {discounted && <span className="was">{money(original)}</span>}
            {money(finalPrice)}
          </p>
          <AddToCart sku={product.sku} name={product.title || product.name} unitPrice={finalPrice} />
        </div>
      </div>
    </>
  );
}
