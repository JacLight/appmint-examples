# AppEngine Headless Storefront Development — runnable source

The revised client connects **catalog → customer session → option/quantity selection → destination pricing → saved basket → Stripe or PayPal sandbox approval → verified paid AppEngine order**. Real recorded purchases are Stripe **HS851V342** and PayPal **C3V466AVY**, both54.50USD. PayPal cancellation and resumption were also performed. These identifiers are evidence from one isolated organization; replace them with your own returned values.

Actual option/coupon proof: Large25 + delivery6.50 − coupon2.50 =29USD; removal31.50; invalid coupon rejected. Actual EasyPost test quote/label6.57USD and existing tracker `in_transit`. The customer delivery charge6.50 and merchant label cost6.57 are deliberately separate. No live charge, live postage, delivered receipt or hosted deployment is claimed.

## Prerequisites you can actually follow

- [AppEngine Introduction](/videos/appengine-introduction/course/review.html): obtain your organization's AppEngine endpoint and organization ID.
- [API Foundations](/videos/appengine-api-foundations/course/review.html): ordinary customer account, password setup, sign-in and verification. Prepare two controlled customers when reproducing the ownership check.
- [Database & Repository APIs](/videos/appengine-data-records/course/review.html), **1:02 staff sign-in**: obtain the staff bearer for product/provider/shipping preparation. A customer token does not replace staff authorization.
- [Canonical illustrated lesson](/tutorials-plan/course-content/courses/build-headless-commerce/index.html), [course catalogue](/videos/course-catalogue/?product=AppEngine#build-headless-commerce).

Use https://studio.appmint.io for the management UI and https://docs.appmint.io for platform documentation. Studio is not automatically your API endpoint. Follow the endpoint supplied for your organization/environment.

The course's training email configuration is inactive with outgoing email disabled. Creating an order can still reduce stock and invoke configured business processing; prepare that policy deliberately. Existing demonstration provider configurations were reused only after verifying Stripe test keys/livemode=false and PayPal Sandbox. No merchant secrets are included in this archive.

## Prepare a product and delivery rule

In Studio → Storefront → Product, create a uniquely named product with SKU, Available status, price24 and an image intended for visitors. Set stock if using tracked inventory. In Shipping → Settings → Shipping Methods, create an active flat method with currencyUSD, countriesUS, rate6.50 and a stable name such as `headless-1010-shipping`. On the product, Shipping → Shipping Configuration references the configuration **name**, not its record sk. Save and reopen both records.

`json/product.json` and `json/shipping-config.json` contain complete optional preparation bodies. Replace the image URL and names/SKU consistently before running this deliberate one-time staff operation:

```sh
export APPENGINE_ENDPOINT='https://YOUR_APPENGINE_HOST'
export ORG_ID='YOUR_ORGANIZATION_ID'
export STAFF_TOKEN='YOUR_PRIVATE_STAFF_BEARER_WITHOUT_PREFIX'
node prepare.mjs --create
```

The initializer creates shipping first, then product; inspect any partial result before retrying. It does not roll back the first write. Never expose this staff route through the customer-facing proxy.

Inspect `GET /storefront/product/{sku}` and the actual visitor catalog. A status label alone does not establish publication visibility. The catalog page in this course filters to the training SKU in `nextjs-store/app/page.tsx`; replace that filter or remove it deliberately when using your own catalog. The product route itself can display any available SKU.

## Run the integrated website and checkout

Requires Node20+ and npm for Next.js. The companion uses only Node built-in modules. Both processes use the same endpoint and organization. Start checkout first in one terminal:

```sh
cd checkout-lab
cp .env.example .env.local
# Set APPENGINE_ENDPOINT and ORG_ID.
# PORT=4341; PUBLIC_ORIGIN=http://127.0.0.1:4100
node --env-file=.env.local server.mjs
```

In another terminal:

```sh
cd nextjs-store
cp .env.example .env.local
# Set the SAME APPENGINE_ENDPOINT and ORG_ID.
# CHECKOUT_SERVICE=http://127.0.0.1:4341
npm install
npm run dev
```

Open `http://127.0.0.1:4100` for this local exercise. The package's Next command uses4100. Keep the exact browser origin and checkout `PUBLIC_ORIGIN` equal; changing only a port or hostname breaks the deliberate origin check. These are local execution instructions, not a claimed public deployment or a substitute for your real AppEngine address. The recording omits browser chrome.

Sign in through **Sign in**, then open a product, select its options if present, and add it to the cart. Change quantity and inspect returned pricing. **Continue to secure checkout** carries the selected SKU/quantity/options/coupon to `/checkout`. Next explicitly rewrites that page and `/api/checkout/*` to the private companion. It does not expose arbitrary AppEngine paths.

Next's HttpOnly `appmint_token` cookie remains inaccessible to browser JavaScript. The checkout server validates that customer token via `/client-data/profile` and retains its own opaque session. The shopper does not sign in a second time. The verified profile supplies the email used for the saved cart. Staff repository access is never used for these shopper operations.

The original Next and Remix examples also support server-only configured application credentials. That is an alternative transport, not a reason to create a privileged System account. The filmed route uses public catalog operations and the ordinary customer's bearer for private operations. The original examples and their contracts are linked at [Next storefront](https://docs.appmint.io/docs/examples/nextjs-storefront) and [Remix storefront](https://docs.appmint.io/docs/examples/remix-storefront). Remix is included as the existing loader/resource-route alternative; a newly executed paid Remix client is not claimed.

## Price, save and restore the customer basket

`POST /shipping/options` receives `items:[{sku,quantity}]` and `toAddress`. Inspect `served` and the returned delivery offer. A rejected destination must not become a fabricated free-shipping offer.

`POST /storefront/pricing/calculate-cart` receives `productItems`, `rentalItems`, `shippingAddress` and optional `couponCode`. Selected product options stay on their line as `options:[{name,value}]`. Send SKU/quantity/selection, without treating browser-stored prices as authoritative. Display returned subtotal, discount, delivery, tax and total; do not subtract the discount a second time. Tax0 in this fixture is its configuration, not a general tax rule.

Calculation can allocate an empty cart record. Persist the accepted quote with `POST /storefront/cart/update/{cartId}` and `{datatype:'sf_cart',data:{...quote,shippingAddress,email}}`. Then `GET /storefront/cart/mine` under the same customer session must return that cart identity, selected options, destination and total. **Restore my cart** reads this server basket, distinct from the browser's shopping selection. Changing the basket requires a new quote before payment.

## Configure and complete Stripe sandbox payment

In Studio → Gateway Manager → Integration Builder → Payment → StripeProvider, supply Name, intended priority, active status and matching **Publishable Key** and **Secret Key** from [Stripe's API keys page](https://docs.stripe.com/keys). Use test/sandbox keys. The secret remains in AppEngine configuration; only the publishable key and individual intent's client secret belong in the browser payment flow.

Save the authorized configuration and run **Test configuration**. Our actual saved test returned success and livemode=false. Connection authentication is not payment proof. `GET /storefront/payment-gateways` discovers sanitized configuration; omit amount/currency when merely discovering gateways.

In the shop choose two24-dollar prints, continue to checkout, enter the eligible address, and **Calculate, save and read back**. The saved total is54.50. **Pay by test card** checks the current saved basket and requests `/storefront/stripe/intent` with cartId, amount54.50, currencyusd and verified customer email. It requires `pk_test_` and intent livemode=false. Stripe reports5450minor units for54.50USD.

Real Stripe Elements collects the provider test card. In our sandbox take, card4242424242424242, a future expiry and test CVC completed the payment. Use [Stripe's testing documentation](https://docs.stripe.com/testing) for current test cases; never enter a real card into this teaching run. After successful confirmation, the server sends the existing cart and payment reference to `/storefront/checkout-cart`, then reads the resulting order **by order number**.

The filmed orderHS851V342 ispaid54.50USD and records intentpi_3UP9WACH9tYO5hDg15wEPvip. Independent staff-side provider verification returned succeeded, livemodefalse, amount5450 and amount_received5450. Studio Payments shows gross collected54.50 and uncollected balance0. No receipt delivery was asserted.

## Configure and complete PayPal sandbox payment

Use [PayPal Developer → Apps and Credentials](https://developer.paypal.com/api/get-started/) with **Sandbox** selected. Use the intended sandbox business application's client ID and secret. In Studio's PayPalProvider configuration, enter **Client Id**, **App Secret**, enable **Sandbox**, set the intended active status/priority and save. Test configuration authenticated the existing sandbox credentials. A connection test does not capture a purchase.

The checkout loads PayPal's JavaScript SDK with the public client ID and currencyUSD. Its actual `actions.order.create` body includes `intent:'CAPTURE'`, the saved cart ID as purchase-unit reference, and `amount:{currency_code:'USD',value:'54.50'}`. PayPal uses major currency units here, unlike Stripe's returned minor units. The companion binds the returned provider order ID to the attempt; it cannot be replaced by another browser-submitted ID.

The filmed PayPal route browses the same shop, saves the basket, opens PayPal and deliberately closes approval. The cancellation message retains the basket and attempt. Resuming reuses the existing provider order. In the provider's sandbox guest form, test payment details complete **Pay now as guest**. We did not create a new PayPal account. The recorded sandbox used PayPal's published Visa test number `4005519200000004`, a future expiry and CVV `123`, with fictional controlled contact/billing details. Obtain supported cards from [PayPal's official sandbox card-testing page](https://developer.paypal.com/tools/sandbox/card-testing/); never use a real payment card. If your sandbox offers account login instead of guest payment, use a **sandbox personal buyer account**, distinct from the merchant's sandbox business account: Developer Dashboard → Testing Tools → Sandbox Accounts → personal account → View/Edit Account. That is an alternative approval route; the recorded take demonstrates guest payment, not a newly executed personal-account login.

Before capture the companion obtains the current provider order and persists a capture lock. If alreadyCOMPLETED it does not capture again. AppEngine verification expects the **top-level PayPal order ID**, not the nested capture ID. The filmed customer orderC3V466AVY ispaid54.50 and references PayPal2P174672ES840272J. Independent readback returned that orderCOMPLETED plus capture42H76939SE7968341COMPLETED for54.50USD.

## Recovery and verification

Run all 21 local mocked checkout/recovery checks with `node --test checkout-lab/server.test.mjs checkout-lab/paypal-companion-contract.test.mjs` from the extracted package root. They use local test servers and injected mock providers; they do not charge a card or call AppEngine.

The finalizer requires the expected customer, amount and case-insensitive currency, paid status and matching recorded tender reference. An order sk alone is insufficient. A cancellation before capture is not the same as losing the response after capture.

**Check existing payment/order** performs read-only reconciliation by searching the signed-in customer's orders for the stored provider reference and then verifying the exact saved record. No match leaves the attempt locked; it does not automatically recapture or create another order. A merchant must inspect the provider and business record before deciding the next action. The package includes21 meaningful mocked checkout/recovery tests, supplementary to actual provider purchases. A rejected checkout does not establish that a refund succeeded; inspect a real refund before making that claim.

`GET /client-data/orders/{number}` expects the customer order number, not the database sk. The recorded Stripe order is available to its owner; the same request as another controlled customer returned HTTP200 and JSONnull. This tests this particular route, not all platform authorization.

The optional **Place an unpaid order** action remains explicit. It sends no payment reference and creates a real order awaiting payment; it is not used as payment proof. It can still affect stock and configured business processing.

## Product options and coupons

### Prepare your own option product and coupon

The earlier `prepare.mjs` creates only the simple print. The optional product/coupon exercise needs these two additional saved records. The exact demonstrated request bodies are supplied as guarded staff descriptors, with record-specific values replaced by explicit placeholders:

1. Edit `json/operations/prepare-option-product.json`. Replace every `YOUR_` marker: choose a unique product name, slug, base SKU and Large variation SKU. Set `shipping.config` to the **name of your already saved flat delivery rule**. Retain the two size values, prices, variation mapping and stock fields. The product body is otherwise the demonstrated preparation contract.
2. Edit `json/operations/prepare-option-coupon.json`. Choose a unique name and coupon code; its `products` array must contain exactly your new **base SKU**. It creates an active, manually entered 10-percent product discount, not a gift card.
3. Read both bodies and verify the endpoint/organization and controlled training context. Use the staff bearer obtained in the linked staff sign-in lesson. Run each create once:

```sh
export STAFF_TOKEN='YOUR_PRIVATE_STAFF_BEARER_WITHOUT_PREFIX'
CONFIRM_TEST_OPERATION=yes node operation.mjs json/operations/prepare-option-product.json > option-product-created.json
CONFIRM_TEST_OPERATION=yes node operation.mjs json/operations/prepare-option-coupon.json > option-coupon-created.json
```

These are persistent writes. If either result is uncertain, inspect the saved SKU/code before retrying; the runner does not deduplicate creation or roll back the other record. The unresolved placeholders intentionally prevent execution until replaced.

4. With the customer identity, run `node client.mjs product YOUR_CHOSEN_BASE_SKU` and inspect the saved attributes/variations and delivery reference. Open `/product/YOUR_CHOSEN_BASE_SKU` in the included shop; the default catalog filter contains only the original print unless you deliberately extend it.
5. Replace the base SKU in `json/operations/option-quote.json` and `coupon-quote.json` with your chosen SKU, and the latter's couponCode with your chosen code. Set `CUSTOMER_TOKEN` privately for the generic runner. Run `node operation.mjs json/operations/option-quote.json`, then the coupon descriptor. With the same US destination and flat rule, Large should return 25 plus 6.50 delivery; the coupon should return discount 2.50 and total 29. Confirm the returned variation SKU is your saved Large variation.
6. In the shop choose Large, apply/remove your coupon, try an unknown code, and save the accepted basket through checkout. Read `/storefront/cart/mine` to confirm the option, discount and amount together. Use your own returned cart ID; the evidence archive's IDs are not your configuration.


The separately prepared option product uses baseSKUHEADLESS-OPTIONS-1010. Its size attribute supports small and large; the saved Large variationSKUHEADLESS-OPTIONS-LARGE-1010 has an absolute price25. Small is20. An unmatched variation can instead use saved attribute price adjustments, so inspect the actual returned price and variation identity rather than assuming every variant is a surcharge.

The browser sends the baseSKU plus `options:[{name:'size',value:'large'}]`. Cart keys include a normalized option combination, so Small and Large do not collapse into one line. Quantity changes affect the selected line. The checkout validates selections against saved attributes and compares the option-bearing saved lines before payment.

CouponHCOPTION10 is scoped to this exercise. Large plus6.50delivery totals31.50; the accepted2.50discount yields29. Remove the code to obtain31.50; an invalid code returns `valid:false`, `reason:'not_found'`. Do not save an invalid quote. The actual saved Nina cart retained Large,2.50discount and29total. JSON requests and observed responses are included under `json/operations` and `observed-json/payment-revision`.

## EasyPost test rates, label and tracking

Create an EasyPostProvider configuration using the provider account's **test** API key, not a production key. Enable Shipping (and Logistics if needed), choose active status/intended priority and save. The course reused existing demo `easy-test` after verifying its test-key prefix; the copied configuration belongs to the isolated course organization, so it does not use a platform-shared paid fallback. Obtain keys from [EasyPost API Keys](https://www.easypost.com/account/api-keys).

`POST /shipping/rates` accepts both `fromAddress` and `toAddress`, parcel length/width/height/weight with `dimensionUnit:'in'` and `weightUnit:'lb'`, and selected items. It creates a provider quote shipment, not a label purchase. Our quote returned USPS and FedEx rates. Store its `shipmentId` and select an exact returned rate. `POST /shipping/create` is a **staff** operation receiving those same identifiers, addresses, parcel and items. Do not manufacture a rate or silently requote and buy a different shipment.

Our exact USPS GroundAdvantage rate6.57 created shipmentshp_f1234bdd60b84df5806400c228ab0413 in mode`test`, tracking9434600208192110020066 and a real label image. This standalone training shipment deliberately has no order/customer email, preventing a shipping message. To fulfil a real order, include its actual `orderNumber` and the items in that parcel. That association updates order shipping state and invokes configured notifications; the following correct-address fulfilment section separately demonstrates that association without sending a notification.

A shipping label cost is distinct from the customer's6.50flat delivery charge. Our existing provider tracker returned `in_transit`. The current public `/shipping/track/{number}` route returned400 for this generated test number because it attempted a new EasyPost test tracker; `getTracker` through the staff provider operation reused the existing tracker successfully. The course documents this exact application finding; it does not claim the public route worked or that the parcel was physically delivered.

## Associate the correct shipment and verify stock deduction

The first standalone label was addressed to San Francisco. The paid order HS851V342 has a Chicago destination, so that earlier label was **not** attached to the order. For fulfilment, we requested a new test quote using the order's unchanged saved Chicago address. The USPS GroundAdvantage test rate was 10.11 USD, not the earlier standalone label's 6.57 USD. The customer's collected delivery charge remained 6.50 USD.

The correct-address test shipment is `shp_f6aa94f79af54346b2eca09a68becb14`, tracking `9434600208192110020219`. Those are recorded evidence identifiers, not reusable inputs for another order. Use your own saved order address, both original product units and exact returned rate/shipment in the carrier quote/label descriptors. For this controlled demonstration the label was created **without orderNumber or customer email**. Then `POST /shipping/order/manual` linked that pre-created label's tracking to the order with `sendNotification:false`. This route records manual/external-label association; it does not purchase another label. The order entry has `manual:true` and no copied labelUrl, while the actual label remains in its separate shipping record/download.

Edit `json/operations/associate-existing-label.json` with your order number, matching-address label's exact carrier/service/tracking/cost and the precise included order lines/quantities. Read the order first; if the tracking is already attached, do not add it again. After deliberate confirmation, run the operation once and read the same customer order again. Manual association is not idempotent: a blind retry can duplicate shipping entries and quantities. Direct `/shipping/create` with an orderNumber follows a different notification path; do not assume its payload accepts the manual route's notification-suppression flag.

The observed association changed this order from `paid` to `shipped`, recorded two shipped units and retained the original Stripe tender/reference, amount 54.50, address and order ID. Collected amount remains 54.50 with zero remaining balance. `shipped` is the fulfilment lifecycle state; it does not mean the payment disappeared. No physical parcel delivery or customer shipping-message delivery is claimed.

### Location inventory is a separate prerequisite

First obtain the location identifier. With a staff session, edit and run `node operation.mjs json/operations/location-lookup.json`. The response is a page whose `data` array holds location records. Read the selected record's **data.name**, not its display title or sk: inventory.locationId in this exercise uses that saved stable name. Our existing `bm-checkout-course` was verified by this lookup; it is not a location that automatically exists in your organization.

If no intended location exists, the downloadable `location-create.json` supplies the current source-backed `POST /repository/create` body for datatype `location`. Choose a unique name of 3–100 letters/digits/underscores/hyphens, a display title, active status, physical address and appropriate IANA timezone. Replace every placeholder, check that the name is unused, then run `CONFIRM_TEST_OPERATION=yes node operation.mjs json/operations/location-create.json` once. Re-run lookup and carry the returned `data.name` into inventory-opening.json. This optional creation contract was checked against the current location schema; the film reuses an existing location and does not claim it created another one. The [Business locations section of the organisation lesson](/videos/course-catalogue/materials/bm-shared-organisation-script.html) shows the corresponding administration screen.


The first stock readback exposed `orderInventory.status: needs_attention`: this SKU had a product-level stock value but **no location inventory record**. Marking a shipment did not establish that inventory was deducted. This is the actual recovery performed, with its before/after evidence preserved:

1. Read the SKU's inventory through `GET /storefront/inventory/sku/{sku}` and confirm the intended business location already exists. The controlled fixture used the existing location name `bm-checkout-course`. Do not create a duplicate inventory row or alter another business's SKU.
2. Set the stock location before normal fulfilment. Here, to demonstrate recovery, `POST /storefront/inventory` created a deliberate opening balance of **30 zero-cost training units**, with `reservedQuantity:0`, `unitCost:0`, `currency:'USD'`. Thirty is an explicitly chosen course fixture balance; it was not inferred from an actual business's stock. Zero is an explicit training valuation, not a recommendation to ignore the real acquisition cost. Use your verified quantity and non-negative unit cost for your own inventory.
3. Edit the guarded `inventory-opening.json` descriptor with your SKU and existing location name. Inspect existing stock first, because this endpoint also changes an existing record's quantity. Review the body and run only the intended write.
4. Run the supported retry for the **already shipped** order; do not add its shipment again. Our route was `POST /storefront/order/stock-retry/HS851V342` with `{}`. It drew exactly two owed units: location stock 30 → 28, orderInventory.status `complete`, drawn quantity 2, issues empty. The existing single stock location was resolved automatically. If more than one location stocks a SKU, the order's business location must identify the intended stock location; generic order/update does not accept that field.
5. Read both the order and inventory again. Compare payment reference/tender, collected balance, address, tracking, quantity and stock transaction. Repeating the stock-retry once left stock **28** and retained the same transaction `INV-29EB45F9A86A450B915DA7D3`; no second deduction occurred.

```sh
# Set STAFF_TOKEN privately; replace all YOUR_ markers and inspect the bodies first.
node operation.mjs json/operations/inventory-read.json
CONFIRM_TEST_OPERATION=yes node operation.mjs json/operations/inventory-opening.json
CONFIRM_TEST_OPERATION=yes node operation.mjs json/operations/order-stock-retry.json
node operation.mjs json/operations/inventory-read.json
```

These commands deliberately separate the opening-stock write from the supported stock retry. A subsequent read of the new shipment’s existing EasyPost tracker returned **mode:test, status:delivered** for this same tracking number. That is simulated provider tracking; it did not mark a physical delivery or automatically change the order from shipped. The earlier public-route error belongs to the separate first test shipment. The recorded responses, original needs_attention outcome, corrected order, matching test label and no-double-draw readback are under `observed-json/payment-revision/fulfilment`. The original Stripe payment and saved shipping address were unchanged throughout.

## Gift cards and other selling models

A gift card is a tender, not a coupon. Its headless integration uses customer `GET /client/giftcards/balance?code=...`, calculation with `giftCards:[{code,pin?}]`, and the same giftCards on `/storefront/checkout-cart`. Quote allocation must not spend it; checkout performs the order-linked redemption. A completed demonstration must compare the paid order's giftcard tender with the matching balance reduction. **New course gift-card issuance is pending specific owner authorization after automatic approval review rejected creating redeemable value. This branch is not marked complete.**

Rentals and subscriptions have different inventory/time/billing outcomes; they are not demonstrated by these physical-product purchases. The existing written [Products](/videos/course-catalogue/materials/am-product-script.html), [Shipping](/videos/course-catalogue/materials/am-shipping-script.html), [Payment Gateways](/videos/course-catalogue/materials/am-payments-script.html), [Discounts](/videos/course-catalogue/materials/am-discount-script.html), [Gift Cards](/videos/course-catalogue/materials/am-gift-card-script.html) and [Rental](/videos/course-catalogue/materials/am-rental-script.html) lessons explain those module controls. Their stated limitations remain in force; a linked draft is not claimed as a completed missing outcome.

## Run equivalent TypeScript, JavaScript, Python, curl and Postman requests

Use private environment values and your own records:

```sh
export APPENGINE_ENDPOINT='https://YOUR_APPENGINE_HOST'
export ORG_ID='YOUR_ORGANIZATION_ID'
export CUSTOMER_EMAIL='YOUR_CONTROLLED_CUSTOMER_EMAIL'
export CUSTOMER_PASSWORD='YOUR_CUSTOMER_PASSWORD'
node client.mjs signin
node client.mjs products
node client.mjs product HEADLESS-CEDAR-1010
node client.mjs quote json/quote.json > quote-result.json
node client.mjs save quote-result.json json/address.json
node client.mjs cart
node client.mjs order YOUR_RETURNED_ORDER_NUMBER
```

`client.py` provides the same basic command flow with Python's standard library. `client.sh` usescurl and printsJSON directly. `client.ts` reuses the included Appmint JavaScript SDK through an explicit customer bearer adapter; the Next and Remix clients use their existing fetch transports, not that SDK. Install/build from this package root with `npm install && npm run build`, then run the generated `dist/client.js` commands. The mocked SDK tests alone do not establish paid checkout.

`operation.mjs`, `operation.ts`, `operation.py` and `operation.sh` execute exact request descriptors in `json/operations/`. Replace marked IDs with your own saved values. Set CUSTOMER_TOKEN for customer operations or STAFF_TOKEN for staff-only fulfilment. A write markedmutation requires deliberate `CONFIRM_TEST_OPERATION=yes` after reviewing the configured sandbox and body. Browser payment approval belongs in the complete checkout application; a curl request does not replace card/PayPal approval.

```sh
node operation.mjs json/operations/option-quote.json
python3 operation.py json/operations/coupon-quote.json
node operation.mjs json/operations/carrier-quote.json > carrier-quote-result.json
# Copy the exact returned shipmentId and selected rate into carrier-label.json.
# Use staff identity and verified test provider for that deliberate label operation.
```

The root build includes both `client.ts` and `operation.ts`. After `npm install && npm run build`, run `node dist/operation.js json/operations/option-quote.json` from the package root. The shell equivalent is `sh operation.sh json/operations/option-quote.json`; it uses Python 3 solely to parse the descriptor safely and curl for the HTTP request. All generic runners require the same explicit customer/staff token and mutation confirmation; they do not read the CLI's private session file automatically.

Import `commerce.postman.json`, populate its environment locally, and keep exported values empty. Its requests identify customer versus staff identity. Full JSON bodies are supplied; no jq is required. `observed-json` is evidence, not a configuration file or set of reusable IDs for your organization.

## Deployment boundary

This is a local teaching server with in-memory sessions, private disk attempts and a single-process lock. A public deployment needs HTTPS, secure cookie attributes, an exact allowed origin, a shared expiring session/attempt store and operational reconciliation across instances. Keep private attempts and provider secrets outside served files. Do not merely copy the local process architecture into a multi-instance production deployment. Application defects unrelated to course completion were documented, not patched in application source.

## Course source publication

This folder contains the downloadable companion supplied with **AppEngine Headless Storefront Development**. Replace training identifiers and paths with your own. Recorded results are examples, not a live connection or credentials. Use the current [AppEngine API reference](https://appengine.appmint.io/documentation) for changing contracts. The course reader retains its verification limits.
