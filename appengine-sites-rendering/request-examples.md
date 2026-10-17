# AppEngine Sites and Pages: complete examples

The five language/client panels share the exact route, headers and JSON request body. JSON is the sixth view. Use your own authorized identity. The observed response fixtures are local rehearsal evidence, not a deployed endpoint.

## Prepare the organization and staff client

### POST /repository/find/site

Linked prerequisites show the complete staff sign-in; use your own organization.

```json
{
  "studio": "https://studio.appmint.io",
  "course": "Database & Repository APIs",
  "chapter": 2
}
```

### POST /repository/find/site

These are request headers; placeholders are deliberately not working credentials.

```json
{
  "orgid": "YOUR_ORGANIZATION_ID",
  "Authorization": "Bearer YOUR_STAFF_TOKEN",
  "Content-Type": "application/json"
}
```

### POST /repository/find/site

Source-reviewed access requirements; never put a staff credential in a public page.

```json
{
  "editContent": "Content permissions",
  "createSite": "Content create + admin role",
  "linkFeature": "Content create + admin role"
}
```

## Select a site and understand creation

### GET /site/get-site/vidsite/<SITE_HOST>

Existing training site; these exact settings govern the following page exercise.

```json
{
  "data": {
    "name": "vidsite",
    "title": "vidsite",
    "homePage": "landing-page",
    "publishedPagesOnly": false
  }
}
```

### POST /site/create

Configuration example only. Optional values may be omitted. No create request was sent.

```json
{
  "name": "your-site",
  "title": "Your Site",
  "homePage": "home",
  "template": "YOUR_TEMPLATE_IF_USED",
  "domainName": "YOUR_DOMAIN_IF_USED"
}
```

**TypeScript**

```ts
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

**JavaScript**

```js
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

**Python**

```py
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

```
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### GET /site/get-site-host-mappings/vidsite

Observed mapping response. <SITE_HOST> replaces the local rehearsal hostname; it is not a public deployment claim.

```json
{
  "mapping": { "site": "vidsite", "hostname": "<SITE_HOST>" }
}
```

## Create the page record and content record

### PUT /repository/create

The complete article body is in the downloadable request JSON.

```json
{
  "datatype": "post",
  "data": {
    "title": "A calmer room starts with light",
    "name": "room-lighting-1010",
    "slug": "room-lighting-1010",
    "summary": "Three ways to make a room feel brighter, without changing its footprint."
  }
}
```

**TypeScript**

