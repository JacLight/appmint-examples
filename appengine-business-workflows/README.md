# AppEngine Event-driven Business Workflows

This companion implements public warranty submission → assigned staff decision → persisted source status and workflow history. The browser is a supplied reference application, not Appmint Studio.

## Before starting

Obtain your AppEngine API endpoint and organization ID from your deployment. Follow the series Introduction and Authentication courses for signup, endpoint discovery and staff sign-in. Your configuration administrator creates the form and workflow; each reviewer is an ordinary staff user in the SAME organization. Creating a user does not require root organization membership. Keep tokens outside source control. No real passwords or live tokens are supplied.

## Configure and run

Use `requests/05-create-workflow/request.json` as the complete workflow definition. Substitute your own stable workflow name, assigned staff emails and escalation reviewers. POST it with your authorized staff token, retaining the response `sk`. Use `requests/06-create-form/request.json`, substitute your form name and the workflow name, and PUT to repository/create. The five schema fields match this client's fields. Required fields are enforced by AppEngine.

Run the supplied client with Node18+:

```bash
export APPENGINE_URL='YOUR_APPENGINE_ENDPOINT'
export APPENGINE_ORG='YOUR_ORGANIZATION_ID'
export FORM_NAME='YOUR_FORM_NAME'
node server.mjs
```

The server prints readiness and listens on port4346. Open it in your local browser. Set PORT to choose another port. The server forwards orgid and the browser's current staff Authorization header. It does not store an administrator token or give one to the public form. In a deployed client, choose appropriate session storage, HTTPS and an allowlisted API proxy; this loopback demonstration server is not a production internet gateway.

Customer form: fill all five fields, submit, keep the returned claim ID. Email-only access trusts the supplied address; it is not mailbox verification. Reviewer desk: sign in as the assigned reviewer, select the task, review answers, add a reason, approve or reject. The client reloads source record AND workflow position, including mode-all partial approval. Staff tokens remain in memory and are cleared on reload.

## API variants and complete payloads

Each requests/<operation>/ contains complete request.json, operation.json, observed sanitized response.json, TypeScript, JavaScript, Python standard-library and curl examples. Import appengine-workflows.postman_collection.json for Postman. Export APPENGINE_URL, APPENGINE_ORG and APPENGINE_TOKEN as appropriate. Run commands inside the chosen request directory. Replace recorded fixture IDs and emails with YOUR saved results; these are evidence, not reusable IDs in another organization. Replace YOUR_PRIVATE_VALUE in signin/signup payloads with your own controlled values. Never repeat staff creation just to replay a decision.

Read the method/path from operation.json. Sign-in returns a token; subsequent staff requests require orgid and Bearer. Public form operations use orgid and the form's access rules. GET the email-first form with the email query before rendering its schema. POST its answers, then use the returned record ID with workflow/position/form_submission/:id. Use taskSk for approval/task/:taskId operations. They are different IDs.

Approve/reject update terminal stage plus source state/status. Repeat decisions return409; read current position. Unassigned reviewers receive403. Reassign validates staff emails and records history. Escalation applies configured stage reviewers immediately. mode=all returns waitingOn after a partial approval; don't claim final success until position.isFinal. A disabled workflow can leave a saved submission without a task. Re-enable it and use workflow/fire with the EXISTING record ID; never repair by resubmitting customer answers. Check position first.

## Existing client conventions

The supplied browser proxy follows the existing Next.js sample's server/request separation (`appmint-examples/nextjs-store/app/api/[...slug]/route.ts`). The shared `appmint-client/appmint_js_client` already exposes `createClient`, `get`, `post`, and a configurable fetch transport. `sdk-readback.mjs` reuses that real package to read the completed claim and workflow history. Install the existing package from your checkout or set APPMINT_SDK_ENTRY to its built `dist/index.js`, then set the ordinary APPENGINE variables and CLAIM_ID and run `node sdk-readback.mjs`.

The SDK distinguishes application authentication and customer identity. These approval endpoints use the ordinary staff token instead; this server-side bridge injects that token with the supported fetch option. Do not put a staff token into `setCustomerToken`, invent a workflow helper, or expose the configuration administrator in the public browser. The standalone journeys show the equivalent exact HTTP calls without a package dependency. The SDK readback was also executed against a completed training claim.

## External-event adapter

`event-adapter.mjs` demonstrates a CUSTOM HMAC protocol, payload mapping boundary and event→claim mapping. It is NOT Stripe, PayPal or Shopify signature code. Plug in provider-specific verification from that provider's SDK. `node --test event-adapter.test.mjs` verifies invalid signatures cause no write and duplicate events reuse a mapped ID. The included Map in the test is ephemeral; use a durable store and atomic unique event key in a deployed adapter. Multi-process concurrency and the crash between creating a claim and saving its event mapping require a durable inbox/outbox or reconciliation strategy. An in-memory guard alone is insufficient for exactly-once delivery. This conceptual chapter is not a verified external-provider delivery.

## Notifications and evidence

All recorded mutations used isolated training records. SMTP was inactive and outgoing disabled. Decisions/history/assignment were verified; delivered email was NOT demonstrated. For mail delivery, configure the organization's mail provider and templates using the series Email/Integrations courses, then test an address you control with explicit sending authorization. Never describe a queued notification as a delivered email.

## Complete journeys in multiple languages

`journey.mjs`, `journey.ts` and `journey.py` each create a fresh definition and form, submit a customer claim, read the reviewer's tray, approve, and independently read the stored source/history. Set APPENGINE_URL, APPENGINE_ORG, APPENGINE_TOKEN for the configuration administrator, REVIEWER_EMAIL and REVIEWER_TOKEN for the assigned ordinary reviewer. Optionally set a unique FORM_NAME and controlled CLAIM_EMAIL. Run `node journey.mjs`, `npx tsx journey.ts` (TypeScript with tsx installed), or `python3 journey.py`. These CREATE training records; do not run in a live production organization. The scripts do not create users, grant roles, or fabricate a token. Each language writes JSON output and explicitly fails when workflow position or final status is missing. The individual request folders cover rejection, reassignment, escalation, all-reviewer policy and recovery as complete separate calls.

## Course source publication

This folder contains the downloadable companion supplied with **AppEngine Event-driven Business Workflows**. Replace training identifiers and paths with your own. Recorded results are examples, not a live connection or credentials. Use the current [AppEngine API reference](https://appengine.appmint.io/documentation) for changing contracts. The course reader retains its verification limits.
