# JavaScript and TypeScript Appmint client

`@appmint/js-client` is the framework-independent ESM package in `appmint-client/appmint_js_client`. The inspected manifest is version `0.1.0`; its public npm availability has not been verified. The Next.js and Remix examples implement their own transport and do **not** depend on this package.

Reviewed against the client working tree and AppEngine source on **13 October 2026**. [Source and package guide](https://github.com/JacLight/appmint-client/tree/main/appmint_js_client) · [Compatibility review](https://github.com/JacLight/appmint-client/blob/main/docs/compatibility.md).

## Install from a source checkout

Use Node with native `fetch` (Node 20+ is a suitable baseline for the examples) and npm. From a directory containing your `appmint-client` checkout:

```bash
cd appmint-client/appmint_js_client
npm install
npm run build
npm pack
```

Then, in your application's directory, install the generated archive using its actual relative path:

```bash
npm install ../appmint-client/appmint_js_client/appmint-js-client-0.1.0.tgz
```

The package exports ESM and TypeScript declarations from `dist`. It has a `build` script and `prepublishOnly`, but no test script. `npm pack` does not run `prepublishOnly`; build first. Use a registry install only after confirming that the intended version is available to your registry/account.

## Configure a server client

Keep these values in your deployment's server environment; use `.env.local` for the examples and keep it out of version control:

```dotenv
APPENGINE_ENDPOINT=https://appengine.appmint.io
ORG_ID=your-org-id
APP_ID=your-app-id
APP_KEY= # Optional legacy key; omit when registration did not issue one.
APP_SECRET=your-app-secret
```

This factory is complete and belongs in a server-only module. In Next.js, install `server-only` and add `import 'server-only'`; in Remix use a `.server.ts` filename.

```ts
// lib/appmint.server.ts
import { createClient } from '@appmint/js-client';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing server configuration: ${name}`);
  return value;
}

