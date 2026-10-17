# AppEngine Workforce APIs companion

Build a workforce client with separate manager and employee sessions. This example consumes AppEngine; it does not implement a separate HR backend.

## Run the browser client

Requires Node.js22 or newer. No package installation is needed.

```sh
export APPENGINE_API_ORIGIN='https://YOUR-ASSIGNED-APPENGINE-ORIGIN'
node browser/server.mjs
```

Open the local development address printed by the server. Sign in separately as the authorized manager and linked employee, using the same organization ID. Tokens remain in browser memory and disappear on reload. The server forwards only the routes this sample uses and listens on loopback; it stores no credentials. This proxy is a development example, not an internet-facing production authentication gateway.

Obtain your API origin and organization identifier from your Appmint organization. Use the [maintained AppEngine sign-in reference](https://appengine.appmint.io/documentation) for the appropriate sign-in/challenge flow. The sample's direct sign-in form accepts a returned token; an organization requiring a further authentication challenge needs that flow completed by its supported authentication client.

The organization manager needs the actual HR/time/payroll permissions for manager operations. Creating/linking staff accounts requires the organization's credential administration permission (ConfigAdmin); no root organization is required. A navigation tab never creates authority. An employee uses their own token and the server derives their employee identity.

## Course sequence

1. Create an employee with a unique `employeeId`. Keep the returned record `sk` separately. For a saved record, search the exact employee code and reopen by its returned `sk`.
2. Employee creation can automatically launch a journey and send the invitation. Read the current journey first. Use create-from-employee to link an existing user or create a supported invitation. The invitation recipient validates and accepts it, then signs in. Do not publish invitation tokens. The browser's training invitation shortcut shows where the token is consumed; production applications should deliver the supported invitation link to its intended recipient.
3. Read the current onboarding journey. Pay choice and employee-supplied tax elections write actual payroll-profile evidence. Read the published handbook and required resources; collect the typed name and explicit electronic-signature consent before acknowledgement. Only then complete required onboarding. The default journey also contains optional longer-term tasks; do not bypass required evidence by editing task status.
4. Create a schedule and a shift using the employee code. A draft remains absent from the employee's own schedule. Publish and read the same range again.
5. Clock in/out as the employee. The real clock session may be brief. A separately entered training shift is explicitly labelled and is not represented as the measured clock duration. Submit the sheet; approve as the manager; reread as the employee.
6. Configure Leave in the organization first: readiness, working days, approval route, active types and policy, and relevant employee balances. Read the employee's types and balance, calculate working-day cost, submit, approve as the assigned decision-maker, then reread status and balance.
7. A payroll run must have produced the employee's payslip before self-service can show one. Follow the linked Accounting and Payroll written course for employer/profile setup, calculation, approval policy and internal processing. Open only an ID returned from the caller's own payslip list, then request its detail/PDF. The server rejects another employee's stub.

## Training data and boundaries

The browser uses obvious example names and values. Replace them with your controlled test data. Its tax-election button saves synthetic values only; this sample does not advise a person's tax elections or submit a tax filing. The payment example uses check/cash and never sends money. Do not use synthetic employer identifiers for live payroll or filings.

Some organization configurations require additional onboarding forms, readiness evidence, geolocation or employee permissions. Render the returned errors and required steps; do not replace them with a generic success message. The course demonstrates an ambiguous-email403 and the supported explicit employee-code link that resolves it.

## Source variants

`browser/` is a plain JavaScript client, not React or a native mobile package. The portable examples cover the same AppEngine contracts in JavaScript/TypeScript, Python, curl and Postman. A mobile implementation must keep the same caller separation and secure its token storage; this package makes no native installation or device-capture claim.

## Current application finding

After an existing period sheet was approved and processed, requesting `staff-portal/timesheets/current` returned409 with the existing overlapping-period message. The companion displays the existing caller-owned period sheet from the list. It does not create a second sheet or modify paid hours. A new clock session needs an eligible open period.

## Run the portable implementations

Set `APPENGINE_API_ORIGIN`, `APPENGINE_ORG_ID` and the relevant `MANAGER_TOKEN` or `STAFF_TOKEN` in your private shell. Select a named operation explicitly: `node client.mjs my-profile` or `python3 client.py my-profile`. Supply each uppercase placeholder named in `operations.json` through an environment variable. Copy saved IDs from the actual preceding result; do not interchange employee codes and record IDs.

For the demonstrated setup, run `employee-create`, obtain/accept its invitation in the browser, then use the new employee session for `my-profile`, `my-pay-method` and `save-training-tax-info`. The latter is an explicit synthetic training example, not a live person's tax form. `time-add-training-entry` persists the separately labelled 7.5-hour example. These operations write records; use your own controlled fixtures and replace all training address/contact/tax values before any real use.

TypeScript exposes a typed `WorkforceClient` for an existing application; `tsc -p tsconfig.json` checks it. Its general `request<T>` method covers every operation in `operations.json`. Import `workforce.postman_collection.json` into Postman and create private variables for the same names. The collection is intentionally uncredentialed. `http/` contains standalone curl examples for own profile, leave cost and draft publication.
