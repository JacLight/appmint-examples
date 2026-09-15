# appmint_flutter_chat_demo

Support chat, the customer's side: sign in (or create an account), open the
conversation, and watch the socket — connect, authenticate, queued, agent
assigned, messages, read receipts — line by line beside the thread.

Built on the [Flutter client](https://github.com/JacLight/appmint-client/tree/main/appmint_flutter_client)
and the [chat package](https://github.com/JacLight/appmint-client/tree/main/appmint_flutter_chat).
The step-by-step tutorial is at
[docs.appmint.io/docs/examples/flutter-chat](https://docs.appmint.io/docs/examples/flutter-chat).

## Run it

```bash
flutter run -d chrome \
  --dart-define=APPMINT_URL=https://appengine.appmint.io \
  --dart-define=APPMINT_ORG=your-org \
  --dart-define=APPMINT_APP_ID=your-app-id \
  --dart-define=APPMINT_APP_KEY=your-app-key \
  --dart-define=APPMINT_APP_SECRET=your-app-secret
```

Sign in as a **customer**. Somebody has to answer — an agent in the Appmint
admin or Appmint Mobile, or the terminal agent in `tool/agent.mjs`.

Both packages are relative-path dependencies (`../../appmint-client/…`);
clone [appmint-client](https://github.com/JacLight/appmint-client) beside this
repository, or switch `pubspec.yaml` to the git dependencies.

## What is in it

| File | What it does |
|---|---|
| `lib/screens/support_page.dart` | Wires the chat package to the client and narrates the socket |
| `lib/socket_log.dart` | The socket panel — state changes, events in, events out |
| `lib/screens/sign_in_page.dart` | Customer sign-in / sign-up with the verification-code dialog |
| `lib/call_log.dart` | The HTTP request log with app-token / user-token badges |
| `tool/agent.mjs` | A support agent at a terminal, for testing without the admin |
