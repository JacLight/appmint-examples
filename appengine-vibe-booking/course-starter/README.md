# Vibe Studio + AppEngine — minimal course starter

This is a technical starter, not the completed customer app. The starting screen makes no API requests. Vibe will build the customer interface in recorded stages.

## What is supplied

- Node server serving the built React app and forwarding a limited set of customer operations to AppEngine.
- Customer-session and booking adapter (`web/src/appengine-api.ts`) with explicit methods in `web/src/api.ts`.
- React/Vite entry point, dependency lockfile, image/font assets and their provenance.
- Companion contract tests and existing Postman artifacts.

No service chooser, sign-in screen, time picker, intake renderer, booking confirmation or owned-booking UI is supplied. No credentials or organization configuration is included.

## Before running

Use Node20 or newer. Copy config.example.json to config.json and enter YOUR AppEngine base address, organization ID and saved reservation-definition ID. These select the backend and booking rules; they do not sign in a staff member or customer. For managed hosting, configure the exact public preview/live origins when required by the supplied gateway.

Run `npm ci --include=dev`, `npm run check`, `npm run build`, then `npm start`. The server uses the host PORT. Studio project-root build is `npm run build`; start is `npm start` after dependencies are installed.

## Build sequence

1. Inspect AppEngine reservation definitions/services in the maintained reference. Ask Vibe to load the real services with `api.services()` and build the service chooser.
2. Explain customer identity and locate customer auth plus availability/form contracts. Ask Vibe to build ordinary customer access, returned slot selection and the configured intake form.
3. Explain booking creation and owned-record retrieval. Ask Vibe to submit selected times and typed answers, then render and reopen the returned booking.

Use https://appengine.appmint.io/documentation for current AppEngine contracts. The `/api/...` routes in server.mjs are THIS EXAMPLE'S wrapper routes, not AppEngine's public API paths. Follow each to its explicit upstream path before describing it as a platform endpoint.

## Provenance

Server, API adapters, build files and assets derive from appmint-examples/appengine-vibe-booking at f63ddb1. The completed App.jsx, Auth.jsx and styles.css are deliberately absent. Production starter preparation is not AI authorship; subsequent recorded Vibe changes will be attributed separately.

## Existing adapter tests

The supplied API adapter and server are unchanged from the completed example. To run their HTTP contract tests, start the provided Postman simulation from this folder using `postman simulation run postman/simulations/booking.sim.yaml --port 4917 --output ndjson --no-history`, then run `npm test` in a second terminal. These tests exercise a local simulated AppEngine, not live customer bookings.

## Reservation setup

Follow the [AppEngine reservation and intake setup](https://github.com/JacLight/appmint-examples/tree/f63ddb1/appengine-vibe-booking/docs/setup) before connecting this starter to your organization. The completed application at that revision is a reference implementation; its customer screens are not part of this starter.
