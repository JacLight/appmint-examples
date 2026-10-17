# Build an AppEngine service-desk client

These six runnable checkpoints expose how the published Business Operations client is constructed. They are plain JavaScript plus a Node20 development proxy. They are **not** a replacement AppEngine backend or a production authentication SDK. No dependencies need installing.

## Run one checkpoint

Start with [API Foundations](/videos/course-catalogue/materials/appengine-api-foundations-script.html) and [Authentication](/tutorials-plan/course-content/courses/appengine-auth-org-isolation/index.html) in the course catalogue. Use the [maintained API reference](https://appengine.appmint.io/documentation) for current contracts. The course links are paths on the course website; they are not AppEngine API endpoints.

Clone the companion repository, enter its checkpoint directory, then choose a runnable stage:

```sh
git clone https://github.com/JacLight/appmint-examples.git
cd appmint-examples/appengine-businessmade-apis/checkpoints
cd 00-project-shell
APPENGINE_API_ORIGIN=https://YOUR_ASSIGNED_APPENGINE_BACKEND PORT=4109 npm start
```

Open the local address printed by Node. Use your assigned backend, not the Studio website origin. Replace the folder with the next checkpoint when ready. Each folder is independent; stop the previous process before reusing the port. The loopback address is for your development server only, not an AppEngine deployment URL.

The first checkpoint performs no AppEngine operation. Checkpoint01 signs in using a normal authorized staff account; it keeps the returned token in memory and never includes credentials in source. If AppEngine returns a verification, temporary-password or MFA challenge instead of a token, complete the linked Authentication lesson. This small adapter deliberately refuses to pretend that a challenge is a signed-in session.

Prepare a training organization, branch, two service points, mechanic and service catalogue items using [the concrete setup requests and readiness checks](SETUP.md). Configure notification delivery for controlled contacts before assigning an arrival. Later checkpoints perform real business writes when you press their actions. Cash is a manual training tender; no payment-provider charge is implemented here.

## Moving between checkpoints

Each folder starts a separate application. Stopping its server, reloading its page or opening the next folder clears the in-memory staff session and current visit. The checkpoint number is a source version, not a saved business-workflow stage. AppEngine records already created are still saved; this client does not automatically rediscover them.

| Folder you launch | What to do after starting it |
|---|---|
|00|Open the page; no sign-in or business request exists yet.|
|01|Sign in with your authorized training staff account.|
|02|Sign in again, enter the saved branch name and load readiness, products and floor.|
|03|Repeat02, then create a clearly named practice arrival and assign an actually available training stand.|
|04|Repeat the earlier setup and arrival actions inside04 with a fresh practice visit, then create its linked work order.|
|05|Repeat setup inside05, then complete one continuous visit: arrival, stand assignment, work order, tab, server totals, manual training tender, close, receipt and stand clear.|

Use distinct practice customer/work-order references when repeating an exercise. Inspect the current queue and floor before assigning a stand: a browser reload does not release a saved assignment or undo a payment. Do not create another arrival or record another tender just to recover from a reload. Reconciliation/reopening of an existing saved visit needs an explicit lookup flow beyond this small example; finish the current exercise in one session or use the authorized management interface to inspect it first.

The course's final integration check runs05 continuously in one browser session, after explaining the incremental source changes. Its visible checkpoint05 badge identifies that complete client. The film does not claim that switching independent folders restores an earlier session. Follow the separate folder exercises for incremental practice, or run05 once for the uninterrupted integration check.

## Construction sequence

| Checkpoint | AppEngine integration you add | Read these named source sections | Visible acceptance result |
|---|---|---|---|
|00-project-shell|Local page and proxy boundary|`index.html`, `server.mjs`, `app.js`|Page opens with no API request; proxy only serves named files and allowed routes.|
|01-staff-session|Staff login and shared authorized request function|`auth.mjs: signInStaff`, `api.mjs: createApi`, login handler|Normal staff token stays in memory; absent token/challenge is refused. Explain org scope and caller separately.|
|02-branch-readiness|Readiness, catalogue, employees and floor|`chooseLocation`, `refreshFloor`, `render()` setup branch|Server readiness reasons, catalogue and current stands render. Location **name** differs from employee/stand **sk**.|
|03-arrival-and-stand|Walk-in, returned customer/task identities, assignment and conflict readback|`walkIn`, `assignStand`, `refreshQueue`, `resetVisit`|Saved arrival yields `sk` and `data.payload.customer.id`; assignment reloads queue/floor. An occupied stand error stays visible.|
|04-linked-work-order|Create/assign/start, time/material appends, completion|`createWork`, `assignMechanic`, `logTime`, `logMaterial`, `completeWork`, `workRead`|Same customer ID enters the work order; returned work-order `sk` drives future calls. Detail envelope `data[0]` renders actual hours/material/status.|
|05-tab-payment-receipt|Stable open identity, catalogue SKU lines, server totals, cash/close/receipt/clear|`openTab`, `chooseItems`, `breakdown`, `cash`, `closeTab`, `receipt`, `clearStand`|Same open request returns same order; unpaid close is refused; server balance controls tender; receipt payload renders; floor refresh confirms available.|

For each checkpoint, read the named handler, identify the AppEngine contract it implements, then run the action and inspect its saved result. Use the maintained reference for current route fields.

Each stage has an [exact patch and named source ranges](SOURCE-MAP.md), with machine-readable file hashes in [changes.json](changes.json). The patches add real files/handlers; later features are not hidden inside the starter.

## Keep the identifiers and response shapes straight

- Branch `data.name` → `businessLocationId`.
- Service-point `sk` → assignment `servicePointId`; mechanic `sk` → `assignedTo[]` and time-entry `employeeId`.
- Walk-in response `sk` → queue position and assign route; `data.payload.customer.id` → work-order customer.
- Work creation returns its record directly; work detail returns `data[0]` in this current implementation. `workRead()` makes that difference explicit.
- Open tab returns the order record. Breakdown returns `{order, breakdown}`; use `breakdown.balanceDue`, not a browser recalculation. Close returns `{order, servicePoint}`.
- Receipt `lines` are structured printer instructions. This browser handles text/feed visually; it does not implement physical printing or every printer primitive.

## Pending, refusal, retry and context

`act()` disables action buttons while a request is pending, renders saved results and keeps server failures visible. `AppEngineError` retains HTTP status and parsed body so a production client can handle409/400 deliberately. In checkpoints03–05, a409 refreshes the floor, renders current choices and restores the original error/trace. A failed refresh preserves the original refusal. No failed write is retried automatically.

`app.requestId ||= crypto.randomUUID()` creates an identity for **one intended tab**, not each click. Retry with the same body and ID. Work time/material entries do not acquire that guarantee simply because the tab endpoint has it.

These checkpoints add explicit dependent-state clearing when the staff session, branch or selected arrival changes. A production multi-visit client should persist identifiers and key its state by visit. This sample clears dependent work/tab state when switching visits rather than silently reconnecting it. Reload recovery and reopening a previous in-progress visit require an explicit server lookup flow; they are not implemented here.

The proxy passes the caller's org/token through; it never substitutes a server administrator. It binds loopback and is a development helper. Hosted sessions, CORS, token renewal/challenges and customer/public clients belong to the linked Authentication and API Foundations lessons.

## Scope and validation

Derived from the actual published `appengine-businessmade-apis/browser` source, preserving route/payload contracts. Named helpers and readable formatting expose implementation; checkpoint gates remove later screens and handlers. No AppEngine product code changed. Existing finished companion remains untouched.

All six checkpoints passed isolated browser/helper checks. The complete checkpoint 05 was then run continuously against a controlled AppEngine organization and checked again through independent reads: arrival and work order share the same customer; the completed job retains 1.25 hours and $10 material cost; the completed tab has $84.36 total and zero balance; the recorded manual tender reads back as $84.36; the actual receipt has 21 lines; and the stand is available again. The example total reflects that training location’s configured tax, not a universal rate. Occupied-stand 409, completed-work 409 and unpaid-close 400 were also exercised. These results establish the companion workflow; final video review is a separate step. No physical-paper printing or card-provider charge is claimed.
