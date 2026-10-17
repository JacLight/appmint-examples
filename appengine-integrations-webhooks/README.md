# AppEngine Integrations and Webhooks companion

This developer example connects to your own AppEngine organization. It discovers provider contracts, tests an existing Stripe connection, creates a controlled unpaid workshop-guide order, confirms a real Stripe TEST payment, finds the provider's matching event, and demonstrates deliberate recovery through AppEngine's provider-retrieval webhook branch. It shows the saved order, `sf_transaction` and processed-event log together.

It is a working example app, not Appmint Studio. It does not contain credentials. The separate automatic-delivery example registers its own temporary TEST endpoint and receives a genuine signed provider callback. ID-only replay and locally signed probes remain separate demonstrations.

## Start with your organization

1. Sign in at https://studio.appmint.io/. Use a development organization and a staff account authorized to manage the selected integration and create the training order.
2. Obtain that deployment's API origin. Studio's website origin is not automatically your API origin. Consult the maintained AppEngine reference at https://appengine.appmint.io/documentation and the API Foundations course for staff sign-in/challenges.
3. In your organization, configure a Stripe **test** connection with your own `pk_test_…` and `sk_test_…` values. Never use this sandbox exercise against live keys. The browser reads safe metadata; it never receives the secret key or signing secret.
4. Create a harmless product using your normal product flow: SKU `AE-WEBHOOK-GUIDE-1017`, name `Integration workshop guide`, active, available, price12USD, no inventory tracking. Use an existing training customer. The example order sets shipping to0 and uses the server's current cart calculation. It refuses totals above50.
5. Route your development organization's notifications to a local sink or a training address you control. Creating orders can produce normal application notifications. Do not point the exercise at real customers.
6. With Node20 or newer, set `APPENGINE_API_ORIGIN`, `APPENGINE_ORG`, `PORT` if needed, and start the server:

```sh
export APPENGINE_API_ORIGIN='https://your-assigned-appengine-origin'
export APPENGINE_ORG='your-development-organization'
export ALLOW_SANDBOX_CONFIRM='1'
npm start
```

Open http://127.0.0.1:4102/ (or your selected local PORT). Connect with your staff email/password; complete any sign-in challenge through the supported Foundations flow first. The example session retains the resulting token only in server memory. A restart clears its order/event context. Browser cookies are HttpOnly and SameSiteStrict; this is a local development example, not a production session-store recommendation.

## Run the example

Select the active Stripe TEST connection and choose **Test provider connection**. A successful connection test only proves account access. **Inspect registered endpoints** is read-only; this version deliberately does not modify existing provider endpoints.

Use **Load configuration fields and operations** to compare Stripe with EasyPost or another returned provider. The schema comes from your running AppEngine, so callers should consult it instead of relying on an old video's copied payload.

Open **Payment event journey**. Create the $12 unpaid order for the training customer. **Confirm sandbox payment** creates its PaymentIntent through AppEngine's built-in provider, then uses Stripe's documented `pm_card_visa` test method on the server. It never collects or charges a real card. For a real user-facing payment UI, follow the Headless Storefront course and its Stripe client integration.

Load recent succeeded events. The app matches both the payment ID and order number. Other events are labelled and cannot be selected as this order's event. Use the provider's cursor when more pages exist.

**Replay selected course event** sends its genuine provider event ID to the current no-secret retrieval branch. AppEngine retrieves the authoritative event using this organization's provider connection. This is deliberately replayed recovery, not autonomous public delivery. The app refuses ID-only replay if the selected configuration already has a signing secret; request a fresh signed resend from Stripe instead. Never remove a signing secret merely to use this shortcut.

Read the same saved order, payment transaction and event log. Replay again and compare transaction IDs as well as count. **Check unknown event refusal** sends a deliberately nonexistent event ID with invented payment fields; the receiver must reject it, and the existing business result must remain unchanged.

## Endpoint and credential ownership

Keep one unambiguous active Stripe connection per organization. Explicit operation calls select `configId`; the webhook resolves the organization's active Stripe connection. A second active connection can make provider selection differ from the caller's intent.

An API credential and webhook signing secret serve different directions. The API key authenticates AppEngine to Stripe. The signing secret verifies Stripe's original raw request body at AppEngine. Preserve raw bytes through your reverse proxy. A token-shaped string in `orgid` is not authentication; it selects organization context.

Credential replacement must start with a valid replacement issued by the provider. Saving a new string in AppEngine does not issue or revoke a Stripe key. Endpoint removal is separate from disabling its AppEngine connection. Never delete or reconfigure an endpoint shared with another application.

