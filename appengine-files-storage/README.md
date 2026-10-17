# AppEngine File Storage API examples

Use your own `BASE`, `ORG_ID` and authorized staff `TOKEN`. The hosted API base is https://appengine.appmint.io. Staff sign-in is taught in Database & Repository APIs chapter 2. Never embed staff credentials in a public app.

These examples correspond to the recorded requests. Observed JSON contains sanitized training responses, not credentials. Replace course object paths and record IDs with your own. All language variants are illustrative equivalents; they were not each executed independently. Customer direct-token upload returned403; the app-mediated two-token flow remains unverified and is not a successful customer demo.

Multipart uploads require a real selected file and the HTTP library-generated Content-Type boundary. Public images are deliberately public. Do not persist an expiring signed link instead of the object path. Never run cleanup against an object still referenced by another record.

For JSON request examples, set `route` to the operation path and `body` from `request.json`. TypeScript/JavaScript examples require modern fetch; Python requires requests. Download/read routes may return non-JSON: inspect response Content-Type and use bytes/text as appropriate.

## Course source publication

This folder contains the downloadable companion supplied with **AppEngine File Storage APIs: Uploads, Access, Attachments and Cleanup**. Replace training identifiers and paths with your own. Recorded results are examples, not a live connection or credentials. Use the current [AppEngine API reference](https://appengine.appmint.io/documentation) for changing contracts. The course reader retains its verification limits.
