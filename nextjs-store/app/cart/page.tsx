import { CartView } from '@/components/CartView';

export default function CartPage() {
  return (
    <>
      <h1>Cart</h1>
      <p className="lede">
        Every figure below comes from <code>storefront/pricing/calculate-cart</code>. Nothing on this
        page is added up in the browser.
      </p>
      <CartView />
    </>
  );
}
