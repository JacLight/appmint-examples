# AppEngine Data APIs — course companion

A runnable browser client and portable API examples for the course. They demonstrate real AppEngine operations, not mocked success. Use a development organization and harmless records.

## Start the browser client

1. Obtain your assigned API origin, organization ID, staff session/account and customer account. API Foundations covers signup/sign-in/challenges. Do not publish staff credentials in a customer app.
2. Clone `https://github.com/JacLight/appmint-examples.git` and open `appengine-data-apis-pattern`. No package installation is needed. From `browser`, run `APPENGINE_API_ORIGIN=https://YOUR_API_ORIGIN node server.mjs` with Node 20+. Open the loopback address on port4097. This is a local development host, not a public production gateway.
3. Connect with your actual account. Campaign workspace and Moderation require staff. Community uses a separate customer sign-in. Sessions stay in this page's memory; reloading requires sign-in again.
4. Create a billboard campaign, use name filter/pagination, inspect a precise description change, then Launch. Billboard activation records a physical campaign; it does not deliver ads or messages. Observe status/start time/actor and allowed actions. Only draft records may be moved to Trash by this example.
5. As one controlled customer create a page with members-only posting. As another controlled customer, join, post, and receive a comment. Submit a harmless training report against your other controlled member, then review the same report with staff. Report review does not remove posts.

The local server proxies only the explicit example route allowlist and forwards the caller's actual token. It does not insert staff credentials or change the identity. It binds loopback. It is not a production authentication server. Keep your application's own authentication, CSRF/session protections and deployment configuration appropriate to its architecture.

## JavaScript and Python

Set `APPENGINE_API_ORIGIN`, `APPENGINE_ORG_ID`, and the required `APPENGINE_STAFF_TOKEN` or `APPENGINE_CUSTOMER_TOKEN` in your private process environment. Run `node http/run.mjs campaign-find` or `python3 http/run.py campaign-find`. See `http/operations.json` for operations. Returned IDs supply `CAMPAIGN_ID`, `PAGE_ID`, `POST_ID`, `REPORT_ID`, and `REPORTED_CUSTOMER_ID`. Customer tokens must be real signed-in customer sessions, not guests. The same call syntax does not imply the same permissions.

The JSON manifest is the full body reference. `http/client.ts` shows typed integration methods. Review changing endpoint contracts at https://appengine.appmint.io/documentation before building a new module integration.

## Important distinctions

- Repository fields are under `data.`; a partial update body is a flat field map.
- CampaignManager responses contain enriched fields/actions, unlike raw record envelopes.
- Community `page` is the space ID; `pageNum` is the numeric feed result page.
- Post/comment routes enforce policies and maintain derived fields/counters.
- Reports target a real customer and may attach post context; staff review is a separate authority.
- Notifications may be queued by signup/module actions. Our recording confines email to a local sink and disables external SMS. No external delivery result is claimed.
- Never use repository writes to imitate a launch, delivery, enrollment or review outcome.

## Membership indicator scope

The browser example reads the first 100 page members to identify the signed-in customer. This is sufficient for the controlled two-customer course fixture. For larger communities, paginate membership results or use a supported exact current-member lookup before treating a missing match as not joined. The server remains responsible for enforcing the actual posting policy.

## Example scope and validation

This package includes a plain browser JavaScript client, a local Node proxy, JavaScript and Python command-line callers, typed TypeScript integration methods, JSON request bodies, cURL and Postman. It does not contain a React or Flutter application. The browser uses real AppEngine responses; the proxy does not grant staff authority.

The recorded controlled example uses Noah as the page owner, Maya as the joining/posting customer, and Noah as the commenter and reporter. Keep each customer session distinct. Staff then reviews the report about Maya. Use your own harmless records and identities.

The production walkthrough verified campaign create/find/partial update/launch and state transitions, member posting, comment counts, customer reporting, staff dismissal and a disposable draft's Trash restoration. These outcomes were checked against the configured development backend; a source syntax check does not establish the same outcomes on your deployment. Node/JavaScript syntax, Python syntax, JSON bodies, shell syntax and strict TypeScript checking were also completed before publication.

For current routes and fields, consult the [AppEngine reference](https://appengine.appmint.io/documentation). The course reader is available in the local documentation workspace at `http://localhost:4060/tutorials-plan/course-content/courses/appengine-data-apis-pattern/`; this is a local review address, not a public documentation URL.
