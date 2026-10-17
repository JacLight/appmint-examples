# AppEngine API Foundations — request examples

These are equivalent client examples, paired with selected responses from the controlled training run. Replace placeholders with your own organization and account. Do not paste live tokens into public code.

## Shared configuration

JavaScript/TypeScript: define `base = "https://appengine.appmint.io"`, `orgid` and (after sign-in) `token`. Define `body` from the shown JSON. Python uses the same variables and requires the `requests` package. curl uses environment variables `BASE`, `ORG_ID`, `TOKEN` and a `request.json` file. Postman uses corresponding environment variables. Store credentials privately.

Read challenge flags before establishing the normal customer session. Save the access token from `token` and keep `refreshToken` separately. The challenge response and refresh response use `user`; the recorded signup response uses `customer`.

## Create a customer account

body / request.json = JSON shown here; replace credential placeholders.

### JSON request

```json
{
  "email": "YOUR_CUSTOMER_EMAIL",
  "password": "YOUR_PASSWORD",
  "firstName": "Mira",
  "lastName": "Chen"
}
```

### TypeScript

```typescript
const path: string = "/profile/customer/signup";
const response = await fetch(base + path, {
  method: "POST",
  headers: { orgid,
    "Content-Type": "application/json" },
  body: JSON.stringify(body)
});
if (!response.ok) throw Error(String(response.status));
const result = await response.json();
```

### JavaScript

```javascript
const path = "/profile/customer/signup";
const response = await fetch(base + path, {
  method: "POST",
  headers: { orgid,
    "Content-Type": "application/json" },
  body: JSON.stringify(body)
});
if (!response.ok) throw Error(String(response.status));
const result = await response.json();
```

### Python

```python
import requests
path = "/profile/customer/signup"
response = requests.post(
  base + path,
  headers={"orgid": orgid},
  json=body,
  timeout=30
)
response.raise_for_status()
result = response.json()
```

### curl

```bash
curl -sS -i -X POST \
  "$BASE/profile/customer/signup" \
  -H "orgid: $ORG_ID" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
POST {{base}}/profile/customer/signup
Headers
  orgid: {{orgid}}
  Content-Type: application/json
Body → raw → JSON
{
  "email": "{{email}}",
  "password": "{{password}}",
  "firstName": "Mira",
  "lastName": "Chen"
}
```

### Selected actual training response

HTTP 201

```json
{
  "customer": {
    "sk": "6ac82b5a58e293f2e4d6635a",
    "datatype": "customer",
    "data": {
      "firstName": "Mira",
      "lastName": "Chen"
    }
  },
  "token": "[redacted]",
  "refreshToken": "[redacted]"
}
```

Optional x-client-host example; the recorded signup omitted this header.

### JSON request

```json
{
  "email": "YOUR_CUSTOMER_EMAIL",
  "password": "YOUR_PASSWORD",
  "firstName": "Mira",
  "lastName": "Chen"
}
```

### TypeScript

```typescript
const path: string = "/profile/customer/signup";
const response = await fetch(base + path, {
  method: "POST",
  headers: { orgid,
    "Content-Type": "application/json",
    "x-client-host": storefront },
  body: JSON.stringify(body)
});
if (!response.ok) throw Error(String(response.status));
const result = await response.json();
```

### JavaScript

```javascript
const path = "/profile/customer/signup";
const response = await fetch(base + path, {
  method: "POST",
  headers: { orgid,
    "Content-Type": "application/json",
    "x-client-host": storefront },
  body: JSON.stringify(body)
});
if (!response.ok) throw Error(String(response.status));
const result = await response.json();
```

### Python

```python
import requests
path = "/profile/customer/signup"
response = requests.post(
  base + path,
  headers={"orgid": orgid,
    "x-client-host": storefront},
  json=body,
  timeout=30
)
response.raise_for_status()
result = response.json()
```

### curl

```bash
curl -sS -i -X POST \
  "$BASE/profile/customer/signup" \
  -H "orgid: $ORG_ID" \
  -H "Content-Type: application/json" \
  --data-binary @request.json \
  -H "x-client-host: $STOREFRONT"
```

### Postman

```text
POST {{base}}/profile/customer/signup
Headers
  orgid: {{orgid}}
  Content-Type: application/json
  x-client-host: {{storefront}}
Body → raw → JSON
{
  "email": "{{email}}",
  "password": "{{password}}",
  "firstName": "Mira",
  "lastName": "Chen"
}
```

### Selected actual training response

HTTP 201

```json
{
  "customer": {
    "sk": "6ac82b5a58e293f2e4d6635a",
    "datatype": "customer",
    "data": {
      "firstName": "Mira",
      "lastName": "Chen"
    }
  },
  "token": "[redacted]",
  "refreshToken": "[redacted]"
}
```

## Sign in and inspect challenge flags

