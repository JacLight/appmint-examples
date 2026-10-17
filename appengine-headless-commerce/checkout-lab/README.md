# Updated headless-commerce companion

The current course setup, direct-customer mode, explicit unpaid-order action, order-number lookup and verification limits are documented in [the package README](../README.md). The recorded course has **no configured Stripe sandbox** and no paid-provider result. The original lab instructions below describe the implemented test-payment branch; its mock/browser tests are historical implementation tests, not a live payment. Finalization now additionally requires a matching paid-order tender and amount.

# AppEngine checkout reference

This is the complete local browser/server companion for the Headless Commerce course. It teaches AppEngine customer sessions, saved carts, Stripe test intents, provider return and order readback. It uses Node's standard library and Stripe.js; it does not require access to the private application repositories.

## Start

1. Prepare the course's training organization, ordinary active product, eligible shipping method, controlled customer and **USD Stripe test** configuration. Finish customer password setup through the Authentication course before using this lab. Read the configured gateway's connection result; the lab must not use live credentials.
2. Use Node 20.6 or newer. Extract the archive into its own directory. Copy `.env.example` to `.env.local`, then enter the actual AppEngine origin and organization ID. These are not a Studio page URL or a site ID. No application secret, Stripe secret or customer password belongs in this file.
3. From this directory run `node --env-file=.env.local server.mjs`.
4. Open **http://127.0.0.1:4310**. Use that exact hostname because cookies and origin checks are deliberate. Sign in as the customer and finish the displayed verification code when requested.
5. Read products, enter an actual active simple-product SKU and a covered destination, then select **Calculate, save and read back**. Confirm returned SKU, quantity, address, shipping and positive total. This reference uses USD and an ordinary product. Variants/rentals need the course's separate payload branches.
6. Select **Open or resume test payment**. The server compares the current saved cart with the inspected quote, checks the sanitized gateway is configured with a test publishable key, records the attempt, and requests AppEngine's intent with that cart ID. Stripe's Payment Element appears only for a returned test-mode intent.
7. Use the configured provider's permitted sandbox instrument and select **Confirm test payment**. Card data goes to Stripe.js. On success the server finalizes the order using its saved intent/cart identities, then shows the actual order ID. It never accepts a browser-selected payment reference or amount as authoritative.
8. Choose **Read my orders**, then enter the saved order ID in **Read this order**. Check Appmint's corresponding order and the provider's test transaction. Repeat the order read with a second controlled customer to test AppEngine ownership.

## Reload, redirect and uncertain outcomes

A `quoted` attempt contains the inspected saved basket but has not contacted Stripe. A completed attempt is returned again by Open or resume; calculate a deliberate new quote before starting another purchase. Creating that next quote replaces the local last-attempt file; retain completed order/payment references in your private exercise notes.

The attempt is stored in `.private/` under a hash of organization and customer identity. It includes private checkout/provider data and is never served as a static file. Keep that directory private; do not commit it. Browser sessions last one hour and live in server memory. A server restart therefore requires sign-in again, while the saved attempt survives. The same customer can use Open or resume to inspect the original intent. A confirmed intent is finalized; an unconfirmed one retains the same payment form. The return handler uses the server-bound client secret and payment ID, not arbitrary query values.

`reconciliation-required`, `creating-intent` left after a crash, or `finalizing` left after a crash means **stop**. Inspect the saved cart ID/payment ID in the private attempt and locate that payment in the configured Stripe test dashboard. Read customer orders and inspect the matching Appmint order/payment record. Do not delete the attempt or start another charge just because the browser timed out. A complete paid order can be read through the order control; local attempt reconciliation is an operator decision, not an automatic retry implemented here. Only after the actual provider/order outcome has been resolved should a developer archive the private training attempt and begin an independent exercise.

The browser does not print the Stripe client secret in its result panel and clears private records/payment controls when customer identity changes. The browser disables duplicate submissions. The server serializes customer mutations in one process and returns the existing intent/order when retried. After an AppEngine 401/403 it clears the private session view. Unknown SKUs and blocked shipping stop before intent creation.

## Architecture and limits

This loopback teaching server uses direct customer bearer authentication; the token remains in its memory behind an HttpOnly SameSite cookie. That is an AppEngine-supported customer route, distinct from the optional application-token plus x-client-authorization design taught elsewhere. Mutations require a same-origin request and CSRF token. No administrative proxy or arbitrary API path is exposed.

For a public deployment, put these explicit handlers behind your framework's HTTPS session store and a transactional shared attempt store. Add expiry cleanup and your permitted session renewal/logout lifecycle. This example intentionally binds only to loopback and has one process; its local lock/file storage does not establish distributed exactly-once payment processing. The course teaches those platform boundaries without presenting a local lab as a production shop host.

The configured shipping offer is preserved from AppEngine's quote. The inspected calculation has no selected-carrier-rate input, so the example does not fake a rate selector. AppEngine's final order operation verifies the stored cart and provider result; a client-side succeeded label does not replace that verification.

Provider interface references: [Stripe confirmPayment](https://docs.stripe.com/js/payment_intents/confirm_payment), [retrievePaymentIntent](https://docs.stripe.com/js/payment_intents/retrieve_payment_intent). AppEngine source contracts: storefront.controller.ts, storefront.service.ts, storefront.order.service.ts, storefront.payment.service.ts and the existing base-app Stripe components.

## Local verification

Run `node --test server.test.mjs`. Eleven mocked HTTP tests check CSRF, temporary-password refusal, challenge continuation, product/shipping rejection, reused intent/order, customer separation, uncertain intent locking, session clearing, test-mode preflight, saved-address mismatch and deliberate new-quote requirement after completion. They run without AppEngine or Stripe, so try a real test payment against your own setup as well.

A separate local Chromium walkthrough also passed sign-in, product reading, saved quote, Payment Element mounting, confirmation/finalization, account-switch privacy and a 390px layout check. Both AppEngine and Stripe were mocked for that check; no provider payment was performed.
