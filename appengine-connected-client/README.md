# AppEngine connected web and mobile client

This reference application consumes AppEngine customer identity and reservation APIs. It is not a replacement SDK. `flutter/lib` reuses `AppmintAuth`, the official sign-in/challenge result types, refresh callbacks and the official `SessionStore` interface from `appmint_flutter_client`.

## Prerequisites and setup

Obtain your organization's AppEngine endpoint and organization ID from the Introduction/API Foundations course. Use a staff configuration administrator to create an active reservation definition with a service, duration, working weekdays, opening/closing hours, timezone and capacity. Keep the returned definition ID and exact service name. Customer accounts are separate from that staff account. Do not embed a staff token in the client.

Use only a training service for rehearsal. The revised course definition offers Room planning (30minutes) and Whole-home consultation (60minutes), each with a15-minute buffer, capacity1, Monday–Friday09:00–17:00, America/Los_Angeles and price0. It references the configured intake collection cc_intake_1011. Test a future working day. Production notification delivery requires your own configured provider; a queued notice does not prove delivery.

## Run the official Flutter integration

Install Flutter. This download includes an unchanged snapshot of the official `appmint_flutter_client` package under `vendor/`, with repository commit and file hashes in `COURSE-PROVENANCE.json`. The Flutter project's relative path dependency points to that package. From this package’s root, run `cd flutter`, then `flutter pub get`. To use your own current official checkout, change that path deliberately and rerun the integration checks.

Create an uncommitted JSON configuration with APPENGINE_URL, APPENGINE_ORG, DEFINITION_ID and BOOKING_DAY (`YYYY-MM-DD`). Use the HTTPS endpoint supplied for your organization. Do not put passwords, staff tokens, app secrets or customer tokens in compile-time defines. Run:

```sh
flutter run -d chrome --dart-define-from-file=/your/private/public-config.json
flutter run -d YOUR_IOS_DEVICE --dart-define-from-file=/your/private/public-config.json
```

For example, public-config.json contains `{"APPENGINE_URL":"https://YOUR_ASSIGNED_API_HOST","APPENGINE_ORG":"YOUR_ORGANIZATION_ID","DEFINITION_ID":"YOUR_SAVED_DEFINITION_SK","BOOKING_DAY":"2026-11-02"}`. Replace the endpoint, organization and saved definition ID, and choose a future working day for your run. These are public connection/selection settings, not credentials.

Enter customer credentials in the application. A verification challenge displays its own code screen; a challenge is not a signed-in session. The browser uses memory-only sessions, so reloading requires sign-in. Native uses `CustomerSessionStore`, an implementation of the official interface backed by OS secure storage, including remembered sessions. The adapter returns mutable lists because the official authentication layer updates them when remembering a session. This host adapter does not change SDK authentication endpoints.

`CustomerTransport` supports this deployment's ordinary customer Bearer token in Authorization plus `orgid`. It retains official auth refresh callbacks. The SDK's default transport also supports a different app-key bootstrap; this sample deliberately provides its ordinary-customer transport to the public `AppmintAuth` constructor. Do not invent System credentials to run it.

Native iOS booking/change/cancel/isolation/refresh has been tested in the course's owned simulator. Android uses the same Flutter source but has not yet been independently run for this course. To explore Android, first generate its host project with `flutter create --platforms=android .` in the Flutter example, then test on your own device; that is an unverified alternative, not part of the filmed iOS result. Do not interpret web responsive layout as native verification.

## HTTP equivalents

`http/client.mjs`, `client.ts` and `client.py` expose signIn/sign_in, definitions, slots, book, mine, read, move, cancel and refresh. JavaScript needs Node20+, Python uses its standard library; TypeScript needs a compiler/runtime with fetch and DOM types. They show the reservation HTTP contract, while the Flutter package provides richer authentication/challenge orchestration. If signin returns a challenge, finish it using the Authentication course before calling customer-owned routes. Never interpret that response as a token.

`http/postman.json` imports into Postman. Set local sensitive variables for email/password/token/refresh_token; do not export real values. `requests.json` contains the full request bodies and paths. `requests.sh` prints JSON directly and preserves HTTP failure. Select calls deliberately; do not run all writes against an existing live booking.

## Follow a saved booking

1. Read definitions and choose the intended ID. Read slots using `reservationDefinitionId`, `serviceName`, `serviceDate`.
2. Display the returned instants in the returned business timezone, using timezone data rather than the device's current offset.
3. Resolve the selected definition's Form collection and render its schema. Validate and preserve the resulting answers. Create using the definition ID, `service`, exact slot start/end and `form` answer map. Note the slot request uses `serviceName`. The customer session identifies the owner.
4. Read the returned `sk` through `/client-data/reservations/:id`. Show this saved record's reference, time, status and form answers.
5. Sign in to the same organization as the same customer on another device. Read the list and the same record.
6. Reschedule by ID with a fresh available startTime. Read back; identity/reference remain stable while time and history change.
7. Read ownership, then cancel through the email+reservation-code route. Read back `cancelled`; history remains.
8. A separate customer must not see the first customer's booking in their list; owned-detail and authenticated-reschedule attempts should return404.