body / request.json = email and password JSON; keep the same organization.

### JSON request

```json
{
  "email": "YOUR_CUSTOMER_EMAIL",
  "password": "YOUR_PASSWORD"
}
```

### TypeScript

```typescript
const path: string = "/profile/customer/signin";
const response = await fetch(base + path, {
  method: "POST",
  headers: { orgid,
    "Content-Type": "application/json" },
  body: JSON.stringify(body)
});
if (!response.ok) throw Error(String(response.status));
const result = await response.json();
```

### JavaScript

```javascript
const path = "/profile/customer/signin";
const response = await fetch(base + path, {
  method: "POST",
  headers: { orgid,
    "Content-Type": "application/json" },
  body: JSON.stringify(body)
});
if (!response.ok) throw Error(String(response.status));
const result = await response.json();
```

### Python

```python
import requests
path = "/profile/customer/signin"
response = requests.post(
  base + path,
  headers={"orgid": orgid},
  json=body,
  timeout=30
)
response.raise_for_status()
result = response.json()
```

### curl

```bash
curl -sS -i -X POST \
  "$BASE/profile/customer/signin" \
  -H "orgid: $ORG_ID" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
POST {{base}}/profile/customer/signin
Headers
  orgid: {{orgid}}
  Content-Type: application/json
Body → raw → JSON
{
  "email": "{{email}}",
  "password": "{{password}}"
}
```

### Selected actual training response

HTTP 201

```json
{
  "customer": {
    "sk": "6ac82b5a58e293f2e4d6635a",
    "datatype": "customer",
    "data": {
      "firstName": "Mira",
      "lastName": "Chen"
    }
  },
  "token": "[redacted]",
  "refreshToken": "[redacted]"
}
```

Actual response has no challenge flags; handle flags before accepting token.

### JSON request

```json
{
  "email": "YOUR_CUSTOMER_EMAIL",
  "password": "YOUR_PASSWORD"
}
```

### TypeScript

```typescript
const session = result;
if (session.requiresPasswordChange)
  throw Error("Finish password change");
if (session.requiresTwoFactor)
  throw Error("Complete verification");
if (typeof session.token !== "string" ||
    !session.token.trim())
  throw Error("No access token");
let token = session.token;
let refreshToken = session.refreshToken;
```

### JavaScript

```javascript
const session = result;
if (session.requiresPasswordChange)
  throw Error("Finish password change");
if (session.requiresTwoFactor)
  throw Error("Complete verification");
if (typeof session.token !== "string" ||
    !session.token.trim())
  throw Error("No access token");
let token = session.token;
let refreshToken = session.refreshToken;
```

### Python

```python
session = result
if session.get("requiresPasswordChange"):
  raise ValueError("Finish password change")
if session.get("requiresTwoFactor"):
  raise ValueError("Complete verification")
token = session.get("token")
if not isinstance(token, str) or not token.strip():
  raise ValueError("No access token")
refresh_token = session.get("refreshToken")
```

### curl

```bash
# Read the signin response JSON.
# Handle requiresPasswordChange first.
# Then handle requiresTwoFactor.
# Continue only with a nonempty token.
read -rs -p "Access token: " TOKEN
read -rs -p "Refresh token: " REFRESH
# Keep the values private.
# TOKEN is used for profile requests.
```

### Postman

```text
// Post-response script
const s = pm.response.json();
if (s.requiresPasswordChange ||
    s.requiresTwoFactor || !s.token) {
  throw Error("Finish sign-in");
}
pm.environment.set("token", s.token);
pm.environment.set(
  "refreshToken", s.refreshToken
);
```

### Selected actual training response

HTTP 201

```json
{
  "customer": {
    "sk": "6ac82b5a58e293f2e4d6635a",
    "datatype": "customer",
    "data": {
      "firstName": "Mira",
      "lastName": "Chen"
    }
  },
  "token": "[redacted]",
  "refreshToken": "[redacted]"
}
```

## Read the signed-in profile

token is the completed customer sign-in access token.

### TypeScript

```typescript
const path: string = "/client-data/profile";
const response = await fetch(base + path, {
  method: "GET",
  headers: { orgid,
    Authorization: `Bearer ${token}` },
});
if (!response.ok) throw Error(String(response.status));
const result = await response.json();
```

### JavaScript

```javascript
const path = "/client-data/profile";
const response = await fetch(base + path, {
  method: "GET",
  headers: { orgid,
    Authorization: `Bearer ${token}` },
});
if (!response.ok) throw Error(String(response.status));
const result = await response.json();
```

### Python

```python
import requests
path = "/client-data/profile"
response = requests.get(
  base + path,
  headers={"orgid": orgid,
    "Authorization": "Bearer " + token},
  timeout=30
)
response.raise_for_status()
result = response.json()
```

