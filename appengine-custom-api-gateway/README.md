# AppEngine Custom API Gateway

Complete local teaching implementation: customer signin → opaque server session → permitted profile/reservation reads → logout; separate supplier fixture → verified reservation note. No real supplier or public deployment is claimed. Recorded JSON is sanitized evidence, not reusable credentials.

## Exact prerequisites

Course catalogue: http://localhost:4060/videos/course-catalogue/?product=AppEngine#appengine-custom-api-gateway
Written course: http://localhost:4060/tutorials-plan/course-content/courses/appengine-custom-api-gateway/index.html
Introduction: /videos/appengine-introduction/course/review.html (your API base + organization ID).
API Foundations: /videos/appengine-api-foundations/course/review.html (ordinary customer signup/signin/challenges).
Database & Repository APIs: /videos/appengine-data-records/course/review.html, chapter2 at1:02 (staff bearer for supplier adapter).
CRM recipe: /tutorials-plan/course-content/courses/appengine-crm-apis/index.html (active reservation definition → available slot → booking).
These are paths in the same course catalogue server. Use your own addresses outside that local reader.

Use two ordinary customers in the same training organization. Create a reservation for customer A through the CRM booking procedure, with that customer's matching identity/contact. Save its returned sk, not display confirmation number. Customer B should have no booking. Check customer A can read its own reservation before testing customer B's404. Our recorded Mira/Nina IDs are evidence only. Customer signup/booking can trigger configured messages: use your deliberate training notification policy. This course reused an existing reservation; it does not claim a new booking creation demonstration.

## Run the server (Node20+, no dependencies)

```sh
export APPENGINE_ENDPOINT='https://YOUR_APPENGINE_HOST'
export ORG_ID='YOUR_ORGANIZATION_ID'
node gateway.mjs
```

Open http://127.0.0.1:4320/. The gateway binds loopback only. This is a local example address, not the AppEngine hosted API. Set PORT for another port and PUBLIC_ORIGIN to the exact external HTTPS origin when using your reverse proxy. The example enables Secure cookies on HTTPS. Do not change the server's trusted upstream based on client input.

The browser's /auth/signin calls AppEngine /profile/customer/signin. Success token stays in the server map. Only opaque gateway_session cookie reaches the browser. requiresTwoFactor or requiresPasswordChange returns409; complete those identity flows using the linked Foundations procedure. The starter does not include a full2FA/password UI. It uses a30-minute in-memory session; restart logs out everyone. Deployments need a shared expiring store, HTTPS, rate limiting, non-secret logging and the verification flow required by policy. Origin checks and SameSite complement the route allowlist; they are not a general authorization substitute.

## Run clients with real cookie sessions

Python3.10+ standard library prompts for email and password:

```sh
python3 client.py signin
python3 client.py profile
python3 client.py reservations
python3 client.py reservation YOUR_BOOKING_SK
python3 client.py logout
```

JavaScript: set CUSTOMER_EMAIL/CUSTOMER_PASSWORD privately, then node client.mjs signin, profile, reservations, reservation ID, logout. curl equivalent: sh client.sh followed by the same command. Set GATEWAY_BASE if changing the gateway's origin. Set COOKIE_JAR to different private paths for customer A and B. Do not manually inject AppEngine tokens into gateway cookies. Cookie files are sensitive and private; delete them after testing.

Import gateway.postman.json. Set gateway_base, customer_email, customer_password and reservation_id privately. Run the matching sign-in request first and retain Postman's cookie jar. The evidence collection includes deliberate401/404 tests; do not blindly run all requests expecting every response to be200. Never save a populated password variable into a shared export.

## TypeScript equivalent

The JS server works without installation. For the actual typed equivalent, install development dependencies in this example directory and build:

```sh
npm install
npm run build
cp portal.html dist/portal.html
node dist/gateway.js
```

The typed client builds to dist/client.js and accepts the same commands/environment. Stop the JS server before starting the TSserver on the same port.

## Supplier adapter (separate staff operation)

Start node supplier-fixture.mjs in a second terminal. Then:

```sh
export APPENGINE_ENDPOINT='https://YOUR_APPENGINE_HOST'
export ORG_ID='YOUR_ORGANIZATION_ID'
export STAFF_TOKEN='YOUR_PRIVATE_STAFF_TOKEN'
export SUPPLIER_URL='http://127.0.0.1:4311'
export SUPPLIER_KEY='tutorial-fixture-only'
export RESERVATION_ID='YOUR_CUSTOMER_A_BOOKING_SK'
node check-supplier.mjs RS-TEA-24
```

Success adds one timestamped, clearly labelled training note and separately reads it back. This is an intentional write; do not repeat blindly. EMPTY writes no note; FAIL returns503; wrong supplier key returns401. Supplier requests have5-second deadline; AppEngine requests15seconds. For timeout after possible write, inspect notes before retrying. No exactly-once guarantee exists: production jobs need persistent operation IDs, deduplication and reconciliation. No order, stock reservation or payment is created. The notes write uses staff identity and is not exposed in the customer gateway.

The actual working mode uses customer bearer Authorization server-side. App+customer dual headers are a source-reviewed alternative only and are not configured by this package. Never substitute a System credential for the required customer identity or expose unverified customer social-login claims through a public proxy.

## Course source publication

This folder contains the downloadable companion supplied with **AppEngine Custom API Gateway: Customer Sessions, Route Isolation and Server-Side Adapters**. Replace training identifiers and paths with your own. Recorded results are examples, not a live connection or credentials. Use the current [AppEngine API reference](https://appengine.appmint.io/documentation) for changing contracts. The course reader retains its verification limits.
