# AppEngine External API Integration and Data Mapping

This is the runnable companion to the supplier integration course. The Northwind endpoint is a controlled teaching supplier. AppEngine is the real training backend. Nothing here pays a supplier, places a commercial order or sends a notification.

## Start with the right platform details

Open https://studio.appmint.io/ and select your organization. The catalogue's AppEngine Introduction teaches account creation and obtaining your endpoint and organization ID. The Database & Repository APIs course's Staff sign-in chapter teaches `POST /profile/signin`. Authentication challenges/password changes are covered in the Authentication course. Complete them and obtain a current ordinary **staff** bearer with Inventory access; a platform root account is not required.

The exact starting references are [Introduction: account, address, token and first request](/videos/course-catalogue/materials/appengine-developer-course-script.html#8-getting-started-account-address-token-and-first-request), [staff password sign-in](https://docs.appmint.io/appengine/authentication/users.html#password-sign-in), and [sign-in outcomes](https://docs.appmint.io/platform/identity-and-access.html#sign-in-outcomes). Select the intended organization before obtaining the staff session; a challenge response is not a completed session. The supplier key authorizes the external service, while the staff session authorizes AppEngine. Neither goes in the browser.

Use your own isolated organization, products, receiving location and accounts. Do not copy the recorded organization or IDs as if they were your resources. The full HTTP API reference is at https://appengine.appmint.io/documentation. For self-hosted installations use your deployment's documentation address.

Copy `.env.example` to a private file and populate it on your server. Do not commit it. `LOCATION_ID` means the saved location's **data.name**, not its record sk. Keep supplier and AppEngine credentials separate. Use HTTPS for hosted connections.

## Prepare the AppEngine records

1. Create a receiving location through Business Locations. Record its exact saved name and currency.
2. Prepare two existing `sf_product` records. Save their actual product SKUs.
3. Read `GET /repository/collections/sf_product?enriched=false`, select the definition with `data.name === 'sf_product'`, preserve its complete schema and add string property `supplierSku`, title `Supplier SKU`. Save the complete definition through `POST /repository/update/COLLECTION_SK`. Read again and retain its current ID/version.
4. Populate `data.supplierSku` on the products using `POST /repository/update-partial/sf_product/PRODUCT_SK` with the flat body `{"data.supplierSku":"NW-OAK-24"}`. Use `NW-WAL-18` for the second product. Do not replace the entire data object.
5. `POST /repository/find/sf_product` with `{"query":{"data.supplierSku":"NW-OAK-24"},"options":{"page":1,"pageSize":2}}` must return exactly one product. Do the same for walnut. The adapter refuses missing/ambiguous mappings.

The course uses `SUPPLIER-OAK-1011` and `SUPPLIER-WAL-1011` only as synthetic example SKUs. Its hidden products are not offered for sale. If you use other product SKUs the adapter discovers them from your supplierSku values.

## Open the current contract before adapting the example

Use the [maintained API reference](https://appengine.appmint.io/documentation) to search the route names below. Select the method as well as the path; creating, reading and receiving an intake are different operations. Read that operation's parameters, response and error descriptions before adapting a recorded payload. The downloadable JSON is observed example evidence, not a replacement for the current reference.

| Decision | Maintained reference | What to carry into the adapter |
|---|---|---|
| Is there a suitable built-in provider? | [Integration setup](https://docs.appmint.io/integrations/overview.html#connecting-a-service), then search `/upstream/integration-use-cases` | Provider operations and configuration requirements. Installed availability alone does not establish your selected account or authorize a supplier call. |
| Which product schema and records are being extended? | [Collections](https://docs.appmint.io/appengine/data/collections.html#reading-collections) and [Repository](https://docs.appmint.io/appengine/data/repository.html) | Preserve the existing definition; map external code to the product's actual SKU. A definition change does not populate record values. |
| Which delivery operation runs? | Search `/storefront/inventory/intakes` | Create a pending delivery, inspect its saved ID, then intentionally call receive. Retain the reference for reconciliation. |
| Did receipt finish the business outcome? | Receive operation and recorded stock/bill/journal readbacks below | Received stock, linked bill and posted journal are separate observations; journal posting may follow the HTTP response. |

This exercise is a **direct supplier delivery**, not a purchase-order receipt. Current AppEngine rejects `purchaseOrderId` on ordinary intake creation; a delivery against an existing purchase order begins through that order's Receive action. Likewise, existing approved reorder bills can be folded into a receipt rather than creating another amount owed. Our isolated demonstration did not have such prior commitments, so its one-new-bill result must not be generalized to every procurement state.

For a built-in integration, use [Save the connection](/videos/course-catalogue/materials/appengine-integrations-webhooks-script.html#4-save-the-connection) and [Prove it works](/videos/course-catalogue/materials/appengine-integrations-webhooks-script.html#5-prove-it-works). Provider account selection, shared-service fallback and cost behavior are described in [How integrations work](https://docs.appmint.io/integrations/how-it-works.html); do not treat the discovery response as proof that a particular account is connected. The current course uses the labelled teaching supplier and makes no commercial provider call.

## Open the downloaded workspace

[Download the examples](/videos/appengine-external-api-usecase/course/supplier-integration-examples.zip), extract the archive, then open a terminal inside its `supplier-integration` directory. The commands below run from that directory. JavaScript and Python adapters use their standard libraries. For TypeScript, run `npm install` before the compilation command below. Keep your populated environment and job-state directory private.

## Start the teaching supplier

Node.js 20+ is sufficient:

```sh
node supplier-fixture.mjs
```

It binds to loopback port 4371, not a public service. In your private environment set `SUPPLIER_URL=http://127.0.0.1:4371` and `SUPPLIER_KEY=training-supplier-only`. The local address is development configuration, not the hosted AppEngine address. The supplier key here is intentionally a non-secret fixture value. Your real provider's secret must remain private.

The fixture accepts `GET /shipments/SHIPMENT_ID` and returns two lines: 40 oak at 38.50 and 12 walnut at 61, currency USD, total 2272. Its response is not an AppEngine inventory record.

## Run the full adapter in your language

Load your private environment first. Then choose one implementation:

```sh
node import-shipment.mjs MY-SHIPMENT-001
python3 import-shipment.py MY-SHIPMENT-001
```

For TypeScript, install the included development dependencies and typecheck. Node 24 can execute the erasable types directly; on older Node use your normal TypeScript build/runtime:

```sh
npm install
npx tsc --noEmit
node import-shipment.ts MY-SHIPMENT-001
```

Use the **same** ID when intentionally demonstrating reuse. Use a new supplier shipment identifier for a genuinely new shipment. Do not mint a new reference merely because a request timed out.

The adapter's sequence is: organization+shipment lock → exact existing active reference read → supplier request → full source validation → product mapping → persisted dispatch marker → pending-intake action → saved reference/ID. It returns `created`, `reused`, or `reconciled`. A supplier/API failure exits nonzero.

All three full adapters use the same platform contract. JavaScript, TypeScript and Python were actually executed against isolated AppEngine records; TypeScript also passed compilation. This example uses single-host directory coordination, not a distributed lock or universal exactly-once guarantee.

## Receive intentionally, then verify separately

Import creates a pending delivery. Confirm what physically arrived first. Use Studio → Inventory → Intakes → search supplier reference → open intake → Receive → Receive stock. Or:

```sh
node client.mjs PUT "/storefront/inventory/intakes/YOUR_INTAKE_SK/receive"
python3 client.py GET "/storefront/inventory/sku/YOUR_PRODUCT_SKU"
sh client.sh GET "/storefront/inventory/sku/YOUR_PRODUCT_SKU/transactions?locationId=YOUR_SAVED_LOCATION_NAME"
```

Keep the intake ID returned by creation. The initial receive response may not contain a top-level sk; its data includes the status and bill link. Read the intake again using your retained ID. Verify the movement reference points to its intake number and that a repeated receive doesn't add stock again.

Read `GET /repository/get/bm_bill/BILL_SK`. The approved bill is owed, not paid. Journal posting is asynchronous after receipt. Query `journal_entry` for `data.referenceType: "bill"` and `data.referenceId: BILL_SK`; inspect posted status, balanced totalDebits/totalCredits and the inventory/payable lines. An empty `booksPending` on the bill plus its posted journal establishes the observed accounting result. If a marker remains, inspect the pending-books status instead of pretending the receipt response proves posting finished.

Existing reorder bills can be linked/folded into an intake. A zero-cost intake can add stock without a new supplier bill. This course's positive-cost example had no prior reorder and produced one bill. Inspect the response's bill/`booksNote`/`booksSettled` fields; do not hard-code that every receipt must create a new bill.

## Recovery exercises

The teaching supplier changes behavior for these shipment suffixes:

| Suffix | Expected behavior |
|---|---|
| `-FAIL` | 503 supplier unavailable; no intake write |
| `-SLOW` | 3-second delay; set `SUPPLIER_TIMEOUT_MS=250` to exercise timeout |
| `-UNKNOWN` |Walnut code becomes NW-ASH-30; fails until you create/map the corresponding product |
| `-BAD` |Negative quantity; rejected before write |
| `-CURRENCY` |EUR response; refused when receiving currency USD |

An incorrect supplier key returns 401. Correct it before retrying; don't endlessly retry authentication failure. Missing mapping: add the correct product and supplierSku, then retry **the same shipment**. Ambiguous mapping: change the incorrect product's supplierSku; don't select the first returned record. Validate received source quantities, SKU and currency before a business write.

A local lock named for organization+reference refuses another worker. If a process dies, its lock intentionally remains. Inspect the exact AppEngine intake reference and reconcile the job before an operator removes a stale lock.

Before intake creation the adapter writes a `dispatching` marker. A known 4xx rejection clears that marker. For an uncertain network/5xx outcome it re-reads the exact reference: a saved record returns `reconciled`; no saved record leaves `uncertain`. A subsequent run refuses another create while that marker remains. A durable shared queue/lock store is required across multiple machines. Read-before-create alone cannot prevent concurrent duplicates.

The recorded lost-response exercise used a local proxy: AppEngine really saved the intake, then the proxy deliberately replaced the success response with 503. The adapter recovered that same ID. Another proxy test never forwarded the write; the adapter retained an uncertain marker and refused a blind retry. These are controlled transport tests, not production outage claims.

## Cancel and correct

A pending intake can be cancelled with a required reason:

```json
{"reason":"Supplier notice had the wrong quantities; corrected intake follows."}
```

Send it to `PUT /storefront/inventory/intakes/INTAKE_SK/cancel`. Keep the cancelled record. Create the corrected pending intake with the same supplier reference and the quantities actually expected/received, then receive the corrected record when checked. The adapter excludes cancelled records during active-reference reconciliation.

Receiving a cancelled intake fails; cancelling a received intake fails. Once goods have been received, use the inventory adjustment/return business process rather than modifying stock history or received intake fields through Repository.

## Inspect individual requests in any client

`client.mjs`, `client.py` and `client.sh` take method, relative path and optional JSON filename. They print the status and full JSON, not jq output. Import `supplier.postman.json` in Postman and set its base, orgid and token privately. Its environment placeholders are empty; it contains no credentials. Record IDs in observed responses are examples, not portable resource IDs.

`requests/` contains real request bodies; `observed/` contains sanitized course evidence. Postman is an equivalent collection; its GUI was not separately executed in this recording.

## Deploy your integration

Replace supplier transport/authentication with the provider's documented contract. Validate webhook authenticity before enqueueing; polling should persist its cursor. Both feed the same serialized shipment worker. Advance job status/cursor only after saving and readback. Refresh expired AppEngine sessions through the supported authentication flow. Use shared durable job coordination across hosts; bound retries and retain diagnostics without credentials. The adapter deliberately does not claim to implement every supplier's OAuth, webhook signature, pagination or delta protocol.

## Check retry coordination before deployment

The adapter reads every matching intake page before accepting one active exact reference. It refuses two active matches even when they are on different pages. Both the directory lock and persisted outcome marker use the same SHA-256 key of the JSON pair `[organizationId, reference]`; sharing a state directory across organizations therefore does not merge their shipment outcomes.

Run `node adapter-regression.mjs` (Node 24 for the TypeScript case) and `python3 adapter-regression.py`. These no-network tests exercise a duplicate split across two pages and an uncertain shipment in one organization while the same supplier identifier is imported independently in another. They supplement the live AppEngine outcome proofs; they do not simulate a commercial supplier success.

When upgrading an earlier local copy of this example, reconcile any existing locks and uncertain markers before migrating state. Do not discard an old uncertainty marker merely because a filename convention changed.

## Course source publication

This folder contains the downloadable companion supplied with **AppEngine External API Integration and Data Mapping**. Replace training identifiers and paths with your own. Recorded results are examples, not a live connection or credentials. Use the current [AppEngine API reference](https://appengine.appmint.io/documentation) for changing contracts. The course reader retains its verification limits.