export function clientForRequest(customerToken: string | null = null) {
  const client = createClient({
    baseUrl: required('APPENGINE_ENDPOINT'),
    orgId: required('ORG_ID'),
    appId: required('APP_ID'),
    appKey: process.env.APP_KEY, // Optional legacy value; current registration returns appId/secret.
    appSecret: required('APP_SECRET'),
    timeoutMs: 15_000,
  });
  client.setCustomerToken(customerToken);
  return client;
}
```

**Each request gets its own customer-bearing client.** `setCustomerToken` changes mutable state. Setting it on a shared server singleton can send one visitor's token on another visitor's request. A singleton is suitable only for application-only calls that never mutate customer state. Creating separate instances also creates separate application-token caches; the present SDK has no shared token-provider option. The example transports instead cache only application identity and pass the customer token as a function argument.

## Configuration and transport

| Option | Current behavior |
|---|---|
| `baseUrl`, `orgId` | Required even in a browser; missing either throws during construction |
| `appId`, `appSecret` | Both are required for server application authentication |
| `appKey` | Optional legacy value; current AppEngine registration/authentication uses App ID and secret |
| `proxyPrefix` | Browser destination; defaults to `/api` |
| `timeoutMs` | Defaults to `30000`; abort signal applies to the resource request, not the application-token fetch |
| `domainAsOrg` | Adds server header `domainAsOrg: true`; does not implement a complete trusted-host resolver |
| `fetch` | Injectable fetch implementation; useful for tests |
| `logRequests` | Logs method, pathname, and response status; defaults to false |

On a server, the client exchanges credentials at `POST /profile/app/key`, caches the returned token **per client instance**, coalesces concurrent exchanges on that instance, and sends `Authorization: Bearer <app-token>`, `orgid`, and `shared-org-id`. A visitor token goes in `x-client-authorization` unchanged. The controller currently consumes `appId`, `secret`, and optional `domain`; the SDK forwards `key` when supplied but no longer requires it locally. This reflects the currently inspected working tree; rebuild an older checkout before using a newly registered App ID/secret without that legacy field.

In a browser, the destination is your `proxyPrefix`, requests use `credentials: 'same-origin'`, and a token set with `setCustomerToken` is sent in `authorization`. The browser does not perform the app-key exchange. This routing behavior does **not** protect secrets you place in a browser bundle. Create browser configuration separately, with no credentials; do not import the server factory into client components. An HTTP-only-cookie design normally uses `fetch` to your own routes instead of a browser-held customer token.

Leading `/` and then `api/` are stripped from SDK paths. Query arrays become repeated keys; `undefined` and `null` query values are omitted. Request bodies are JSON; this transport is not a multipart upload or binary download client.

## Catalog and pricing

```ts
const client = clientForRequest();
const page = await client.products.list({ p: 1, ps: 12 });
for (const row of page.data) {
  const product = row.data;
  console.log(product.sku, product.calculatedPrice?.finalPrice ?? product.price);
}
```

List rows are `BaseModel<Product>` records with product fields under `row.data`. `products.get(skuOrSlug)` URL-encodes its argument. A TypeScript generic describes the response; it does not validate it at runtime.

```ts
const quote = await client.cart.price({
  productItems: [{ sku: 'YOUR-EXISTING-SKU', quantity: 1, itemType: 'product' }],
  shippingAddress: {
    street1: '1 Main St', city: 'Dallas', state: 'TX', zip: '75001', country: 'US',
  },
  couponCode: 'YOUR-TEST-COUPON',
});
if (quote.valid === false) console.log(quote.message);
console.log(quote.total); // Includes the returned tax and shipping.
```

Use a controlled organization: calculating a cart can create an `sf_cart` and return its `cartId`. This is not a pure read and does not persist the whole edited basket. Treat calculate, persist, restore, and checkout as separate operations; see [Build a web store](https://docs.appmint.io/docs/client-integration/web-tutorial).

The backend recalculates known SKUs, but the inspected pricing service falls back to supplied line prices, or zero, when line pricing throws. A successful quote alone therefore does not prove every SKU was resolved. Validate sellable items on your server and include unknown-SKU and price-tampering cases in checkout acceptance tests. Never manufacture a fallback total in the UI.

## Implemented helper reference

| Helper | Request |
|---|---|
| `products.list({ p, ps, categories, brand, sort })` | `GET storefront/products` |
| `products.get(slugOrSku)` | `GET storefront/product/:slugOrSku` |
| `products.categories()`, `products.brands()` | `GET storefront/categories`, `GET storefront/brands` |
| `cart.price(input)` | `POST storefront/pricing/calculate-cart` |
| `shipping.options({ items, toAddress, orderTotal?, discountCode? })` | `POST shipping/options` |
| `orders.checkout(input)` | `POST storefront/checkout-cart`; accepts an unvalidated record |
| `orders.paymentGateways()` | `GET storefront/payment-gateways` |
| `auth.signIn(email, password)` | `POST profile/customer/signin`; stores `res.token` in this instance when present |
| `auth.signUp({ email, firstName?, lastName? })` | `POST profile/customer/signup` |
| `auth.magicLink(email)` | `GET profile/magic-link?email=…` |
| `affiliate.resolve(code)` | `GET affiliate/public/resolve/:code` |
| `affiliate.trackClick(code, source?)` | `POST affiliate/public/track`; source is `link`, `code`, or `qr` |
| `affiliate.me()` | `GET client/affiliate/me` |

Three helpers currently do not match the inspected backend routes:

| SDK helper | Current SDK path | Use instead |
|---|---|---|
| `auth.profile()` | `profile/customer/profile` | `client.get('client-data/profile')` |
| `orders.mine()` | `storefront/orders/get` | `client.get('client-data/orders')` |
| `orders.get(number)` | `storefront/order/get?orderNumber=…` | `client.get('storefront/order/get/me/' + encodeURIComponent(number))` with a customer session |

The authenticated storefront order alias has path parameters; for customers the backend derives ownership from the session and ignores the requested author. `client-data/orders/:orderId` is also available; the current customer order service looks up `data.number`, so pass the order number, not an assumed record `sk`. Never substitute an arbitrary customer identifier to grant ownership.

`auth.magicLink(email)` also needs integration work: it sends only `email`, while the backend link flow requires a client host or redirect URL. The SDK does not add `x-client-host`/`x-client-info`. Use a server-owned, validated redirect URL via a generic request or a transport that supplies the hosted context, then implement the matching redemption route. Do not expose an unrestricted browser-controlled redirect.

Use generic methods for endpoints without helpers:

```ts
const client = clientForRequest(customerToken);
const profile = await client.get('client-data/profile');
const orders = await client.get('client-data/orders', { page: 1, limit: 10 });
// For a PATCH route in the current reference, use request('PATCH', path, body).
```

`request(method, path, body?, query?)`, `get(path, query?)`, `post(path, body?, query?)`, `put(path, body?, query?)`, and `del(path, query?)` return parsed JSON, text for non-JSON responses, or `undefined` for an empty body. There is no dedicated `patch`, refresh, logout, session storage, cookie, or verification helper.

## Authentication and failures

`auth.signIn` does not create a browser cookie, persist a session, refresh a customer token, or complete MFA. It only sets an instance token when the response contains `token`. The backend may return `requiresTwoFactor` and `challengeToken` instead. Use the [authentication flow](https://docs.appmint.io/docs/client-integration/authentication) before enabling customer data.

```ts
import { AppmintError, AppmintNetworkError } from '@appmint/js-client';

