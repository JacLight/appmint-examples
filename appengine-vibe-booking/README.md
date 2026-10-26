# Atelier appointments — AppEngine + Vibe Studio

A working customer appointment application: browse configured services, create an account or sign in, choose actual availability, complete the configured intake form, book, view your own appointments with their saved project answers, and reschedule. This is the companion project for the AppEngine platform deployment course. Its React frontend consumes AppEngine customer and Reservations APIs through a small Node HTTP gateway.

## Run locally

Use Node 20 or newer. From this project directory:

```sh
npm ci --include=dev
cp config.example.json config.json
# Set the real AppEngine base URL, organization and reservation definition in config.json.
npm run build
PORT=3000 npm start
```

Open http://localhost:3000. For development, keep the Node server on port 3000 and run `npm run dev` in a second terminal; Vite proxies `/api` to that server. Production serves `web/dist` itself and binds `0.0.0.0` on the platform-provided `PORT`.

Configuration can instead come from `APPENGINE_BASE_URL`, `APPENGINE_ORG_ID` and `APPENGINE_DEFINITION_ID`. These are public coordinates, not credentials. `APPENGINE_CONFIG` selects a JSON file. HTTPS is required for the upstream except for localhost testing. Never add staff passwords, API keys or service credentials to this app.

When a hosting proxy rewrites the request's `Host`, set `publicOrigins` in `config.json` to the exact public addresses customers use, for example `"publicOrigins": ["https://preview.example.com", "https://appointments.example.com"]`. Use HTTPS origins only: scheme and hostname (plus a non-default port if needed), without a trailing slash, path, query, credentials or wildcard. `APP_PUBLIC_ORIGINS` can instead supply a comma-separated list and overrides the file; an empty value disables the extra origins. The default empty list preserves the same-host check. Unknown origins remain rejected, and forwarded headers never grant access. These values are public deployment coordinates, not secrets or upstream AppEngine addresses.

## AppEngine setup

In the Appmint application, configure an active service Reservation Definition with its real service names/durations, working days, office hours, timezone and capacity. Attach its intake Collection with a JSON schema when answers are needed. Set the definition's ID in this site's configuration. The configured customer policy controls signup, password requirements and additional verification. Configure outbound email/SMS before offering real bookings: creating an account, verifying an account and booking can send messages. Empty reservation notification arrays do not reliably suppress messages.

Use normal customer signup/sign-in in the site. The application handles verification codes and temporary-password change, then requests a new ordinary sign-in. Customer tokens live in browser `sessionStorage`, scoped to the configured organization/definition; refresh is automatic. The server stores no customer session, so restarting or redeploying it does not discard an open tab's session. Signing out clears the local session; this sample does not implement global token revocation.

## Import and configure in Vibe Studio

Open an empty App development environment and confirm its organization and project. In the GitHub drawer choose **Clone fresh**, enter `https://github.com/JacLight/appmint-examples.git`, then choose **Clone repository into workspace**. This imports the whole examples repository; the GitHub subfolder webpage is not a clone URL. Back up existing work before using a fresh workspace.

Open `appengine-vibe-booking` and inspect its files. The course starting source is commit `2c2b407`; the repository's current branch may include later changes. Because the workspace contains the whole repository, create this `package.json` at the **workspace root**, outside `appengine-vibe-booking`:

```json
{
  "private": true,
  "engines": { "node": ">=20" },
  "scripts": {
    "build": "npm ci --prefix appengine-vibe-booking --include=dev && npm run build --prefix appengine-vibe-booking",
    "start": "npm start --prefix appengine-vibe-booking"
  }
}
```

Keep the development environment's framework set to **Node**. This wrapper selects the nested project's locked dependencies, builds its React interface, and starts its Node server. The demonstrated flow does not depend on a hidden root-directory or build-command settings field. Including development dependencies supplies Vite even when installation runs with `NODE_ENV=production`.

Create `appengine-vibe-booking/config.json` in the Studio file editor from [config.example.json](config.example.json), and replace `baseUrl`, `orgId` and `definitionId` with your own public AppEngine coordinates. Save and reopen both new files to check their contents. The local ignored `config.json` is absent from a Git clone, so create it in this workspace. No environment-variable editor is demonstrated in this flow; the runtime's environment-variable support remains available for deployments that provide one. Do not put passwords, access/refresh tokens or service credentials in either file.

Add the actual preview and production HTTPS origins to `publicOrigins` before building behind a proxy that rewrites `Host`. Copy only each address's origin, without its path or trailing slash. This permits ordinary customer sign-in on those configured addresses; a successful services GET alone does not exercise the browser's sign-in origin check.

The build writes `appengine-vibe-booking/web/dist`. The Node server serves those assets and the `/api` gateway, binds `0.0.0.0`, and reads the platform's `PORT`. Static paths resolve relative to `server.mjs`. A static-only target cannot run this gateway.