### curl

```bash
curl -sS -i -X GET \
  "$BASE/client-data/profile" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
GET {{base}}/client-data/profile
Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send the request.
Read the status and response body.
```

### Selected actual training response

HTTP 200

```json
{
  "sk": "6ac82b5a58e293f2e4d6635a",
  "datatype": "customer",
  "data": {
    "firstName": "Mira",
    "lastName": "Chen",
    "email": "[training email masked]"
  }
}
```

## Update supported profile fields

Permitted fields: firstName, lastName, phone. Send only the change.

### JSON request

```json
{
  "firstName": "Mira-Lin"
}
```

### TypeScript

```typescript
const path: string = "/client-data/profile";
const response = await fetch(base + path, {
  method: "PUT",
  headers: { orgid,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json" },
  body: JSON.stringify(body)
});
if (!response.ok) throw Error(String(response.status));
const result = await response.json();
```

### JavaScript

```javascript
const path = "/client-data/profile";
const response = await fetch(base + path, {
  method: "PUT",
  headers: { orgid,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json" },
  body: JSON.stringify(body)
});
if (!response.ok) throw Error(String(response.status));
const result = await response.json();
```

### Python

```python
import requests
path = "/client-data/profile"
response = requests.put(
  base + path,
  headers={"orgid": orgid,
    "Authorization": "Bearer " + token},
  json=body,
  timeout=30
)
response.raise_for_status()
result = response.json()
```

### curl

```bash
curl -sS -i -X PUT \
  "$BASE/client-data/profile" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
PUT {{base}}/client-data/profile
Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json
Body → raw → JSON
{
  "firstName": "Mira-Lin"
}
```

### Selected actual training response

HTTP 200

```json
{
  "sk": "6ac82b5a58e293f2e4d6635a",
  "datatype": "customer",
  "data": {
    "firstName": "Mira-Lin",
    "lastName": "Chen"
  }
}
```

## Read back the saved change

A fresh GET checks the persisted update, using the same session.

### TypeScript

```typescript
const path: string = "/client-data/profile";
const response = await fetch(base + path, {
  method: "GET",
  headers: { orgid,
    Authorization: `Bearer ${token}` },
});
if (!response.ok) throw Error(String(response.status));
const result = await response.json();
```

### JavaScript

```javascript
const path = "/client-data/profile";
const response = await fetch(base + path, {
  method: "GET",
  headers: { orgid,
    Authorization: `Bearer ${token}` },
});
if (!response.ok) throw Error(String(response.status));
const result = await response.json();
```

### Python

```python
import requests
path = "/client-data/profile"
response = requests.get(
  base + path,
  headers={"orgid": orgid,
    "Authorization": "Bearer " + token},
  timeout=30
)
response.raise_for_status()
result = response.json()
```

### curl

```bash
curl -sS -i -X GET \
  "$BASE/client-data/profile" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
GET {{base}}/client-data/profile
Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send the request.
Read the status and response body.
```

### Selected actual training response

HTTP 200

```json
{
  "sk": "6ac82b5a58e293f2e4d6635a",
  "datatype": "customer",
  "data": {
    "firstName": "Mira-Lin",
    "lastName": "Chen",
    "email": "[training email masked]"
  }
}
```

## Refresh and retry once

body.refresh_token uses refreshToken from the completed sign-in.

### JSON request

```json
{
  "refresh_token": "[refresh token]"
}
```

### TypeScript

```typescript
const path: string = "/profile/customer/refresh";
const response = await fetch(base + path, {
  method: "POST",
  headers: { orgid,
    "Content-Type": "application/json" },
  body: JSON.stringify(body)
});
if (!response.ok) throw Error(String(response.status));
const result = await response.json();
```

### JavaScript

```javascript
const path = "/profile/customer/refresh";
const response = await fetch(base + path, {
  method: "POST",
  headers: { orgid,
    "Content-Type": "application/json" },
  body: JSON.stringify(body)
});
if (!response.ok) throw Error(String(response.status));
const result = await response.json();
```

### Python

```python
import requests
path = "/profile/customer/refresh"
response = requests.post(
  base + path,
  headers={"orgid": orgid},
  json=body,
  timeout=30
)
response.raise_for_status()
result = response.json()
```

### curl

```bash
curl -sS -i -X POST \
  "$BASE/profile/customer/refresh" \
  -H "orgid: $ORG_ID" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
POST {{base}}/profile/customer/refresh
Headers
  orgid: {{orgid}}
  Content-Type: application/json
Body → raw → JSON
{
  "refresh_token": "{{refreshToken}}"
}
```

### Selected actual training response

HTTP 201

```json
{
  "user": {
    "sk": "6ac82b5a58e293f2e4d6635a",
    "datatype": "customer",
    "data": {
      "firstName": "Mira-Lin",
      "lastName": "Chen"
    }
  },
  "token": "[redacted]",
  "refreshToken": "[redacted]"
}
```

