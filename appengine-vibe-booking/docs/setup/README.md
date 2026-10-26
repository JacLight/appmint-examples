# Set up Atelier in your Appmint organization

Use this recipe before building the customer app. You need staff access to configure collections and reservations in your own exercise organization, its organization ID, and its AppEngine API address. Studio staff sign-in and the app's customer sign-in are separate identities.

The course inspected an existing, working configuration through the hosted UI and booked against it. Creation through the UI below is source-checked guidance, **not a filmed or independently completed fresh-organization setup**. Save and reopen each record to verify your result. No course organization, customer credential or record ID is supplied in these examples.

## Create the intake collection first

1. Sign in normally to Appmint Studio. Open **Database → New Collection**. The Database landing page also has a **New Collection** button; **View Custom Collections** is the route used later to find existing collections.
2. In **Collection Info**, set the collection's name/key to `atelier_booking_intake` and its title to `Prepare your Atelier consultation`. Use a custom collection. Set the title first, then check the name: the editor can generate a key from a new collection's title. The name must be unique in your organization.
3. Open **JSON Schema** and replace the schema document with [intake.schema.json](intake.schema.json). Paste the schema itself, not a record wrapper containing `data` or `datatype`.
4. Open **Form Preview**. Check that it contains a project-type choice, a brief text area and consent. Choose **Save**, then find the collection under **Database → View Custom Collections**, choose **Edit**, and confirm the saved schema and name.

The schema requires all three fields. Project type is `Single room` or `Whole home`, the brief is 12–300 characters, and consent must be the boolean `true`. These are JSON values: do not send the string `"true"` for consent.

The companion supports this bounded, flat schema. Do not add arrays, nested objects, file controls, `dataSource`, layout extensions or other keywords without extending its renderer. Studio can support controls that this sample does not. An unsupported configured schema deliberately blocks booking.

## Create and configure the booking type

1. Open **CRM → Reservations → Booking types → New booking type**. Choose **An appointment with a person**, and enter `Atelier design consultations` as its name/title.
2. Set the following values in the initial form, then choose **Save**. If an initial booking-length field is shown before services exist, use 30 minutes.

| Setting | Value for this example |
| --- | --- |
| Working days | Monday through Friday |
| Opens at / Last booking ends | 09:00 / 17:00 |
| Time zone | Central Time (Chicago), IANA `America/Chicago` |
| Bookings at the same time | 1 |
| Taking bookings | On |
| Confirm online bookings automatically | On |
| Payment required to book | Off |
| Hosts / venue / meeting link | No host assignment or meeting details needed for this example |

3. Reopen the saved card using its pencil **Edit** control. Choose **All settings (services, blocked times, notifications)**. This control is available for a saved definition; it is not exposed during initial creation.
4. Expand **Services** and add these two entries. Keep the spelling: the app sends the selected service's exact name to AppEngine.

| Service name | Duration, minutes | Price | Break after, minutes |
| --- | --- | --- | --- |
| Room planning | 30 | 0 | 15 |
| Whole-home consultation | 60 | 0 | 15 |

5. In the definition's **Booking form** / **Form** selector, choose the collection titled **Prepare your Atelier consultation**. Its stored name is `atelier_booking_intake`. Select the existing collection; do not paste the schema into this reference field. Keep the booking assignment strategy unassigned and leave host assignments empty.
6. Save the advanced form. Reopen it and verify the two services and the selected form. Recheck the opening hours, timezone, capacity and booking policy in the main editor.

[definition-values.json](definition-values.json) records the intended field values for comparison with the saved definition's `data`. It is a reference object, not a request to execute. The example uses duration-based slots: a 30-minute consultation plus a 15-minute break normally produces a 45-minute rhythm. Existing bookings and availability rules can change the returned list. Do not configure an interval override if you want this rhythm; always inspect actual returned slots rather than generating times in the client.

Auto-confirm explains the course's `Confirmed` result. With auto-confirm off, a successful customer booking can correctly return `new`. Display AppEngine's actual status.

## Connect this definition to the app

Open **Booking types → your saved definition → pencil Edit**. In the browser address bar, locate `openDefinition`:

```text
.../app/reservations?title=Reservations&tab=reservation-definitions&openDefinition=YOUR_DEFINITION_ID
```

Copy only the value after `openDefinition=` into the app's `definitionId`. Use your own record ID, not the title, collection name, service name or entire URL. This normal editor navigation was verified in the course's hosted UI. No Copy ID action was exposed there.

Create `config.json` beside `server.mjs`, using the root [config.example.json](../../config.example.json):

```json
{
  "baseUrl": "https://appengine.appmint.io",
  "orgId": "YOUR_ORGANIZATION_ID",
  "definitionId": "YOUR_DEFINITION_ID",
  "publicOrigins": []
}
```

A private AppEngine installation uses its own API address. For a hosting proxy that rewrites Host, fill `publicOrigins` with the exact customer-facing preview and production HTTPS origins, without paths or trailing slashes. Leave it empty for the default same-host check. These values and the three AppEngine coordinates are public configuration, not credentials. The ignored local `config.json` is not included in Git; supply the file in the deployed workspace or use the three environment variables documented in the [companion README](../../README.md).

## Check with an ordinary customer

Use a customer account in the same organization, or the app's **Create account** screen if the organization's policy permits it. Staff credentials do not substitute for a customer account. Complete verification or temporary-password steps when required. The app does not offer verification resend or password recovery.

Before signup or booking, configure the intended email/SMS routing for the exercise with the organization administrator. Both actions can request messages. Empty notification arrays do not disable delivery, and having no local provider does not necessarily prevent a shared-provider fallback. Use a deliberate test-delivery policy; a saved booking is not proof of delivered email.

Run the app using the root README. Confirm both services appear, sign in normally, choose a future weekday in the business timezone, and select an actual returned slot. Complete the three intake answers, save, then reopen the appointment through **My bookings**. Check its actual status and reference. The implemented **Your project** section shows the saved answers using the current configured question titles; verify all three values. The staff reservation details can independently show those saved answers. Reschedule and reopen to verify the same reference with the new time.

The connection uses distinct values:

| Value | How the app uses it |
| --- | --- |
| Definition record ID | Fixed configuration; selects the published definition and slot rules |
| Exact service name | `serviceName` for availability; `service` for creation |
| Form collection name | Resolves the configured collection's `data.schema` |
| Returned slot timestamps | Preserved as booking `startTime` and `endTime` |
| Saved reservation record ID | Owned detail and reschedule API paths |
| Booking reference | Customer-visible reference; not the API record ID |

## Navigation evidence and limits

Verified existing-record course navigation: Booking types → Edit → All settings → Services/form; Database → View Custom Collections → Edit → Form Preview/JSON Schema; the editor's `openDefinition` URL parameter.
