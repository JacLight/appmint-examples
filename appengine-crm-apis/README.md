# AppEngine CRM APIs: reproducible requests

Use an isolated training organization. **Do not run this directory as a batch.** Creates, conversion, booking, cancellation and status updates change business records and may queue notifications. The recording used a verified inactive SMTP configuration, reserved training addresses and no outbound reply/send action. Your deployment may send notices: choose controlled recipients and configure delivery deliberately before writes.

## Connection and identities

Database & Repository APIs chapter 2: `/videos/appengine-data-records/course/review.html` (1:02, Use the staff identity and organization). Written setup: `/videos/course-catalogue/materials/appengine-data-records-script.html#2-set-up-what-you-need`. Obtain API origin, organization ID and authorized staff token. Customer ticket sign-in uses API Foundations (`/videos/appengine-api-foundations/course/review.html`). No app token is required for the public routes demonstrated here. Private server integrations must not expose staff credentials to visitors.

```sh
export APPENGINE_ENDPOINT='https://YOUR_APPENGINE_HOST'
export ORG_ID='YOUR_ORGANIZATION_ID'
export STAFF_TOKEN='YOUR_AUTHORIZED_STAFF_TOKEN'
export CUSTOMER_TOKEN='YOUR_CUSTOMER_SESSION_TOKEN'
node call.mjs 42-pipeline-read
python3 call.py 42-pipeline-read
```

Replace the operation's path IDs first. Node 20+ and Python 3. 10+ runners use built-ins; TypeScript call.ts is the typed equivalent for an existing TypeScript/Node project. Import postman.json and set base/orgid/staffToken/customerToken privately. `route.json` states method, path and identity; `request.json` is exact JSON BODY, and `response.json` is observed rehearsal evidence. Example read with curl:

```sh
curl -sS -X GET "$APPENGINE_ENDPOINT/crm/leads/pipelines/YOUR_PIPELINE_ID" \
 -H "orgid: $ORG_ID" -H "Authorization: Bearer $STAFF_TOKEN"
```

For a JSON write use the method/path from route.json, Content-Type application/json, and `--data-binary @OPERATION/request.json`. Public routes omit Authorization; customer routes use CUSTOMER_TOKEN. Do not infer identity from the word CRM.

## Reproduce setup and preserve returned IDs

1. Edit 05's pipeline name to a unique name; create once and preserve response.sk. Edit 06 with your controlled contact and returned pipeline ID plus its real stage ID. Save the lead's sk and contactId. 07–12 work that lead: replace route IDs, assignedTo with your own permitted staff identity, and followUpDate with a future ISO instant. 11's convertedToCustomerId identifies the person; compare it with contactId and read that customer through 14.
2. Edit 15's definition name to a unique value, verify its 30-minute service, capacity, weekday hours and America/Chicago timezone. Hosts/location/blocked times must match your actual service. Reminder configuration can queue future messages. Create once and keep definition sk.
3. Generate a future slot request: `python3 future-slots.py YOUR_DEFINITION_ID > 16-slots/request.json`. Run 16, then copy an actual returned startTime into 17 alongside the definition ID and controlled customer details. Keep booking sk and data.name separately. Recording dates are historical and must not be replayed. 18 intentionally repeats an occupied time and expects rejection; it is not an automatic retry strategy.
4. 20 uses a newly available startTime and `notify:false`; replace its booking ID. 21 cancels that same owned booking. 29 reads the retained reservation through the staff Repository route. 19/22 deliberately demonstrate403 when staff calls the customer-read route, not an application defect.
5. 23 creates the uniquely named inline-schema form; substitute that name in 24–27. 25 intentionally omits required request;26 saves the complete answers. Save form and submission sk. Open form email is **not verified identity**. No approval workflow was configured for this example.
6. 30 signs in an already registered controlled customer (API Foundations prerequisite). 31 creates one ticket using that customer's token; it demonstrates ignored status/priority fields. 32 uses the returned ticket number. 33–40 switch to staff, use ticket sk, add note, assign, resolve and read the final workflow. The support customer is distinct from the lead/booking customer in this recording.
7. 28 queries the lead/booking customer's email;41 uses your pipeline ID. Counts are fixtures, not performance claims. Full payloads accompany each operation. API response fields remain nested under data where returned.

## Attachments, alternatives and limits

Ticket multipart intake is POST /crm/tickets/create-ticket: send full ticket JSON in text part `data` and file parts alongside. Browser FormData/requests/curl generate the boundary; **do not set application/json** on a multipart request. Complete counterpart:

```sh
curl -X POST "$APPENGINE_ENDPOINT/crm/tickets/create-ticket" \
 -H "orgid: $ORG_ID" -H "Authorization: Bearer $CUSTOMER_TOKEN" \
 -F 'data=<ticket.json' -F 'files=@attachment.pdf'
```

`ticket.json` contains `{"data":{"title":"Attachment question","description":"Please review the file"}}`. Multipart upload is source-reviewed here, not a second recorded outcome. File Storage APIs teaches storage objects and references. Live staff reply/resend, signature invitations, enrichment purchases and account charges were not executed. Customer email+booking-code management is a separate contract listed in the written companion. Queued message status is not delivered status. Pipeline probability/scoring, advanced stage rules and provider alternatives need their own configured tests.

## Course source publication

This folder contains the downloadable companion supplied with **AppEngine CRM APIs: Leads, Reservations, Forms and Support Tickets**. Replace training identifiers and paths with your own. Recorded results are examples, not a live connection or credentials. Use the current [AppEngine API reference](https://appengine.appmint.io/documentation) for changing contracts. The course reader retains its verification limits.