try {
  await clientForRequest(customerToken).get('client-data/profile');
} catch (error) {
  if (error instanceof AppmintNetworkError) {
    // status is 0; return 503 from your route, keep the visitor session.
  } else if (error instanceof AppmintError) {
    // Inspect status and optional code; body contains the upstream payload.
    // Treat 401, 403, validation and missing records as different outcomes.
  } else {
    throw error;
  }
}
```

On **any server-side 401**, the SDK clears its app token and replays once, including POST. It does not refresh the customer token. A remaining 401 needs diagnosis of the two identities. Network errors and 403 do not trigger that replay. App-key errors are swallowed into a missing app token; a public endpoint succeeding is not evidence that application authentication worked. The SDK does not expose response headers such as `Retry-After`; use a custom transport if you need them.

## Verify before connecting customers

Run the source package build, then use an injected `fetch` to check app exchange coalescing, the two headers, query encoding, one 401 replay, and independent visitor instances. Against a disposable tenant, check catalog, quote, saved-cart readback and customer isolation separately. The reference review did not contact a tenant or make a provider payment; [the examples](https://docs.appmint.io/docs/client-integration/examples) explain their implemented scope.

## Customer registration, renewal and sign-out

`auth.signUp` currently accepts email and names only and does not store the returned token. It has no password field in its TypeScript signature. If your registration flow collects a password, use `client.post('profile/customer/signup', { email, password, firstName, lastName })` with the current reference contract, inspect the response, then persist the issued session in your trusted host. A customer signup creates a customer in the chosen organization; it does not create an organization or require platform root privileges.

For an existing customer session, the backend renewal operation is `POST profile/customer/refresh` with `{ refresh_token: savedRefreshToken }`. JavaScript has no renewal manager: your trusted host must replace the access token and any rotated refresh token atomically, then call `setCustomerToken` on the request-owned client. `setCustomerToken(null)` clears only that object's token; remove your host's session/cookie separately. It does not revoke a server-issued token by itself.

Account selection through `POST profile/customer/shared-account` also returns a replacement session. It changes purchasing context, not the customer's identity or authority. Persist the replacement before reloading cart or company data. The [customer portal companion](https://github.com/JacLight/appmint-examples/tree/main/appengine-customer-portal) implements this sequence and the trusted ownership check required before capability-style booking cancellation.

## Ordinary bearer mode and transport adapters

Without app credentials, the server SDK skips the app-token exchange but still places `setCustomerToken` in `x-client-authorization`. It does not automatically produce an ordinary `Authorization: Bearer <customer-token>` request. The portal companion's [sdk-host.mjs](https://github.com/JacLight/appmint-examples/blob/main/appengine-customer-portal/examples/sdk-host.mjs) uses the supported injected-fetch hook to adapt this mode on the trusted server. It restricts the upstream origin, rejects redirects, and leaves the official SDK unchanged. Do not mix that adapter with a privileged application client or reuse one mutable client across different customer sessions.

## Environment support

The package tests the runtime with `typeof window !== 'undefined'`: a browser uses your proxy; Node uses the configured backend. React Native, workers and other non-browser runtimes need their own validation of that detection, `fetch`, URL and abort support. A platform name in an older README is not a tested compatibility guarantee. Neither JavaScript transport mode supplies offline caching, a mutation queue or a Socket.IO client.
