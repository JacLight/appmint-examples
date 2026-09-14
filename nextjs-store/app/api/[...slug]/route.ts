import { NextRequest, NextResponse } from 'next/server';
import { viaServer, AppmintError } from '@/lib/appmint';

/**
 * The proxy the browser talks to.
 *
 * Everything the browser needs goes through here, so the application
 * credentials stay on this server and the appengine host is never named in a
 * bundle. `GET /api/storefront/products` becomes `GET storefront/products`
 * against appengine, with the app token attached on this side.
 *
 * It is deliberately thin — it moves credentials off the browser, it does not
 * decide what a visitor may do. Guard anything sensitive in its own route
 * rather than letting it fall through here.
 */

const ALLOWED = [
  'storefront/',
  'profile/customer/',
  'profile/magic-link',
  'affiliate/public/',
  'client/',
  'shipping/',
  'notice/',
];

function handler(method: string) {
  return async (request: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) => {
    const { slug } = await ctx.params;
    const path = slug.join('/');

    // A public catch-all must not expose the whole API. Anything outside the
    // storefront surface a visitor legitimately needs is refused here.
    if (!ALLOWED.some((prefix) => path.startsWith(prefix))) {
      return NextResponse.json({ error: `Not proxied: ${path}` }, { status: 404 });
    }

    const search = new URL(request.url).search;
    let body: unknown;
    if (method !== 'GET' && method !== 'DELETE') {
      body = await request.json().catch(() => undefined);
    }

    // The visitor's own token, if they are signed in. Kept in an httpOnly
    // cookie so browser script cannot read it.
    const customerToken = request.cookies.get('appmint_token')?.value;

    try {
      const result = await viaServer(method, `${path}${search}`, body, customerToken);
      return NextResponse.json(result);
    } catch (err) {
      // Forward what appengine said. Collapsing everything into a 500 turns a
      // missing record into an outage and hides validation messages.
      if (err instanceof AppmintError) {
        return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
      }
      return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
  };
}

export const GET = handler('GET');
export const POST = handler('POST');
export const PUT = handler('PUT');
export const PATCH = handler('PATCH');
export const DELETE = handler('DELETE');
