# Release two: show the saved project answers

**Implemented in this companion.** The current [App.jsx](../../web/src/App.jsx) and [styles.css](../../web/src/styles.css) contain the actual Vibe Studio refinement, independently reviewed and checked on the managed preview. Do not apply the patch again to this version.

The appointment detail now includes **Your project** below its time, status, reference and reschedule control. It reads the owned booking's saved answers and displays the configured question titles. This is a read-only addition: it introduces no endpoint or reservation write.

## Understand the implementation

`appengine-api.ts` normalizes the owned reservation's `data.form` into `booking.answers`. `BookingDetail` calls `api.intakeSchema(booking.serviceId)` through `useRemote`; the adapter resolves the service and the gateway reads the configured definition's collection schema. The hook is before the component's early return, so opening a booking never changes hook order.

`ProjectAnswers` combines schema properties with any saved keys that are no longer in the form. Configured fields retain schema order; extra saved keys follow. Titles come from the current schema, not a historical snapshot. Renaming a question changes its displayed title while preserving the saved answer.

Booleans display Yes/No, and numeric zero stays visible. Missing values display Not provided when other answers exist; entirely empty or malformed answer objects show an explicit empty state. A schema read failure retains saved answers under their keys and offers retry, or normal sign-in for 401. React renders answer values as escaped text. Existing mobile styles stack label/value rows; scoped wrapping preserves long briefs. Intake validation, booking creation and rescheduling remain unchanged.

## Reproduce the edit from the earlier baseline

Use an isolated copy at commit `b2c9788` if you want to repeat the before/after exercise. Its UI files are the same pre-feature files as the course's initial `2c2b407` source; `b2c9788` also includes the public-origin fix needed behind a proxy. Preserve your current work before checking out an earlier version.

In Vibe Studio:

1. Open `appengine-vibe-booking/web/src/App.jsx`. Insert [ProjectAnswers.jsx.txt](ProjectAnswers.jsx.txt) immediately before `function BookingDetail(...)`.
2. Apply both marked sections of [BookingDetail-insertion.jsx.txt](BookingDetail-insertion.jsx.txt): the schema hook immediately after `const booking = ...`, **before** `if (!booking)`; the `ProjectAnswers` JSX after `remote.error` in the normal appointment branch, **outside** the moving-time picker.
3. Append [project-answers.css](project-answers.css) to the existing `styles.css`. Save and reopen both files to confirm persistence. The snippets are excerpts, not complete replacements for either file.

The [complete patch](your-project.patch) contains these exact actual-source additions. From the examples repository root at the earlier baseline:

```sh
git apply --check appengine-vibe-booking/docs/release-two/your-project.patch
git apply appengine-vibe-booking/docs/release-two/your-project.patch
npm ci --prefix appengine-vibe-booking --include=dev
npm run check --prefix appengine-vibe-booking
npm run build --prefix appengine-vibe-booking
```

If the applicability check fails, compare your current source; the feature may already be present. Do not overwrite newer work or force the patch.

## Build and check the result

Keep the existing Node workspace-root wrapper and the nested public config described in the [companion README](../../README.md#import-and-configure-in-vibe-studio), including the actual preview/live `publicOrigins` when the proxy rewrites Host. In Vibe choose **Manage project → Build**, wait for the new build result, then open preview. Saving source or reloading Preview alone can display a previous build.

Sign in with an ordinary customer, open **My bookings**, and reopen an existing appointment that has saved intake answers. Check the labels and answers against its configuration and saved record, including its unchanged reference, status, time and timezone. Check a narrow viewport and long text. The time-picker control should remain available for an eligible booking; do not create or reschedule another booking solely to inspect this read-only feature.

After preview passes, promote the checked build and verify the production address separately. Its browser session may require another sign-in. Rolling back an interface build does not roll back reservation data.

For the source-download alternative, use **Download → Download .zip**. Extract the companion source/config/assets into a clean directory, omit bundled `node_modules` and `web/dist`, then run `npm ci --include=dev`, `npm run check`, `npm run build`, and `PORT=3000 npm start` from `appengine-vibe-booking`. Keep your own public configuration and inspect ZIP contents before sharing; download is not a secret-removal step. The Node gateway is required, so a static-only upload is insufficient.

## What was verified

On 26 October 2026 UTC, independent review checked the actual Vibe-saved JSX/CSS. The managed preview passed normal customer sign-in, owned appointment/schema reads, exact saved-answer display and a 390px mobile review with no horizontal overflow. The same checked feature build was promoted and passed a separate live customer sign-in, saved-answer readback and reload. The actual downloaded ZIP matched those source files and the committed server fix. A clean installation, typecheck and production build passed; its independently started local Node service served real services and hash-matching images/fonts. No booking mutations were needed for these checks.

[validation.json](validation.json) records source hashes and the measured scope. Error/empty/zero/false branches were independently source-reviewed, not established by live failure injection. Rollback and deployment of the exported app on another provider are outside this validation. The earlier baseline's managed preview/live checks are separate from this refinement's preview acceptance.
