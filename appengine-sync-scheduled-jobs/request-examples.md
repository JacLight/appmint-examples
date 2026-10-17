# AppEngine Scheduling and Sync APIs — complete requests

Use your own AppEngine address, organization and authorized staff token. Responses are from the controlled training deployment. Five client code formats are equivalent contract examples, not five independent executions. JSON bodies are the sixth format. Do not send the same create operation from every language. Choose one client.

Observed JSON contains historic timestamps. Use make-schedule.py or the Postman pre-request script to generate future dates; replace target and organization IDs. Only the isolated schedule controls were executed; provider settings and triggers are source-reviewed examples.

## Client setup

Set base to your assigned AppEngine address; route to the exact route printed for the current example; orgId to your organization ID; token to your authorized staff token. In TypeScript/JavaScript, headers = {orgid: orgId, Authorization: `Bearer ${token}`, "Content-Type": "application/json"}; body is the displayed JSON object. In Python use the same values in a dictionary. In curl set BASE, ORG_ID and TOKEN in your local session and place only the JSON body in request.json. Postman uses the equivalent environment variables and raw JSON body. Do not place secrets in downloaded files.

Use the bundled make-schedule.py to produce a current simple or bounded cron request. The bundled Postman pre-request script sets futureStart and futureEnd. Historical observed bodies are evidence only.

## 02-sync-info

GET `/sync`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers, timeout=30
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
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```

Observed HTTP 200. Full sanitized evidence: 02-sync-info.json.

## 03-scheduled-jobs

GET `/jobs/scheduled`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers, timeout=30
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
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```

Observed HTTP 200. Full sanitized evidence: 03-scheduled-jobs.json.

## 04-sync-platforms

GET `/sync/platforms`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers, timeout=30
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
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```

Observed HTTP 200. Full sanitized evidence: 04-sync-platforms.json.

## 05-org-queues

GET `/queue-manager/org-schedules`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers, timeout=30
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
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```

Observed HTTP 200. Full sanitized evidence: 05-org-queues.json.

## 06-create-collection

