# AppEngine MCP course examples

Use an isolated training organization. These requests can mutate business records: run individual numbered requests intentionally, not the whole directory in a loop. No credentials are included. Recorded response files are evidence snapshots, not results from your own organization.

## Prerequisites

Obtain your API address and organization ID from Studio / the AppEngine Introduction course. Staff sign-in is demonstrated in Database & Repository APIs chapter 2. `POST /profile/user/signin` needs the orgid header and JSON email/password. Handle any returned challenge before treating the response as a staff session. Store the returned token privately. MCP service invocation currently requires content read permission; it calls registered services directly and does not promise every REST controller guard is reapplied.

Set `APPENGINE_ENDPOINT`, `ORG_ID`, and `STAFF_TOKEN` in your private environment. Do not paste credentials into prompts or commit them. Use Node 20+ or Python 3.10+ for the raw clients. JavaScript/Python runners use only built-in modules.

## Raw protocol

Run `node call.mjs 02-initialize`, then `node call.mjs 03-tools-list`. Or use `python3 call.py 03-tools-list`. TypeScript is the equivalent typed client (`call.ts`) for an existing Node TypeScript project. Every numbered folder includes complete `request.json`, route/headers and observed response. Import `postman.json`, set its base/orgid/token variables privately, and send only the desired request. For curl:

```sh
curl -sS -X POST "$APPENGINE_ENDPOINT/mcp" \
 -H "orgid: $ORG_ID" -H "Authorization: Bearer $STAFF_TOKEN" \
 -H 'Content-Type: application/json' \
 --data-binary @08-read-order/request.json
```

## Prepare the order and preserve its identity

The filmed order MCP1010A is a zero-value repository fixture, not a paid checkout. In `07-create-isolated-order/request.json`, replace YOUR_TRAINING_EMAIL and YOUR_UNIQUE_ORDER_NUMBER. Check that the chosen number does not already exist before creating once. Run the request with a staff account authorized to create records. Save the returned `sk`. Replace MCP1010A in requests 08–13 and 25 with your own number or record ID as required. Then read → hold → read → release → read. Request 13 deliberately repeats release and should return a tool error.

Do not blindly retry hold: holding an already-held order can overwrite previousStatus. After a timeout, read current state first. Use returned status/previousStatus/reason to decide. Current history.from can repeat the destination; it is not proof of the earlier state. Deleting the owned fixture uses `DELETE /repository/delete/sf_order/YOUR_SK`; verify your exact record before cleanup and read back absence. No customer message, checkout, shipment or refund is needed for this exercise.

## Actual MCP SDK client

Install the SDK in your own example folder:

```sh
npm init -y
npm install @modelcontextprotocol/sdk
export ORDER_NUMBER='YOUR_UNIQUE_ORDER_NUMBER'
node mcp-client.mjs
```

The video verified SDK connection, tool listing and readback. The client intentionally does not mutate an order automatically. An AI host adds reasoning and tool-selection on top of this transport; its prompt execution was not recorded. Configure an HTTP MCP server ending in /mcp with private orgid and bearer headers in your chosen host. Suggested prompt: read this order; if it is on hold, release it; read again and report status. Inspect the host's actual tool log and readback before accepting its answer.

## Custom collections

Request 24 queries the training collection workflow_lab_1010 with data.status=approved. This record was created in the Workflow course. Use that prerequisite, or create your own collection and record using the Database & Repository course and replace both datatype and query. An empty data array is valid when nothing matches. findByAttribute takes a plain attribute name; find queries use full data.field paths.

## Errors and alternatives

Requests 14–18 demonstrate missing context or invalid names; use their route.json header requirements when reproducing. The generic runners keep orgid by default, so deliberately omit it for the missing-org test. Protocol notifications return 202 with no body; GET returns 405. Independent batch messages can execute concurrently. Send dependent reads after writes, outside a shared batch. Public discovery is not proof of authenticated service access. A successful HTTP200 can contain a tool failure: inspect top-level error, then result.isError, then parse result.content's text JSON.

## Course source publication

This folder contains the downloadable companion supplied with **AppEngine MCP: Connect AI Clients to Business APIs**. Replace training identifiers and paths with your own. Recorded results are examples, not a live connection or credentials. Use the current [AppEngine API reference](https://appengine.appmint.io/documentation) for changing contracts. The course reader retains its verification limits.
