# Native integration reference

These excerpts come from the current Appmint Mobile implementation, not the CRM example's phone-inventory page. They give concrete integration points for your existing Flutter application. This directory is not a standalone Flutter project; no native build or physical background-ringing test is claimed for this download.

Read [registration, binding and cleanup](softphone-service.md), then [caller selection, events and controls](phone-screen.md). `source-manifest.json` records exact repository paths, hashes and source ranges. The excerpts intentionally omit the rest of Appmint's navigation, theme and business screens. Do not paste a partial excerpt into a new project and expect all app-specific symbols to resolve.

## Supply the application boundary

The original service imports these app-owned adapters:

| Existing dependency | Responsibility in your app |
|---|---|
| `services/http_client.dart` / `AppengineHttpClient` | Authenticated AppEngine requests for the current staff organization, including completed access-session headers. Its `orgId` identifies the current organization. |
| `services/storage_service.dart` / `StorageService` | Persist installation ID and the user's explicit offline setting; keep session secrets in suitable OS storage. |
| `services/client_info_service.dart` | Optional supported client metadata sent with registration/heartbeat. This is not caller identity. |
| `providers/communications_provider.dart` | Read assigned phones, select a returned E.164 number and load communications history. |
| `providers/auth_provider.dart` and app theme/navigation | Existing UI dependencies, which you replace with your application's state and widgets. |

The source snapshot's Flutter dependencies include `twilio_voice ^0.5.0`, `firebase_core ^4.15.0`, `firebase_messaging ^16.7.0`, `device_info_plus ^13.3.0`, `permission_handler ^13.0.2`, `http ^1.6.0` and `shared_preferences ^2.5.6`. These are observed constraints from that app, not a promise that installing them creates a complete phone app. Follow your selected plugin version's platform installation instructions and compatible Flutter/OS toolchains.

## Follow the AppEngine sequence

1. Complete your staff session and load `/phone/user-phones` plus `/phone/voice/app`. Keep the assigned line's record ID separate from its E.164 `phoneNumber`.
2. Persist one installation ID, then call `/phone/voice/register-device` with `platform: ios` or `android`, that ID and supported capabilities. On iOS send the signing-compatible `apnsEnvironment`. If registration says voice is unavailable, stop before native binding.
3. Bind the returned voice token and installation push token through `TwilioVoicePlatform.instance.setTokens`. Use the returned identity; do not reconstruct it from an email. Keep staff and voice tokens separate and do not copy debug token logging into your app.
4. Observe native call/registration results. Returning from `setTokens` does not establish that background push registration succeeded. Android obtains an FCM token; the referenced iOS plugin uses its own PushKit token rather than a Dart-supplied FCM token.
5. For an outgoing call, pass the selected assigned number with `extraOptions: {'CallerIdOverride': fromNumber}`. Drive Connected and terminal UI from native Call events. `place()` returning true is an accepted placement request, not proof of two-way audio.
6. Reuse the installation ID during renewal. Stop presence refresh when the connection is not usable, guard late callbacks, and serialize renewal versus logout so a late registration cannot restore a signed-out identity. The browser helper's tested race handling is useful design guidance; the native excerpts are not certified to cover every race.
7. Before switching organization, remove the previous native registration, stop its timers and callbacks, and bind only the newly authenticated organization's token. On logout, remove both native binding and AppEngine installation presence.

## Configure the native application

Follow the current official [iOS voice setup](https://www.twilio.com/docs/voice/sdks/ios/get-started), [Android voice setup](https://www.twilio.com/docs/voice/sdks/android/get-started) and [mobile best practices](https://www.twilio.com/docs/voice/sdks/mobile-best-practices). Those sources carry changing SDK/platform requirements.

The source app's relevant configuration locations are `ios/Runner/Info.plist` (microphone permission and audio/VoIP background modes), `ios/Runner/AppDelegate.swift` (the signing environment passed to AppEngine), and `android/app/src/main/AndroidManifest.xml` (native voice/FCM service declarations). Use your own app identity, signing, entitlements and Firebase configuration. Private signing/provider materials are intentionally absent here. Do not create a competing iOS PushKit registry if your selected voice plugin already owns it.

Match the app's push configuration and provider account to the account that issues the voice token. Test actual foreground, background and lock-screen incoming calls, rejection, logout, renewal and organization switching in that signed app. A simulator can explain these states but does not verify physical push or audio.
