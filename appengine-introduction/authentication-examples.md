# AppEngine: sign in, obtain a token and read your profile

### The same JSON and HTTP exchange in every client

Use an existing **staff account**, its password and its exact organization ID. First create the account through [Appmint signup](https://appmint.io/signup/) if needed; these examples **sign in**, then read a profile. An existing Google/GitHub account may need its supported password setup or another documented authentication route before using this password example. Use your own development organization. The video uses a separate training deployment; the examples default to the hosted API.

**Request 1 — sign in.** Send JSON to the API host, with the organization header:

```http
POST https://appengine.appmint.io/profile/signin
Content-Type: application/json
orgid: YOUR_ORGANIZATION_ID

{"email":"YOUR_STAFF_EMAIL","password":"YOUR_PASSWORD"}
```

**Response 1 — find `token`.** This is an abbreviated JSON shape with placeholder values, not a credential:

```json
{
  "token": "ACCESS_TOKEN_RETURNED_BY_SIGNIN",
  "refreshToken": "REFRESH_TOKEN_IF_RETURNED",
  "orgId": "YOUR_ORGANIZATION_ID",
  "user": {"datatype": "user", "data": {"email": "YOUR_STAFF_EMAIL"}}
}
```

The access token is the top-level **`token`**, not `refreshToken`. A successful status alone does not establish a session. If `requiresTwoFactor` or `requiresPasswordChange` is returned without a usable token, stop and complete that flow. See [User authentication](https://docs.appmint.io/appengine/authentication/users.html) and [Two-factor and device security](https://docs.appmint.io/appengine/authentication/two-factor-and-devices.html). Do not send a challenge token as the bearer token for this profile call.

**Request 2 — use that token.** URL-encode the same staff email in the path and keep the **same `orgid`**:

```http
GET https://appengine.appmint.io/profile/user/profile/YOUR_URL_ENCODED_STAFF_EMAIL
Authorization: Bearer ACCESS_TOKEN_RETURNED_BY_SIGNIN
orgid: YOUR_ORGANIZATION_ID
```

**Response 2 — verify the returned person.** The profile is a record with a top-level datatype and nested `data`:

```json
{
  "datatype": "user",
  "data": {
    "email": "YOUR_STAFF_EMAIL",
    "firstName": "YOUR_FIRST_NAME",
    "lastName": "YOUR_LAST_NAME"
  }
}
```

Expect HTTP 200, `datatype: "user"`, and `data.email` matching the account you signed in with. Read names from `data.firstName` and `data.lastName`. If sign-in fails, check the host, organization and credentials. If the protected request fails, check that the access token is current and belongs to that same organization. These requests do not create an account or change a business record.

### JavaScript — native fetch

Requires Node.js 20+; save as `first-profile.mjs` and run `node first-profile.mjs`. Set `ORG_ID`, `STAFF_EMAIL`, `STAFF_PASSWORD` privately in the process environment. `APPENGINE_ENDPOINT` is optional. Keep this on your server or private terminal; do not ship the password or privileged token in browser code.

```javascript
const base = (process.env.APPENGINE_ENDPOINT || "https://appengine.appmint.io").replace(/\/$/, "");
const orgid = process.env.ORG_ID;
const email = process.env.STAFF_EMAIL;
const password = process.env.STAFF_PASSWORD;
if (!orgid || !email || !password) throw new Error("Set ORG_ID, STAFF_EMAIL and STAFF_PASSWORD");

async function json(response) {
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
const session = await json(await fetch(`${base}/profile/signin`, {
  method: "POST",
  headers: { "Content-Type": "application/json", orgid },
  body: JSON.stringify({ email, password })
}));
if (typeof session.token !== "string" || !session.token) {
  throw new Error("No access token: complete any MFA or password-change challenge first");
}
const profile = await json(await fetch(`${base}/profile/user/profile/${encodeURIComponent(email)}`, {
  headers: { orgid, Authorization: `Bearer ${session.token}` }
}));
if (profile.datatype !== "user" || profile.data?.email !== email) {
  throw new Error("Returned profile does not match the signed-in staff account");
}
console.log(profile.datatype, profile.data.firstName, profile.data.lastName);
```

### TypeScript — the same HTTP requests, with response types

Requires Node.js 20+, TypeScript and Node type definitions. Save as `first-profile.mts`; compile with `tsc first-profile.mts --target ES2022 --module NodeNext --moduleResolution NodeNext`, then run `node first-profile.mjs`. Use the same private environment variables as JavaScript. Types describe the expected JSON; the explicit token and identity checks still run.

```typescript
type Session = { token?: string; requiresTwoFactor?: boolean; requiresPasswordChange?: boolean };
type Profile = { datatype: string; data: { email: string; firstName?: string; lastName?: string } };
const base = (process.env.APPENGINE_ENDPOINT || "https://appengine.appmint.io").replace(/\/$/, "");
const orgid = process.env.ORG_ID;
const email = process.env.STAFF_EMAIL;
const password = process.env.STAFF_PASSWORD;
if (!orgid || !email || !password) throw new Error("Set ORG_ID, STAFF_EMAIL and STAFF_PASSWORD");
async function json<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<T>;
}
const session = await json<Session>(await fetch(`${base}/profile/signin`, {
  method: "POST",
  headers: { "Content-Type": "application/json", orgid },
  body: JSON.stringify({ email, password })
}));
if (typeof session.token !== "string" || !session.token) {
  throw new Error("No access token: complete any MFA or password-change challenge first");
}
const profile = await json<Profile>(await fetch(`${base}/profile/user/profile/${encodeURIComponent(email)}`, {
  headers: { orgid, Authorization: `Bearer ${session.token}` }
}));
if (profile.datatype !== "user" || profile.data?.email !== email) {
  throw new Error("Returned profile does not match the signed-in staff account");
}
console.log(profile.datatype, profile.data.firstName, profile.data.lastName);
```

### Python — standard library

Requires Python 3, with no extra packages. Save as `first_profile.py` and run `python3 first_profile.py`. This version prompts for the organization, email and hidden password.

```python
import getpass
import json
import os
from urllib.parse import quote
from urllib.request import Request, urlopen

base = os.environ.get("APPENGINE_ENDPOINT", "https://appengine.appmint.io").rstrip("/")
orgid = input("Organization ID: ").strip()
email = input("Staff email: ").strip()
password = getpass.getpass("Password: ")
if not all((orgid, email, password)):
    raise SystemExit("Organization ID, staff email and password are required")

def request(path, headers, body=None):
    data = None if body is None else json.dumps(body).encode("utf-8")
    with urlopen(Request(base + path, data=data, headers=headers), timeout=30) as response:
        return json.load(response)  # HTTP failures raise HTTPError

session = request("/profile/signin", {"Content-Type": "application/json", "orgid": orgid},
                  {"email": email, "password": password})
token = session.get("token")
if not isinstance(token, str) or not token:
    raise SystemExit("No access token: complete any MFA or password-change challenge first")
profile = request("/profile/user/profile/" + quote(email, safe=""),
                  {"orgid": orgid, "Authorization": "Bearer " + token})
if profile.get("datatype") != "user" or profile.get("data", {}).get("email") != email:
    raise SystemExit("Returned profile does not match the signed-in staff account")
print(profile["datatype"], profile["data"].get("firstName"), profile["data"].get("lastName"))
```

### curl — inspect the JSON directly

Requires curl and a private working directory. Set `umask 077` in your shell first. Create `signin.json` containing the Request 1 JSON above, replacing its placeholders with your own values. Set `APPENGINE_ENDPOINT=https://appengine.appmint.io` and `ORG_ID` to your organization ID. Keep the JSON files private and out of version control.

```bash
curl --fail-with-body -sS -X POST "$APPENGINE_ENDPOINT/profile/signin" \
  -H 'Content-Type: application/json' -H "orgid: $ORG_ID" \
  --data-binary @signin.json -o signin-response.json
```

Inspect `signin-response.json` privately. Continue only if it contains a nonempty access **`token`**, after completing any challenge. Create `headers.txt` with these two lines, replacing the placeholders; use the actual access token from that response:

```http
Authorization: Bearer ACCESS_TOKEN_RETURNED_BY_SIGNIN
orgid: YOUR_ORGANIZATION_ID
```

Set `EMAIL_PATH` to your URL-encoded staff email (for example, `your.name%40example.com`), then send the protected read:

```bash
curl --fail-with-body -sS \
  "$APPENGINE_ENDPOINT/profile/user/profile/$EMAIL_PATH" \
  -H @headers.txt -o profile.json
```

Open `profile.json` and check `datatype` is `user`, `data.email` is your account, and the nested name fields are correct. Remove `signin.json`, `signin-response.json`, `headers.txt` and `profile.json` after the exercise. Neither request requires jq. `--fail-with-body` requires curl 7.76+.

### Postman — two saved requests

Create private environment values `baseUrl` (`https://appengine.appmint.io`), `orgid`, `email`, and `password`. Keep credentials and returned tokens out of shared/synced values. Use the same environment for both requests.

1. **Sign in:** `POST {{baseUrl}}/profile/signin`. Set header `orgid: {{orgid}}`, Authorization **No Auth**, and Body → **raw → JSON**:

   ```json
   {"email":"{{email}}","password":"{{password}}"}
   ```

   Confirm `Content-Type: application/json`. Inspect the response body for `token` and challenge flags. In the request's **post-response script**, save only a completed session:

   ```javascript
   pm.environment.unset("accessToken");
   const session = pm.response.json();
   if (pm.response.code < 200 || pm.response.code >= 300 ||
       typeof session.token !== "string" || !session.token) {
     throw new Error("No session: check the response and complete any challenge first");
   }
   pm.environment.set("accessToken", session.token);
   pm.environment.set("emailPath", encodeURIComponent(pm.environment.get("email")));
   ```

2. **Own profile:** `GET {{baseUrl}}/profile/user/profile/{{emailPath}}`. Set header `orgid: {{orgid}}`. In Authorization select **Bearer Token** and enter `{{accessToken}}` (Postman adds the `Bearer` prefix). Send this request only after the first returns a usable token. In its post-response script:

   ```javascript
   pm.test("The signed-in staff profile was returned", () => {
     pm.response.to.have.status(200);
     const profile = pm.response.json();
     pm.expect(profile.datatype).to.eql("user");
     pm.expect(profile.data.email).to.eql(pm.environment.get("email"));
   });
   ```

Read `data.firstName` and `data.lastName` in the JSON response. Clear private password and token values when finished. A failed sign-in clears the old token; do not reuse a token from a different organization.

### Optional Bash helper and downloadable examples

[Download these JavaScript, TypeScript, Python, curl, Postman and JSON examples](/videos/appengine-introduction/course/authentication-examples.md). The [existing Bash helper](/videos/appengine-introduction/course/first-authenticated-request.sh) remains optional. It requires Bash, curl and jq and can be run with `bash first-authenticated-request.sh`; it performs the same sign-in, token check and own-profile request with private prompts and temporary-file cleanup. You do not need that helper to use any client shown above.
