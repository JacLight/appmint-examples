# AppEngine Workflow, Handling and Approvals API examples

These are controlled training requests and observed responses. Replace the organization, deployment endpoint, staff email and fixture identifiers with your own. Never use the training IDs against a different organization. A successful earlier write does not make a later repeated write safe.

## Shared configuration

Use the AppEngine API endpoint supplied for your organization. Sign in with POST /profile/user/signin and the orgid header. Send the returned staff token as Authorization: Bearer YOUR_STAFF_TOKEN. The Database & Repository APIs course chapter 2 demonstrates this prerequisite. Customer credentials are not interchangeable with a staff session.

Each operation directory contains complete request.json body, operation.json method/path/headers, and response.json. On-screen excerpts are explicitly selected fields; use these complete payloads. Earlier lab operator mistakes 20, 26 and 62 are excluded. This folder does not contain credentials. Sensitive server metadata is removed from response examples. CLI output is ordinary JSON, without jq.

## Six formats

Set APPENGINE_BASE_URL, APPENGINE_ORG_ID and APPENGINE_STAFF_TOKEN in your own environment. For TypeScript/JavaScript, define base, route, method, headers and body from the operation's operation.json. Do not embed private tokens in a public client application. Python and curl examples assume a trusted development shell. A backend integration must keep its credentials on the server.

```typescript
const res: Response = await fetch(base + route, {
  method, headers,
  ...(body === null ? {} : {body: JSON.stringify(body)})
});
const raw = await res.text();
console.log(res.status, raw ? JSON.parse(raw) : null);
```

```javascript
const res = await fetch(base + route, {
  method, headers,
  ...(body === null ? {} : {body: JSON.stringify(body)})
});
const raw = await res.text();
console.log(res.status, raw ? JSON.parse(raw) : null);
```

```python
import os, json, requests
request = json.load(open('operation.json'))
headers = {'Content-Type': 'application/json',
           'orgid': os.environ['APPENGINE_ORG_ID'],
           'Authorization': 'Bearer ' + os.environ['APPENGINE_STAFF_TOKEN']}
response = requests.request(request['method'],
    os.environ['APPENGINE_BASE_URL'].rstrip('/') + request['path'],
    headers=headers, json=request['body'])
print(response.status_code)
result = response.json() if response.content else None
print(json.dumps(result, indent=2))
```

For curl use the exact method/path from operation.json; request.json is already the complete JSON body. Omit --data-binary for a bodyless request.

```sh
curl --request POST "$APPENGINE_BASE_URL/workflow/fire"   --header "orgid: $APPENGINE_ORG_ID"   --header "Authorization: Bearer $APPENGINE_STAFF_TOKEN"   --header 'Content-Type: application/json'   --data-binary @request.json
```

In Postman, choose the operation's method and {{appengineBaseUrl}} plus its path, add orgid and Bearer Token authorization, then Body → raw → JSON with the complete body from request.json. For sign-in, omit Bearer authorization and use your own credentials in its body. Inspect the HTTP status and full JSON response.

The JSON format is the complete request.json body in each directory. GET query parameters are already present in path; do not put them in a JSON body.

## Scope and replay order

Follow the numbered files. Create collection, definition and source record first; substitute returned IDs in every later request. The normal workflow and decision workflow intentionally share a collection, so pass workflowId explicitly. Assignment examples 71–76 use a separate completed task. The custom approval and rejection examples change only disposable record states; no actual access grant or publication was performed. The access-request example asks for an isolated dummy screen and cancels the request; it never grants access. Email delivery is disabled in the training organization.

## Included operations

- 01-staff-signin
- 02-existing-workflows
- 03-existing-approval-tray
- 04-staff-accounts
- 05-create-collection
- 06-create-definition
- 07-get-definition
- 08-effective-workflow
- 09-create-record
- 10-fire-record
- 11-position
- 12-list-task
- 13-sla
- 14-snooze
- 15-escalate
- 16-sla-after
- 17-take-record
- 18-take-retry
- 19-advance
- 21-required-input-refusal
- 22-add-note
- 23-reassign
- 24-complete-with-input
- 25-history
- 27-handling-done
- 28-handling-read
- 29-archive-task
- 30-list-without-archive
- 31-list-with-archive
- 32-unarchive-task
- 33-analytics
- 34-task-eta
- 35-search
- 36-source-completed-correct-route
- 37-restart
- 38-position-restarted
- 39-handling-release
- 40-handling-no-action
- 41-cancel-task
- 42-archive-definition
- 43-fire-archived-refusal
- 44-restore-definition
- 45-patch-definition
- 46-create-decision-definition
- 47-create-approve-record
- 48-fire-approve
- 49-decision-approve
- 50-read-approve-record
- 51-read-approve-task
- 52-create-reject-record
- 53-fire-reject
- 54-decision-reject
- 55-read-reject-record
- 56-read-reject-task
- 57-approval-history
- 58-approval-reasons
- 59-template-existing
- 60-create-built-in-ticket
- 61-ticket-workflow
- 63-ticket-done
- 64-ticket-after
- 65-ask-access
- 66-ask-duplicate
- 67-own-request-refusal
- 68-bare-decision-refusal
- 69-cancel-request
- 70-read-cancelled-request
- 71-assignment-record
- 72-assignment-fire
- 73-complete-direct
- 74-reassign-completed
- 75-note-completed
- 76-completed-history
- 77-ticket-assign-correct
- 78-ticket-assignment-read

## Course source publication

This folder contains the downloadable companion supplied with **AppEngine Workflow, Handling and Approvals APIs**. Replace training identifiers and paths with your own. Recorded results are examples, not a live connection or credentials. Use the current [AppEngine API reference](https://appengine.appmint.io/documentation) for changing contracts. The course reader retains its verification limits.
