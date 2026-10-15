# Embed AppEngine calling and SMS

Run the labelled local simulator first, then adapt the same client to your configured AppEngine organization. The simulator exercises assigned-line selection, registration, outgoing and incoming calls, call controls, SMS states, history, renewal and logout without contacting a carrier. Its responses and voice SDK events are fixtures, not carrier delivery or microphone audio. The course separately shows actual AppEngine readiness reads.

## Run the client without provider credentials

Use Node 20+. Keep the downloaded `examples/`, `simulation/`, `client/` and `assets/` directories together. From `examples/`:

```sh
npm test
npm run test:simulation
npm run test:client
npm run simulate
```

Open the loopback URL printed by the simulator, normally `http://localhost:4079`. No AppEngine token, provider account, microphone, npm install or external call is needed. The server binds to this computer and stores exercise state in memory; restarting resets the fixtures. The local address is for running the downloaded source, not a hosted Appmint service.

The visible simulation controls let you answer an outgoing attempt, create an incoming call, accept/reject it, exercise keypad/mute/hang-up, change a simulated message status and expire a voice token. Registration, SDK readiness and connected calls remain separate states. The simulated voice token is deliberately not a JWT and is rejected by a real voice provider. Do not replace fixture phone numbers with real recipients and interpret a fixture Delivered status as an actual SMS.

`simulation/contract-fixture.mjs` implements the bounded AppEngine request interface consumed by the same `Phone` adapter. `simulation/fixture-sdk.js` implements the Device/Call event interface used by the browser. `simulation/contract-fixture.test.mjs` verifies registration removal, draft versus send, call history and identifiers. `npm run test:client` runs four tests against the actual included UI script: duplicate Connect, renewal finishing during logout, queued heartbeat after SDK disconnection, and retained message results with duplicate-submit prevention. These are offline contract tests, not an AppEngine or Twilio network test. `client/source.html` and its accompanying JSON contain the lesson's source excerpts; the full browser entry point is `examples/embed-phone.mjs`.

## Put it in your application

`embed-phone.mjs` connects UI callbacks to `browser-softphone.mjs`. The full runnable demonstration is `client/index.html`; it includes its own guarded event handlers and the simulation controls. Choose one connection owner in your app rather than running both the demonstration and the helper for the same installation.

```js
import {mountPhone} from './embed-phone.mjs';

const connection = await mountPhone({
  api: myAuthenticatedPhoneRoutes,
  Device: window.Twilio.Device,
  ui: myPhoneView,
});
```

Implement `myPhoneView.showState`, `showError`, `offerCall`, `onDial`, `onHangup`, `onMute` and `onLogout` for your application. The authenticated API adapter supplies `register`, `heartbeat` and `unregister`. Keep the returned ephemeral voice token separate from the staff session. `mountPhone` is integration glue; the simulator is the complete runnable browser example.

For a direct helper integration, import **both** `startSoftphone` and `persistentDeviceId` from `browser-softphone.mjs`, then inject your API and Device. Reuse the installation ID on renewal. Wait for SDK `registered` and AppEngine `outboundReady` before enabling Dial. Choose `CallerIdOverride` from returned assigned lines. A call connects when its Call event says so, not when registration succeeds.

The helper stops heartbeat on SDK unregistration/error, guards queued callbacks, disables dialing after failed renewal and cleans up a registration that completes after logout. A backend presence record does not prove that the native/browser SDK is online. Multiple tabs sharing an installation ID need one connection owner or explicit coordination.

## Switch to actual AppEngine

