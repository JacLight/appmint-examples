# appmint_flutter_events_demo

Create an event, give it a ticket type, issue a ticket, and work the door —
check in, re-scan, check out — against a live AppEngine, with every request the
client makes shown beside the screen.

Built on the [Flutter client](https://github.com/JacLight/appmint-client/tree/main/appmint_flutter_client).
The step-by-step tutorial is at
[docs.appmint.io/docs/examples/flutter-events](https://docs.appmint.io/docs/examples/flutter-events).

## Run it

Credentials come in at build time so none are committed:

```bash
flutter run -d chrome \
  --dart-define=APPMINT_URL=https://appengine.appmint.io \
  --dart-define=APPMINT_ORG=your-org \
  --dart-define=APPMINT_APP_ID=your-app-id \
  --dart-define=APPMINT_APP_KEY=your-app-key \
  --dart-define=APPMINT_APP_SECRET=your-app-secret
```

Sign in with a **staff** account. Issuing tickets and scanning are staff actions.

The client is a relative-path dependency (`../../appmint-client/appmint_flutter_client`);
clone [appmint-client](https://github.com/JacLight/appmint-client) beside this
repository, or switch `pubspec.yaml` to the git dependency.

## What is in it

| File | What it does |
|---|---|
| `lib/events_api.dart` | The events endpoints, and the four things about them the error messages do not say |
| `lib/screens/sign_in_page.dart` | Staff sign-in with the verification-code dialog |
| `lib/screens/events_page.dart` | The list, and creating an event |
| `lib/screens/event_page.dart` | Ticket types, tickets, and the way to the door |
| `lib/screens/door_page.dart` | Check in / check out, three-colour result, live stats |
| `lib/call_log.dart` | The request log with app-token / user-token badges |
