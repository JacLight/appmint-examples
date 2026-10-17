# AppEngine Logistics, Rental and Storage client examples

Build three connected applications with different business lifecycles: an equipment rental desk, customer/host box storage, and dispatcher/driver delivery. The runnable browser uses real AppEngine operations; the physical journey is simulated. No credentials or saved customer records are bundled.

## Start here

1. Open [Appmint Studio](https://studio.appmint.io), choose your development organization and obtain its assigned AppEngine origin. The API Foundations and Authentication courses explain supported sign-in, required challenges and session handling. A Studio web address and the backend API origin are different.
2. Use an authorized staff account for operations. Sign the renter, host and driver in separately through customer sign-in. Host application and driver approval establish eligibility; a customer account is not a staff token.
3. Use a dedicated training organization and controlled recipients. Verify its configured payment gateway is Stripe **TEST** before running the payment examples. The browser's staff payment proxy verifies the secret-key prefix on the server and never exposes it to the page. Customer confirmation uses the configured organization gateway: independently verify that configuration before enabling the sandbox demo.
4. Install Node 22+ for the browser or JavaScript runner, Python 3 for the Python runner, TypeScript for your TS app, or Flutter plus `http` for the mobile helper.
5. Open the maintained reference from your assigned backend's `/documentation` entry point. Find **Rental**, **Stowbo Client**, **Delivery** and **Logistics Client**. Consult current operation fields before building; this source demonstrates a complete flow rather than replacing the reference.

## Runnable browser

```sh
APPENGINE_API_ORIGIN='YOUR_ASSIGNED_BACKEND_ORIGIN' APPENGINE_SANDBOX_DEMO=1 node browser/server.mjs
```

Open the local address printed by the server. This address is only the development workbench; deployed clients use their own web origin. Use Connect account for each role. Tokens remain in memory and are lost on reload. The role selector selects a session already authenticated for that role; it grants no authority. A production customer/driver app must never receive the manager's session. The multi-role workbench is for developers demonstrating both sides.

The forms create an item/listing/driver, then use saved identifiers for subsequent operations. The recorded fixture uses two hand trucks ($15/day; fixed $20 deposit) and two storage units ($5/box/day; 100% upfront). Adjust the fixture and UI together for other rates. A provider test method must never be substituted for a real customer's consent or payment instrument. No payout endpoint is included.

## Portable requests: JavaScript, TypeScript, Python and Flutter

`http/operations.json` describes 54 current operations with the required actor, body and contract notes. `http/run.mjs` and `http/run.py` execute one named operation. `http/client.ts` is an importable client for React/web/React Native. `flutter/logistics_client.dart` uses the same manifest in Flutter; bundle the JSON as an asset and load it with `rootBundle.loadString`. Reuse your app's secure authentication/session storage.

Provide environment variables privately: `APPENGINE_API_ORIGIN`, `APPENGINE_ORG_ID`, plus `APPENGINE_STAFF_TOKEN`, `APPENGINE_CUSTOMER_TOKEN`, `APPENGINE_HOST_TOKEN`, or `APPENGINE_DRIVER_TOKEN` as required. Values referenced in braces are separate variables, such as `SKU`, `START_DATE`, `END_DATE`, `RENTAL_ID`, `BOOKING_ID`, `ITEM_ID` and `JOB_NUMBER`. The manifest says which response field supplies each identifier. Never paste tokens into source files.

```sh
SKU=MY-TRAINING-HANDTRUCK node http/run.mjs create_equipment --plan
# Inspect the exact request first; --plan does not contact AppEngine.
node http/run.mjs rental_price
python3 http/run.py rental_availability
```

Financial examples additionally require `APPENGINE_VERIFIED_TEST=1` **after** verifying your configured sandbox gateway and original payment references. The flag is an operator assertion, not a substitute for provider verification. Read-only plan mode is safe to use before connecting any account. CLI output contains actual business results; do not publish private results.

## Reproduce the full workflow

**Rental:** create equipment once → price and availability → create reservation → confirm → successful TEST fee charge → record that original payment → separate TEST deposit charge → link the deposit → checkout → checkin → refund deposit through its original provider → complete → read availability again. Save `data.name` as `RENTAL_ID`. Generic `payment` and `deposit/hold` operations record already collected funds; they do not charge a card. Finance charge amounts use cents; rental recording amounts use currency units. For a second reservation, cancellation and provider refund are distinct actions. A fixed deposit applies once to the rental, not once per quantity.

**Storage:** host eligibility/application → create listing → add A1/A2 units → activate → quote → cart → hold → confirmation with TEST payment → read saved booking and item records. Save `sk` as `BOOKING_ID`. Retry the same `CHECKOUT_ID` after a response interruption; do not create a new checkout blindly. Extend using the original booking and a later end date; the response is a summary, so read the booking again. Check in each item, record movement out, inspect its checkout statement, then close its stay. First collection leaves a two-item order active; the last completes it. Refund the original and extension payments by their own original references. A refund does not erase the bill or custody history, so the displayed balance can increase after returning money. A host bill credit is a different operation.

**Delivery:** customer driver registration → staff approval → driver online → server route quote → create with `requireSystemQuote:true` → staff offer → driver acceptance → start/arrive/complete pickup → start/arrive/complete dropoff → complete job → read job and linked earning. Save `data.jobNumber` as `JOB_NUMBER`. Delivered is not earnings completion. The dedicated training driver has no payout destination; completion records one internal earning, and repeated completion must not duplicate it. This course never spends the balance or requests a transfer.

## Follow the rejection rather than overwriting status

An unavailable rental returns a conflict. A storage hold may expire; request a new quote/hold only after inspecting the saved checkout state. Payment-required confirmation creates no paid booking. An extension checks extra capacity and payment before changing the stay. Checkout refuses while an item is present. A driver must be assigned and follow the stop sequence. Use these business operations for transitions; changing generic repository status fields bypasses their intended side effects.

## Evidence limits

Current production verifies live AppEngine records and Stripe test transactions in an isolated course organization. It does not establish physical delivery, live card settlement or external payouts. Route providers can vary by organization configuration. The exact source used in the film is retained with the course; maintained API reference is the authority for future changes.

## React and Flutter driver applications

`react-driver/` is a React interface for the driver's customer session: load an assigned job, accept, record pickup and destination proof, complete, and inspect internal earnings. Run `npm install`, then `npm run dev` from that folder. Enter the assigned API origin, organization and a customer token obtained through the linked authentication course; enter the job number supplied by dispatch. The backend must allow this development application's origin. No credential is bundled or persisted.

`flutter/` contains the matching mobile UI, API helper, and driver-only operation manifest. Run `flutter create --platforms=android,ios,web .` inside that folder to add platform runners, preserving the supplied `lib/` and `pubspec.yaml`; then `flutter pub get` and `flutter run`. The manifest is bundled as an asset. The demonstration keeps the customer token in memory; use your secure session manager for a deployed app. Device networking and the API's allowed-origin configuration must match your environment.

Both driver apps deliberately lack staff approval and payout controls. Dispatch prepares and offers the job using the browser workbench. The course's confirmation operations include example two-box proof text; replace those fixed examples with user-entered evidence before deployment. These sources are runnable companion implementations; the film shows the combined browser workbench, not a claim that a native app was recorded.
