# appmint_flutter_authentication_demo

Connect to an organization, sign in as staff or as a customer, answer a
verification code, remember accounts, and watch every request the client makes
with the tokens that rode on it.

Built on the [Flutter client](https://github.com/JacLight/appmint-client/tree/main/appmint_flutter_client).
The step-by-step tutorial is at
[docs.appmint.io/docs/examples/flutter-authentication](https://docs.appmint.io/docs/examples/flutter-authentication).

## Run it

```bash
flutter run -d chrome
```

Fill in the Connect screen with your AppEngine URL, organization id, and the
app id, key and secret from Studio Manager. Nothing is stored in the repository.

The client is a relative-path dependency (`../../appmint-client/appmint_flutter_client`);
clone [appmint-client](https://github.com/JacLight/appmint-client) beside this
repository, or switch `pubspec.yaml` to the git dependency.
