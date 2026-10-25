# Release two: show the saved project answers

**Prepared source edit; hosted behavior is unverified.** These files do not change the running app. They target the course's starting `App.jsx` and `styles.css` from commit `2c2b407`. Static checks confirm patch applicability and JSX/CSS syntax; they do not prove rendering, API behavior, a managed build or a live release.

The baseline detail page already displays the booking's service, time, status and reference. Add a **Your project** section using its saved answers. No new endpoint or booking write is needed.

## Make the edit in Vibe Studio

1. Open `appengine-vibe-booking/web/src/App.jsx`. Insert the complete [ProjectSummary.jsx.txt](ProjectSummary.jsx.txt) immediately before `function BookingDetail(...)`. The existing file already provides `useRemote` and `Status`; this snippet belongs in that file rather than an unconnected new component file.
2. Inside `BookingDetail`, find its normal appointment branch, following the reschedule branch. Insert [BookingDetail-insertion.jsx.txt](BookingDetail-insertion.jsx.txt) after the existing `remote.error` block and before that branch's closing fragment. It should appear below the current reference, time, status and reschedule controls. Keep it outside the moving-time picker branch.
3. Append [project-summary.css](project-summary.css) to `appengine-vibe-booking/web/src/styles.css`. Preserve all existing styles.
4. Save and reopen both files to verify the changes persisted. The [complete patch](your-project.patch) shows the exact context and additions. Do not replace either source file with a snippet alone.

The child component has an unconditional `useRemote` call and is keyed by booking ID. This avoids adding conditional hooks to the parent and clears its schema state when another booking opens. Values come from `booking.answers`, normalized from the owned reservation's `data.form`; labels come from the current configured schema. Labels are not a historical snapshot: renaming a field title changes its display label while leaving the saved answer intact.

Boolean values display Yes/No; zero stays visible; missing values display Not provided. Empty answers, malformed answers, loading and a failed schema read have distinct states. React renders values as escaped text. The original controls and reschedule flow remain in place.

## Optional local patch workflow

From the **examples repository root**, with your work saved:

```sh
git apply --check appengine-vibe-booking/docs/release-two/your-project.patch
git apply appengine-vibe-booking/docs/release-two/your-project.patch
npm run check --prefix appengine-vibe-booking
npm run build --prefix appengine-vibe-booking
```

If the applicability check fails, compare the patch with your current source and make the scoped edit manually. Do not replace newer files with the older course version. The patch is provided for reproduction and review; the course's editor demonstration should show the actual edit, save and readback.

## Verify before releasing

First establish a working baseline live build. After applying this change, build and open preview, sign in normally, and reopen an existing saved appointment. Verify its actual answers, schema labels, reference, time and status. Check a long brief, readable booleans and narrow-screen layout. Confirm the time picker still opens normally; do not make an unnecessary reservation write just to inspect its layout.

An appointment with no answers should show the empty state. A failed schema read should show retry/sign-in handling, not an empty project. These require separate suitable test conditions; syntax checks do not establish them.

Compare the new preview with the earlier live detail page, then promote only a checked build. Open the production address and verify the same saved record there. Preview and production have separate browser sessions and may require separate normal sign-ins. Rolling back the interface does not roll back the reservation data.

See [validation.json](validation.json) for the limited checks performed on temporary source copies. Hosted build, preview, production, promotion and rollback are **not established** by this prepared patch.
