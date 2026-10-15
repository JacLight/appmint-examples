# Flutter phone and SMS client

A runnable Flutter client with a clearly labelled, entirely local provider simulation. It demonstrates registration versus SDK readiness, outgoing/incoming call state, accept/reject, mute, DTMF, hangup, SMS receipts/status, history, token renewal and logout cleanup. No carrier account, credentials, microphone, network or push service is used in simulation.

## Run

Use Flutter with Dart 3.13.5 or newer (the generated project SDK constraint). From this directory:

```sh
flutter pub get
flutter run -d chrome
# Or select your own simulator/device:
flutter devices
flutter run -d YOUR_DEVICE_ID
```

The repository contains Android, iOS and web targets. Native signing and toolchains are your own; a browser build and widget tests do not prove physical ringing or a signed mobile release.

Register the installation, then select **Simulate SDK ready**. Dial the sample number and select **Simulate remote answer**, or simulate an incoming call and accept/reject it. The SMS tab retains a pending receipt; simulation controls change its status. The History tab retains call outcomes. Exercise network failure or expiry, then reconnect the simulated SDK. Restarting the app clears all exercise state.

## Files and integration boundary

- `lib/main.dart`: complete responsive Flutter interface.
- `lib/phone_model.dart`: client state owner, injectable `PhoneApi`, and in-memory AppEngine fixture.
- `test/widget_test.dart`: registration/event sequencing, logout race, SMS state, offline heartbeat and narrow-screen UI tests.

`PhoneApi` accepts your authenticated request function with method, path, body and query parameters. Its registration/heartbeat/unregister and SMS request shapes match the supplied JS/Python clients. SMS uses `send=true` as a query parameter, not a body property.

The runnable default is **simulation-only**. For real calling, inject your staff-session transport, read actual assigned lines and outbound readiness, persist a unique installation ID, select the correct iOS/Android platform and bind the returned voice token to your native SDK. The model's `sdkRegistered`, `answer`, and terminal events stand for SDK callbacks; simulation buttons are not actual native SDK integration. Use the [existing Appmint native source reference](../examples/native/README.md) for concrete token binding, Call events, caller ID and push setup. Keep staff and voice tokens separate; do not log either. The hard-coded simulation installation ID and fixture lines must not be used in a deployed app.

The [full client guide](../examples/README.md) covers live service prerequisites. The Flutter simulator never provisions providers or changes AppEngine data. Background/locked-device ringing, native push and actual audio require a configured signed application and device tests.

## Check

```sh
flutter analyze
flutter test
flutter build web --release
```
