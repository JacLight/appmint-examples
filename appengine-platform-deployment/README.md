# AppEngine Platform Deployment — Ticket board

This is the existing small Node application supplied with the deployment course. It serves a staff ticket board, reads the first page of open tickets from AppEngine, and displays a release marker so a learner can distinguish preview and live releases.

**Hosted deployment remains unverified.** The local training organization could create and read a development-environment record, but the configured hosting provider rejected its identity handshake. No hosted workspace, successful build, preview, production promotion, custom DNS/TLS, rollback or provider cleanup is claimed. Publishing this source does not change that status.

## Run locally

Node 20 or newer; no third-party dependencies:

```sh
APPENGINE_ORIGIN=https://YOUR_ASSIGNED_APPENGINE_BACKEND \
APPENGINE_ORG=YOUR_ORGANIZATION_ID PORT=3000 npm start
```

Open your service address and supply your own staff token. Obtain the assigned backend and an authorized staff session using the API Foundations and Authentication courses; the Studio administration website is not automatically the API backend. The sample posts to `repository/find/ticket` with the organization and caller token. AppEngine must authorize that caller to read those records.

The token passes to this service for one request and is not persisted by the sample. It clears the password input afterwards. Use a trusted HTTPS origin outside local development, and keep tokens out of source, logs and screenshots. This training token-entry form is not a production login flow or session store. `/health` reports the application release and process health; it does not verify AppEngine access.

## Use for the deployment exercise

Set the two environment variables in the hosting environment, preserving private credentials outside the bundle. Build release 1 and inspect its preview before promoting it. Change the `RELEASE` constant for release 2, then verify which release each address actually serves. Those are intended exercises, not outcomes already verified in this training run.

Creating a development-environment record alone does not deploy this application. Follow the configured Vibe Studio hosting flow, provider identity requirements, plan allowance and maintained reference. A saved custom-domain string is not proof of DNS routing or TLS. Do not attach or change an unrelated live domain.

The board reads at most 20 open tickets. Its total can exceed the visible page; implement pagination when expanding it. No ticket mutation, customer-facing credential flow or mobile deployment is implemented here.

Current contracts: https://appengine.appmint.io/documentation

Course source: https://github.com/JacLight/appmint-examples/tree/main/appengine-platform-deployment