Obtain connection details from [API Foundations](../guides/foundations.md#2-create-the-organization) and finish [staff sign-in, including challenge/password change](../guides/foundations.md#7-sign-in-as-the-owner). Use the intended staff member, not a customer or platform-root session.

For a live deployment, an administrator supplies the configured phone service, assigned line and SMS eligibility. See the existing [Phone setup course](../guides/phone-setup.md). This companion focuses on embedding the client; it does not automatically buy numbers, provision a provider or change IVR routes.

Read [assigned phones](https://appengine.appmint.io/documentation/#GET%20%2Fphone%2Fuser-phones) and [outbound readiness](https://appengine.appmint.io/documentation/#GET%20%2Fphone%2Fvoice%2Fapp) first. Current source uses `voice/app` for outbound readiness despite older hosted inbound prose. The actual training organization returned no assigned line and setup-needed; the configured simulation is visibly separate.

From `examples/`, set your own values privately:

```sh
export APPMINT_URL='https://appengine.appmint.io'
export APPMINT_ORG='your-organization-id'
# Set STAFF_TOKEN privately to your completed staff access token.
node readiness.mjs
npm start
```

`npm start` runs **the actual AppEngine host**, not the simulator. It serves the sample UI and retains the staff bearer on the server. It requires no private recording file. The optional `PHONE_PRIVATE_FILE` recording input is excluded from this package. The host defaults to read-only: registration, drafts, sending and calls are disabled by sample-host policy. This is not an AppEngine product refusal.

For your configured environment, `PHONE_ALLOW_DEVICE_REGISTRATION=true` explicitly enables registration/heartbeat/unregister; registration can provision provider credentials. Controlled outgoing calls/SMS additionally require `PHONE_ALLOW_CONTROLLED_ACTIONS=true` and exact comma-separated `PHONE_ALLOWED_RECIPIENTS`. Those remain **off by default**. The host verifies assignment and selected recipients, but its UI authorization check is not a carrier destination security boundary: an issued voice token connects directly to the provider. Provisioning, IVR and AI calling are not enabled by those UI flags.

Load the bundled `/vendor/twilio.min.js` in actual mode. The package contains the existing Twilio 2.18.1 browser bundle and license. For current browser options, consult the [official Device reference](https://www.twilio.com/docs/voice/sdks/javascript/twiliodevice). Deployed browser voice needs HTTPS and microphone permission. Use the [Custom API Gateway course](../guides/gateway.md) for a real per-user session boundary; the loopback host's single session and local HttpOnly cookie are not a public multi-user authentication service.

## AppEngine requests in other languages

`phone-client.mjs` and `phone-client.ts` use the included official Appmint JS client's generic request transport. `sdk-host.mjs` injects the ordinary completed staff bearer without modifying that SDK. Python uses the standard library in `phone_client.py`; it covers AppEngine HTTP operations, not microphone or native voice transport.

```js
const phone = new Phone(await staffClient({baseUrl, orgId, token}));
const assigned = await phone.userPhones();
const readiness = await phone.voiceApp();
```

```python
phone = Phone(base_url, org_id, staff_token)
print(phone.user_phones())
print(phone.voice_app())
```

For SMS, `POST /crm/inbox/update` takes `data.deliveryType: 'sms'`, `from`, `to` and `text`. Sending is the fourth transport argument `{send: true}`—a query option, not a field inside the message or a nested `query` object. `sendText` in `embed-phone.mjs` shows this exact distinction. Retain the returned result if a later history read fails; retry the read, not the send.

`requests.sh`, `requests.json`, `request.py` and the Postman v3 collection include focused requests. Use `python3 request.py <name>` for one intentional operation. Non-GET operations require `ENABLE_SIDE_EFFECTS=true`; the Postman explicit-actions folder requires `enable_side_effects=true`. Optional administration/supervision methods remain for reference and are not part of the client lesson's run sequence. Do not run the whole actions folder as a smoke test.

```sh
python3 -m unittest test_phone.py
postman collection lint postman/collections/phone
```

## Adapt to native iOS or Android

Read `native/README.md` and the source excerpts under `native/`. They are drawn from the actual Appmint Mobile implementation, including AppEngine registration, native token binding, selected caller ID, call events and controls. They are **not a standalone Flutter project** and this package makes no claim that a new native app was compiled or tested on a handset.

Use a stable native installation ID and `platform: 'ios'` or `'android'`. iOS `apnsEnvironment` must match signing; the app's push identity and provider account must match the issued token. The exact SDK and app-service prerequisites are documented beside the excerpts. Verify foreground/background/locked-device ringing, logout and organization switching in your own signed application before claiming those outcomes. A simulated native state is an explanation of the contract, not physical ringing.

## What the evidence establishes

Offline JS/Python tests cover request shapes, browser lifecycle and host boundaries; fixture tests cover the simulated state transitions. The actual course readiness read establishes the returned setup-needed state. The simulator demonstrates how the client handles calls/messages; it establishes no carrier audio, handset SMS receipt or native background push. Live audio and push verification are deployment checks, not a reason to mislabel simulated outcomes.
