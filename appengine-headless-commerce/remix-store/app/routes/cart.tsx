import { useCallback, useEffect, useState } from 'react';
import { clearCart, readCart, setQuantity } from '~/cart-storage';
import { money, type CartLine, type CartSummary } from '~/types';

const ADDRESS = { street1: '1 Main St', city: 'Dallas', state: 'TX', zip: '75001', country: 'US' };

export default function Cart() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [coupon, setCoupon] = useState('');
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [pricing, setPricing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setLines(readCart());
    sync();
    window.addEventListener('appmint:cart', sync);
    return () => window.removeEventListener('appmint:cart', sync);
  }, []);

  const price = useCallback(async (code: string) => {
    const current = readCart();
    if (current.length === 0) { setSummary(null); return; }

    setPricing(true);
    setError(null);
    try {
      // Posts to our own resource route, which talks to AppEngine. No
      // credential ever reaches this component.
      const res = await fetch('/api/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productItems: current.map((l) => ({
            sku: l.sku, name: l.name, price: l.unitPrice,
            unitPrice: l.unitPrice, quantity: l.quantity, itemType: 'product',
          })),
          shippingAddress: ADDRESS,
          couponCode: code || undefined,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error ?? 'Pricing failed');
      setSummary(payload as CartSummary);
    } catch (e) {
      // No usable price means no price shown. A locally summed stand-in would
      // look right and disagree with the invoice.
      setSummary(null);
      setError((e as Error).message);
    } finally {
      setPricing(false);
    }
  }, []);

  useEffect(() => { void price(coupon); }, [lines, price]); // eslint-disable-line react-hooks/exhaustive-deps

  if (lines.length === 0) {
    return (<><h1>Cart</h1><p className="muted">Your cart is empty.</p></>);
  }

  return (
    <>
      <h1>Cart</h1>
      <p className="lede">Every figure below comes from the server. Nothing here is added up in the browser.</p>

      <div className="row" style={{ alignItems: 'flex-start', gap: 28 }}>
        <div style={{ flex: '1 1 380px' }}>
          {lines.map((l) => (
            <div key={l.sku} className="card" style={{ marginBottom: 10 }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <div className="name">{l.name}</div>
                  <div className="sku">{l.sku}</div>
                </div>
                <div className="row">
                  <button onClick={() => setQuantity(l.sku, l.quantity - 1)} aria-label="Decrease">−</button>
                  <span style={{ minWidth: 22, textAlign: 'center' }}>{l.quantity}</span>
                  <button onClick={() => setQuantity(l.sku, l.quantity + 1)} aria-label="Increase">+</button>
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => clearCart()}>Empty cart</button>
        </div>

        <div style={{ flex: '1 1 300px' }}>
          <div className="card">
            <div className="row">
              <input type="text" placeholder="Promo code" value={coupon}
                     onChange={(e) => setCoupon(e.target.value)} style={{ flex: 1 }} />
              <button onClick={() => void price(coupon)} disabled={pricing}>Apply</button>
            </div>

            {summary?.valid === false && (
              <p className="note" style={{ marginTop: 10 }}>
                {summary.message ?? 'That code could not be used.'} The total is unchanged.
              </p>
            )}
            {error && <p className="note" style={{ marginTop: 10 }}>Pricing unavailable: {error}</p>}

            {summary ? (
              <table className="totals" style={{ marginTop: 12 }}>
                <tbody>
                  <tr><td>Subtotal</td><td>{money(summary.subtotal)}</td></tr>
                  {summary.discount > 0 && <tr><td>Discount</td><td>−{money(summary.discount)}</td></tr>}
                  <tr>
                    <td>Shipping {summary.shippingMethod && <span className="muted">· {summary.shippingMethod}</span>}</td>
                    <td>{summary.freeShipping ? 'Free' : money(summary.productShipping ?? 0)}</td>
                  </tr>
                  <tr><td>Tax</td><td>{money(summary.tax)}</td></tr>
                  <tr className="grand"><td>Total</td><td>{money(summary.total)}</td></tr>
                </tbody>
              </table>
            ) : (
              <p className="muted" style={{ marginTop: 12 }}>{pricing ? 'Pricing…' : 'No price yet.'}</p>
            )}

            <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
              Total includes tax and shipping — the server&apos;s figure, rendered as sent.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