Open **Manage project → Build**, follow the job in **Builds**, and inspect its logs. After a successful build, open preview and check the real services, ordinary customer sign-in and saved-booking readback. A working `/healthz` only proves the process is listening. Then verify the checked build independently on the production address before calling a release complete. **Verified 26 October 2026:** a fresh managed build, ordinary customer sign-in and saved-booking reload passed on the SpinForge preview, then on the production address after promotion. Those checks establish the baseline deployment. The subsequent Vibe Studio refinement now implements **Your project** on appointment detail; its managed preview passed normal customer sign-in, saved-answer/schema-label readback and a 390px mobile check. The actual downloaded refinement also passed a clean rebuild and local services/assets check. The same feature build was then promoted and passed normal customer sign-in, saved-answer readback and reload on the live address. The complete course and an independently hosted external-provider deployment remain pending.

Use the [setup recipe](docs/setup/README.md) for the supported intake schema and reservation-definition values. The [implemented release-two feature](docs/release-two/README.md) explains the actual saved-answer summary, supplies its exact patch for the earlier baseline, and records the source, managed-preview/mobile and downloaded-artifact validation. Current source already includes the feature; do not apply that patch again.

## API boundary

`web/src/appengine-api.ts` adapts the maintained AppEngine contract to `web/src/api.ts`. `server.mjs` forwards only these same-origin operations:

| Site route | AppEngine route |
| --- | --- |
| POST `/api/auth/signin` | `/profile/customer/signin` |
| POST `/api/auth/signup` | `/profile/customer/signup` |
| POST `/api/auth/refresh` | `/profile/customer/refresh` with `refresh_token` |
| POST `/api/auth/verify` | `/profile/security/challenge/verify` |
| POST `/api/auth/password` | `/profile/customer/password/change` |
| GET `/api/definitions` | `/crm/reservations/definitions`, filtered to configured ID |
| POST `/api/slots` | `/crm/reservations/slots` using configured ID, `serviceName`, `serviceDate` |
| GET `/api/intake-schema` | Configured definition form; named forms load `/repository/collections/:name` |
| GET/POST `/api/bookings` | `/client-data/reservations` |
| GET `/api/bookings/:id` | `/client-data/reservations/:id` |
| POST `/api/bookings/:id/reschedule` | Owned-read preflight, then `/crm/reservations/reschedule/:id` |

Creation sends `service`, the returned slot's `startTime`/`endTime`, and typed `form` answers. AppEngine attaches the authenticated customer. Saved status remains the actual upstream status, often `new`; the application does not invent confirmation. Rescheduling preserves the booking reference. The gateway fixes the organization and definition, strips unneeded payload fields and does not forward arbitrary URLs, headers, cookies or redirects. It caps request bodies at 64 KiB and upstream responses at 2 MiB, with a 12-second upstream timeout. AppEngine remains responsible for authorization, capacity and schema validation.

A lost write response is an **unknown outcome**, not a failed booking. The UI directs the customer to check My appointments before another submission. Mutations are never automatically retried. A rejected authentication can renew the session but requires explicit resubmission. Schema controls currently cover flat strings, booleans, numbers, integers and enumerations; unsupported configured controls block booking and require implementing the corresponding control. The app does not implement cancellation, payment collection, password recovery, social login, passkeys or verification-code resend.

## Validate

```sh
npm run check
npm run build
# Terminal 1, local test stand-in only:
postman simulation run postman/simulations/booking.sim.yaml --port 4917 --output ndjson --no-history
# Terminal 2:
npm test
```

The tests run the actual gateway and browser adapter over HTTP. They exercise configured form mapping, booking/read/reschedule, refresh/expiry, signup, verification, temporary-password handling, conflict, an HTML error response, a hanging write, origin checks, route restrictions and body limits. Set `SIMULATION_URL` to change the simulation address. Stop the simulation with Ctrl-C, or `pkill -INT -f 'postman simulation run postman/simulations/booking.sim.yaml'`.

The local mock was generated from `../appengine-connected-client/http/postman.json` and filled with audited shapes from AppEngine `users.controller.ts`, `users.service.ts`, `security.controller.ts`, `two-factor.service.ts` and `reservations.service.ts`, plus the connected-client fixtures. Published owner mock discovery was attempted but the Postman CLI was signed out. Test rows and failure sentinels are synthetic and never part of the application or course capture. Passing simulation checks proves adapter behavior against these modeled contracts; it does not prove a live deployment or real booking outcome.

The course's live organization and its separate operation evidence establish the demonstrated outcome. Keep passwords, access/refresh tokens and raw simulation logs out of Git. The supplied `config.example.json` contains placeholders only.