```ts
const response: Response = await fetch(base + route, {
  method: "PUT", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

**JavaScript**

```js
const response = await fetch(base + route, {
  method: "PUT", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

**Python**

```py
import requests
response = requests.request(
  "PUT", base + route, headers=headers,
  json=body, timeout=30
)
result = (response.json()
  if response.content else None)
print(response.status_code, result)
```

**curl**

```sh
curl -sS -i -X PUT \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

**Postman**

```
PUT {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### PUT /repository/create

Use the full supplied HTML, not the displayed abbreviation. Final page uses the existing vidsite.

```json
{
  "datatype": "page",
  "data": {
    "site": "vidsite",
    "name": "journal-sites1010",
    "slug": "journal-sites1010",
    "title": "Cedar & Form Journal",
    "datatype": "post",
    "html": "<complete journal.html>"
  }
}
```

**TypeScript**

```ts
const response: Response = await fetch(base + route, {
  method: "PUT", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

**JavaScript**

```js
const response = await fetch(base + route, {
  method: "PUT", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

**Python**

```py
import requests
response = requests.request(
  "PUT", base + route, headers=headers,
  json=body, timeout=30
)
result = (response.json()
  if response.content else None)
print(response.status_code, result)
```

**curl**

```sh
curl -sS -i -X PUT \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

**Postman**

```
PUT {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### PUT /repository/create

Outer datatype chooses the page collection; data.datatype configures attached content.

```json
{
  "datatype": "page",
  "data": {
    "site": "vidsite",
    "name": "journal-sites1010",
    "slug": "journal-sites1010",
    "title": "Cedar & Form Journal",
    "datatype": "post",
    "html": "<complete journal.html>"
  }
}
```

**TypeScript**

```ts
const response: Response = await fetch(base + route, {
  method: "PUT", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

**JavaScript**

```js
const response = await fetch(base + route, {
  method: "PUT", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

**Python**

```py
import requests
response = requests.request(
  "PUT", base + route, headers=headers,
  json=body, timeout=30
)
result = (response.json()
  if response.content else None)
print(response.status_code, result)
```

**curl**

```sh
curl -sS -i -X PUT \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

**Postman**

```
PUT {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### GET /repository/get/page/6aca144df5d6b011f6e12081

Fresh saved-record readback. Keep the returned page ID for publish and unpublish.

```json
{
  "sk": "6aca144df5d6b011f6e12081",
  "state": "published",
  "data": {
    "name": "journal-sites1010",
    "site": "vidsite",
    "title": "Cedar & Form Journal",
    "datatype": "post"
  }
}
```

## Read the page and its attached post

### GET /site/page/<SITE_HOST>/vidsite/journal-sites1010/room-lighting-1010

The shown hostname is a placeholder for your configured site mapping.

```json
{
  "hostname": "<SITE_HOST>",
  "siteName": "vidsite",
  "path": "journal-sites1010/room-lighting-1010"
}
```

**TypeScript**

```ts
const response: Response = await fetch(base + route, {
  method: "GET", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

**JavaScript**

```js
const response = await fetch(base + route, {
  method: "GET", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

**Python**

```py
import requests
response = requests.request(
  "GET", base + route, headers=headers,
  json=body, timeout=30
)
result = (response.json()
  if response.content else None)
print(response.status_code, result)
```

**curl**

```sh
curl -sS -i -X GET \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

**Postman**

```
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### GET /site/page/<SITE_HOST>/vidsite/journal-sites1010/room-lighting-1010

Actual successful training response; page and post have different record IDs.

```json
{
  "sk": "6aca144df5d6b011f6e12081",
  "state": "published",
  "requestPath": "journal-sites1010/room-lighting-1010",
  "data": {
    "name": "journal-sites1010",
    "site": "vidsite",
    "title": "Cedar & Form Journal",
    "datatype": "post"
  }
}
```

### GET /site/page/<SITE_HOST>/vidsite/journal-sites1010/room-lighting-1010

Selected attached post fields. Complete article body remains available in the response.

```json
{
  "requestData": {
    "data": [
      {
        "sk": "6aca144df5d6b011f6e1207e",
        "data": {
          "title": "A calmer room starts with light",
          "summary": "Three ways to make a room feel brighter, without changing its footprint."
        }
      }
    ]
  }
}
```

### GET /site/page/<SITE_HOST>/vidsite/journal-sites1010/room-lighting-1010

These are two explicit rendering approaches, not an automatic heading substitution.

```json
{
  "htmlBinding": "data-bind=\"data.title\"",
  "attachedData": "requestData.data[0].data.title"
}
```

## Publish, revise and unpublish through the API

### GET /site/page/sites-course-1010.<RENDERER_HOST>/sites-course-1010/journal/room-lighting-1010

Initial isolated site was published-only. The working page existed but was not served.

```json
{
  "statusCode": 404,
  "error": "Page journal not found",
  "path": "/site/page/sites-course-1010.<RENDERER_HOST>/sites-course-1010/journal/room-lighting-1010",
  "method": "GET",
  "timeStamp": "2026-10-10T10:32:49.350Z"
}
```

### POST /repository/publish/page/6aca144df5d6b011f6e12081

The saved page ID is part of the publish route.

```json
{}
```

**TypeScript**

```ts
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

**JavaScript**

```js
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

**Python**

```py
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

```
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### GET /site/page/<SITE_HOST>/vidsite/journal-sites1010/room-lighting-1010

The later lifecycle continues on the existing training site with published-only temporarily enabled.

```json
{
  "sk": "6aca144df5d6b011f6e12081",
  "state": "published",
  "requestPath": "journal-sites1010/room-lighting-1010",
  "data": {
    "name": "journal-sites1010",
    "site": "vidsite",
    "title": "Cedar & Form Journal",
    "datatype": "post"
  }
}
```

### POST /repository/update-partial/page/6aca144df5d6b011f6e12081

Update only the intended working-page field.

```json
{ "data.title": "Cedar & Form Journal — revised" }
```

**TypeScript**

```ts
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

**JavaScript**

```js
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

**Python**

```py
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

```
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### GET /repository/get/page/6aca144df5d6b011f6e12081

The working copy now holds the revised title.

```json
{
  "sk": "6aca144df5d6b011f6e12081",
  "state": "published",
  "data": {
    "name": "journal-sites1010",
    "site": "vidsite",
    "title": "Cedar & Form Journal — revised",
    "datatype": "post"
  }
}
```

### GET /site/page/<SITE_HOST>/vidsite/journal-sites1010/room-lighting-1010

Serving copy still has the previous title under published-only policy.

```json
{
  "sk": "6aca144df5d6b011f6e12081",
  "state": "published",
  "requestPath": "journal-sites1010/room-lighting-1010",
  "data": {
    "name": "journal-sites1010",
    "site": "vidsite",
    "title": "Cedar & Form Journal",
    "datatype": "post"
  }
}
```

### POST /repository/publish/page/6aca144df5d6b011f6e12081

Repeat publish using the same source page ID.

```json
null
```

**TypeScript**

```ts
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

**JavaScript**

```js
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

**Python**

```py
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

```
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### GET /site/page/<SITE_HOST>/vidsite/journal-sites1010/room-lighting-1010

Fresh serving read now contains the revision.

```json
{
  "sk": "6aca144df5d6b011f6e12081",
  "state": "published",
  "requestPath": "journal-sites1010/room-lighting-1010",
  "data": {
    "name": "journal-sites1010",
    "site": "vidsite",
    "title": "Cedar & Form Journal — revised",
    "datatype": "post"
  }
}
```

### POST /repository/publish/page/6aca144df5d6b011f6e12081

Observed no-change publish response.

```json
"already published"
```

### POST /repository/unpublish/page/6aca144df5d6b011f6e12081

Unpublish retains the source. A fresh source read succeeded afterward.

```json
null
```

**TypeScript**

```ts
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

**JavaScript**

```js
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

**Python**

```py
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

```
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### GET /site/page/<SITE_HOST>/vidsite/journal-sites1010/room-lighting-1010

Not found is expected only under this published-only policy. Original site setting was restored.

```json
{
  "statusCode": 404,
  "error": "Page journal-sites1010 not found",
  "path": "/site/page/<SITE_HOST>/vidsite/journal-sites1010/room-lighting-1010",
  "method": "GET",
  "timeStamp": "2026-10-10T10:41:21.440Z"
}
```

## Page publication does not freeze every data source

### GET /site/page/<SITE_HOST>/vidsite/journal-sites1010/room-lighting-1010

Original attached post before the content change.

```json
{
  "requestData": {
    "data": [
      {
        "sk": "6aca144df5d6b011f6e1207e",
        "data": {
          "title": "A calmer room starts with light",
          "summary": "Three ways to make a room feel brighter, without changing its footprint."
        }
      }
    ]
  }
}
```

### POST /repository/update-partial/post/6aca144df5d6b011f6e1207e

This edits the content record; the page HTML is unchanged.

```json
{
  "data.title": "Natural light, thoughtfully layered",
  "data.summary": "Start with daylight. Add task lighting. Finish with a warm accent."
}
```

**TypeScript**

```ts
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

**JavaScript**

```js
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

**Python**

```py
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

```
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### GET /site/page/<SITE_HOST>/vidsite/journal-sites1010/room-lighting-1010

Actual fresh route response carries changed content without rebuilding the design.

```json
{
  "requestData": {
    "data": [
      {
        "sk": "6aca144df5d6b011f6e1207e",
        "data": {
          "title": "Natural light, thoughtfully layered",
          "summary": "Start with daylight. Add task lighting. Finish with a warm accent."
        }
      }
    ]
  }
}
```

### GET /repository/get/site/6ac1a7896cf55d217cabf059

Page selection policy is separate from the bound collection’s editorial visibility rules.

```json
{
  "data": { "name": "vidsite", "publishedPagesOnly": false }
}
```

## Home pages, nested paths and missing content

### GET /site/get-site/vidsite/<SITE_HOST>

Source-reviewed route behavior. This chapter distinguishes alternatives from the tested journal path.

```json
{
  "homePage": "landing-page",
  "emptyPath": "uses homePage"
}
```

### GET /site/get-site/vidsite/<SITE_HOST>

Configure and test against your actual page structure; this alternative was not rehearsed.

```json
{
  "page": "parent",
  "childNavigation": true,
  "path": "/parent/child"
}
```

### GET /site/get-site/vidsite/<SITE_HOST>

Explicit datatype alternative follows the page segment.

```json
{
  "data.datatype": "not configured",
  "path": "/page/post/record-slug"
}
```

### GET /site/page/<SITE_HOST>/vidsite/does-not-exist-1010

Actual missing-page request returned 404.

```json
{
  "statusCode": 404,
  "error": "Page does-not-exist-1010 not found",
  "path": "/site/page/<SITE_HOST>/vidsite/does-not-exist-1010",
  "method": "GET",
  "timeStamp": "2026-10-10T10:41:19.935Z"
}
```

### GET /site/page/<SITE_HOST>/vidsite/journal-sites1010/does-not-exist-1010

Actual page response succeeded, but no matching article was attached.

```json
{
  "requestData": { "data": [] }
}
```

### GET /site/get-site/vidsite/<SITE_HOST>

Verify the resolved site; a fallback success may be the wrong site.

```json
{
  "sk": "6ac1a7896cf55d217cabf059",
  "data": { "name": "vidsite", "title": "vidsite" }
}
```

## Link an enabled site feature

### POST /site/sites-course-1010/features/forms/link

The isolated training site already had forms configured; no external message was sent.

```json
{ "where": "footer", "label": "Contact us" }
```

**TypeScript**

```ts
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

**JavaScript**

```js
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

**Python**

```py
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

```
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### POST /site/sites-course-1010/features/forms/link

Actual footer-link insertion result.

```json
{
  "href": "/consultation-form",
  "where": "footer",
  "label": "Contact us",
  "updated": [
    "feature-links"
  ],
  "alreadyLinked": [],
  "noPlace": [],
  "removed": []
}
```

### GET /repository/get/page/6aca1652f5d6b011f6e120fb

The actual saved footer includes the configured feature destination.

```json
{
  "html": "<html><head></head><body><header><nav><a href=\"/\">Home</a></nav></header><main><h1>Our studio</h1></main><footer><a href=\"/\">Home</a><a href=\"/consultation-form\">Contact us</a></footer></body></html>"
}
```

### POST /site/sites-course-1010/features/forms/link

Linking does not replace the publication check.

```json
{
  "edits": "working page records",
  "publication": "depends on site policy"
}
```

### POST /site/sites-course-1010/features/forms/link

Observed removal restored this isolated fixture’s footer.

```json
{
  "where": "footer",
  "label": "Contact us",
  "remove": true
}
```

**TypeScript**

```ts
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

**JavaScript**

```js
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
const result = text ? JSON.parse(text) : null;
console.log(response.status, result);
```

**Python**

```py
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

```
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

## Find the failed layer without changing everything

### GET /site/get-site/vidsite/<SITE_HOST>

First check: did hostname/name fallback resolve the intended site?

```json
{
  "sk": "6ac1a7896cf55d217cabf059",
  "data": { "name": "vidsite", "title": "vidsite" }
}
```

### GET /site/page/<SITE_HOST>/vidsite/journal-sites1010/room-lighting-1010

Second check: which page record did the path select?

```json
{
  "sk": "6aca144df5d6b011f6e12081",
  "state": "published",
  "requestPath": "journal-sites1010/room-lighting-1010",
  "data": {
    "name": "journal-sites1010",
    "site": "vidsite",
    "title": "Cedar & Form Journal",
    "datatype": "post"
  }
}
```

### GET /site/page/<SITE_HOST>/vidsite/journal-sites1010/room-lighting-1010

Third check: which record was attached, and is data empty?

```json
{
  "requestData": {
    "data": [
      {
        "sk": "6aca144df5d6b011f6e1207e",
        "data": {
          "title": "Natural light, thoughtfully layered",
          "summary": "Start with daylight. Add task lighting. Finish with a warm accent."
        }
      }
    ]
  }
}
```

### GET /site/page/<SITE_HOST>/vidsite/journal-sites1010/room-lighting-1010

Compare this serving title to the revised source before blaming a cache.

```json
{
  "sk": "6aca144df5d6b011f6e12081",
  "state": "published",
  "requestPath": "journal-sites1010/room-lighting-1010",
  "data": {
    "name": "journal-sites1010",
    "site": "vidsite",
    "title": "Cedar & Form Journal",
    "datatype": "post"
  }
}
```

### GET /site/page/<SITE_HOST>/vidsite/journal-sites1010/room-lighting-1010

Correct data does not automatically prove the HTML binding or rendering logic.

```json
{
  "field": "data.title",
  "binding": "data-bind=\"data.title\"",
  "HTML": "data-bind-html only for trusted markup"
}
```

### GET /site/base-url?siteName=vidsite

A configured origin and a reachable deployed website are different outcomes.

```json
{
  "checks": [
    "site mapping",
    "DNS",
    "certificate",
    "renderer configuration"
  ]
}
```