POST `/repository/create`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
{
  "datatype": "collection",
  "isNew": true,
  "data": {
    "name": "schedule_marks_1010",
    "title": "Schedule markers \u2014 API course",
    "schema": {
      "type": "object",
      "properties": {
        "reference": {
          "type": "string",
          "title": "Reference"
        },
        "status": {
          "type": "string",
          "title": "Status",
          "enum": [
            "waiting",
            "ready",
            "finished",
            "manual"
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

Observed HTTP 201. Full sanitized evidence: 06-create-collection.json.

## 07-create-target

POST `/repository/create`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
{
  "datatype": "schedule_marks_1010",
  "isNew": true,
  "data": {
    "reference": "SCHEDULE-1010-A",
    "status": "waiting"
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

Observed HTTP 201. Full sanitized evidence: 07-create-target.json.

## 08-create-simple-schedule

POST `/repository/create`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
{
  "datatype": "schedule",
  "isNew": true,
  "data": {
    "name": "course-status-window-1010",
    "title": "Course status window \u2014 API course",
    "type": "simple",
    "status": "active",
    "target": [
      {
        "datatype": "schedule_marks_1010",
        "id": "6aca1344f5d6b011f6e12028"
      }
    ],
    "start": {
      "date": "2026-10-10T10:29:20.490Z",
      "action": "update-status",
      "actionArgs": "ready"
    },
    "end": {
      "date": "2026-10-10T10:30:20.490Z",
      "action": "update-status",
      "actionArgs": "finished"
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

Observed HTTP 201. Full sanitized evidence: 08-create-simple-schedule.json.

## 09-queued-simple

GET `/queue-manager/org-schedules`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers, timeout=30
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
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```

Observed HTTP 200. Full sanitized evidence: 09-queued-simple.json.

## 10-end-target

GET `/repository/get/schedule_marks_1010/6aca1344f5d6b011f6e12028`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers, timeout=30
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
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```

Observed HTTP 200. Full sanitized evidence: 10-end-target.json.

## 10-start-target

GET `/repository/get/schedule_marks_1010/6aca1344f5d6b011f6e12028`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers, timeout=30
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
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```

Observed HTTP 200. Full sanitized evidence: 10-start-target.json.

## 11-end-schedule

GET `/repository/get/schedule/6aca1344f5d6b011f6e12029`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers, timeout=30
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
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```

Observed HTTP 200. Full sanitized evidence: 11-end-schedule.json.

## 11-start-schedule

GET `/repository/get/schedule/6aca1344f5d6b011f6e12029`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers, timeout=30
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
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```

Observed HTTP 200. Full sanitized evidence: 11-start-schedule.json.

## 12-end-runs

GET `/queue-manager/schedule-runs/6aca1344f5d6b011f6e12029?limit=10`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers, timeout=30
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
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```

Observed HTTP 200. Full sanitized evidence: 12-end-runs.json.

## 12-start-runs

GET `/queue-manager/schedule-runs/6aca1344f5d6b011f6e12029?limit=10`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers, timeout=30
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
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```

Observed HTTP 200. Full sanitized evidence: 12-start-runs.json.

## 13-invalid-past

POST `/repository/create`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
{
  "datatype": "schedule",
  "isNew": true,
  "data": {
    "name": "course-invalid-past",
    "type": "simple",
    "status": "active",
    "target": [
      {
        "datatype": "schedule_marks_1010",
        "id": "6aca1344f5d6b011f6e12028"
      }
    ],
    "start": {
      "date": "2020-01-01T00:00:00.000Z",
      "action": "update-status",
      "actionArgs": "ready"
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

Observed HTTP 400. Full sanitized evidence: 13-invalid-past.json.

## 14-invalid-target

POST `/repository/create`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
{
  "datatype": "schedule",
  "isNew": true,
  "data": {
    "name": "course-invalid-target",
    "type": "simple",
    "status": "stop",
    "start": {
      "date": "2026-10-11T10:30:30.387Z",
      "action": "update-status",
      "actionArgs": "ready"
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

Observed HTTP 400. Full sanitized evidence: 14-invalid-target.json.

## 15-create-control-target

POST `/repository/create`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
{
  "datatype": "schedule_marks_1010",
  "isNew": true,
  "data": {
    "reference": "SCHEDULE-1010-B",
    "status": "waiting"
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

Observed HTTP 201. Full sanitized evidence: 15-create-control-target.json.

## 16-create-stopped

POST `/repository/create`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
{
  "datatype": "schedule",
  "isNew": true,
  "data": {
    "name": "course-controls-1010",
    "title": "Course controls \u2014 API course",
    "type": "simple",
    "status": "stop",
    "target": [
      {
        "datatype": "schedule_marks_1010",
        "id": "6aca13c6f5d6b011f6e12051"
      }
    ],
    "start": {
      "date": "2026-10-10T12:30:30.387Z",
      "action": "update-status",
      "actionArgs": "manual"
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

Observed HTTP 201. Full sanitized evidence: 16-create-stopped.json.

## 17-start

POST `/schedule-control/start/6aca13c6f5d6b011f6e12052`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "POST", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "POST", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "POST", base + route, headers=headers, timeout=30
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
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```

Observed HTTP 201. Full sanitized evidence: 17-start.json.

## 18-stop

POST `/schedule-control/stop/6aca13c6f5d6b011f6e12052`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "POST", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "POST", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "POST", base + route, headers=headers, timeout=30
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
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```

Observed HTTP 201. Full sanitized evidence: 18-stop.json.

## 19-reschedule

POST `/repository/update-partial/schedule/6aca13c6f5d6b011f6e12052`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
{
  "data.start.date": "2026-10-10T13:30:30.387Z"
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

Observed HTTP 201. Full sanitized evidence: 19-reschedule.json.

## 20-start-rescheduled

POST `/schedule-control/start/6aca13c6f5d6b011f6e12052`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "POST", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "POST", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "POST", base + route, headers=headers, timeout=30
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
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```

Observed HTTP 201. Full sanitized evidence: 20-start-rescheduled.json.

## 21-run-now

POST `/schedule-control/run/6aca13c6f5d6b011f6e12052`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "POST", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "POST", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "POST", base + route, headers=headers, timeout=30
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
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```

Observed HTTP 201. Full sanitized evidence: 21-run-now.json.

## 22-control-target

GET `/repository/get/schedule_marks_1010/6aca13c6f5d6b011f6e12051`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers, timeout=30
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
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```

Observed HTTP 200. Full sanitized evidence: 22-control-target.json.

## 23-control-runs

GET `/queue-manager/schedule-runs/6aca13c6f5d6b011f6e12052`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers, timeout=30
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
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```

Observed HTTP 200. Full sanitized evidence: 23-control-runs.json.

## 24-cancel-start

POST `/schedule-control/cancel-job`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
{
  "jobId": "video-lab-mut4jkwd-6aca13c6f5d6b011f6e12052-start"
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

Observed HTTP 201. Full sanitized evidence: 24-cancel-start.json.

## 25-cancelled-schedule

GET `/repository/get/schedule/6aca13c6f5d6b011f6e12052`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers, timeout=30
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
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```

Observed HTTP 200. Full sanitized evidence: 25-cancelled-schedule.json.

## 26-create-cron-target

POST `/repository/create`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
{
  "datatype": "schedule_marks_1010",
  "isNew": true,
  "data": {
    "reference": "SCHEDULE-1010-C",
    "status": "waiting"
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

Observed HTTP 201. Full sanitized evidence: 26-create-cron-target.json.

## 27-create-cron

POST `/repository/create`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
{
  "datatype": "schedule",
  "isNew": true,
  "data": {
    "name": "course-cron-1010",
    "title": "Course bounded repeat \u2014 API course",
    "type": "cron",
    "status": "active",
    "target": [
      {
        "datatype": "schedule_marks_1010",
        "id": "6aca13c6f5d6b011f6e12058"
      }
    ],
    "cron": {
      "value": "* * * * *",
      "timezone": "America/Chicago",
      "action": "update-status",
      "actionArgs": "ready"
    },
    "end": {
      "date": "2026-10-10T10:32:10.387Z"
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

Observed HTTP 201. Full sanitized evidence: 27-create-cron.json.

## 28-cron-queue

GET `/queue-manager/org-schedules`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers, timeout=30
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
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```

Observed HTTP 200. Full sanitized evidence: 28-cron-queue.json.

## 29-cron-target

GET `/repository/get/schedule_marks_1010/6aca13c6f5d6b011f6e12058`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers, timeout=30
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
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```

Observed HTTP 200. Full sanitized evidence: 29-cron-target.json.

## 30-cron-runs

GET `/queue-manager/schedule-runs/6aca13c6f5d6b011f6e12059`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers, timeout=30
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
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```

Observed HTTP 200. Full sanitized evidence: 30-cron-runs.json.

## 31-cron-final

GET `/repository/get/schedule/6aca13c6f5d6b011f6e12059`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers, timeout=30
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
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```

Observed HTTP 200. Full sanitized evidence: 31-cron-final.json.

## 32-cron-final-queue

GET `/queue-manager/org-schedules`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers, timeout=30
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
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```

Observed HTTP 200. Full sanitized evidence: 32-cron-final-queue.json.

## 33-sync-status

GET `/sync/status/facebook`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers, timeout=30
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
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```

Observed HTTP 200. Full sanitized evidence: 33-sync-status.json.

## 34-existing-job-history

GET `/jobs?kind=scheduled:social-sync-content`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers, timeout=30
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
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```

Observed HTTP 200. Full sanitized evidence: 34-existing-job-history.json.

## 35-control-queue-final

GET `/queue-manager/org-schedules`

Headers: orgid and Bearer staff token; Content-Type: application/json for JSON bodies.

### JSON request

```json
null
```

### TypeScript

```typescript
const response: Response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### JavaScript

```javascript
const response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

### Python

```python
import requests
response = requests.request(
  "GET", base + route, headers=headers, timeout=30
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
  -H "Authorization: Bearer $TOKEN"
```

### Postman

```text
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```

Observed HTTP 200. Full sanitized evidence: 35-control-queue-final.json.