# AppEngine API Troubleshooting and Local Verification

[← AppEngine course catalogue](/videos/course-catalogue/?product=AppEngine#developer-path)

**Outcome:** restore a customer booking-history view by tracing its actual request, correcting organization context, and fixing its response mapping. You will also distinguish identity, permission, ownership, setup, transport and retry failures. The course concerns AppEngine contracts and integration boundaries; it does not require changes to AppEngine source.

The reference application uses an existing cancelled booking. The saved record remains unchanged throughout this diagnosis. The visible final result is that the owning customer can see the same record, reference, status and time that AppEngine returns. New booking creation, rescheduling and cancellation are covered by the linked CRM/client courses.

## Before you begin

[Download the runnable examples, Postman collection and observed JSON](/videos/appengine-api-troubleshooting-usecase/course/api-troubleshooting-examples.zip). Extract the archive, open a terminal in `api-troubleshooting-examples`, and run commands below from that folder. The customer reference app requires Node.js 20 or later; the Python and curl alternatives can be used independently. TypeScript compilation additionally installs the pinned development dependency.

```bash
cd api-troubleshooting-examples
```

Have an existing booking and its owning **test customer**, your AppEngine endpoint, and your organization ID. The primary exercise performs reads only. A second test customer is optional for the ownership check; never substitute an unrelated person's credentials. If no test booking exists, first follow the linked CRM lesson to create one deliberately, including its notification settings, then return here.

## Obtain the right AppEngine context

Open [Appmint Studio](https://studio.appmint.io/) for your organization. Obtain its actual organization ID and AppEngine endpoint from your account or administrator; the Studio website address is not the API base URL. [AppEngine Introduction — section 8, Getting started](/videos/course-catalogue/materials/appengine-developer-course-script.html#8-getting-started-account-address-token-and-first-request) explains account and organization setup. [Authentication — customer-session lab](/videos/course-catalogue/materials/appengine-auth-org-isolation-script.html#run-the-complete-customer-session-lab) explains customer sign-in, challenge completion and session renewal. Use an ordinary customer session belonging to the saved booking you intend to inspect.

For an organization with a booking already saved, sign in as its owning test customer. Obtain its record ID from `GET /client-data/reservations`: use the record's `sk`, not the displayed booking reference in `data.name`. An existing cancelled booking remains a valid history record. This exercise does not create, reschedule or cancel a booking. The [CRM API course](/tutorials-plan/course-content/courses/appengine-crm-apis/script.md) covers those actions separately.

Set private environment variables on your own development machine. `.env.example` contains placeholders; no tool here automatically loads that file. Set your values in the terminal or your development environment. Do not commit actual tokens, paste them into shared screenshots, or enable shell tracing around authenticated requests.

```bash
export APPENGINE_ENDPOINT='https://YOUR_APPENGINE_ENDPOINT'
export ORG_ID='YOUR_ORGANIZATION_ID'
export CUSTOMER_TOKEN='YOUR_PRIVATE_OWNING_CUSTOMER_TOKEN'
export BOOKING_ID='YOUR_SAVED_BOOKING_RECORD_ID'
```

Start the reference client after setting the variables:

```bash
npm start
```

Open the loopback address printed by the process. This address is your local teaching client; it is not the AppEngine endpoint. Keep the process running while using the exercise. The server only forwards the configured booking read, keeps its customer token out of browser configuration, and supplies deliberately selectable diagnostic failures. The reference client is provided here; you do not have to build one before following the lesson.

## 1. Start with the customer's actual failure

A page saying “We couldn’t load this booking” does not establish which system failed. Here the page is a supplied reference application calling an actual AppEngine deployment. Its request inspector is a course diagnostic tool; it is not an Appmint Studio menu.

Open the reference client with its incorrect-organization and old-response-adapter settings. Press **Reload booking** once. Then open **Request inspector**. The customer sees the generic error while the inspector shows the exact AppEngine route and 401 answer. Preserve the method, path, selected organization, status and body. Keep private token values out of shared recordings and logs.

![Actual reference-client failure and 401 organization response](/videos/appengine-api-troubleshooting-usecase/production/qa/organization-4k.png)

In your own website, inspect the triggering request in the browser's Network panel. If it calls your proxy, follow the matching upstream request in your server logs as well: browser→proxy and proxy→AppEngine are two different hops. A proxy-generated 502, a CORS failure and an AppEngine 401 are not the same event. Copy the failing request for a local replay, retaining the original payload and context privately. Do not copy credentials into a support ticket.

## Use the maintained reference beside your implementation

Open [Appmint documentation](https://docs.appmint.io/appengine/overview.html), then its [hosted API reference](https://appengine.appmint.io/documentation). Search `client-data/reservations` and compare the list with the detail operation. The reference is the place to check the current identity requirements, parameters and response description; this course teaches how to diagnose the specific boundary and verify its result, rather than asking you to memorize a frozen schema.

[Client account — Who “me” is](https://docs.appmint.io/appengine/modules/client-account.html#who-me-is) explains how the request resolves the customer. The direct diagnostic sends an ordinary customer bearer session. A server integration that also carries its application token uses `x-client-authorization` for the separate customer session. Inspect this distinction before substituting credentials: staff success is not proof of customer access.

[Take bookings with reservations](https://docs.appmint.io/tutorials/take-bookings-with-reservations.html#1-create-a-reservation-definition) explains the dependency chain behind the configuration test. The saved definition supplies its ID, exact service names, hours and timezone. The [slots action](https://appengine.appmint.io/documentation#POST%20/crm/reservations/slots) calculates availability from that configuration. Its `201` response is not proof of a created booking. The selected slot’s UTC values and `businessTimezone` must retain their meaning when rendered or later submitted. Completing a reservation belongs to the linked reservation course; this diagnostic repairs a read of an existing cancelled booking.

## 2. Verify the server and organization before changing records

Use the endpoint obtained from the organization setup, not the Studio website URL. Read `GET /version` with your organization context and preserve its actual answer. A successful version read identifies a responding deployment; it does not establish permission to read a customer's data or prove every dependent service is healthy.

The failing booking request carries an organization that does not match the customer identity. AppEngine returns 401 with `Customer identity does not belong to this organization`. Correct the release configuration to the intended organization; do not search unrelated organizations or substitute a more privileged token.

In the course client, select **Matching organization**, retain **Current customer**, and reload while leaving the old response adapter selected. AppEngine now returns 200. The customer screen still fails. This is useful evidence: one boundary is corrected, and the remaining problem is in how the client consumes the result.

![AppEngine returns 200 while the old response adapter fails](/videos/appengine-api-troubleshooting-usecase/production/qa/contract-4k.png)

## 3. Verify the caller with the intended identity

Read `GET /client-data/profile` using the same organization and customer token. Confirm the expected customer. A successful staff read through Repository does not prove the customer's route works; retain the intended customer identity for this verification.

The separate **Invalid session** control produces the recorded 401 `Invalid or expired authorization`. Restore **Current customer** afterward. This control substitutes an invalid request credential; it does not expire or renew the actual account session. In a real client, use the documented customer refresh/sign-in lifecycle and complete any challenge, then repeat the same operation. Do not label every 401 “expired”: a valid token for a different organization also produces 401 here.

![Actual invalid-session response](/videos/appengine-api-troubleshooting-usecase/production/qa/session-4k.png)

## 4. Read the exact response contract

The customer detail route is `GET /client-data/reservations/{reservationId}`. Its successful response is a record directly:

```json
{
  "sk": "YOUR_SAVED_RECORD_ID",
  "data": {
    "name": "YOUR_BOOKING_REFERENCE",
    "service": "Private session",
    "status": "cancelled",
    "startTime": "2026-10-20T17:00:00.000Z",
    "timezone": "America/Los_Angeles"
  }
}
```

This example shows selected contract fields. The observed JSON download contains the actual response. `sk` identifies the saved record; `data.name` is the display/reference code. They are not interchangeable. A cancelled booking can remain in history. Reading that status is not a request to cancel it again.

The old client assumes `response.booking`. That property is absent. The correction passes the returned record to the adapter, which reads its fields under `record.data`. The list route returns a result containing `data` rows; the detail route returns one record whose `data` contains fields. Do not assume that both uses of `data` mean the same structure.

## 5. Apply the client correction and show the result

Open `client.mjs` (or the typed equivalent `client.ts`) in the extracted companion and find `bookingView(record)`. It checks that the record ID and required data fields are present before mapping the view. In the reference app, **Current response adapter** selects that implemented function. Choose it and press **Apply and reload**. The existing booking appears immediately; the request inspector still shows the same successful 200 JSON.

![Actual repaired customer view and matching AppEngine JSON](/videos/appengine-api-troubleshooting-usecase/production/qa/repaired-4k.png)

Compare the record/reference, service, cancelled status, start time and time zone. The example displays 10:00 AM in America/Los_Angeles for 17:00 UTC. A green HTTP badge alone would not verify those fields. Close the inspector and reload from the customer's view once more. No new booking was created to hide the original defect.

## 6. Verify permission and ownership separately

The recorded customer call to `GET /repository/org/{orgid}` returns 403. The final path segment is the same organization ID sent in the `orgid` header. This is an organization-record route used by staff; it is not the customer profile route. That refusal establishes a route boundary; it is not solved by leaking staff credentials into a customer app. Use a route intended for the caller or have an administrator assign the legitimate staff capability where appropriate.

For this customer reservation detail route, the owning customer receives 200, while another owned test customer receives 404 for the same ID. Current source intentionally makes absent and inaccessible records indistinguishable. A 404 therefore does not prove a booking was deleted. The current detail implementation also requires a customer identity and validates the 24-character record ID; the malformed-ID case returns 400. Keep these route-specific facts separate from general status-code conventions.

The Postman collection includes an **Optional boundary checks** folder:

1. **Customer to organization record** reuses your customer token on `/repository/org/{{orgid}}`; the observed course result was 403.
2. **Malformed reservation ID** reads `/client-data/reservations/not-a-record-id` with the owning token; the course result was 400. It does not attempt a write.
3. **Same booking as another customer** keeps `bookingId` and `orgid` unchanged and uses `otherCustomerToken`. Set that variable privately to a second customer you control in the same organization, then run only this request. The course observed 404, compared with 200 for the owner. Do not run this optional check with the default empty token: that tests missing authentication, not ownership.

These expected answers are recorded facts from the course deployment. If your deployment answers differently, retain the original answer, check its current reference/version, and investigate rather than labelling it a successful isolation check. Return to the owner's **Customer booking detail** request to complete the original exercise.

## 7. Diagnose the configuration an operation actually reads

AppEngine's public reservation definitions identify active bookable services. Read the intended definition and inspect its real service names, workdays, hours and timezone before requesting slots. Sending `Follow-up` when the saved service is `Private session` returns 400 `Service type "Follow-up" not found.`

Correct the request to the configured service when that is the intended operation. If the product actually needs a new service, configure it through the Reservations module with appropriate authorization and then repeat the request; do not silently rename a production service during diagnosis. This course's controlled check uses the existing service and does not alter configuration.

In Postman, run **Public bookable definitions** with the intended organization. Find the intended active definition, set `definitionId` to its saved `sk`, and set `serviceName` to an entry's exact `data.services[].name`, not its title or display label. Read `data.officeHours.timezone` and `data.workDays`; choose `serviceDate` as YYYY-MM-DD in that business's calendar. A matching text label from a different definition does not identify the same service.

Call **Read available slots**, `POST /crm/reservations/slots`, using those values. The request body is already supplied in the collection:

```json
{
  "reservationDefinitionId": "{{definitionId}}",
  "serviceName": "{{serviceName}}",
  "serviceDate": "{{serviceDate}}"
}
```

These are Postman variables, not literal AppEngine IDs. Keep optional location/party-size settings aligned with the actual service configuration if you add them; consult that deployment's operation schema. The observed 201 response describes available slots. It does not save a booking. Read the definition and response for timezone, activity and capacity; an empty list can be a legitimate business outcome rather than a transport failure. The CRM API course covers creating and verifying a booking after availability is known.

## 8. Complete the replay and regression check

The runnable language clients below reproduce the same version/profile/detail reads. Keep the failure body even when the status is not successful. The provided regression check rejects the obsolete wrapper, retains plain-text errors, distinguishes an HTTP refusal from a transport exception, and verifies that the diagnostic helper does not silently retry. Then repeat the original customer action and inspect the exact saved outcome.

A useful incident note records the original operation, context without secrets, observed status/body, one cause at a time, the precise correction and the saved/customer-visible result. Do not write “fixed” merely because a different request or more privileged identity succeeds.

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

## Production evidence and scope

Four real reference-client states were independently exercised and captured at 3840×2160. JavaScript, compiled TypeScript 5.9.3, Python and curl read the same existing owned cancelled booking; the equivalent Postman collection is supplied without claiming a separately filmed Postman GUI run. Focused local regression tests passed. No new reservation, notification, account or organization-setting write is part of this revised course.

Current source references: `appengine/src/client-account/client-account.controller.ts`, `client-account.service.ts`, `crm/reservations.service.ts`, `middlewares/current-user.middleware.ts`; existing client transport and error handling in `appmint-client/appmint_js_client/src/transport.ts` and `errors.ts`. The captured no-org version request returned plain-text 404 despite common middleware code having a structured missing-org branch. Therefore this course teaches inspection of the actual route/deployment response rather than promising one error envelope or one universal sequence for every request.

The companion’s `observed-json` folder contains the captured detail, session, organization and boundary responses. Start with `16-customer-detail.json`, `22-wrong-org-customer.json`, `07-invalid-session.json`, `08-customer-staff-boundary.json`, `20-not-found.json` (a **malformed-ID 400**, despite its historical filename), and `21-other-customer.json`. These synthetic recorded results include their actual method/path/status; replace identifiers when running your own requests. Missing-service and no-organization-version responses are included separately.

The course video remains in production. These screenshots and written steps are completed evidence; they are not a finished export.
