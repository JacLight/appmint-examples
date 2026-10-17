# AppEngine Backend as a Service — complete requests

Use your own AppEngine address, organization and authorized staff token. Responses are from the controlled training deployment. Five client code formats are equivalent contract examples, not five independent executions. JSON bodies are the sixth format. Do not send the same create operation from every language. Choose one client.

Multipart file upload uses a binary file part, not JSON. The complete procedure is in the written course.

## 02-create-collection

POST `/repository/create`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
{
  "datatype": "collection",
  "isNew": true,
  "data": {
    "name": "baas_submissions_1010",
    "title": "App submissions \u2014 Backend course",
    "enableVersioning": true,
    "schema": {
      "type": "object",
      "properties": {
        "reference": {
          "type": "string",
          "title": "Reference"
        },
        "title": {
          "type": "string",
          "title": "Title"
        },
        "attachmentPath": {
          "type": "string",
          "title": "Attachment path"
        },
        "status": {
          "type": "string",
          "title": "Status",
          "enum": [
            "new",
            "reviewed"
          ]
        }
      },
      "required": [
        "reference"
      ]
    }
  }
}
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

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

### curl

```bash
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

Observed HTTP 201. Full sanitized evidence: 02-create-collection.json.

## 02-find-collection

GET `/repository/collections/baas_submissions_1010?enriched=false`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers,
  json=body, timeout=30
)
result = (response.json()
  if response.content else None)
print(response.status_code, result)
```

### curl

```bash
curl -sS -i -X GET \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

Observed HTTP 200. Full sanitized evidence: 02-find-collection.json.

## 02-read-collection

GET `/repository/collections/baas_submissions_1010?enriched=false`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers,
  json=body, timeout=30
)
result = (response.json()
  if response.content else None)
print(response.status_code, result)
```

### curl

```bash
curl -sS -i -X GET \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

Observed HTTP 200. Full sanitized evidence: 02-read-collection.json.

## 03-create-collection

POST `/repository/create`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
{
  "datatype": "collection",
  "isNew": true,
  "data": {
    "name": "baas_receipts_1010",
    "title": "Event receipts \u2014 Backend course",
    "enableVersioning": true,
    "schema": {
      "type": "object",
      "properties": {
        "submissionId": {
          "type": "string",
          "title": "Submission ID"
        },
        "reference": {
          "type": "string",
          "title": "Reference"
        },
        "message": {
          "type": "string",
          "title": "Message"
        }
      },
      "required": [
        "reference"
      ]
    }
  }
}
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

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

### curl

```bash
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

Observed HTTP 201. Full sanitized evidence: 03-create-collection.json.

## 03-find-collection

GET `/repository/collections/baas_receipts_1010?enriched=false`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers,
  json=body, timeout=30
)
result = (response.json()
  if response.content else None)
print(response.status_code, result)
```

### curl

```bash
curl -sS -i -X GET \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

Observed HTTP 200. Full sanitized evidence: 03-find-collection.json.

## 03-read-collection

GET `/repository/collections/baas_receipts_1010?enriched=false`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers,
  json=body, timeout=30
)
result = (response.json()
  if response.content else None)
print(response.status_code, result)
```

### curl

```bash
curl -sS -i -X GET \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

Observed HTTP 200. Full sanitized evidence: 03-read-collection.json.

## 04-existing-automation

POST `/repository/find/automation`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
{
  "query": {
    "data.name": "Backend course \u2014 submission receipt"
  },
  "options": {
    "page": 1,
    "pageSize": 5
  }
}
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

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

### curl

```bash
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

Observed HTTP 201. Full sanitized evidence: 04-existing-automation.json.

## 05-create-automation

POST `/automation`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
{
  "name": "Backend course \u2014 submission receipt",
  "trigger": {
    "type": "data_created",
    "config": {
      "datatype": "baas_submissions_1010"
    }
  },
  "actions": [
    {
      "type": "create_data",
      "config": {
        "datatype": "baas_receipts_1010",
        "data": {
          "submissionId": "{{dataId}}",
          "reference": "{{data.reference}}",
          "message": "AppEngine event processed"
        }
      }
    }
  ]
}
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

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

### curl

```bash
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

Observed HTTP 201. Full sanitized evidence: 05-create-automation.json.

## 07-manual-test

POST `/automation/6ac9e9a0f5d6b011f6e11a13/execute`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
{
  "variables": {
    "dataId": "manual-preview",
    "data": {
      "reference": "PREVIEW-1010"
    }
  }
}
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

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

### curl

```bash
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

Observed HTTP 201. Full sanitized evidence: 07-manual-test.json.

## 08-manual-receipt

POST `/repository/find/baas_receipts_1010`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
{
  "query": {
    "data.reference": "PREVIEW-1010"
  },
  "options": {
    "page": 1,
    "pageSize": 10
  }
}
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

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

### curl

```bash
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

Observed HTTP 201. Full sanitized evidence: 08-manual-receipt.json.

## 09-start-automation

POST `/automation/start/6ac9e9a0f5d6b011f6e11a13`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
{}
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

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

### curl

```bash
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

Observed HTTP 201. Full sanitized evidence: 09-start-automation.json.

## 10-create-submission

POST `/repository/create`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
{
  "datatype": "baas_submissions_1010",
  "isNew": true,
  "data": {
    "reference": "BAAS-1010-A",
    "title": "Application submission with attachment",
    "attachmentPath": "video-lab-mut4jkwd/course-baas-1010/submission-notes.txt",
    "status": "new"
  }
}
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

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

### curl

```bash
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

