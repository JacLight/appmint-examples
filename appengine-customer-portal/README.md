# AppEngine Customer Self-Service Portal — executable companions

These examples implement the course's portal lifecycle on AppEngine. They begin with an existing authenticated customer session. They do not create a second authentication SDK or repeat the full booking-creation course.

## Prerequisites and reference

- Complete API Foundations §4: sign in the customer and §6: session renewal and errors. Obtain API address, organization ID and a customer session. Staff credentials never belong in this browser portal.
- Complete Custom API Gateway §§5–7: server session, cookie lifetime and permitted routes. Its video has chapter buttons at 1:57, 2:35 and 3:21.
- Complete CRM APIs §§7–9: bookable service, availability and booking; use its video chapter buttons at 4:06, 4:50 and 5:34. This portal course changes an existing owned booking. For form setup/submission, use the same course’s chapters at 7:07 and 7:49.
- Use the maintained [AppEngine reference](https://appengine.appmint.io/documentation/). Search `client-data/profile`, `client-data/shared-accounts`, `profile/customer/shared-account` and `crm/reservations/reschedule`. Compare the operation's response shape to its current example; course source-contract notes identify known differences.
- Shared accounts need a company customer record and a first active manager association, prepared by authorized staff. The manager's customer session then handles membership. Ordinary buyers cannot view the manager member/order routes.
- Use owned test customers and records. Membership creation can send an account-added notice even for an existing customer. Cancellation and ticket creation may produce notifications. Course recording uses the producer's separately verified disabled-outbound lab; these examples do not disable organization configuration.

## JavaScript and the official SDK

Node20+. Commands in this section run from `appengine-customer-portal/examples/`. Build the existing official `appmint_js_client` package in your Appmint client checkout once with its documented `npm run build`. Set `APPMINT_SDK_MODULE` to the absolute `file:///.../appmint_js_client/dist/index.js` URL. No registry publication is assumed. Keep API/ORG/CUSTOMER_TOKEN in your shell or server secret store.

```sh
export API=https://appengine.appmint.io
export ORG=your-organization
# Set CUSTOMER_TOKEN privately; do not paste it into a committed file.
export APPMINT_SDK_MODULE=file:///absolute/path/appmint-client/appmint_js_client/dist/index.js
node read-portal.mjs
```

`read-portal.mjs` performs only reads. `sdk-host.mjs` uses the official SDK's supported injected-fetch hook to carry an ordinary customer bearer in Authorization. No app or System identity is created. An existing application-identity gateway can use the official SDK directly and pass its initialized client into `Portal` instead.

```js
import {Portal} from './portal.mjs';
import {customerClient} from './sdk-host.mjs';
const client = await customerClient({baseUrl:process.env.API,orgId:process.env.ORG,token:process.env.CUSTOMER_TOKEN});
const portal = new Portal(client, async replacement => {
  // Replace BOTH tokens in the existing trusted server session.
  await yourSessionStore.replace(replacement);
});
const profile = await portal.profile();
const bookings = await portal.reservations();
const selected = bookings.data[0]; // In a UI the customer chooses a row.
const availability = await portal.availability(selected.sk, '2026-11-06');
// Render the returned availability in its configured timezone; let the user pick.
// await portal.move(selected.sk, chosenReturnedStartTime);
// await portal.cancel(selected.sk); // Server-owned read occurs before email/code action.
```

Writes above are deliberately not auto-executed. `move` uses the customer-owned ID route and returns a fresh saved booking. A409 destination refusal is an opportunity to refresh availability, not to cancel the original booking. `cancel` first reads that booking through the owned detail route, derives its email/code on the trusted server, then calls the separate capability-style cancellation action and reads the saved cancelled record. That does not change authorization on direct AppEngine email/code URLs. Never expose a generic unrestricted proxy in place of this server workflow.

`portal.ts` is the TypeScript integration entry and uses the same JavaScript workflow implementation. Import `createPortal` with your initialized `AppmintClient`; the official SDK supplies transport/error handling. The typed `ProfilePatch` and `MemberPatch` define consequential editable choices. It is not a separately invented SDK.

## Python, curl, JSON and Postman

`python3 portal.py` performs the same five read-only views using API/ORG/CUSTOMER_TOKEN. Import `Portal` to call `update_profile`, `availability`, `move`, `cancel`, `open_ticket`, `members`, `company_orders`, `invite`, `member` and `switch_account`. Supply `save_session` to atomically persist the new tokens after an account switch.

`source requests.sh` defines curl functions without making requests. Run `portal_profile`, `portal_reservations` or other named functions explicitly. JSON files show field-scoped profile, availability and membership bodies. Replace placeholder values with those from selected owned records. Do not send a whole enriched customer record back to the profile endpoint.

Import `postman.json` into Postman, create a private environment and populate its variables. Run requests individually, not the whole collection: some mutate records or generate notifications. The switch requests update environment customerToken and refreshToken. Use separate private environments for the two customers. Cancellation is intentionally demonstrated through the trusted server implementation rather than an unsafe Postman-only preflight presented as a deployable access gate.

## Important response and state distinctions

| View/action | Identifier and result |
|---|---|
| Profile | Flat PATCH-like PUT fields firstName/lastName/phone. A changed phone becomes unverified. The example rereads the profile. |
| Reservation detail | Record `sk`; raw record; inaccessible record is404. |
| Order detail | Order `data.number`, despite route parameter named orderId; raw record or an empty HTTP200 body (the service returns null). List filters/paging are currently ignored by this path. |
| Ticket detail | Ticket `data.name`; page with `data[]`; inaccessible ticket yields empty rows. Creation sets reporter from identity and strips customer-supplied staff fields. |
| Forms | Page with submitted/pending states and linked form/schema; do not describe a pending link as submitted answers. |
| Member update | `associationId` identifies membership; accountId identifies company customer. Last active manager cannot be demoted/suspended through the customer-manager route. |
| Account switch | New customer token AND refresh token; switch with `{}` to return to personal. A selected account is purchase context, not manager authority. |

Shared flow: manager lists members → adds existing buyer → buyer selects company → manager suspends buyer → a fresh account selection is refused → manager reactivates → buyer selects again → buyer returns personal. Verify the actual checkout/shared-order behavior in the linked commerce lesson; selecting an account is not a purchase or payment proof. Do not claim that an already issued token has instantly been revoked solely because a fresh switch is refused.

The remaining portal features are selective extensions, not a genericCRUD catalogue. Addresses use flat address fields and deduplicate street1/city/state/zip; this server helper checks owned addresses before removal because the direct deletion handler lacks that explicit check. Named wishlists use wishlist `sk` plus product SKU, and server ownership is checked when the list ID is supplied. Saved-payment-method writes currently return501 and its list is a stub; do not show a successful card vault. Verification, benefits and messaging require their own verified feature lessons and provider setup.

## Run the sample portal

The Node host serves `public/index.html` and its font on `http://localhost:4069`. AppEngine customer tokens remain in server memory; the browser receives an HttpOnly, SameSite=Strict cookie. The persona buttons sign in prepared test customers, so this is a local demonstration host, not a deployable public login service. Production login requires the Gateway lesson’s HTTPS, session renewal and authentication flow.

Clone [appmint-client](https://github.com/JacLight/appmint-client) beside this repository, then build its JavaScript SDK:

```sh
cd ../appmint-client/appmint_js_client
npm install
npm run build
cd ../../appmint-examples/appengine-customer-portal
cp fixture.template.json fixture.json
# Edit fixture.json with your organization and owned record identifiers.
# Copy identities.template.json to a PRIVATE location and set real test-customer credentials there.
export PORTAL_PRIVATE_FILE=/absolute/private/path/portal-identities.json
export API=https://appengine.appmint.io
export ORG=your-organization
node examples/server.mjs
```

Open `http://localhost:4069` (use that exact origin). `PORT` changes the port. `PORTAL_FIXTURE_FILE` can override the local fixture path. The SDK defaults to the sibling checkout; set `APPMINT_SDK_MODULE` to a `file:///.../dist/index.js` URL for a different location. `fixture.json` and `identities.json` are ignored by Git, but keep the private identity file outside this repository.

Prepare owned customer profiles for Dana (personal records), Priya (company manager), Noah (buyer), and optionally Elli (pending invitation). The names are sample persona labels; emails/passwords must be yours. Supply an owned booking and its definition, company customer ID and optional order/ticket numbers in the fixture. Configure the company’s first active manager with authorized staff before exercising the customer-manager routes. Prepare distinct personal/company carts to observe switching. The host does not create these records automatically.

UI contract: POST `/api/signin` `{persona}`; GET `/api/session` → `{persona,profile,fixture}`; POST `/api/action` `{method,args}` → `{data}`; POST `/api/signout`. All POST calls require matching Origin. Methods are explicitly allowlisted and errors preserve HTTP status. The record in `/api/action`'s data may itself contain an AppEngine page data array.

## Verification

From `examples/`, offline: `node --test test.mjs` (11 tests); `python3 -m unittest test_portal.py` (4 tests). These verify server workflow ordering, no cancellation after refused owned read, exact encoded email/code, exclusion of the booking from availability,409 without a retry, response-shape distinctions, token replacement and real official SDK injected headers against a mocked transport. They do not claim live server ownership or delivered notifications. Producer evidence/recording is separate.

### Saved cart and pending invitations

`portal.cart()` calls `GET /storefront/cart/mine`: it reads the signed-in customer's saved cart in the selected company/personal context without creating one. A null result means no existing cart for that context. To demonstrate a meaningful difference, prepare actual personal and company carts using the commerce workflow. The legacy `GET /storefront/cart/get/:authorid` can auto-create a cart; do not describe that route as a read-only check. Compare saved cart `sk` and `data.sharedAccountId` after switching; a changed heading alone is not downstream proof.

The local server adds `pendingInvites` to `/api/session` and supports `/api/action` methods `pendingInvites`, `validatePendingInvite(inviteId)` and `acceptPendingInvite(inviteId)`. Browser receives an opaque, session-specific inviteId. Server rereads the customer's current profile and resolves the capability token privately before forwarding validation/acceptance. A foreign or no-longer-pending handle is refused. After acceptance, reload the profile and explicitly select the new company so its purchase-context token is issued. Acceptance does not itself select the account.

### Source layout and verified scope

- `public/`: actual sample portal UI and font.
- `examples/portal.mjs`, `portal.ts`, `portal.py`: JavaScript, TypeScript and Python workflows.
- `examples/requests.sh`, JSON payloads and `postman.json`: curl and request examples.
- `examples/server.mjs`: localhost-only demonstration host.
- `fixture.template.json`, `identities.template.json`: placeholder configuration; no real credentials.

The course demonstrated profile changes, saved booking moves and cancellation, a slot conflict that preserves the booking, orders/forms/tickets, customer isolation, manager/buyer controls, personal/company carts and invitation acceptance against a controlled AppEngine instance. It did not demonstrate a payment or external email delivery. Offline tests verify workflow ordering and transport behavior; they do not replace live outcome checks in your organization.

The Postman collection contains 19 requests and passed structural lint. Run mutations individually with your private environment; structural validation is not a claim that every provider is configured.
