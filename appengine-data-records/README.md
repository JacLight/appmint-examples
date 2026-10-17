# Database and Repository API examples

The numbered JSON files contain the complete recorded request envelopes, not the selected excerpts displayed in the film. Set your own base URL, organization and staff token; replace all fixture IDs with IDs returned by your own requests. Authenticate at `/profile/user/signin`; handle any verification challenge before using a returned token.

Schema overrides must start from your current full collection definition. Full record updates must start from your latest read and preserve its version. The saved example includes the training state at that point in the demonstration; do not reuse it to overwrite unrelated records. `19-stale-update` and `38-duplicate-code` intentionally illustrate rejected requests.

The six-format film panels share `base`, `route`, `headers` and `body`. `route` is the path only; the HTTP method is separate. For curl, `BASE`, `ROUTE`, `ORG_ID` and `TOKEN` are the equivalent variables and request.json contains just body. For Postman use raw JSON body, orgid and Authorization headers. The optional runner below accepts an envelope file. It requires an explicit --write flag for mutations, including staff sign-in; read-only find/search use POST without being writes.

`APPENGINE_BASE`, `APPENGINE_ORG`, `APPENGINE_TOKEN` must be supplied by your environment. No credentials are embedded. This package shows actual controlled training examples; production deployment support and permissions must be verified for your organization.

```sh
node run-request.mjs 40-find-code-repeat.json
```

## Course source publication

This folder contains the downloadable companion supplied with **AppEngine Database & Repository APIs: Collections, Queries, Updates and Recovery**. Replace training identifiers and paths with your own. Recorded results are examples, not a live connection or credentials. Use the current [AppEngine API reference](https://appengine.appmint.io/documentation) for changing contracts. The course reader retains its verification limits.
