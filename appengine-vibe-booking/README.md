# Atelier appointments — AppEngine + Vibe Studio

A working customer appointment application: browse configured services, create an account or sign in, choose actual availability, complete the configured intake form, book, view your own appointments and reschedule. This is the companion project for the AppEngine platform deployment course. Its React frontend consumes AppEngine customer and Reservations APIs through a small Node HTTP gateway.

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

## AppEngine setup

In the Appmint application, configure an active service Reservation Definition with its real service names/durations, working days, office hours, timezone and capacity. Attach its intake Collection with a JSON schema when answers are needed. Set the definition's ID in this site's configuration. The configured customer policy controls signup, password requirements and additional verification. Configure outbound email/SMS before offering real bookings: creating an account, verifying an account and booking can send messages. Empty reservation notification arrays do not reliably suppress messages.

Use normal customer signup/sign-in in the site. The application handles verification codes and temporary-password change, then requests a new ordinary sign-in. Customer tokens live in browser `sessionStorage`, scoped to the configured organization/definition; refresh is automatic. The server stores no customer session, so restarting or redeploying it does not discard an open tab's session. Signing out clears the local session; this sample does not implement global token revocation.

In Vibe Studio, use this folder as the application root. If importing the whole examples repository, the application root is `appengine-vibe-booking`, not its `web` subfolder. Run `npm ci --include=dev` to install the locked toolchain, then `npm run build`, and start the runtime with `npm start`. Explicitly including development dependencies makes the Vite build work even when the host sets `NODE_ENV=production` during installation. The root `package-lock.json` is the deployment lockfile.

The build writes `web/dist`; deploy that output alongside `server.mjs` and the root package files. The server resolves static files relative to `server.mjs`, rather than the shell's current directory. Do not configure a static-only hosting target: the `/api` gateway needs the Node process. The process binds `0.0.0.0` and reads the platform's `PORT` (3000 locally). Provide `APPENGINE_BASE_URL`, `APPENGINE_ORG_ID` and `APPENGINE_DEFINITION_ID` through deployment configuration; the ignored local `config.json` will not be in a Git checkout. A working `/healthz` proves the process is listening; verify the customer journey separately against your chosen AppEngine organization.

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
