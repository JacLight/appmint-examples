import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData, useNavigate } from '@remix-run/react';
import { appmint, AppmintError } from '~/appmint.server';
import { addLine } from '~/cart-storage';
import { imageOf, money, type BaseModel, type Product } from '~/types';

export async function loader({ params }: LoaderFunctionArgs) {
  const sku = params.sku!;
  try {
    const row = await appmint<BaseModel<Product> | Product>('GET', `storefront/product/${encodeURIComponent(sku)}`);
    // An unknown sku comes back as 200 with an empty body, not a 404 — so the
    // absence has to be detected here rather than trusted to the status code.
    const product = row ? ((row as BaseModel<Product>).data ?? (row as Product)) : null;
    if (!product) throw new Response('Not found', { status: 404 });
    return json({ product, error: null as string | null });
  } catch (e) {
    // A missing product must BE a 404 — throwing makes the response one, so a
    // crawler or a monitor sees what a human sees. Rendering "not found"
    // inside a 200 is a lie that search engines believe.
    if (e instanceof Response) throw e;
    if (e instanceof AppmintError && e.status === 404) throw new Response('Not found', { status: 404 });
    // Anything else is our problem, not a missing product. Say so.
    return json({ product: null, error: (e as Error).message });
  }
}

export default function ProductDetail() {
  const { product, error } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  if (!product) {
    return (
      <>
        <h1>Not found</h1>
        <p className="note">{error ?? 'No such product.'}</p>
        <p><Link to="/">← Back to catalog</Link></p>
      </>
    );
  }

  const img = imageOf(product);
  const finalPrice = product.calculatedPrice?.finalPrice ?? product.price ?? 0;
  const original = product.calculatedPrice?.originalPrice;
  const discounted = typeof original === 'number' && original > finalPrice;

  return (
    <>
      <p className="muted"><Link to="/">← Catalog</Link></p>
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
          <button
            className="primary"
            onClick={() => {
              addLine({ sku: product.sku, name: product.title || product.name, quantity: 1, unitPrice: finalPrice });
              navigate('/cart');
            }}
          >
            Add to cart
          </button>
        </div>
      </div>
    </>
  );
}
