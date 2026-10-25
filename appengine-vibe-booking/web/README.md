# Atelier customer web app

React customer interface for home-design appointments. The public entry presents consultations returned by AppEngine. Customers sign in or create an account, choose an available date and time, complete the configured intake form, review, and submit. My bookings supports owned detail and rescheduling. Successful submissions display the actual returned status, including a newly received request.

## Run from the project root

Use the parent `appengine-vibe-booking` directory, which contains `server.mjs` and the canonical lockfile:

```sh
npm ci --include=dev
npm run check
npm run build
npm start
```

Configure the server as described in the root README. Run `npm test` separately after starting the Postman simulation described there. The build writes `web/dist`; the Node server serves that build and the same-origin API. For development, run the server on port 3000 and `npm run dev` in another terminal. Vite proxies `/api` to `http://127.0.0.1:3000`.

## Read the implementation

- `src/App.jsx`: public service overview, slot selection, schema intake, review, owned booking list/detail and rescheduling.
- `src/Auth.jsx`: sign-in, account creation, verification-code and temporary-password forms.
- `src/api.ts`: injectable `BookingApi` interface and normalized data types.
- `src/appengine-api.ts`: ordinary customer authentication/session adapter and calls to the allowlisted same-origin server proxy.
- `src/styles.css`: responsive visual design, local font faces, focus states and reduced-motion treatment.

`App` accepts an `api` prop. Production `main.jsx` uses the real customer adapter through `api.js`. Components neither collect staff tokens nor know upstream AppEngine addresses. Credentials, fixture bookings, fake availability and successful fallback responses are not bundled.

Service and slot IDs are opaque adapter identifiers. The adapter maps service IDs to the actual reservation definition and exact service name; booking and reschedule use the returned ISO instants. Dates and times display in the response's IANA timezone. Availability is requested when the service or date changes. Returning from intake preserves the selected date and answers.

A failed reschedule retains the current booking until a successful response. An unknown mutation outcome stops further submission and directs the customer to My bookings, so a lost response does not encourage duplicate booking. Conflicts clear the selected slot for a fresh choice. Authentication challenges never become a signed-in account without a regular authenticated customer result.

The bounded intake renderer supports configured string, enum, boolean, integer and number fields plus required/const, string length/pattern, numeric bounds and textarea. Unsupported schema controls block submission instead of omitting data. Browser validation supplements backend validation of inputs, availability and ownership.

## Assets

The supplied living-room image is an AI-generated illustration of a design aesthetic, not a photograph of a real business location. See `public/images/PROVENANCE.md`. DM Sans and Manrope are self-hosted; their source URLs, SHA-256 hashes and SIL Open Font Licenses are in `public/fonts`. The app requires no external font service.

## Validation scope

The production build and adapter type check pass. Live read-only browser checks covered actual public services, customer sign-in, returned availability, configured schema intake, local review, draft back-navigation, booking list and sign-out. Desktop/mobile layouts were inspected. These checks did not submit a booking or reschedule, create an account, exercise verification/password-change execution, or verify deployment. Those are separate integration checks.

Local QA scripts, screenshots and private environment references are kept outside this public companion app in the course production workspace.
