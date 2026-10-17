# AppEngine scoped credentials and account devices

A developer companion for the Authentication, Scoped API Keys and Organization Isolation course. The browser runs real supported AppEngine operations through a local Node server. It is an example client, not Appmint Studio.

## Before running

1. Open https://studio.appmint.io/ and use your own development organization. Obtain its assigned AppEngine API origin; the Studio website is not automatically that API origin.
2. Consult https://appengine.appmint.io/documentation for the current API key and profile/security contracts. The linked API Foundations course demonstrates staff/customer sign-in and returned code challenges; do not bypass a challenge.
3. Use your own legitimate staff account. Own-key management is distinct from organization-wide administrative revoke, which uses ConfigAdmin authority. No platform or root organization is required for this example.
4. Prepare harmless reservations and a separate customer account for the device test. Never block someone else's device or rotate an existing production key for a lesson.

## Run the browser example

Requires Node 22.12+; no dependencies.

Set `APPENGINE_API_ORIGIN` and `APPENGINE_ORG` in your shell or environment file using your deployment's values, then run:

```sh
node browser/server.mjs
```

Open the loopback address and port printed by your own local server (default port 4098). Connect your staff account. Choose **Create training key**, keep `read:data`, and set a future expiry. The server stores the one-time secret; the browser receives only metadata and a cookie. Run the export with a date window containing your own confirmed reservations, download its CSV, and compare the result.

The current maintained reference has some legacy scope examples. This course verified `read:data` against current source and live responses. It allows ordinary-data reads broadly in the organization, not only reservations or the rows selected by your query. Do not distribute this key inside a public browser or phone application.

Use the actual refusal probes, metadata/usage, regeneration, inactive/reactivate and revoke controls. The wrong-organization probe uses a nonexistent training organization, not another person's tenant. Its current result is 404; invalid/inactive/retired keys return 401, and scope refusals return 403. Regeneration invalidates the old secret immediately. No overlap period is implied.

## Device exercise

Connect the same dedicated customer under **Desktop** and **Laptop**. These emulate distinct browser/OS request fingerprints; they are not physical hardware attestation. Check both profiles, refresh the device list and identify the training laptop. Read the actual owner policy. With `sign_out_now`, block that laptop, then separately check its saved session, a new sign-in, and the desktop profile. The verified outcomes were 401, 403 and 200 respectively. Device-list entries from earlier setup clients can also appear.

The demo retains the customer password in process memory solely to perform the deliberate blocked re-sign-in check. **This is not a production password-storage pattern.** Normal clients should obtain credentials from the user when needed, complete challenges, and use appropriately protected sessions. Do not deploy this local server publicly.

## Boundaries and adaptation

- Tokens, full keys and customer test passwords remain in server memory. A restart loses those example sessions and job secrets. Use a production secret manager and session store when deploying a real service.
- The local cookie is HttpOnly/SameSite Strict. Production additionally needs HTTPS, Secure cookies, session expiry/persistence, stronger request protection and normal application hardening.
- Each job request sends `orgid` and `x-api-key` directly. It does not exchange the scoped key for a broader application token.
- The job reads every returned page, with a 100-page example safety cap. Narrow the dates or implement a durable checkpoint for larger exports. Pagination was independently checked with page size one against two records and the terminal empty page.
- CSV quoting also neutralizes formula-leading values; preserve both protections when adapting it.
- The UI runs one actual execution. It does not install a nightly timer or send a file to an external spreadsheet service.
- Credential usage counts authenticated attempts, including later scope refusals. Track successful jobs separately.
- Optional new-device notifications follow your deployment configuration. Use a controlled account and delivery setup during rehearsal; the example does not change organization security settings or shared providers.
- Retire the training keys after the exercise. The device remains blocked until you deliberately recover it through supported account controls.

Source contracts: current `apikey.controller.ts`, `apikey.service.ts`, `apikey-scopes.ts`, current-user middleware, profile security/device controllers and services. Verify current maintained docs when adapting URLs or payloads.


## Language examples

- [JavaScript export](javascript/export-bookings.mjs): `node javascript/export-bookings.mjs`.
- [TypeScript export](typescript/export-bookings.ts): compile with a current TypeScript compiler and Node types using NodeNext, or use your normal TypeScript runner. This standalone server job deliberately uses the HTTP contract directly.
- [Python export](python/export_bookings.py): `python3 python/export_bookings.py`, standard library only.
- [cURL requests](curl/metadata-and-page.sh): one-page read and safe metadata lookup, not a full paginated export.
- [Postman collection](postman/collection.json): import, populate private local variables, then run one deliberate request. Do not run every lifecycle request blindly.

For the three export programs, provide `APPENGINE_API_ORIGIN`, `APPENGINE_ORG`, `APPENGINE_JOB_KEY`, `EXPORT_FROM` and `EXPORT_BEFORE` (YYYY-MM-DD, exclusive end). Optional `EXPORT_FILE` sets the output path. All examples keep secrets out of logs. Postman's create/regenerate responses necessarily contain a one-time secret: keep the response private, move it directly into your secret manager, and never share an exported environment containing it.

A mobile client should use its person's supported sign-in/session flow, not this server-job key. The browser companion's two device sessions demonstrate that boundary; the course does not ship a phone application carrying a machine credential.
