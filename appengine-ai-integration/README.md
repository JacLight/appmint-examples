# AppEngine AI Integration demo app

This sample manages one real AI employee and one configured AI Assistant. The browser is a custom client of AppEngine, not Appmint Studio. The employee model runtime is the existing `ai-employee` session manager; this package does not substitute a scripted answer for AI execution.

## Prerequisites

1. Complete [API Foundations §7 — staff sign-in](http://localhost:4060/videos/course-catalogue/materials/appengine-api-foundations-script.html#7-sign-in-as-the-owner), including any challenge/password change. Keep the ordinary Owner/ConfigAdmin session private.
2. The package includes an unchanged built snapshot of the official `appmint-client/appmint_js_client` in `vendor/appmint-js`. That is the default. To use your newer official checkout, run its documented install/build, then set `APPMINT_SDK_MODULE` to the **absolute file URL of its built `dist/index.js`**. This sample calls its public request transport; it does not change the SDK or create a System app credential.
3. For employee execution, use the included `runtime/` source from the existing `ai-employee` checkout and its README. Run `npm ci` inside `runtime/`, configure your private environment and model login, then `npm start`. This snapshot removes the original development-key fallback: set your own `AIE_PROVIDER_KEY` before starting. Configure AppEngine's private `AI_EMPLOYEE_SESSION_MANAGER_URL`/`AI_EMPLOYEE_SESSION_MANAGER_KEY` and runtime `AIE_PROVIDER_KEY` together. Confirm runtime→AppEngine reachability, a supported model and authenticated model CLI. Choose a dedicated persistent data directory; it contains secrets and resumable jobs.
4. For a deployed browser gateway/session, follow [Custom API Gateway](http://localhost:4060/videos/course-catalogue/materials/appengine-custom-api-gateway-script.html). This loopback sample intentionally demonstrates local trusted-host configuration, not production login/session management.
5. For ticket tool data and access, use an owned ticket from the [CRM APIs course](http://localhost:4060/videos/course-catalogue/materials/appengine-crm-apis-script.html). Ticket number/email is a selector, not caller authentication.

[Maintained reference](https://appengine.appmint.io/documentation/) is the current contract. Search AI Employees, Workspace, Chat and CRM AI Assistant. The complete written course is [AI Employee APIs](http://localhost:4060/videos/course-catalogue/materials/appengine-ai-employee-apis-script.html).

## Start the sample

From the examples repository, run `cd appengine-ai-integration` and `npm ci`. This is the actual custom app shown in the course. The full source includes its browser interface, trusted Node host, employee runtime, official SDK snapshot and JavaScript/TypeScript/Python/curl/Postman examples.

Course links below use the local documentation server on port 4060. The maintained API reference works independently of that server.

Supply your own configuration:

```sh
export APPMINT_URL=https://appengine.appmint.io
export APPMINT_ORG=your-organization
# Optional: override the bundled official SDK with a newer built checkout.
# export APPMINT_SDK_MODULE=file:///absolute/path/appmint-client/appmint_js_client/dist/index.js
export AI_FIXTURE=/private/path/your-ai-fixture.json
# Supply STAFF_TOKEN privately from completed staff sign-in. Never commit it.
node read-employee.mjs
npm start
```

Open the exact loopback address printed by the host (default `http://localhost:4075`). That is your local sample, not the AppEngine production URL. Staff/runtime tokens stay on the host. `AI_FIXTURE` contains only selected IDs and handles, shaped like `fixture.example.json`. The server permits only explicit actions and verifies work belongs to the selected employee before a decision/retry/cancel.

If you have no employee yet, edit `employee-profile.example.json` with your existing supervisor, selected model, intended hours and boundaries. Start with **no existing fixture file**, then run the deliberate stages:

```sh
node setup.mjs create
node setup.mjs access
node setup.mjs provision
node setup.mjs activate
node setup.mjs conversation
node setup.mjs native-chat
node setup.mjs assistant
node setup.mjs read
```

Creation makes the employee's own staff identity and private team relationship. Access adds the existing User group; mandatory AI remains. Provision before expecting a connection, then switch on. Inspect provider status, own-user hello and a genuine work result separately. `setup.mjs` never automatically runs the stages or retries a failed write. If a response was lost, inspect the server records before repeating creation.

The Assistant profile explicitly enables **only `get_ticket`**, with no triggers/channels. Missing/null tools currently means all tools; `[]` means no tools. Do not omit the field when you intend no executable tools. Use the selected Assistant and your own ticket number in the UI.

## What each file does

- `employees.mjs` / `employees.ts`: management, direct work, real task assignment, Workspace messages, approvals and worker contracts. The worker takes a separate employee client/session.
- `sdk-host.mjs`: injects the ordinary staff bearer through the official SDK's supported fetch option. It refuses an unexpected upstream origin and redirects.
- `native-chat.mjs`: authenticates Socket.IO, obtains `ack.chat.chatId`, sends only the intended message and closes its socket. A lost acknowledgement requires reading history before another send.
- `employees.py` / `read_employee.py`: standard-library Python equivalents; no new SDK claimed.
- `employee-host.mjs` + `client/` + `assets/`: the runnable local browser interface and explicit trusted adapter. `AI_CLIENT_DIR` and `AI_ASSET_DIR` override bundled paths if needed.
- `requests.json`, `requests.sh`, `postman/`: focused JSON/curl/Postman operations. Shell defaults to a read. Select individual mutation requests in Postman and set `enabled_action` to that request's name. Staff and employee tokens are separate variables; fill them privately, not in committed YAML. Do not run the whole collection as an automated scenario.
- `employee-profile.example.json`, `assistant.example.json`: consequential configuration choices, not an exhaustive frozen schema copy.

## Verify meaningful results

1. Ask the employee a bounded question. Read a genuine reply authored by its staff email and the matching message work item.
2. Assign a Workspace task using `task.assignTo:[employeeEmail]`; read the queue's `source:assigned` and `ref.id`. Inspect the original task after completion. Closed Workspace status is `done`, not free-form `completed`.
3. Mention the employee explicitly in a shared Workspace; direct Workspace and native Chat use distinct conversation contracts.
4. Request a narrowly defined approval. While waiting, perform no action. After a human decision, obtain the work again, confirm the same unchanged action and verify its result. Same-job reuse matches action category and monetary amount, not every payload field. Rejection means no action.
5. Request a report from an explicit summary window; compare with that snapshot. Later counts include later jobs and can change.
6. Execute the Assistant's owned ticket lookup. Inspect `toolResults` and the final answer, not just a friendly response. No ticket mutation or customer message is part of that example.

Pause/working hours/budget refusals are distinct from transport errors. Do not retry writes blindly. The runtime reports cost; a configured budget is not proof of an observed budget stop. Model replies and latency vary; use actual saved states rather than a fixed delay as completion evidence.

## Local checks

```sh
npm test
python3 -m unittest discover -p 'test_*.py'
postman collection lint postman/collections/ai-integration
```

Offline tests check assignment shape, mention scope, refusal/no-action behavior and avoiding duplicate writes. They are not live model or external delivery proof. The recorded course separately exercised actual employee identity, native/Workspace replies, task/result, approval/resume, reporting and a tool-backed Assistant result. No email, SMS, phone call, charge or physical operation is claimed.

## Source and video

- [Source repository](https://github.com/JacLight/appmint-examples/tree/main/appengine-ai-integration)
- [Course video and written companion (local docs server)](http://localhost:4060/videos/appengine-ai-integration-usecase/course/review.html)

Private staff sessions, employee credentials, model credentials and runtime data are not included. `fixture.example.json` contains placeholders only. Keep real configuration outside the repository.