## Code map

- `browser/server.mjs`: staff session, safe provider metadata, actual order/payment/event operations and result readback.
- `browser/app.js`: labelled browser UI with in-flight controls and visible outcomes.
- `javascript/provider-client.mjs`, `typescript/provider-client.ts`, `python/provider_client.py`: server-side discovery/test/event paging and exact readback.
- `curl/provider-and-events.sh`: read-only connection and event requests.
- `postman/collection.json`: current discovery, test, event lookup and processed-event request shapes.

The snippets read credentials from environment variables. They do not log provider secrets or create new payments. Run the browser's deliberate mutation buttons only in your own training environment. Provider retry and event-order details change; consult https://docs.stripe.com/webhooks for current behavior.


## Automatic signed provider delivery

`webhooks/automatic-delivery.mjs` and its browser interface implement the separate sandbox demonstration filmed in the course. They create a new owned TEST endpoint, temporarily select its signing configuration, receive Stripe's actual callback for a fresh $12 test payment, restore the original connection and delete only the temporary endpoint. Use an isolated development organization with one active Stripe TEST connection and no concurrent payment work: the current receiver resolves the organization's active connection.

The harness intentionally requires an isolated starting connection with no existing webhook signing secret, plus an active own-organization SMTP configuration pointing to `127.0.0.1` on the AppEngine server. Run a local mail sink there and keep other outbound notification providers disabled. A controlled email address alone does not satisfy this harness check. If your normal connection already verifies signed events, leave it unchanged and use a separate development organization for this recorded exercise.

Run `npm install` and install the official Cloudflare `cloudflared` client (`CLOUDFLARED_BIN` may select its path). The example creates a temporary quick tunnel; use a stable owned HTTPS deployment in production. Its public listener exposes only a random callback path, not the control UI or a general proxy. It verifies exact raw-body signature, TEST mode, intended event type, exact payment ID and course metadata, then forwards to the fixed configured organization.

Set `APPENGINE_API_ORIGIN`, `APPENGINE_ORG`, `APPENGINE_STAFF_TOKEN` from supported staff sign-in, and `COURSE_CUSTOMER_EMAIL` for a controlled customer. Prepare the $12 product above, or use `COURSE_PRODUCT_SKU` for an equivalent fixture. Run `npm run webhook-demo` and open http://127.0.0.1:4123/.

1. **Register course endpoint** creates a dedicated `payment_intent.succeeded` subscription, initially disabled, and saves its returned signing secret in an inactive AppEngine connection.
2. **Prepare $12 order** creates a new order and unconfirmed TEST PaymentIntent.
3. **Enable course receiver** selects this course connection and enables its owned endpoint.
4. **Confirm TEST payment** uses `pm_card_visa`; Stripe sends the event automatically. Inspect the receipt and saved order/transaction separately. After verification the harness disables its endpoint and restores the original connection.
5. **Delete course endpoint** removes only its endpoint and compares pre-existing endpoint records. Stop the process to close the tunnel.

Owner-only private recovery state under `.local/webhook-course/` contains secrets and is excluded from Git. Never publish it. If the process is killed without cleanup, use that private record to restore the original AppEngine connection and delete only the endpoint created by this run. Caught ambiguous save failures trigger conservative restoration. Production needs durable workflow and monitored recovery rather than this single-process harness.

The ordinary AppEngine `setupWebhook` operation derives the callback from deployment configuration. This isolated example registers directly with Stripe because the temporary receiver has a different address. Saving a config alone does not prove registration or delivery. Keep the original raw bytes before JSON parsing; the filmed deployment preserves them on the Stripe/Plaid routes.

## Local signature checks and replacement

`javascript/signed-probe.mjs` and `python/signed_probe.py` accept exact raw event bytes and a generated course-only signing secret. These are local probes, not provider resends. Configure that secret only in an isolated course connection; never overwrite a production signing secret for this exercise. Repeating a genuine event with a valid signature should acknowledge a duplicate. Changing one byte while retaining the old signature, or signing with a different secret, must be refused. Inspect the exact order and transaction afterward.

The filmed replacement changes only generated course signing configuration: old signature fails, replacement works, same payment remains. It does not issue/revoke a Stripe API key or roll a provider-issued endpoint secret. Those require the provider's own lifecycle, then an update to the intended AppEngine config and a fresh delivery. An inactive explicitly selected course connection was also verified to refuse the provider call with404, without shared-account fallback.
