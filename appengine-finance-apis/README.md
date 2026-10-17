# AppEngine Payment and Finance APIs

Companion clients for the course: a staff payment desk, a customer wallet, and payout review. The examples use AppEngine business operations and saved outcomes rather than replacing its business records with custom collections.

## Prerequisites

Use your assigned AppEngine backend and organization ID. Sign in with separate staff and customer accounts. Use the course reader’s API Foundations prerequisite for sign-in challenges and caller types, and the [maintained API reference](https://appengine.appmint.io/documentation) for current fields. Do not use the Studio website URL as your backend merely because it is where you sign in to administration.

Prepare a location and one service SKU using the Business Operations course. Our fixture is a tax-free $80 service. Configure Stripe TEST for collections, PayPal sandbox for payout submission, and Plaid sandbox for bank verification. Staff capabilities are separate from the customer's own wallet routes. Never put a staff token in a distributed customer or mobile app.

## Full browser application

```sh
cd browser
APPENGINE_API_ORIGIN=https://YOUR_ASSIGNED_BACKEND APPENGINE_SANDBOX_DEMO=1 node server.mjs
```

Open the local URL printed by the server. Use **Connect an account** twice, choosing the correct actor each time. Sessions stay in that browser tab's session storage. Password fields clear after successful signin. This local development proxy is not a production authentication gateway.

The customer opens their own wallet first; its returned ID identifies the same wallet when switching to staff. Staff read it with staff routes and can record the isolated training credit, hold/release and freeze/unfreeze. The seed-credit button refuses a wallet with previous activity because credit is not idempotent. For a production credit source, design deduplication and reconciliation around the originating business event.

The payment desk accepts your actual location identifier and SKU. Keep its tab request key stable for a retry. It records $30 cash, collects $50 with the Stripe TEST `pm_card_visa` fixture and links the returned reference to the tab. Production customer card capture belongs in the provider's supported payment UI; the companion does not collect raw card details.

The refund operation uses the original payment transaction plus a stable operation key. Retry identical input; changing its amount with the same key returns 409. Authorization/capture/void examples use minor units at the raw finance endpoint. The UI converts its labelled USD fields to cents.

The wallet connects a bank through official Plaid Link. AppEngine creates the Link token; the frontend returns the provider public token and account ID to AppEngine. Only masked destination details are displayed. PayPal destination saving is shown separately from verification. Payout requests reserve funds; staff approval, provider submission and provider completion are different states.

The controlled proxy checks configured Stripe TEST and PayPal sandbox before provider operations. It does not expose organization-wide payout scheduling, bank-sent, settlement or return actions. ACH generation only builds the file; the file contains bank details and must remain private. Do not upload the synthetic course file to a bank.

## JavaScript, TypeScript and Python

`http/operations.json` contains 36 named contracts with the exact caller, method, path, example body and recovery note. `client.ts` is a typed fetch adapter for browser/server clients. The JavaScript and Python runners default to a plan; writes require `--execute`.

```sh
export APPENGINE_API_ORIGIN=https://YOUR_ASSIGNED_BACKEND
export APPENGINE_ORG_ID=YOUR_ORGANIZATION
# Set APPENGINE_CUSTOMER_TOKEN or APPENGINE_STAFF_TOKEN privately.
node http/run.mjs my_wallet
node http/run.mjs my_wallet --execute
python3 http/run.py my_wallet --execute
```

Placeholder values such as `ORDER_ID`, `PAYMENT_REF`, `METHOD_ID` and `REFUND_KEY` come from your own prior responses. Route placeholders are URL-encoded. Provider test operations additionally require `APPENGINE_VERIFIED_TEST=1` after you verify the gateway and the original reference. This flag is an explicit local assertion, not proof that a provider is sandbox; the full browser proxy performs its own config check.

Do not run the entire manifest as a batch. Creation, credit and some payment operations are not idempotent. Inspect a saved result before retrying an interrupted call. `ach_file` returns private account data; redirect it to a protected file instead of a shared terminal log.

## React customer wallet

```sh
cd react-wallet
npm install
APPENGINE_API_ORIGIN=https://YOUR_ASSIGNED_BACKEND npm run dev
```

The React app signs in a customer, reads their own wallet and masked destinations, requests a payout and refreshes request status. It does not receive a staff token or provide staff approval. Configure a destination in the full browser example first. `npm run build` produces the client bundle; configure your deployment's API proxy and customer-session policy before serving it.

## Flutter customer wallet

```sh
cd flutter-wallet
flutter pub get
flutter create . --project-name appengine_finance_wallet --platforms=android,ios,web
flutter run
```

Enter your assigned HTTPS backend and organization, then sign in as a customer. The app displays total/held/reserved/available balances, saved destinations and payout requests. It uses the same own-customer routes as React. Platform project generation is local; retain the supplied `lib/main.dart` and `pubspec.yaml` if Flutter offers changes.

This Flutter sample covers wallet and payout requests. The full browser sample demonstrates bank connection. A native production bank-consent integration needs Plaid's supported mobile SDK and its platform configuration; no mobile provider consent is claimed by this sample. Keep tokens in platform secure storage for a deployed app rather than expanding this training example's in-memory token handling.

## Verified boundaries

The course uses real AppEngine writes and provider sandboxes. Training referral credit is explicitly labelled. The first PayPal rehearsal reached processing with a provider reference. A later distinct payout failed with a duplicate sender-batch identifier; that failure is preserved as an application finding and is not presented as a paid transfer. Do not retry a failed or uncertain provider operation without reconciling its existing provider identity. The generated ACH file is not transmitted. No gift card, live bank transfer, tax filing or production credentials are included.

## Retry and pagination limits

The browser persists an attempted marker before card charge or authorization. If a response is lost, reconcile that attempt against the provider and business document before clearing the marker; do not assume a network error means no charge occurred. A saved credit reference is descriptive, not an idempotency guarantee. Staff controls are hidden in customer mode; the server still enforces authorization independently. Only staff cancel a pending request in this sample.

The sample lists the first page of wallet activity and payout history. A production history screen must implement the current reference’s pagination contract rather than assuming this list is complete. The customer’s own wallet and masked destinations are separate from staff management routes.
