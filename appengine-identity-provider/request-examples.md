# AppEngine Identity Provider examples

These examples distinguish actual observed public metadata from source-verified configuration recipes. No registration, token exchange or signed-in relying-app result has been verified in this training run.

Obtain your exact AppEngine API address from the administrator. The issuer comes from that deployment's discovery document and must match your OIDC library's configured issuer. Never replace the issuer string merely to match a desired hostname. Public metadata needs no bearer token. The training transport origin is substituted explicitly in the sanitized responses; the advertised issuer is preserved.

Start with a configured issuer and a registered relying application. Keep the client ID, exact callback and allowed organizations together. The proposed public-client registration has no client secret; access.orgs identifies the organizations allowed to sign in. Replace the reserved .test callback with an exact callback served by your relying application. No wildcard or fragment.

The six client formats in the course share base and route. TypeScript/JavaScript use fetch, Python uses requests, curl uses BASE/ROUTE, Postman uses equivalent environment variables. JSON is the response for OIDC discovery; SAML metadata is XML. The samples show selected fields; full sanitized observed responses are provided separately.

The companion's complete oidc-lab.mjs uses openid-client and validates state, nonce, PKCE, signature and token claims before setting a local session. It remains unexecuted without an configured client. Do not describe merely decoding a JWT as authenticating a person. ID tokens and issuer access tokens are not business API bearer credentials.


## Read the issuer discovery document

### GET /idp/.well-known/openid-configuration

Observed discovery. Transport-derived training addresses are explicitly substituted; issuer value is preserved.

**TypeScript**

```typescript
const response: Response = await fetch(base + route);
const result = await response.json();
console.log(response.status, result);
```

**JavaScript**

```javascript
const response = await fetch(base + route);
const result = await response.json();
console.log(response.status, result);
```

**Python**

```python
import requests
response = requests.get(base + route,
                        timeout=30)
print(response.status_code)
print(response.json())
```

**curl**

```sh
curl -sS -i "$BASE$ROUTE"
```

**Postman**

```text
GET {{base}}{{route}}

Authorization: No Auth
Body: none

Send; inspect status and response.
```

**Selected JSON/XML fields — explanatory excerpt**

```json
{
  "issuer": "https://proxy.appmint.io/idp",
  "authorization_endpoint": "[training API address]/idp/oauth/authorize",
  "token_endpoint": "[training API address]/idp/oauth/token",
  "userinfo_endpoint": "[training API address]/idp/oauth/userinfo",
  "jwks_uri": "[training API address]/idp/.well-known/jwks.json"
}
```

### GET /idp/.well-known/jwks.json

Public verification key metadata only. Full modulus is in the exact downloadable JWKS response.

**TypeScript**

```typescript
const response: Response = await fetch(base + route);
const result = await response.json();
console.log(response.status, result);
```

**JavaScript**

```javascript
const response = await fetch(base + route);
const result = await response.json();
console.log(response.status, result);
```

**Python**

```python
import requests
response = requests.get(base + route,
                        timeout=30)
print(response.status_code)
print(response.json())
```

**curl**

```sh
curl -sS -i "$BASE$ROUTE"
```

**Postman**

```text
GET {{base}}{{route}}

Authorization: No Auth
Body: none

Send; inspect status and response.
```

**Selected JSON/XML fields — explanatory excerpt**

```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "WHHBoZrgpA-jKQPPUdLt5r5VOey2uI3E3Ly1Jd3DpbA",
      "alg": "RS256",
      "e": "AQAB"
    }
  ]
}
```

## Connect a SAML service provider

### POST /idp/clients

Configuration reference: obtain these values from the relying application. No SAML client was registered in this run.

**TypeScript**

```typescript
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

**JavaScript**

```javascript
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

**Python**

```python
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
result = (response.json()
  if response.content else None)
print(response.status_code, result)
```

**curl**

```sh
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

**Postman**

```text
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

**Selected JSON/XML fields — explanatory excerpt**

```json
{
  "name": "AppEngine SAML course",
  "protocol": "saml",
  "access": {
    "orgs": [
      "YOUR_ORGANIZATION_ID"
    ],
    "userTypes": [
      "user"
    ]
  },
  "saml": {
    "entityId": "https://wiki.example.test/saml/metadata",
    "acsUrl": "https://wiki.example.test/saml/acs",
    "nameIdFormat": "persistent"
  }
}
```

### GET /idp/saml/metadata

Binding namespace prefix abbreviated; complete public XML is included in the companion.

**TypeScript**

```typescript
const response: Response = await fetch(base + route);
const result = await response.text();
console.log(response.status, result);
```

**JavaScript**

```javascript
const response = await fetch(base + route);
const result = await response.text();
console.log(response.status, result);
```

**Python**

```python
import requests
response = requests.get(base + route,
                        timeout=30)
print(response.status_code)
print(response.text)
```

**curl**

```sh
curl -sS -i "$BASE$ROUTE"
```

**Postman**

```text
GET {{base}}{{route}}

Authorization: No Auth
Body: none

Send; inspect status and response.
```

**Selected JSON/XML fields — explanatory excerpt**

```xml
<SingleSignOnService
  Binding="HTTP-Redirect"
  Location="https://proxy.appmint.io/idp/saml/sso"/>

<SingleSignOnService
  Binding="HTTP-POST"
  Location="https://proxy.appmint.io/idp/saml/sso"/>
```