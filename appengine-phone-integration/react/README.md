# React phone and SMS client

A runnable React application, with outgoing/incoming calls, accept/reject/hang up, mute, DTMF, text messages, delivery-state controls and call history. **All communication in this example is simulated locally.** No carrier account, microphone or staff token is needed.

## Run

From this directory:

```sh
npm install
npm run dev
```

Open **http://localhost:4082**. The command starts the existing contract simulator on port 4081 and Vite on port 4082. Stop both with Ctrl-C. Keep the sibling `examples/` and `simulation/` folders in place; this React application imports their tested code. It does not stop any pre-existing service. If a port is occupied, stop your prior instance first.

1. Connect phone. Registration and SDK readiness are separate from call connection.
2. Dial, then click **Simulate remote answer**. Try mute, keypad and hang up.
3. Click **Simulate incoming**, then accept or reject. Another incoming call is rejected while a call is active.
4. Send an SMS. Its saved receipt starts pending. Select simulated sent, delivered or undelivered, then inspect the record.
5. Exercise token expiry or a network error. Disconnect/reconnect and refresh history before retrying an uncertain action.

The React view retains a successful message receipt if the following refresh fails. Simulation events and recipient numbers must never be described as real ringing or delivery.

## Verify and build

```sh
npm test
npm run build
```

The build is a browser bundle, **not a backend**. For a local production-build preview, run `PORT=4081 node ../simulation/server.mjs` in one terminal and `npm run preview` in another. The preview proxy supplies the same local API and fixture SDK. Do not deploy this demo proxy as a production authorization boundary.

## Integration structure

- `src/main.jsx`: actual React components, controls and result rendering.
- `src/session.mjs`: a small React-facing session owner. It prevents duplicate starts, stops a late registration after cleanup, refuses concurrent calls and rejects a second incoming call before it can change the current UI.
- `../examples/browser-softphone.mjs`: the existing SDK helper owns registration, heartbeat, voice-token renewal and Device cleanup. The React example reuses it rather than reimplementing that lifecycle.
- `../simulation/`: the same labelled API contract and Device fixture used by the JavaScript example.

`useEffect` owns the session and tears it down when the component unmounts. There is no automatic call/SMS retry. The example intentionally uses one mounted root; the wrapper also compensates delayed asynchronous completion.

## Connect a configured AppEngine service

Keep the completed staff session on a trusted server. Replace the local `/api` proxy with that authenticated gateway and its authorized assigned-line checks; map registration, heartbeat, unregister, send SMS and communications history through the existing [Phone client](../examples/phone-client.mjs). Provide the actual Twilio `Device` from the supplied SDK bundle instead of `/fixture-sdk.js`. `PhoneSession` accepts an injected `Device` and registration API. Remove simulation controls and map actual message readback into the view's messages array.

Only the ephemeral voice credential belongs in the browser. Registration is not proof of SDK registration, and SDK registration is not proof of a connected call. Production requires the configured AppEngine phone service, assigned staff line, HTTPS/microphone access and actual SDK callbacks. See the [main integration guide](../examples/README.md) for prerequisites and native differences. This React example does not provision a provider or implement native push registration.
