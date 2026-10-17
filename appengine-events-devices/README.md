# Events and Devices companion

This course-owned client uses current AppEngine operations. The isolated software rehearsal verified admission, duplicate/capacity refusal, exit/re-entry, benefit preview/redemption, fresh versus rotated QR, credential revocation, decision-only crew access and authenticated stream reconnect. Physical printer/lock output remains unverified. The existing Flutter reference is `appmint-examples/appmint_flutter_events_demo`; use its official Flutter client and gate-screen structure, while following the current contracts here rather than older comments about required CRM creation boilerplate.

## Session and identifiers

Complete [API Foundations §7 staff sign-in](/tutorials-plan/course-content/courses/appengine-api-foundations/script.md#7-sign-in-as-the-owner), including any verification or temporary-password replacement. Obtain the organization ID/backend address from that course. Keep the staff token on the trusted host; For the browser-to-host boundary, complete [Custom API Gateway §§5–7: opaque session, cookie lifetime and permitted routes](/tutorials-plan/course-content/courses/appengine-custom-api-gateway/script.md#5-sign-in-and-create-an-opaque-session). Its [review video](/videos/appengine-custom-api-gateway/course/review.html) provides chapter buttons at 1:57, 2:35 and 3:21.  do not paste it into a public page or download. This host uses the official JavaScript SDK's supported injected fetch and request interfaces, supplying an ordinary staff Bearer. It does not request a new System/app identity.

Use returned event `sk`, ticket-type `sk` and ticket `sk` for their record actions. The static printable ticket code is `ticket.name`. Select an existing controlled customer in Studio Customers and retain that customer record's `sk` for holderId; do not invent CUSTOMER_SK or use the staff user ID as a customer. An optional holder name is enough for the first bounded software exercise; notification behavior still requires the isolated disabled-delivery lab before replaying production-like customer data.

For the crew exercise, choose the actual staff user record in Users and retain its `sk`. The administrator needs Access-area permission to create credentials and mint the owned reader's key. That reader key is a separate secret, not the staff session. Use `triggers:[]` and omit request.trigger so no physical actuator is called.

## Read-only JavaScript start

Build the official `appmint-client/appmint_js_client` checkout using its package instructions; set APPMINT_SDK_MODULE to its built `dist/index.js` **file URL**. Set APPMINT_URL, APPMINT_ORG, STAFF_TOKEN and EVENT_ID in the host environment. Run `node read-event.mjs`. It reads the selected event, active ticket types and occupancy; it does not issue tickets or move anyone through a gate.

`events.mjs` supplies explicitly called workflows. `events.ts` demonstrates the same official typed request interface. `events.py` is a Python standard-library host client, not an invented Python Appmint SDK. Instantiate it with the same API address/organization/staff session and select the exact event, zone, entrance and benefit point.

## Meaningful sequence

1. `Venue.create` uses CRM with title/future startTime/endTime/timezone and the zone/scan-point definitions. Read its saved draft and publish/live through their built-in operations when ready. Create the ticket type as an `event_ticket_type` record with its real event link, active flag, capacity and re-entry policy.
2. Issue a free controlled ticket through the ticket action. `Venue.issue` intentionally omits email and sets skipNotification. The returned issue record is not a payment receipt.
3. `admit(code)` calls checkin directly, then rereads occupancy. Inspect decision.success; HTTP201/200 alone is not admission. If a request times out, inspect ticket/history before retrying an uncertain action.
4. `exit(code)` records the exit before a permitted re-entry. Configure capacity1 to demonstrate a second customer's capacity refusal without generating hundreds of records.
5. Only after admission use `benefit(code)` for a non-redeeming preview. `benefit(code,{redeem:true})` deliberately consumes the configured benefit; reread perks afterwards. Neither operation is a safe polling endpoint.
6. Import a unique owned credential, assign it using the selected ticketId, then call admitCredential at the separate wristband-gate configured with matchField credential_code. The front-gate uses ticket_code and must not receive a wristband code. Revoke the credential and verify refusal at the same credential point. The assign-by-QR helper is not proof of QR authenticity: this sample selects the already known ticket ID.
7. `badge(ticketId)` reads actual badgeData/template. `previewBadgeDispatch` pins adapter=console, returns physicalOutputVerified:false and never marks printed. The exact PrintPayload uses ticketType:label and line.kind; barcode uses data/type. A console adapter accepts many objects, so its acknowledgement cannot validate actual printer formatting.

## Hub and physical-output continuation

The linked Hub/Devices manuscripts are drafts; they are useful setup material, not proof that this course's physical outcome is complete. Existing recorded evidence at `videos/businessmade-usecases/bm-physical-devices/GATE.md` used the real hub agent with explicitly simulated FIFO peripherals.

The recorded public installer destination is `https://web.appmint.space/hub-agent/index.html`; the installer command in that evidence is `curl -sSL https://web.appmint.space/hub-agent/install | sudo bash`. Consult its maintained instructions for your supported machine. Supply its exact connection fields Server, OrgId, HubName and ApiKey from your own hub setup; protect the key and never show it in footage. Confirm hub live state (`GET /device-integrations/hubs/live-states`, then `/hubs/:hubName/state`) and the intended printer endpoint before dispatch. Adapter discovery is `/device-integrations/adapters` and `/adapters/configured`. Pin device/servicePoint/location rather than assuming the first printer belongs to your gate.

For real output, replace the explicitly pinned console adapter with the intended configured device, dispatch a badge, inspect the paper and verify name/code/layout/scannability, then call confirmBadgePrinted with operatorConfirmedPhysicalOutput:true. If paper is absent or unreadable, leave that flag unset and correct the device condition. No physical printer or lock may be controlled by this preparation pass.

## Offline checks

`node --test test.mjs` verifies the consequential workflow boundaries with a local fake transport, including no benefit preflight before admission, deliberate redemption, no write retry after uncertainty and no physical-output claim after console acknowledgement. It is not live API evidence.

## Reproduce the saved setup

Copy `venue-config.example.json` to `venue-config.json`. Set a unique type name, a future start/end and your intended timezone. Read the zone capacity, re-entry count, scan-point match field and lunch allowance before applying them. Use an owned isolated training organization with outbound delivery disabled; after verifying that boundary set `confirmIsolatedDisabledDelivery:true`. The runner also reads the provider configuration and refuses this rehearsal when that disabled-delivery boundary is absent. It never changes providers.

With the same trusted-host environment as the read-only example, run each step separately and inspect its returned record:

```sh
node setup-event.mjs create --apply
node setup-event.mjs type --apply
node setup-event.mjs publish --apply
node setup-event.mjs live --apply
node setup-event.mjs issue --apply
```

`venue-state.json` retains the actual event/type/ticket responses. Each command performs at most one write; existing steps are not replayed. An uncertain failure leaves `pending` set: inspect saved records before reconciling that state. Never clear it and retry blindly. These are explicit side-effecting setup commands, not an automatically running collection. The capture shows saved configuration and the maintained reference, while the corresponding setup requests and readbacks were separately rehearsed.

The recording-only `server.mjs` depends on private production fixtures and is excluded from the learner ZIP. Use `sdk-host.mjs` and the environment-driven runners in your own trusted host. No staff token belongs in a browser bundle. The course UI is an example integration, not Appmint Studio.

## Evidence and limits

The software rehearsal includes actual saved free tickets, entry/refusal/exit/re-entry, non-consuming benefit preview then redemption, old signed-QR refusal after admission, credential revocation, a keyed crew decision and suspension history. The authenticated `/device-events` stream connected and reconnected, and rejected an invalid session; no physical hub or device event was produced in that test. The current live-update allowlist does not establish Events occupancy push updates, so refresh the owned ticket/count after actions. A checkout can leave ticket status `checked_in` while `currentZone` becomes null; use the occupancy/movement data. Statistics include different scan kinds and are not a substitute for current headcount.

Console badge dispatch and crew `unlocked:false` are software outcomes. No physical badge, camera scan, RFID reader or door opening was demonstrated. Use the hardware acceptance steps above before making those claims in your deployment.

## Python, TypeScript, curl and Postman

For Python, import `Client` and `Venue` from `events.py`, construct the client from APPMINT_URL/APPMINT_ORG/STAFF_TOKEN in your process environment, and select your actual event ID, zone, entrance and benefit point. The workflow methods preserve the same explicit decisions and never automatically retry a write. For TypeScript, install/build the official `@appmint/js-client`, pass an initialized trusted-host client into the exported functions in `events.ts`, and use the same context object. The strict type check uses the official SDK; the Python adapter uses standard HTTP, not a claimed official Python package.

`requests.json` is the inspectable request catalogue. `sh requests.sh occupancy` reads the count using EVENT_ID; other request inputs use uppercase names such as TICKET_ID, TICKET_CODE, ZONE, ENTRANCE and BENEFIT_POINT. For a deliberate admission set ENABLED_ACTION=admit, then run `sh requests.sh admit`. The shell uses curl and shows the complete JSON response. It does not follow redirects or retry requests. HTTP success still requires inspecting decision.success or eligibility/claimed; preserve a refusal as a refusal.

The Postman v3 collection is `postman/collections/venue`. Supply your API URL, organization and actual identifiers in a private local environment; keep staff_token out of committed exports. Select individual requests. Each POST requires enabled_action matching its request name, including benefit-preview because eligibility checks can log attempts. Do not run the entire collection as a production workflow. Local CLI `postman collection lint postman/collections/venue` passed17requests with zero errors/warnings; this validates the files, not new live executions. The actual software outcomes are independently recorded by the isolated rehearsal described above.

## Run the included venue application

The ZIP contains the actual sample UI plus a separate environment-driven `venue-host.mjs`. The recording-only server remains excluded. Install the small host dependency with `npm install`, build the official JavaScript SDK separately, and set APPMINT_SDK_MODULE to its built module file URL. Set APPMINT_URL, APPMINT_ORG and STAFF_TOKEN in the host environment. Keep that token private.

Copy `venue-fixture.example.json` to your own private working config. Fill eventId/typeId and ticket id/code from `venue-state.json`, retaining the configured point IDs. Add more issued owned tickets to `capture` if exercising capacity/refusals. Set VENUE_FIXTURE to that file and run `npm start`; PORT defaults to4073. Open the local address printed by your host. The server returns sanitized event records to the page and keeps the staff session outside it. This sample binds loopback, uses a local HttpOnly/SameSite cookie and rejects cross-origin action requests. Production login, session expiration/renewal, HTTPS secure cookies and authorization belong to the linked Gateway implementation.

For crew actions additionally configure your own no-trigger reader/point/zone/credential IDs in the fixture and supply CREW_DEVICE_KEY privately in the host environment. Leave those fixture fields empty if you are only rehearsing event tickets; do not use crew actions until that setup is complete. Never connect the demonstration to a real actuator. All screenshots are this custom client reading real AppEngine outcomes, not Appmint Studio screens.


`crew.mjs` supplies the separate policy setup: createZone→createPoint→createReader(no triggers)→mintReaderKey→issueCredential. Choose unique names and the actual staff-user sk first. Each method is an explicit write; save its response and do not rerun a key mint or credential issue blindly. Keep the returned key private. The read method uses x-device-key with no trigger; inspect result and unlocked separately, then suspend the selected credential and read its history.

`device-stream.mjs` is a bounded20-second Socket.IO example. Supply HUB_NAME for your intended hub; it waits for explicit authentication and does not automatically admit anyone from a received event. No physical event is invented when a hub is absent. Filter actual incoming messages by your selected hub/endpoint and re-read current records after reconnect in your application. The source rehearsal verified authentication/reconnect only.

## Course source publication

This folder contains the downloadable companion supplied with **AppEngine Events and Devices**. Replace training identifiers and paths with your own. Recorded results are examples, not a live connection or credentials. Use the current [AppEngine API reference](https://appengine.appmint.io/documentation) for changing contracts. The course reader retains its verification limits.
