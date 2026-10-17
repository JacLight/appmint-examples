# Run the AppEngine journal example

Requires Node 22+, an existing identity authorized to read the selected site through your server, a saved site/page/post, and a configured site hostname. The controlled local rehearsal used an existing staff session; production app-identity setup remains a separate prerequisite below. No credential is included.

Set API_BASE to your AppEngine HTTPS origin, SITE_HOST to your site hostname, SITE_NAME to its machine name, ORG_ID to its organization, APP_TOKEN to the authorized server token, and optional PORT (default 3226). Replace every YOUR_ value below; these placeholders are not usable credentials. Run from the directory containing the downloaded renderer:

```sh
export API_BASE="https://YOUR_APPENGINE_API_HOST"
export SITE_HOST="YOUR_CONFIGURED_SITE_HOSTNAME"
export SITE_NAME="YOUR_SAVED_SITE_NAME"
export ORG_ID="YOUR_ORGANIZATION_ID"
export APP_TOKEN="YOUR_EXISTING_AUTHORIZED_SERVER_TOKEN"
export PORT="3226"
node course-renderer.mjs
```

Use the API origin without a trailing slash. SITE_HOST is the hostname returned by your site's mapping, without a scheme or path; SITE_NAME is its machine name, not its display title. The server binds to the loopback interface on PORT. In your local development browser, open that listener at **/journal-sites1010/room-lighting-1010** for the demonstrated page and post, or substitute the page name and article slug you actually saved. The endpoint it calls is `/site/page/{SITE_HOST}/{SITE_NAME}/{pageName}/{postSlug}`. Keep this renderer running while you perform the article update and reload the same browser path.

For the demonstrated local read-only rehearsal, the existing staff session remained on the server. A deployed application needs its own authorized server identity; obtaining or verifying that identity was not demonstrated here. See Database and Repository APIs chapter 2 (`/videos/appengine-data-records/course/review.html`); see the Authentication and Organization Isolation written course (`/videos/course-catalogue/materials/appengine-auth-org-isolation-script.html`) for app-token exchange. Never move a privileged token into journal.html or browser JavaScript. No credential is shipped, and no new identity is created by this example.

The renderer is a deliberately small implementation for journal.html, not a universal renderer. It escapes title/summary/author, renders trusted article HTML, handles a missing page or article, and keeps authorization on the server. The included label identifies the local preview. Public deployment, DNS/TLS and anonymous access require separate verification.

Create the post with the complete 03 request; create the page with the complete 05 request after replacing its isolated example site and name with your own. Later proofs show the final page moved to vidsite. The journal.html includes the full design. Use YOUR_SITE_HOST in sanitized routes; it replaces the actual local hostname. Proofs 43/44 show the final browser before/after fixture transition. Do not replay unrelated state-changing proof files blindly: they document the controlled lifecycle. Use only owned training records.

`request-examples.md` shows TypeScript, JavaScript, Python, curl, Postman and JSON. Set shared base, route and headers first. Supply complete JSON bodies from the matching proof request; any on-screen HTML abbreviation is not a request body. Preserve returned IDs. All six language variants were not independently executed.

## Course source publication

This folder contains the downloadable companion supplied with **AppEngine Sites and Pages: Routing, Content Binding and Publishing**. Replace training identifiers and paths with your own. Recorded results are examples, not a live connection or credentials. Use the current [AppEngine API reference](https://appengine.appmint.io/documentation) for changing contracts. The course reader retains its verification limits.
