# AppEngine real-time support integration

This is the source companion for [AppEngine Real-time Chat and AI Support Integration](http://localhost:4060/tutorials-plan/course-content/courses/build-realtime-support/). It reuses the official `appmint_flutter_chat` controller, service and screen unchanged. The host application's sign-in, configuration and file-picker wiring are course additions. The Node/Python clients demonstrate the same Socket.IO events; they are not alternative AppEngine servers. Course links using localhost open the local documentation server when it is running; the source and official package links are on GitHub.

## Existing official sources

- [Appmint client packages](https://github.com/JacLight/appmint-client): Flutter HTTP and chat packages, JavaScript HTTP client.
- [Official Flutter support-chat example](https://docs.appmint.io/docs/examples/flutter-chat): original app-level authentication and event-log wiring.
- [Appmint examples](https://github.com/JacLight/appmint-examples): complete example projects.

Use the exact repository URLs published in your Appmint documentation if your organization's distribution differs. The course was checked against the local source copies named in `PROVENANCE.json`. No web package publication or mobile-store release is claimed.

## Prerequisites

Prepare your actual API base URL, orgid, an existing customer token, the saved chat_config ID, and a separate staff token for staff tools. The [Database and Repository video, chapter 2](http://localhost:4060/videos/appengine-data-records/course/review.html) shows staff sign-in. [API Foundations](http://localhost:4060/videos/appengine-api-foundations/course/review.html) covers the customer session; use its exact current sign-in requirements. Never give staff credentials to a visitor app.

HTTP customer sign-in uses `POST /profile/customer/signin`, organization header `orgid`, and JSON `{ "email": "YOUR_EMAIL", "password": "YOUR_PASSWORD" }`. Complete any password-change or second-factor challenge before using a token. The small Flutter host directs challenge cases to the sign-in prerequisite; it is not a full authentication application.

## Node / TypeScript

From `node`, run `npm install`. Supply the values in your shell or local secret environment (do not commit them):

```sh
export APPENGINE_URL='https://YOUR_APPENGINE_API_ADDRESS'
export APPENGINE_ORG='YOUR_ORG_ID'
export APPENGINE_TOKEN='YOUR_CUSTOMER_TOKEN'
export APPENGINE_CHAT_CONFIG='YOUR_SAVED_CHAT_CONFIG_ID'
npm start
```

Type a question. `/history` reads the current conversation; `/quit` disconnects. The local session file retains only orgId and chatSessionId. It does not contain a password or JWT. Keep a separate session file per customer; the included command-line client is intended for one identity at a time.

For a staff terminal, use the staff token and additionally set `APPENGINE_ROLE=staff`, `APPENGINE_CHAT_ID` from the target conversation, `APPENGINE_CUSTOMER_EMAIL`, and `APPENGINE_ASSISTANT` to the configured assistant's stable name. Commands `/takeover`, `/resume` and `/close` act on that exact conversation. Close passes `sendTranscript:false`; the example does not request an external email.

The connection explicitly requests WebSocket transport because that is the tested deployment transport. Authentication and stream listeners are installed before connect. A successful transport connection is not the AppEngine authenticate result. Match stream events to the acknowledged message ID; greetings and other messages can interleave.

## Python

Create a virtual environment and install `python/requirements.txt`. Set the same customer environment variables, then run `python python/support.py`. This example uses python-socketio and the actual `/chat` namespace, not raw WebSocket frames. An HTTP client such as requests alone cannot replace the Socket.IO protocol.

## Flutter host using the official chat screen

The `flutter` directory is the course's small host adapter. Clone the two repositories as siblings. This example is nested inside `appmint-examples`, so its Flutter dependency resolves three levels up:

```sh
git clone https://github.com/JacLight/appmint-examples.git
git clone https://github.com/JacLight/appmint-client.git
cd appmint-examples/appengine-realtime-support/flutter
```

The path dependency is `../../../appmint-client/appmint_flutter_chat`. `PROVENANCE.json` records the client revision used in the course; the source checkout at that revision is the reproducible reference. Then:

```sh
flutter pub get
flutter build web --release
export APPENGINE_URL='https://YOUR_APPENGINE_API_ADDRESS'
export APPENGINE_ORG='YOUR_ORG_ID'
export APPENGINE_CHAT_CONFIG='YOUR_SAVED_CHAT_CONFIG_ID'
node serve.mjs
```

Open the loopback preview shown by the server on port 4092. `serve.mjs` serves the compiled Flutter app and its **non-secret** `/course-settings` response; a plain static file server does not provide that route. Sign in with your existing customer account. The password is used for sign-in, held only in the host form and never written into the source bundle. The customer token remains in memory; after reload this example asks you to sign in again. Shared Preferences preserves the session identifier for the normalized customer and organization.

The actual controller, chat view, streaming/history handling and attachment transport remain in `appmint_flutter_chat`. This adapter adds configId, callbacks that persist chatSessionId, and FilePicker's `onPickAttachments` hook. The official package is Flutter code usable in supported target apps; this course's completed capture is the web build, not an Android/iOS installation test. A mobile host should supply its own settings and secure session lifecycle rather than request a browser-only `/course-settings` route.

## Website guests

A guest session is a separate integration branch. It needs an app identity configured for your organization. `POST /profile/guest/auth` uses `orgid` and `appId` with visitor details, and returns a guest token. The Socket.IO `authenticate` result supplies chatSessionId. Retain it and pass it back in context on reconnect. Guest conversation addressing is `customer:{chatSessionId}:{email}`; the official Flutter controller in this version uses the signed-in key `customer::{email}` and is not a drop-in guest controller.

A visitor-entered email is not verified email ownership. The course operates controlled threads and does not certify authorization isolation for arbitrary chat IDs. Keep these distinctions when exposing your production integration.

## Read the outcome, not just an acknowledgement

A message acknowledgement supplies messageId. A stream end supplies the saved answer ID. Read history and match actual text when testing. An AI failure may produce fallback content and a human handoff instead of a separate stream-error event. Do not manufacture a success bubble, automatically resend uncertain messages, or assume a completed stream is necessarily a useful answer.


## HTTP setup: TypeScript, JavaScript, Python, curl, Postman and JSON

`http` contains full bodies and individually selected operations. Assistant/config creation, public configuration read and a recorded file upload were demonstrated; guest authentication, matching AI answer and same-session browser reconnect were also executed using an existing authorized app identity.

Set APPENGINE_URL, APPENGINE_ORG, APPENGINE_ASSISTANT (unique stable name), APPENGINE_CONFIG_NAME (unique), APPENGINE_STAFF_EMAIL (controlled staff), and privately APPENGINE_STAFF_TOKEN for the two setup mutations. Review http/json/assistant.json and chat-config.json: tools is explicitly empty and missed-chat automation is disabled. Creation is not automatically rolled back. Inspect a saved result before retrying a partially completed setup.

```sh
node http/client.mjs assistant-create
node http/client.mjs chat-config-create
# Set APPENGINE_CHAT_CONFIG to the second response's sk.
node http/client.mjs chat-config-get
```

JavaScript requires Node20+. TypeScript: run npm ci in node, then npm run http -- chat-config-get; npm run typecheck validates both typed clients. Python: python3 http/client.py chat-config-get (standard library only). curl: cd http, then sh requests.sh chat-config-get. Python renders JSON for curl; no jq is used. JSON templates use ${ENVIRONMENT_VARIABLE} placeholders; the runners expand them. Resolve them before manually sending raw JSON. Import http/support.postman.json, fill variables privately, and send individual requests. Do not automatically run the full collection: it includes record creation and file upload.

Guest: set APPENGINE_APP_ID, APPENGINE_CUSTOMER_EMAIL, APPENGINE_GUEST_FIRST_NAME and APPENGINE_GUEST_LAST_NAME, then select guest-auth. Current source reads orgid and appId. An existing app identity is required; these examples do not register one or send an app secret. Guest auth may create a customer and returns credentials: keep stdout private. It does not verify email ownership or return chatSessionId; the socket authenticate event supplies that ID. The recorded browser guest procedure verifies authentication, a matching AI answer and same-session history after reload.

Upload: set APPENGINE_CHAT_CONFIG and APPENGINE_CUSTOMER_EMAIL, then run node http/client.mjs chat-upload ./your-controlled-file.txt (same action/file with Python or curl). The multipart field is files; the client sets the boundary. This currently public upload route does not establish private attachment authorization. Retain returned path/metadata, send them in chat-message.files, then verify recipient/history. Upload alone is not chat delivery.

## Browser Socket.IO host

Run npm ci in node, then node browser/serve.mjs from this examples directory. Open the local address printed on port4094. It serves the installed Socket.IO library locally, with no CDN dependency. Requests go directly to the entered AppEngine endpoint, so that deployment must allow the intended browser origin.

Choose Existing customer, enter endpoint/org/config and ordinary customer credentials. The token stays in memory; only chatSessionId is retained in localStorage, scoped by endpoint/org/config/mode/email. The password field clears after sign-in. Staff-authenticated sockets are refused. The host installs listeners before connecting, waits for authenticate, groups chunks by messageId, reads history, shows handoff, and uploads files before sending them. It does not automatically retry uncertain sends. Complete password-change/verification using the prerequisite course; this sample is not a full production authentication UI.

Website guest calls the actual guest/auth route, then uses its token in the socket handshake. This branch requires an existing app identity and is demonstrated in the browser; the filmed Flutter implementation uses a signed-in customer instead. The browser guest flow was executed against the controlled AppEngine deployment. Public hosted production deployment and native mobile installation are not claimed. Use appropriate privacy/session lifecycle and do not give visitors a staff token.

The browser’s **Clear local view** control clears only displayed messages. It never deletes server history; **Read saved history** restores the retained records.

## Staff operations and automatic AI handoff

`node/operations.ts`, compiled `node/operations.mjs` and `python/operations.py` execute **one named Socket.IO operation** from `node/operations.json`. Listeners are registered before connection; execution waits for successful `authenticate`. Install the existing Node or Python dependencies first. Set APPENGINE_URL, APPENGINE_ORG and APPENGINE_TOKEN to your own authorized staff session; never expose that token in the public browser. Set APPENGINE_CHAT_ID and APPENGINE_CUSTOMER_EMAIL from the exact owned conversation. APPENGINE_ASSISTANT is the assistant name used by socket resume; APPENGINE_ASSISTANT_ID is the saved record ID used by HTTP update.

Run from node: `npm run operation -- queue-stats`, or `node operations.mjs queue-stats`. Python: `python3 python/operations.py queue-stats`. Replace queue-stats with an exact operation key. Examples include set-status, queue-position, takeover-chat, sendMessage, resume-ai, close-chat, shareStatus, updateMessageStatus and chat-history. APPENGINE_MESSAGE supplies the staff reply. Typing/read templates use APPENGINE_SENDER_EMAIL, APPENGINE_RECIPIENT_EMAIL and, for read, APPENGINE_MESSAGE_ID from the saved message. The sender/recipient values describe the **original message**, so a reader acknowledges that message to its other participant. close-chat sets sendTranscript:false.

Keep the staff connection open while testing queue availability: set APPENGINE_LISTEN_SECONDS=300 for set-status. The default runner waits ten seconds for recipient events after its acknowledgement; Ctrl+C ends it. Do not interpret an acknowledgement as proof that the other participant received the event; observe that participant and read saved history where applicable.

For pick-next, use an isolated training queue with no other arrivals. Set APPENGINE_CONFIRM_PICK_CHAT_ID to the exact APPENGINE_CHAT_ID and APPENGINE_ISOLATED_QUEUE=yes. The runner refuses unless queue size is one and this target is first. These read checks are not an atomic server reservation: concurrent arrivals can change the queue. It verifies the returned chat ID and stops on mismatch; do not blindly retry. Production routing needs its own concurrency design.

Enable the demonstrated assistant handoff with `node http/client.mjs assistant-enable-handoff` (or the TS, Python, curl or Postman equivalent). Use a dedicated training assistant: this PUT replaces its tools and behaviorRules arrays. The exact body is http/json/assistant-handoff.json. Only transfer_chat_to_agent is enabled. Ask for a human from the guest browser, wait for the resulting queue state, then inspect the returned pick-next context: aiHandoff:true, reason, summary and assistantId. The recorded proof then verifies the staff reply in this same guest history. The gateway did not expose a tool-call stream event; the course uses the observed queue and reply outcomes.


## Offline website requests

In Chat Designer, select the intended widget, set Status Offline, enable Offline → Show Form, set Message and Save. The website's **Leave us a message** form authenticates the submitted guest details afresh, then creates a ticket. Obtain your organization's public App ID through App Credentials; an authorized ConfigAdmin can create that identity. Guest authentication uses the App ID, never its app secret.

After guest-auth, privately set `APPENGINE_GUEST_TOKEN` to that response's token. Keep `APPENGINE_ORG` and `APPENGINE_CHAT_CONFIG` matched to the same organization/widget; set `APPENGINE_MESSAGE` to the question. Choose one implementation:

```sh
node http/client.mjs offline-ticket-create
# or python3 http/client.py offline-ticket-create
# or from node/: npm run http -- offline-ticket-create
# or from http/: sh requests.sh offline-ticket-create
```

Postman's offline-ticket-create uses private guest_token, chat_config_id and offline_message variables. The body template contains only data.description and data.configId. The same-organization guest token supplies the reporter identity; a registered customer or staff token is not this route's identity.

Show success only after the response contains a saved `sk`; preserve input on error. Use the staff session to open the exact saved ticket and compare the question. The course's actual official widget and staff readback were verified; these portable HTTP variants expose that same contract and have static and request-construction checks, not separate new live submissions in every language. A created ticket can start configured workflow/notifications. The recording used a local mail sink and disabled external SMS, so external delivery is not claimed. Avoid duplicate submissions when a response is uncertain.


## Demonstrated targets and production adaptation

The course ran the Flutter host as a **web build** and exercised the actual browser guest widget separately. It does not claim a native Android/iOS installation test. The official Flutter chat package is reusable in mobile applications, but this host deliberately obtains settings from the local web server's `/course-settings` route; provide your mobile app's own configuration and secure token lifecycle when adapting it. Platform project scaffolds, push notifications and app-store packaging are outside this companion.

The browser demo is a vanilla JavaScript client using Socket.IO, not a React implementation. It supports guest authentication, retained sessions, AI messages and staff handoff. Offline intake is supplied as portable HTTP examples and demonstrated with the official widget in the course; it is not an extra offline-form button in this browser demo.

Tokens belong only in your private environment or application session. The loopback development servers publish only static assets and non-secret endpoint/org/config settings. Do not commit shell values, local session files, guest-auth responses or customer records.
