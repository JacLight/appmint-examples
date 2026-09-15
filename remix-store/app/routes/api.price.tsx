import { json, type ActionFunctionArgs } from '@remix-run/node';
import { appmint, AppmintError } from '~/appmint.server';
import type { CartSummary } from '~/types';

/**
 * Pricing, as a resource route.
 *
 * Remix has no need for a catch-all proxy: an action already runs on the
 * server, so the browser posts here and this talks to AppEngine. That is
 * narrower than a generic proxy by construction — this route can price a cart
 * and do nothing else, so there is no allow-list to maintain and no way to
 * reach an endpoint nobody intended to expose.
 */
export async function action({ request }: ActionFunctionArgs) {
  const body = await request.json().catch(() => ({}));

  // The visitor's own token, if signed in.
  const cookie = request.headers.get('Cookie') ?? '';
  const customerToken = /appmint_token=([^;]+)/.exec(cookie)?.[1];

  try {
    // Items, destination and coupon travel together: the server nets the
    // discount, resolves shipping and computes tax in one pass.
    const summary = await appmint<CartSummary>(
      'POST',
      'storefront/pricing/calculate-cart',
      {
        productItems: body.productItems ?? [],
        shippingAddress: body.shippingAddress,
        couponCode: body.couponCode || undefined,
      },
      customerToken,
    );
    return json(summary);
  } catch (err) {
    // Forward what AppEngine said rather than collapsing it into a 500.
    if (err instanceof AppmintError) {
      return json({ error: err.message, code: err.code }, { status: err.status });
    }
    return json({ error: (err as Error).message }, { status: 500 });
  }
}
