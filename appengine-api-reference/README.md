# API Reference runnable example

Use Node 20 or later. Obtain your own organization and a completed customer sign-in token from API Foundations. Finish any password-change or two-factor challenge before using that token. Keep credentials private.

Set `ORG_ID` to your organization. `BASE` defaults to `https://appengine.appmint.io`. Override it for your own HTTPS deployment. `CLIENT_INFO` defaults to `appengine-api-reference-course`; this metadata does not authenticate a request.

```bash
export BASE=https://appengine.appmint.io
read -r -p 'Organization ID: ' ORG_ID
export ORG_ID
node booking-walkthrough.mjs
```

The default run searches the API, follows the returned detail, lets you pick a definition and service, and lists slots for your chosen date. It creates nothing. If no active definition/service exists, complete the Reservations setup lesson first. The video used its existing Course tasting training definition; your identifiers will differ.

To create one real booking with the same selected customer, privately load your customer access token and opt in:

```bash
read -rs -p 'Customer access token: ' TOKEN
export TOKEN
node booking-walkthrough.mjs --book
unset TOKEN
```

The script reads your signed-in profile, shows the selected slot, asks for BOOK, creates the reservation, then verifies its own list and detail and requests slots again. Your deployment may send its configured confirmations and reminders. The video recording used a separate training deployment with email delivery disabled; this script does not disable your notifications.

`panel-examples.json` contains the on-screen snippets in TypeScript, JavaScript, Python, curl and Postman. They are separate action excerpts. JavaScript/TypeScript require an async context plus `base`, `orgid`, `token`, `clientInfo`; Python uses `requests` and `base`, `orgid`, `token`, `client_info`. Assign the shown request object to `body`, or save it as `request.json` for curl. Definitions extraction uses the prior request's `result`; choose your actual definition name. Postman equivalents use the indicated environment variables and raw JSON body. Replace all training IDs, dates and customer placeholders with your own values; do not concatenate phase snippets unchanged.

The examples include the hosted-required metadata header. The first controlled booking/list recording omitted it and succeeded; a later read included it. This distinction is preserved in the production evidence. Contract differences across deployments must be checked in your own reference.

## Course source publication

This folder contains the downloadable companion supplied with **AppEngine API Reference: Find Endpoints, Read Contracts and Verify Requests**. Replace training identifiers and paths with your own. Recorded results are examples, not a live connection or credentials. Use the current [AppEngine API reference](https://appengine.appmint.io/documentation) for changing contracts. The course reader retains its verification limits.
