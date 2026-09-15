# appmint_flutter_crm_demo

A field-sales shaped app: capture a lead (and see if it already exists),
work it — qualify, assign, follow up, note, convert — with the server-written
timeline underneath; look people up and see their journey; and text or call
them through the organization's number rather than your own.

Built on the [Flutter client](https://github.com/JacLight/appmint-client/tree/main/appmint_flutter_client).
The step-by-step tutorial is at
[docs.appmint.io/docs/examples/flutter-crm](https://docs.appmint.io/docs/examples/flutter-crm).

## Run it

```bash
flutter run -d chrome \
  --dart-define=APPMINT_URL=https://appengine.appmint.io \
  --dart-define=APPMINT_ORG=your-org \
  --dart-define=APPMINT_APP_ID=your-app-id \
  --dart-define=APPMINT_APP_KEY=your-app-key \
  --dart-define=APPMINT_APP_SECRET=your-app-secret
```

Sign in with a **staff** account. Leads, contacts and the phone are staff tools.

The client is a relative-path dependency (`../../appmint-client/appmint_flutter_client`);
clone [appmint-client](https://github.com/JacLight/appmint-client) beside this
repository, or switch `pubspec.yaml` to the git dependency.

## What is in it

| File | What it does |
|---|---|
| `lib/crm_api.dart` | The leads, contacts, activity and phone endpoints — and what each of them wants that its name does not say |
| `lib/screens/leads_page.dart` | Search, status filter, and the New lead dialog with the duplicate check |
| `lib/screens/lead_page.dart` | One lead: facts, the actions, and the timeline built from `lead_activity` records plus notes |
| `lib/screens/contacts_page.dart` | Contact search and a person's journey (`customer-activity`) |
| `lib/screens/reach_sheet.dart` | Text or call — from which number, and why the buttons may be dead |
| `lib/screens/phone_page.dart` | Your numbers, the organization's, and a voice-token probe |
| `lib/call_log.dart` | The request log with app-token / user-token badges |

## What it does not do

Ring. Placing and receiving calls needs the native Twilio Voice SDK on a
device; a browser example gets as far as the server's half (the number, the
token). The tutorial says where the device code lives.
