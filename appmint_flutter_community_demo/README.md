# appmint_flutter_community_demo

A social surface inside an app: a feed of posts written by customers, a post
with its comment thread, reactions that wait for the server before they
change, and reporting — with every request shown beside the screen.

Built on the [Flutter client](https://github.com/JacLight/appmint-client/tree/main/appmint_flutter_client).
The step-by-step tutorial is at
[docs.appmint.io/docs/examples/flutter-community](https://docs.appmint.io/docs/examples/flutter-community).

## Run it

```bash
flutter run -d chrome \
  --dart-define=APPMINT_URL=https://appengine.appmint.io \
  --dart-define=APPMINT_ORG=your-org \
  --dart-define=APPMINT_APP_ID=your-app-id \
  --dart-define=APPMINT_APP_KEY=your-app-key \
  --dart-define=APPMINT_APP_SECRET=your-app-secret
```

Sign in as a **customer** (or create an account). Posts, comments and
reactions are customer-authored; the token on the request is the author.

The client is a relative-path dependency (`../../appmint-client/appmint_flutter_client`);
clone [appmint-client](https://github.com/JacLight/appmint-client) beside this
repository, or switch `pubspec.yaml` to the git dependency.

## What is in it

| File | What it does |
|---|---|
| `lib/community_api.dart` | Feed, posts, comments, reactions, reports — and what each wants that its name does not say |
| `lib/screens/feed_page.dart` | Latest / Trending, hashtag filter, compose, the list |
| `lib/screens/post_widgets.dart` | The post card: plain-text content, sized thumbnails, the honest like button, the report dialog |
| `lib/screens/post_page.dart` | One post and its comment thread |
| `lib/screens/sign_in_page.dart` | Customer sign-in / sign-up with the verification-code dialog |
| `lib/call_log.dart` | The request log with app-token / user-token badges |
