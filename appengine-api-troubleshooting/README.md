# AppEngine API Troubleshooting and Local Verification

Use these examples to diagnose a customer-facing request without modifying the record. JavaScript, compiled TypeScript, Python and curl were executed against the same existing, owned booking. Postman contains the equivalent requests. The observed JSON folder contains recorded results from the controlled course environment; it is evidence, not a substitute for running your own request.

## Before you begin

[Download the runnable examples, Postman collection and observed JSON](/videos/appengine-api-troubleshooting-usecase/course/api-troubleshooting-examples.zip). Extract the archive, open a terminal in `api-troubleshooting-examples`, and run commands below from that folder. The customer reference app requires Node.js 20 or later; the Python and curl alternatives can be used independently. TypeScript compilation additionally installs the pinned development dependency.

```bash
cd api-troubleshooting-examples
```

Have an existing booking and its owning **test customer**, your AppEngine endpoint, and your organization ID. The primary exercise performs reads only. A second test customer is optional for the ownership check; never substitute an unrelated person's credentials. If no test booking exists, first follow the linked CRM lesson to create one deliberately, including its notification settings, then return here.

## Obtain the right AppEngine context

Open [Appmint Studio](https://studio.appmint.io/) for your organization. Obtain its actual organization ID and AppEngine endpoint from your account or administrator; the Studio website address is not the API base URL. [AppEngine Introduction — Getting started](/videos/course-catalogue/materials/appengine-developer-course-script.html#8-getting-started-account-address-token-and-first-request) explains account and organization setup. [Authentication — customer-session lab](/videos/course-catalogue/materials/appengine-auth-org-isolation-script.html#run-the-complete-customer-session-lab) explains customer sign-in, challenge completion and session renewal. Use an ordinary customer session belonging to the saved booking you intend to inspect.

For an organization with a booking already saved, sign in as its owning test customer. Obtain its record ID from `GET /client-data/reservations`: use the record's `sk`, not the displayed booking reference in `data.name`. An existing cancelled booking remains a valid history record. This exercise does not create, reschedule or cancel a booking. The [CRM API course](/tutorials-plan/course-content/courses/appengine-crm-apis/script.md) covers those actions separately.

Set private environment variables on your own development machine. `.env.example` contains placeholders; no tool here automatically loads that file. Set your values in the terminal or your development environment. Do not commit actual tokens, paste them into shared screenshots, or enable shell tracing around authenticated requests.

```bash
export APPENGINE_ENDPOINT='https://YOUR_APPENGINE_ENDPOINT'
export ORG_ID='YOUR_ORGANIZATION_ID'
export CUSTOMER_TOKEN='YOUR_PRIVATE_OWNING_CUSTOMER_TOKEN'
export BOOKING_ID='YOUR_SAVED_BOOKING_RECORD_ID'
```

## Run the same read in each language

Node 20 or later:

```bash
node diagnose.mjs
```

TypeScript 5.9.3 is pinned in package.json. Install the development dependency once, then compile and run:

```bash
npm install
npm run typecheck
node --input-type=module -e 'import {diagnose} from "./dist/client.js"; console.log(JSON.stringify(await diagnose(process.env.BOOKING_ID), null, 2));'
```

Python 3.10 or later, standard library only:

```bash
python3 client.py
```

curl with `--fail-with-body` support:

```bash
bash diagnose.sh
```

JavaScript, TypeScript and Python return selected version/profile/booking fields. curl prints the actual booking response; it deliberately preserves a failed request's response body while returning a nonzero exit status. No `jq` is needed. The record is returned directly as `{sk, data, ...}`; the client does not invent a `booking` wrapper.

## Postman

Import `postman.json`. Set endpoint and orgid to your own values. Keep customerToken in a local secret/vault variable rather than saving it into a shared collection. Set bookingId to the exact `sk` from your customer's list. Run Version, Customer profile, then Customer booking detail. The detail requires the owning customer session; public definitions and available-slots reads use organization context without attaching a private customer session.

To inspect service configuration, set definitionId from the public definitions result, serviceName from that definition's actual services, and serviceDate to a future day in YYYY-MM-DD form. **Read available slots is a POST that calculates availability; it does not create a reservation.** Its observed HTTP 201 therefore does not prove a booking was saved. Inspect the operation and response body, not the success number alone.

The **Optional boundary checks** folder adds three read-only comparisons: customer on `GET /repository/org/{orgid}`, malformed reservation ID, and the same booking with `otherCustomerToken`. Use a second test customer you control in the same organization; an empty token checks authentication, not ownership. Recorded course answers were 403, 400 and 404 respectively. Restore the owning customer's detail read afterward. See `COURSE.md` for the interpretation and recorded evidence.

## Open the customer reference application

```bash
npm start
```

Open the local address printed by the process (default port 4376). The server binds only to the loopback interface. Its request inspector can select an incorrect organization, invalid customer session, or old response adapter. These intentionally controlled failures apply only to the one configured record read.

1. With Incorrect organization selected, reload and inspect the actual 401 response.
2. Select Matching organization and Current customer. With the old adapter still selected, AppEngine returns 200 but the screen cannot map the result.
3. Select Current response adapter and reload. The existing booking should appear with the same record/reference, service, status and time as the JSON.
4. Select Invalid session separately to inspect the identity failure. Restore Current customer afterward; the control never signs anyone in or out or changes a server session.

This inspector is a teaching tool in the supplied reference application, not an Appmint Studio feature. It forwards real reads to AppEngine and redacts its Authorization display. Do not publish development diagnostics or private server environment variables to your customers.

## Diagnose the boundary, then repeat the original read

- Connection fails before any HTTP response: inspect address, TLS, proxy/CORS and transport timeout. Absence of a response does not prove a write never reached the server.
- **400**: inspect the endpoint's exact fields and setup. In this course an invalid reservation ID and a missing service produce different 400 messages.
- **401**: inspect session validity and organization membership. The response is not a reason to switch to a staff or system token for a customer screen.
- **403**: the caller is not permitted to use that route. Keep the intended identity and use the appropriate route or legitimately assigned role.
- **404**: for customer reservation details, absent and unowned records are intentionally indistinguishable. A 404 is not proof a record was deleted.
- **200** with a failed screen: inspect the returned contract and the client's mapping. Detail records and paginated lists have different shapes.
- **409/429/5xx**: follow the operation's documented conflict, throttling or availability contract. Do not treat every conflict as 409: reservation slot contention currently uses a 400 `SLOT_TAKEN` response. These additional status classes are explanatory references; no artificial outage was introduced to the live platform.

The helper deliberately performs no automatic retry or token refresh. This exposes the original response during diagnosis. For a live application, apply bounded read retries only when the failure is transient; session renewal belongs to the authentication lifecycle. For a timed-out create/payment/receipt action, reconcile its actual saved identity before considering another write. [External API Integration — Recovery exercises](/videos/course-catalogue/materials/supplier-api-script.html#recovery-exercises) demonstrates durable uncertainty and exact-reference reconciliation.

## Existing Appmint clients

The platform's JavaScript client under `appmint-client/appmint_js_client` has a browser proxy boundary and separate application/customer identities. Its `AppmintError` preserves status, code and body; `AppmintNetworkError` indicates there was no usable response. Inspect both browser→proxy and proxy→AppEngine when using it. Its server transport may renew the application token once on 401, so an initial trace and the final exception can differ. The plain request clients supplied here expose the same route contracts with an ordinary bearer customer session, avoiding an extra application credential prerequisite for the diagnosis.

## Verify your correction

```bash
npm test
```

The focused regression checks cover direct-record mapping, rejection of the obsolete wrapper, preservation of plain-text errors, a failure that is not silently retried, and the distinction between an HTTP refusal and a transport exception. A passing local test is only part of the result. Repeat the customer's original action, inspect the saved record through the owning session, and show the visible page result. Preserve the failure evidence and the exact change in a short incident note.

## Course source publication

This folder contains the downloadable companion supplied with **AppEngine API Troubleshooting and Local Verification**. Replace training identifiers and paths with your own. Recorded results are examples, not a live connection or credentials. Use the current [AppEngine API reference](https://appengine.appmint.io/documentation) for changing contracts. The course reader retains its verification limits.
