# AppEngine Business Operations client example

A custom staff counter consumes AppEngine check-in, work orders and POS APIs. It follows the same customer from arrival to a service stand, repair work and a closed sale. This is a plain JavaScript browser client with a small development proxy; it is not a React or native-mobile application.

## Build it step by step

Start with the [six runnable source checkpoints](checkpoints/README.md) for the developer course: a blank project, staff authentication, branch reads, arrival/stand assignment, linked work orders, and tab/payment/receipt integration. Each stage has exact diffs and named source ranges. The [setup guide](checkpoints/SETUP.md) supplies concrete training record requests and readiness checks. Independent folders start separate browser sessions; checkpoint05 runs the complete integration continuously. The original finished browser client and language examples below remain available.

## Prerequisites

Use an organization you control and an authorized staff account. Obtain the assigned AppEngine API origin and organization ID from your deployment; follow the published API Foundations and Authentication courses for sign-in. Current contracts: https://appengine.appmint.io/documentation . Staff permissions must cover Check-in/Floor, Time/work orders and POS/Tabs. A visible navigation item never grants permission.

Before running a write, create a training business location, two available service points, an active employee and the two catalogue products you intend to sell. Use BusinessMade's setup screens or the maintained Repository setup routes. Set `isNew: true` when creating built-in records. Preserve the location's `data.name` for `businessLocationId`; preserve employee and service-point `sk` values for their references. Service-point records in the current check-in implementation must carry `data.businessLocationId`. Query the available-service-point route to verify that setup rather than assuming a saved form is sufficient.

Configure tax on the location. Configure notification providers deliberately: assigning a waiting customer can send a ready message. The course uses a controlled local mailbox, not a real customer's address. An unconfigured hardware field does not demonstrate printing. This client requests returned receipt lines for a client-owned printer implementation; the screen does not claim physical-paper success.

## Run the browser client

Node20+; no npm dependencies:

```sh
export APPENGINE_API_ORIGIN='https://YOUR_ASSIGNED_APPENGINE_ORIGIN'
PORT=4108 node browser/server.mjs
```

Open the loopback address printed by the server, sign in, then enter the saved location name. Credentials are kept only in browser memory. This proxy is a local-development helper bound to loopback, with an explicit route allowlist. Production clients should use their supported auth/CORS/backend boundary; never deploy a privileged staff session into a public visitor client.

The branch screen reads readiness, service points, products and employees. The arrival screen finds/creates the CRM customer through check-in, then assigns a stand. Work Orders preserves the customer ID and logs assignment, time, material cost and completion. Counter opens a tab with one request ID, adds catalogue SKUs, reads server totals, records a training cash tender, closes, clears the stand and renders the returned receipt.

## JavaScript, Python, TypeScript and Postman

`operations.json` contains explicit selectable operations. Supply environment values for each placeholder used by the operation; never commit tokens. Save returned IDs and carry them to the next operation.

```sh
export APPENGINE_ORG_ID='YOUR_ORGANIZATION'
export STAFF_TOKEN='YOUR_SIGNED_IN_STAFF_TOKEN'
export LOCATION_NAME='YOUR_SAVED_LOCATION_NAME'
node client.mjs readiness
python3 client.py available-stands
```

The Node/Python runners send one selected request, print normal JSON and do not automatically execute the whole workflow. `client.ts` supplies typed sequence helpers. Compile with `tsc -p tsconfig.json`. Import `postman.collection.json`, use local environment variables and keep the bearer token private. Postman collection operations match `operations.json`.

Core order: readiness → walk-in → queue/position → assign-stand → work-create → work-assign → work-start → work-note/time/material → work-complete → tab-open → tab-items → tab-breakdown → tab-cash → tab-close → receipt → stand-clear. The standalone cash-operation body is an editable example: replace its amount with the **current server balanceDue**, never blindly reuse the course figure. The browser and TypeScript helpers read the balance immediately before constructing the tender.

Important boundaries:

- Reuse the same `OPEN_REQUEST_ID` when retrying a tab-opening request. Time/material appends do not provide that same retry identity; read the saved job before retrying them.
- A work order's cost does not create a customer invoice or sale. Choose catalogue SKUs for the tab; the server supplies sale prices and tax. The course's chain-replacement line is a service charge. Stock procurement/consumption needs the separate Inventory/Commerce workflow.
- Job time does not become employee payroll time. Workforce APIs cover that separate sequence.
- A completed work order refuses new time. Reopen deliberately before appending a legitimate entry.
- A tab with money due cannot close. A recorded manual cash tender is an accounting record, not a simulated card-provider success. Do not use it to claim that an external card charge occurred.
- A closed tab releases its occupant; inspect whether the service point needs cleaning. Clear it through the supported clear action before accepting the next arrival.
- Receipt lines come from the server's actual template. Render supported `text`, `feed`, `cut` and other primitives in your chosen printer driver; the included browser display is only the document preview.

Validation in course production: actual isolated-organization readbacks for queue assignment, occupied-stand409, work totals and completed-time409, stable open retry, unpaid-close400, manual-cash transaction, closed tab, receipt payload and cleared stand. No physical receipt printer or real card charge is claimed by this package.
