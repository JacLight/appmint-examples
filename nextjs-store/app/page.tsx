import Link from 'next/link';
import { viaServer } from '@/lib/appmint';
import { imageOf, money, type Paged, type Product } from '@/lib/types';

// Catalog is public, but it is still fetched on the server: one round trip,
// rendered HTML, and no API surface named in the browser.
export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  let page: Paged<Product> | null = null;
  let error: string | null = null;

  try {
    page = await viaServer<Paged<Product>>('GET', 'storefront/products?ps=24');
  } catch (e) {
    error = (e as Error).message;
  }

  if (error) {
    return (
      <>
        <h1>Catalog</h1>
        <p className="note">
          Could not reach appengine: {error}. Check <code>.env.local</code> — see{' '}
          <code>.env.example</code> for what is required.
        </p>
      </>
    );
  }

  const products = page?.data ?? [];

  return (
    <>
      <h1>Catalog</h1>
      <p className="lede">
        {page?.total ?? 0} products, fetched server-side from <code>storefront/products</code>.
      </p>

      <div className="grid">
        {products.map((row) => {
          const p = row.data;
          const img = imageOf(p);
          const finalPrice = p.calculatedPrice?.finalPrice ?? p.price;
          const original = p.calculatedPrice?.originalPrice;
          const discounted = typeof original === 'number' && typeof finalPrice === 'number' && original > finalPrice;

          return (
            <Link key={row.sk} href={`/product/${encodeURIComponent(p.sku)}`} className="card">
              {img ? <img src={img} alt={p.name} /> : <div className="card-img" />}
              <span className="name">{p.title || p.name}</span>
              <span className="sku">{p.sku}</span>
              <span className="price">
                {discounted && <span className="was">{money(original)}</span>}
                {money(finalPrice)}
              </span>
            </Link>
          );
        })}
      </div>

      {products.length === 0 && <p className="muted">No products in this organization yet.</p>}
    </>
  );
}