Observed HTTP 201. Full sanitized evidence: 10-create-submission.json.

## 11-event-receipt

POST `/repository/find/baas_receipts_1010`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
{
  "query": {
    "data.submissionId": "6ac9e9c6f5d6b011f6e11a28"
  },
  "options": {
    "page": 1,
    "pageSize": 10
  }
}
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

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

### curl

```bash
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

Observed HTTP 201. Full sanitized evidence: 11-event-receipt.json.

## 12-execution-runs

GET `/automation/6ac9e9a0f5d6b011f6e11a13/runs`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers,
  json=body, timeout=30
)
result = (response.json()
  if response.content else None)
print(response.status_code, result)
```

### curl

```bash
curl -sS -i -X GET \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

Observed HTTP 200. Full sanitized evidence: 12-execution-runs.json.

## 13-submission-readback

GET `/repository/get/baas_submissions_1010/6ac9e9c6f5d6b011f6e11a28`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers,
  json=body, timeout=30
)
result = (response.json()
  if response.content else None)
print(response.status_code, result)
```

### curl

```bash
curl -sS -i -X GET \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

Observed HTTP 200. Full sanitized evidence: 13-submission-readback.json.

## 14-stop-automation

POST `/automation/stop/6ac9e9a0f5d6b011f6e11a13`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
{
  "reason": "Controlled course event proof complete"
}
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

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

### curl

```bash
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

Observed HTTP 201. Full sanitized evidence: 14-stop-automation.json.

## 15-unauthenticated-read

GET `/repository/get/baas_submissions_1010/6ac9e9c6f5d6b011f6e11a28`

Headers: orgid only. This is the deliberate unauthenticated refusal test.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers,
  json=body, timeout=30
)
result = (response.json()
  if response.content else None)
print(response.status_code, result)
```

### curl

```bash
curl -sS -i -X GET \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

Observed HTTP 401. Full sanitized evidence: 15-unauthenticated-read.json.

## 16-sign-attachment

POST `/repository/file/signurl`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
{
  "location": "video-lab-mut4jkwd/course-baas-1010/submission-notes.txt",
  "options": {
    "expiry": 900
  }
}
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

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

### curl

```bash
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

Observed HTTP 201. Full sanitized evidence: 16-sign-attachment.json.

## 17-start-update-check

POST `/automation/start/6ac9e9a0f5d6b011f6e11a13`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
{}
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

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

### curl

```bash
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

Observed HTTP 201. Full sanitized evidence: 17-start-update-check.json.

## 18-update-submission

POST `/repository/update-partial/baas_submissions_1010/6ac9e9c6f5d6b011f6e11a28`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
{
  "data.status": "reviewed"
}
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

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

### curl

```bash
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

Observed HTTP 201. Full sanitized evidence: 18-update-submission.json.

## 19-updated-submission

GET `/repository/get/baas_submissions_1010/6ac9e9c6f5d6b011f6e11a28`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers,
  json=body, timeout=30
)
result = (response.json()
  if response.content else None)
print(response.status_code, result)
```

### curl

```bash
curl -sS -i -X GET \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

Observed HTTP 200. Full sanitized evidence: 19-updated-submission.json.

## 20-receipt-after-update

POST `/repository/find/baas_receipts_1010`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
{
  "query": {
    "data.submissionId": "6ac9e9c6f5d6b011f6e11a28"
  },
  "options": {
    "page": 1,
    "pageSize": 10
  }
}
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

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

### curl

```bash
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

Observed HTTP 201. Full sanitized evidence: 20-receipt-after-update.json.

## 21-runs-after-update

GET `/automation/6ac9e9a0f5d6b011f6e11a13/runs`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers,
  json=body, timeout=30
)
result = (response.json()
  if response.content else None)
print(response.status_code, result)
```

### curl

```bash
curl -sS -i -X GET \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

Observed HTTP 200. Full sanitized evidence: 21-runs-after-update.json.

## 22-event-execution

GET `/automation/executions/exec_1791617478031_65seflj0f`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers,
  json=body, timeout=30
)
result = (response.json()
  if response.content else None)
print(response.status_code, result)
```

### curl

```bash
curl -sS -i -X GET \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

Observed HTTP 200. Full sanitized evidence: 22-event-execution.json.

## 23-stop-final

POST `/automation/stop/6ac9e9a0f5d6b011f6e11a13`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
{
  "reason": "Course finished; preserve records only"
}
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

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

### curl

```bash
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

Observed HTTP 201. Full sanitized evidence: 23-stop-final.json.

## 24-final-status

GET `/automation/status/6ac9e9a0f5d6b011f6e11a13`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers,
  json=body, timeout=30
)
result = (response.json()
  if response.content else None)
print(response.status_code, result)
```

### curl

```bash
curl -sS -i -X GET \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

Observed HTTP 200. Full sanitized evidence: 24-final-status.json.

## 25-built-in-customer-schema

GET `/repository/collections/customer?enriched=false`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers,
  json=body, timeout=30
)
result = (response.json()
  if response.content else None)
print(response.status_code, result)
```

### curl

```bash
curl -sS -i -X GET \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

Observed HTTP 200. Full sanitized evidence: 25-built-in-customer-schema.json.

## 26-built-in-products-schema

GET `/repository/collections/sf_product?enriched=false`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers,
  json=body, timeout=30
)
result = (response.json()
  if response.content else None)
print(response.status_code, result)
```

### curl

```bash
curl -sS -i -X GET \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

Observed HTTP 200. Full sanitized evidence: 26-built-in-products-schema.json.