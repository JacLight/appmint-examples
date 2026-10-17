import { json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { appmint } from '~/appmint.server';
import { imageOf, money, type Paged, type Product } from '~/types';

/**
 * The loader runs on the server, so it can talk to AppEngine directly. The
 * browser never sees a credential or the AppEngine host — it just receives
 * the data this returns.
 */
export async function loader() {
  try {
    const page = await appmint<Paged<Product>>('GET', 'storefront/products?ps=24');
    return json({ page, error: null as string | null });
  } catch (e) {
    return json({ page: null, error: (e as Error).message });
  }
}

export default function Catalog() {
  const { page, error } = useLoaderData<typeof loader>();

  if (error) {
    return (
      <>
        <h1>Catalog</h1>
        <p className="note">Could not reach appengine: {error}. Check <code>.env.local</code>.</p>
      </>
    );
  }

  const products = page?.data ?? [];

  return (
    <>
      <h1>Catalog</h1>
      <p className="lede">{page?.total ?? 0} products, loaded server-side from <code>storefront/products</code>.</p>
      <div className="grid">
        {products.map((row) => {
          const p = row.data;
          const img = imageOf(p);
          // `price` is the list price. `finalPrice` is what THIS customer pays.
          const finalPrice = p.calculatedPrice?.finalPrice ?? p.price;
          const original = p.calculatedPrice?.originalPrice;
          const discounted = typeof original === 'number' && original > (finalPrice ?? 0);

          return (
            <Link key={row.sk} to={`/product/${encodeURIComponent(p.sku)}`} className="card">
              {img ? <img src={img} alt={p.name} /> : null}
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
