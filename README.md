# appmint-examples

Small, runnable apps built on [Appmint](https://appmint.io) AppEngine — one per
idea, meant to be read end to end and copied from.

Each example does one thing properly rather than touring everything. If you are
evaluating whether AppEngine can back your app, start with **authentication**:
every other example begins where that one ends.

## The examples

| Example | Stack | Shows | Status |
|---|---|---|---|
| [`appmint_flutter_authentication_demo`](appmint_flutter_authentication_demo) | Flutter | App auth, staff vs customer sign-in, verification codes, sessions | **Working** |
| [`appmint_flutter_payments_demo`](appmint_flutter_payments_demo) | Flutter | Card present, cash, tips, split tenders, refunds, receipts | Scaffolded |
| [`appmint_flutter_events_demo`](appmint_flutter_events_demo) | Flutter | Create an event, add a ticket type, issue a ticket, scan it at the door — check in, re-scan, check out | **Working** |
| [`appmint_flutter_chat_demo`](appmint_flutter_chat_demo) | Flutter | Customer support chat over the `/chat` socket — queue, agent pick-up, replies, read receipts, with the socket narrated | **Working** |
| [`appmint_flutter_crm_demo`](appmint_flutter_crm_demo) | Flutter | Leads with the server-written timeline, duplicate check, contacts and journeys, text/call through the org number | **Working** |
| [`appmint_flutter_community_demo`](appmint_flutter_community_demo) | Flutter | Feed, posts, comments, reactions that wait for the server, reporting | **Working** |
| [`nextjs-store`](nextjs-store) | Next.js 15 | Storefront: catalog, cart, server-priced totals, credentials behind a proxy | **Working** |
| [`remix-store`](remix-store) | Remix 2 | The same storefront plus appointment booking — no proxy needed | **Working** |

"Scaffolded" means the project exists and is wired to the client, but the app
itself is still being written. Only what is marked **Working** has been run
against a live server.

## Running a Flutter example

The Flutter examples use the client package as a sibling checkout, so clone both:

```bash
git clone https://github.com/JacLight/appmint-examples.git
git clone https://github.com/JacLight/appmint-client.git
```

```
your-folder/
  appmint-client/
    appmint_flutter_client/
  appmint-examples/
    appmint_flutter_authentication_demo/
```

Then:

```bash
cd appmint-examples/appmint_flutter_authentication_demo
flutter pub get
flutter run            # or: flutter run -d chrome
```

Prefer not to keep the client checked out? Open the example's `pubspec.yaml` and
swap the `path:` dependency for the `git:` form shown in the
[client README](https://github.com/JacLight/appmint-client).

## What you need before anything works

An organization and an app credential, both created in Studio Manager:

| | |
|---|---|
| **Appengine URL** | `https://appengine.appmint.io`, or your own deployment |
| **Organization id** | Your org's short name — sent as `orgid` on every call |
| **App id / key / secret** | Created for your organization |

Nothing is hardcoded and **no credentials are committed**. The authentication
example asks for these on its first screen; anything you type stays on your
machine.

## Watching what the client does

The authentication example runs a request log beside the app: every call, with
two badges saying whether the app token and the person's token went with it.

That panel is the point. The confusing part of AppEngine is not any single
endpoint — it is that two tokens ride on a request and answer different
questions. Watching the second badge light up the moment somebody signs in
explains it faster than any paragraph.

## Documentation

- [Example apps](https://docs.appmint.io/docs/client-integration/flutter-examples)
- [Build a Flutter app — tutorial](https://docs.appmint.io/docs/client-integration/flutter-tutorial)
- [Flutter client](https://docs.appmint.io/docs/client-integration/flutter-client)
- [AppEngine API](https://docs.appmint.io/docs/appengine/overview)

## Licence

MIT.