## Contracts and recovery

Availability is not a hold. A create may be refused when a slot fills; reload availability and preserve the error. After a network-unknown create, inspect saved bookings before retrying. A400 is not an empty list. A401 means session/authentication needs attention. A404 from an owned route can mean either absent or inaccessible.

Cancellation's email+code route is capability-style. The client first reads the owned detail, but this does not alter authorization of the direct public cancellation endpoint. For a server gateway, enforce ownership there too; do not claim token-only cancellation isolation. The course tests ownership on customer detail/list and ID-based reschedule separately.

Signout clears this client's active session; it does not assert global revocation. The official SDK retains remembered accounts. For an explicit forget-account action call `auth.forgetSession(email, orgId)` as well; the current sample UI has no remembered-account picker. A refreshed token is verified by a subsequent profile/reservation read. Notices arrays represent notification work, not proof of external delivery.

## Source package hygiene

Do not distribute generated build folders, Generated.xcconfig, flutter_export_environment.sh, .dart_tool or private test defines. They may contain compile-time test credentials. The integration test uses separately provided training credentials; these are never included in this companion. No app source or SDK source was changed to make the example work.

## Staff setup request

`setup/intake-collection.json` and `setup/consultation-definition.json` are the current two-service example. Send the collection first and the definition second using your configuration administrator's staff session to `POST /repository/create`. `setup/reservation-definition.json` is the preserved original single-service example and does not supply the configured intake flow. Keep the returned `sk` as DEFINITION_ID and use the exact service name. Check for an existing definition before creating duplicates. All subsequent customer operations use customer credentials, not this staff token.

For a separately hosted browser, your AppEngine host must permit the web origin. The current self-hosted production setting is `ALLOWED_ORIGINS`, a comma-separated list of allowed origins. Ask your deployment operator to include your HTTPS frontend origin if browser preflight is refused. Native HTTP calls do not use browser CORS. A CORS error is not a customer-password error; inspect the browser network response before retrying signin.

## Platform-flow revision,11 October

The current source adds actual definition/service pickers and fetches the selected definition's `data.form` collection schema. The native iOS configured-form integration test passed: service change→fresh slots→required fields block POST→answers submitted→exact owned readback→cancelled with answers retained. The earlier video does not yet contain these controls; it remains an incomplete review cut.

Run `integration_test/configured_form_test.dart` in an owned test organization with the provided definition/form fixtures and private test defines. `schema_intake.dart` deliberately supports the controls used here (text, enum, number/integer and boolean; required/length/enum/const constraints). It blocks unsupported files/nested/conditional/data-source controls and unknown schema keywords. It rejects a configured enriched form with no usable properties instead of silently treating it as absent. Optional numeric values must still parse as numbers. These bounded-renderer checks have focused local tests; the sample does not claim full JSON Schema support. Add those renderers deliberately, using File Storage for attachment references. Client validation is not a claim of server schema enforcement. The smaller TS/JS/Python/curl clients send explicitly supplied answers; they do not implement this Flutter UI renderer or independently validate arbitrary form schemas.

Use JavaScript/TypeScript `.schema(formName)` / Python `.schema(form_name)` for schema resolution. The `book` method now accepts optional answers and endTime; answers are sent under `form`. Keep selected definition ID, selected service name and exact returned slot values distinct. Postman and request JSON include this sequence. Read current contracts at https://appengine.appmint.io/documentation rather than treating the captured JSON as a permanent API specification.

The extended setup JSON is `setup/intake-collection.json` followed by `setup/consultation-definition.json`. Save the custom collection first, then keep the definition's Form reference equal to that collection's name. Use unique names in your own organization. Read back both before customer testing. In Studio this relationship is under the reservation definition's full settings Form control; the modern staff wizard does not itself establish that your custom client rendered the schema.

`flutter test test/schema_intake_test.dart` checks the required/length/choice/consent rules used here and refusal to silently omit unsupported controls. Native `integration_test/configured_form_test.dart` checks real server schema resolution and saved answer readback. Test inputs belong in private defines, never in the shipped build.

## Current written-review checks

The service-booking course was reviewed against current AppEngine controller/service and collection-schema source on11October2026. The schema guards added after the recorded native/browser journey pass local analyzer/unit checks; those small guards have not been re-recorded on-device. Existing proof still establishes discovery, service changes, required-field refusal, saved answers and browser→native reschedule/cancel. No new live writes are needed to read the documentation.

## Course and source

- [Course review (local documentation server)](http://localhost:4060/videos/appengine-connected-client-usecase/course/review-platform-revision.html)
- [Source on GitHub](https://github.com/JacLight/appmint-examples/tree/main/appengine-connected-client)
