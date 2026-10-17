# AppEngine Identity Provider examples

These examples distinguish actual observed public metadata from source-verified configuration recipes. No registration, token exchange or signed-in relying-app result has been verified in this training run.

Obtain your exact AppEngine API address from the administrator. The issuer comes from that deployment's discovery document and must match your OIDC library's configured issuer. Never replace the issuer string merely to match a desired hostname. Public metadata needs no bearer token. The training transport origin is substituted explicitly in the sanitized responses; the advertised issuer is preserved.

Start with a configured issuer and a registered relying application. Keep the client ID, exact callback and allowed organizations together. The proposed public-client registration has no client secret; access.orgs identifies the organizations allowed to sign in. Replace the reserved .test callback with an exact callback served by your relying application. No wildcard or fragment.

The six client formats in the course share base and route. TypeScript/JavaScript use fetch, Python uses requests, curl uses BASE/ROUTE, Postman uses equivalent environment variables. JSON is the response for OIDC discovery; SAML metadata is XML. The samples show selected fields; full sanitized observed responses are provided separately.

The companion's complete oidc-lab.mjs uses openid-client and validates state, nonce, PKCE, signature and token claims before setting a local session. It remains unexecuted without a configured client. Do not describe merely decoding a JWT as authenticating a person. ID tokens and issuer access tokens are not business API bearer credentials.


## Run the OIDC relying application

This is the complete existing source behind the course's proposed relying-app walkthrough, not a completed live SSO demonstration. Node 22.12 or newer is required.

```sh
npm ci
```

Create a private `.env.local` (ignored by Git):

```dotenv
APP_ORIGIN=https://YOUR-RELYING-APP.example
OIDC_ISSUER=https://YOUR-APPENGINE-ISSUER.example/idp
OIDC_CLIENT_ID=YOUR_REGISTERED_CLIENT_ID
```

For a confidential client, also set `OIDC_CLIENT_SECRET` to its registered secret; omit it for a public PKCE client. Do not use these placeholder addresses. The issuer must exactly match discovery, and the registered redirect must exactly match `APP_ORIGIN/auth/callback`. Register the exact `APP_ORIGIN/` as the post-logout return. Serve the loopback process through an HTTPS reverse proxy preserving Host, then run `npm start` and open your configured origin.

The app keeps tokens server-side, checks state/nonce/PKCE and signed claims with `openid-client`, rotates its local session on sign-in and offers userinfo, refresh, local logout and issuer logout. The in-memory session store is a training implementation. Restarting it ends local sessions. No business API access is implied by an issuer token.

## Verification limits

Syntax and dependency installation can be checked without a registration. Live sign-in, validated claims, userinfo, refresh and both logout outcomes remain **unverified** until a real registered relying application is supplied. The proposed SAML registration and observed metadata are included; **no executable SAML relying app or successful signed assertion delivery is claimed**. The existing video is a partial review cut, not a completed course.

`request-examples.md` includes TypeScript, JavaScript, Python, cURL and Postman-formatted public discovery/metadata requests. Those examples do not perform authentication. No issuer signing keys, client secrets, tokens or cookies belong in this repository.