Save the new access token before retrying the protected request.

### JSON request

```json
{
  "refresh_token": "[refresh token]"
}
```

### TypeScript

```typescript
token = result.token;
refreshToken = result.refreshToken;
```

### JavaScript

```javascript
token = result.token;
refreshToken = result.refreshToken;
```

### Python

```python
token = result["token"]
refresh_token = result["refreshToken"]
```

### curl

```bash
# Copy token from the refresh JSON.
read -rs -p "New access token: " TOKEN
# Use TOKEN on the next profile GET.
```

### Postman

```text
const s = pm.response.json();
pm.environment.set("token", s.token);
pm.environment.set(
  "refreshToken", s.refreshToken
);
```

### Selected actual training response

HTTP 201

```json
{
  "user": {
    "sk": "6ac82b5a58e293f2e4d6635a",
    "datatype": "customer",
    "data": {
      "firstName": "Mira-Lin",
      "lastName": "Chen"
    }
  },
  "token": "[redacted]",
  "refreshToken": "[redacted]"
}
```

First save refresh result.token as token (curl TOKEN; Postman token).

### TypeScript

```typescript
const path: string = "/client-data/profile";
const response = await fetch(base + path, {
  method: "GET",
  headers: { orgid,
    Authorization: `Bearer ${token}` },
});
if (!response.ok) throw Error(String(response.status));
const result = await response.json();
```

### JavaScript

```javascript
const path = "/client-data/profile";
const response = await fetch(base + path, {
  method: "GET",
  headers: { orgid,
    Authorization: `Bearer ${token}` },
});
if (!response.ok) throw Error(String(response.status));
const result = await response.json();
```

### Python

```python
import requests
path = "/client-data/profile"
response = requests.get(
  base + path,
  headers={"orgid": orgid,
    "Authorization": "Bearer " + token},
  timeout=30
)
response.raise_for_status()
result = response.json()
```

### curl

```bash
curl -sS -i -X GET \
  "$BASE/client-data/profile" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
GET {{base}}/client-data/profile
Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send the request.
Read the status and response body.
```

### Selected actual training response

HTTP 200

```json
{
  "sk": "6ac82b5a58e293f2e4d6635a",
  "datatype": "customer",
  "data": {
    "firstName": "Mira-Lin",
    "lastName": "Chen",
    "email": "[training email masked]"
  }
}
```

## Recover a failed request

Deliberate missing-org example; the bearer is valid.

### TypeScript

```typescript
const path: string = "/client-data/profile";
const response = await fetch(base + path, {
  method: "GET",
  headers: { Authorization: `Bearer ${token}` },
});
const result = await response.text();
console.log(response.status, result);
```

### JavaScript

```javascript
const path = "/client-data/profile";
const response = await fetch(base + path, {
  method: "GET",
  headers: { Authorization: `Bearer ${token}` },
});
const result = await response.text();
console.log(response.status, result);
```

### Python

```python
import requests
path = "/client-data/profile"
response = requests.get(
  base + path,
  headers={"Authorization": "Bearer " + token},
  timeout=30
)
print(response.status_code)
print(response.text)
```

### curl

```bash
curl -sS -i -X GET \
  "$BASE/client-data/profile" \
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
GET {{base}}/client-data/profile
Headers
  Authorization: Bearer {{token}}

Send the request.
Read the status and response body.
```

### Selected actual training response

HTTP 404

```json
"Not Found"
```

Restore the same orgid; reuse the same valid bearer.

### TypeScript

```typescript
const path: string = "/client-data/profile";
const response = await fetch(base + path, {
  method: "GET",
  headers: { orgid,
    Authorization: `Bearer ${token}` },
});
if (!response.ok) throw Error(String(response.status));
const result = await response.json();
```

### JavaScript

```javascript
const path = "/client-data/profile";
const response = await fetch(base + path, {
  method: "GET",
  headers: { orgid,
    Authorization: `Bearer ${token}` },
});
if (!response.ok) throw Error(String(response.status));
const result = await response.json();
```

### Python

```python
import requests
path = "/client-data/profile"
response = requests.get(
  base + path,
  headers={"orgid": orgid,
    "Authorization": "Bearer " + token},
  timeout=30
)
response.raise_for_status()
result = response.json()
```

### curl

```bash
curl -sS -i -X GET \
  "$BASE/client-data/profile" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
GET {{base}}/client-data/profile
Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send the request.
Read the status and response body.
```

### Selected actual training response

HTTP 200

```json
{
  "sk": "6ac82b5a58e293f2e4d6635a",
  "datatype": "customer",
  "data": {
    "firstName": "Mira-Lin",
    "lastName": "Chen",
    "email": "[training email masked]"
  }
}
```
