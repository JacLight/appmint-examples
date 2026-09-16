# appmint_flutter_payments_demo

The example that answers *can I take money with this?* — open a tab, put
items on it, and settle it one tender at a time: cash with change, a card
with a reference, split across tenders, a refund, and a receipt printed or
sent. Every rule the server enforces is shown in its own words.

Built on the [Flutter client](https://github.com/JacLight/appmint-client/tree/main/appmint_flutter_client).
The step-by-step tutorial is at
[docs.appmint.io/docs/examples/flutter-payments](https://docs.appmint.io/docs/examples/flutter-payments).

## Run it

```bash
flutter run -d chrome \
  --dart-define=APPMINT_URL=https://appengine.appmint.io \
  --dart-define=APPMINT_ORG=your-org \
  --dart-define=APPMINT_APP_ID=your-app-id \
  --dart-define=APPMINT_APP_KEY=your-app-key \
  --dart-define=APPMINT_APP_SECRET=your-app-secret
```

Sign in with a **staff** account. The organization needs products with SKUs;
everything else works with nothing configured. Card-present (Stripe Terminal)
needs a device build — the example gets the server's half and says so.

The client is a relative-path dependency (`../../appmint-client/appmint_flutter_client`);
clone [appmint-client](https://github.com/JacLight/appmint-client) beside this
repository, or switch `pubspec.yaml` to the git dependency.

## What is in it

| File | What it does |
|---|---|
| `lib/payments_api.dart` | Tabs, items, settle, refund, receipts, Terminal token — and the rules the server enforces on each |
| `lib/screens/register_page.dart` | Open tabs and a New tab button |
| `lib/screens/tab_page.dart` | One tab: items, totals, payments, refund, receipt |
| `lib/screens/take_payment_sheet.dart` | Cash / Card / Reader / Other, tip, reference, the server's refusals verbatim |
| `lib/call_log.dart` | The request log with app-token / user-token badges |
