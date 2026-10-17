# AppEngine File Storage API examples

Use your own `BASE`, `ORG_ID` and authorized staff `TOKEN`. The hosted API base is https://appengine.appmint.io. Staff sign-in is taught in Database & Repository APIs chapter 2. Never embed staff credentials in a public app.

These examples correspond to the recorded requests. Observed JSON contains sanitized training responses, not credentials. Replace course object paths and record IDs with your own. All language variants are illustrative equivalents; they were not each executed independently. Customer direct-token upload returned403; the app-mediated two-token flow remains unverified and is not a successful customer demo.

Multipart uploads require a real selected file and the HTTP library-generated Content-Type boundary. Public images are deliberately public. Do not persist an expiring signed link instead of the object path. Never run cleanup against an object still referenced by another record.

For JSON request examples, set `route` to the operation path and `body` from `request.json`. TypeScript/JavaScript examples require modern fetch; Python requires requests. Download/read routes may return non-JSON: inspect response Content-Type and use bytes/text as appropriate.


## Prepare the organization and staff session

### POST /profile/user/signin

Database & Repository APIs, chapter 2: complete staff sign-in walkthrough.

Observed status: 201. Full sanitized response: `prerequisites/01-staff-signin/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/profile/user/signin";
const headers = {orgid: process.env.ORG_ID, "Content-Type":"application/json"};
const body = {
  "email": "video-lab-mut4jkwd@example.com",
  "password": "[redacted]"
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/profile/user/signin";
const headers = {orgid: process.env.ORG_ID, "Content-Type":"application/json"};
const body = {
  "email": "video-lab-mut4jkwd@example.com",
  "password": "[redacted]"
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/profile/user/signin'
headers = {"orgid": os.environ["ORG_ID"]}
body = json.loads('{"email": "video-lab-mut4jkwd@example.com", "password": "[redacted]"}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/profile/user/signin'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### POST /repository/file/flatlist

Shared variables use your own deployment and authorized staff session.

Observed status: 201. Full sanitized response: `prerequisites/02-storage-list/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/flatlist";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "prefix": "course-files-1009/",
  "pageNumber": 1,
  "maxKeys": 10,
  "checkPrivacy": true
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/flatlist";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "prefix": "course-files-1009/",
  "pageNumber": 1,
  "maxKeys": 10,
  "checkPrivacy": true
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/flatlist'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"prefix": "course-files-1009/", "pageNumber": 1, "maxKeys": 10, "checkPrivacy": true}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/flatlist'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### GET /repository/file/driver

This training organization uses S3-compatible storage; your configured provider may differ.

Observed status: 200. Full sanitized response: `prerequisites/47-driver/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/driver";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = null;
const response: Response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/driver";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = null;
const response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/driver'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('null')
import requests
response = requests.request(
  "GET", base + route, headers=headers, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/driver'
curl -sS -i -X GET \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN"
```


#### Postman
```txt
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```

### POST /repository/file/upload

Owned sample asset; dedicated folder isolates course cleanup.

Observed status: 201. Full sanitized response: `prerequisites/04-upload-image/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/upload";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN};
import {readFile} from "node:fs/promises";
const filename = process.env.FILE || "cedar-botanical-print.png";
const selectedFile = new File([await readFile(filename)], filename.split("/").pop());
const location = "course-files-1009";
const isPrivate = "false";
const form: FormData = new FormData();
form.set("file", selectedFile);
form.set("location", location);
form.set("isPrivate", isPrivate);
const response = await fetch(base + route, {
  method: "POST", headers, body: form
});
console.log(await response.json());
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/upload";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN};
import {readFile} from "node:fs/promises";
const filename = process.env.FILE || "cedar-botanical-print.png";
const selectedFile = new File([await readFile(filename)], filename.split("/").pop());
const location = "course-files-1009";
const isPrivate = "false";
const form = new FormData();
form.set("file", selectedFile);
form.set("location", location);
form.set("isPrivate", isPrivate);
const response = await fetch(base + route, {
  method: "POST", headers, body: form
});
console.log(await response.json());
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/upload'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
filename = os.environ.get("FILE", 'cedar-botanical-print.png')
location = 'course-files-1009'
isPrivate = 'false'
import requests
with open(filename, "rb") as source:
  response = requests.post(base + route,
    headers=headers, files={"file": source},
    data={"location": location,
          "isPrivate": isPrivate}, timeout=60)
print(response.status_code, response.json())
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/upload'
curl -sS -i -X POST "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@cedar-botanical-print.png" \
  -F "location=course-files-1009" \
  -F "isPrivate=false"
```


#### Postman
```txt
POST {{base}}{{route}}
Headers: orgid + Authorization

Body → form-data
file       File  cedar-botanical-print.png
location   Text  course-files-1009
isPrivate  Text  false
Let Postman create Content-Type.
```


## Upload a file with multipart form data

### POST /repository/file/upload

Multipart fields are shown as a JSON-shaped reference; send actual form-data, not this object as JSON.

Observed status: 201. Full sanitized response: `upload_image/04-upload-image/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/upload";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN};
import {readFile} from "node:fs/promises";
const filename = process.env.FILE || "cedar-botanical-print.png";
const selectedFile = new File([await readFile(filename)], filename.split("/").pop());
const location = "course-files-1009";
const isPrivate = "false";
const form: FormData = new FormData();
form.set("file", selectedFile);
form.set("location", location);
form.set("isPrivate", isPrivate);
const response = await fetch(base + route, {
  method: "POST", headers, body: form
});
console.log(await response.json());
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/upload";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN};
import {readFile} from "node:fs/promises";
const filename = process.env.FILE || "cedar-botanical-print.png";
const selectedFile = new File([await readFile(filename)], filename.split("/").pop());
const location = "course-files-1009";
const isPrivate = "false";
const form = new FormData();
form.set("file", selectedFile);
form.set("location", location);
form.set("isPrivate", isPrivate);
const response = await fetch(base + route, {
  method: "POST", headers, body: form
});
console.log(await response.json());
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/upload'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
filename = os.environ.get("FILE", 'cedar-botanical-print.png')
location = 'course-files-1009'
isPrivate = 'false'
import requests
with open(filename, "rb") as source:
  response = requests.post(base + route,
    headers=headers, files={"file": source},
    data={"location": location,
          "isPrivate": isPrivate}, timeout=60)
print(response.status_code, response.json())
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/upload'
curl -sS -i -X POST "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@cedar-botanical-print.png" \
  -F "location=course-files-1009" \
  -F "isPrivate=false"
```


#### Postman
```txt
POST {{base}}{{route}}
Headers: orgid + Authorization

Body → form-data
file       File  cedar-botanical-print.png
location   Text  course-files-1009
isPrivate  Text  false
Let Postman create Content-Type.
```


## Understand paths, links and image previews

### POST /repository/file/upload

path identifies the stored object; signedUrl is an opening link.

Observed status: 201. Full sanitized response: `upload_response/04-upload-image/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/upload";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN};
import {readFile} from "node:fs/promises";
const filename = process.env.FILE || "cedar-botanical-print.png";
const selectedFile = new File([await readFile(filename)], filename.split("/").pop());
const location = "course-files-1009";
const isPrivate = "false";
const form: FormData = new FormData();
form.set("file", selectedFile);
form.set("location", location);
form.set("isPrivate", isPrivate);
const response = await fetch(base + route, {
  method: "POST", headers, body: form
});
console.log(await response.json());
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/upload";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN};
import {readFile} from "node:fs/promises";
const filename = process.env.FILE || "cedar-botanical-print.png";
const selectedFile = new File([await readFile(filename)], filename.split("/").pop());
const location = "course-files-1009";
const isPrivate = "false";
const form = new FormData();
form.set("file", selectedFile);
form.set("location", location);
form.set("isPrivate", isPrivate);
const response = await fetch(base + route, {
  method: "POST", headers, body: form
});
console.log(await response.json());
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/upload'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
filename = os.environ.get("FILE", 'cedar-botanical-print.png')
location = 'course-files-1009'
isPrivate = 'false'
import requests
with open(filename, "rb") as source:
  response = requests.post(base + route,
    headers=headers, files={"file": source},
    data={"location": location,
          "isPrivate": isPrivate}, timeout=60)
print(response.status_code, response.json())
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/upload'
curl -sS -i -X POST "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@cedar-botanical-print.png" \
  -F "location=course-files-1009" \
  -F "isPrivate=false"
```


#### Postman
```txt
POST {{base}}{{route}}
Headers: orgid + Authorization

Body → form-data
file       File  cedar-botanical-print.png
location   Text  course-files-1009
isPrivate  Text  false
Let Postman create Content-Type.
```

### POST /repository/file/upload

Text document response has no xs, sm or md preview keys.

Observed status: 201. Full sanitized response: `upload_response/05-upload-private-text/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/upload";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN};
import {readFile} from "node:fs/promises";
const filename = process.env.FILE || "supplier-notes.txt";
const selectedFile = new File([await readFile(filename)], filename.split("/").pop());
const location = "course-files-1009/private";
const isPrivate = "true";
const form: FormData = new FormData();
form.set("file", selectedFile);
form.set("location", location);
form.set("isPrivate", isPrivate);
const response = await fetch(base + route, {
  method: "POST", headers, body: form
});
console.log(await response.json());
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/upload";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN};
import {readFile} from "node:fs/promises";
const filename = process.env.FILE || "supplier-notes.txt";
const selectedFile = new File([await readFile(filename)], filename.split("/").pop());
const location = "course-files-1009/private";
const isPrivate = "true";
const form = new FormData();
form.set("file", selectedFile);
form.set("location", location);
form.set("isPrivate", isPrivate);
const response = await fetch(base + route, {
  method: "POST", headers, body: form
});
console.log(await response.json());
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/upload'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
filename = os.environ.get("FILE", 'supplier-notes.txt')
location = 'course-files-1009/private'
isPrivate = 'true'
import requests
with open(filename, "rb") as source:
  response = requests.post(base + route,
    headers=headers, files={"file": source},
    data={"location": location,
          "isPrivate": isPrivate}, timeout=60)
print(response.status_code, response.json())
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/upload'
curl -sS -i -X POST "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@supplier-notes.txt" \
  -F "location=course-files-1009/private" \
  -F "isPrivate=true"
```


#### Postman
```txt
POST {{base}}{{route}}
Headers: orgid + Authorization

Body → form-data
file       File  supplier-notes.txt
location   Text  course-files-1009/private
isPrivate  Text  true
Let Postman create Content-Type.
```


## Attach the uploaded image to a product

### PUT /repository/create

Saved training product. This course attaches a gallery image; default image remains separate.

Observed status: 200. Full sanitized response: `attach_record/13-create-product/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/create";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "datatype": "sf_product",
  "isNew": true,
  "data": {
    "name": "Cedar Botanical Print \u2014 File API course",
    "sku": "FILES-CEDAR-1009",
    "description": "Harmless training product for file attachment demonstration",
    "status": "draft",
    "price": 12,
    "images": []
  }
};
const response: Response = await fetch(base + route, {
  method: "PUT", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/create";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "datatype": "sf_product",
  "isNew": true,
  "data": {
    "name": "Cedar Botanical Print \u2014 File API course",
    "sku": "FILES-CEDAR-1009",
    "description": "Harmless training product for file attachment demonstration",
    "status": "draft",
    "price": 12,
    "images": []
  }
};
const response = await fetch(base + route, {
  method: "PUT", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/create'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"datatype": "sf_product", "isNew": true, "data": {"name": "Cedar Botanical Print \\u2014 File API course", "sku": "FILES-CEDAR-1009", "description": "Harmless training product for file attachment demonstration", "status": "draft", "price": 12, "images": []}}')
import requests
response = requests.request(
  "PUT", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/create'
curl -sS -i -X PUT \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
PUT {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### POST /repository/update-partial/sf_product/6ac99bdff5d6b011f6e10eeb

The complete image-reference array is being replaced by this partial update.

Observed status: 201. Full sanitized response: `attach_record/14-attach-product/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/update-partial/sf_product/6ac99bdff5d6b011f6e10eeb";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "data.images": [
    {
      "path": "video-lab-mut4jkwd/course-files-1009/cedar-botanical-print.png",
      "url": "https://fundu-space-sfo3-dev.sfo3.digitaloceanspaces.com/video-lab-mut4jkwd/course-files-1009/cedar-botanical-print.png"
    }
  ]
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/update-partial/sf_product/6ac99bdff5d6b011f6e10eeb";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "data.images": [
    {
      "path": "video-lab-mut4jkwd/course-files-1009/cedar-botanical-print.png",
      "url": "https://fundu-space-sfo3-dev.sfo3.digitaloceanspaces.com/video-lab-mut4jkwd/course-files-1009/cedar-botanical-print.png"
    }
  ]
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/update-partial/sf_product/6ac99bdff5d6b011f6e10eeb'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"data.images": [{"path": "video-lab-mut4jkwd/course-files-1009/cedar-botanical-print.png", "url": "https://fundu-space-sfo3-dev.sfo3.digitaloceanspaces.com/video-lab-mut4jkwd/course-files-1009/cedar-botanical-print.png"}]}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/update-partial/sf_product/6ac99bdff5d6b011f6e10eeb'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### GET /repository/get/sf_product/6ac99bdff5d6b011f6e10eeb

Fresh read verifies the gallery reference. Uploading alone did not create this record relationship.

Observed status: 200. Full sanitized response: `attach_record/15-product-readback/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/get/sf_product/6ac99bdff5d6b011f6e10eeb";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = null;
const response: Response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/get/sf_product/6ac99bdff5d6b011f6e10eeb";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = null;
const response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/get/sf_product/6ac99bdff5d6b011f6e10eeb'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('null')
import requests
response = requests.request(
  "GET", base + route, headers=headers, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/get/sf_product/6ac99bdff5d6b011f6e10eeb'
curl -sS -i -X GET \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN"
```


#### Postman
```txt
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```


## List files, folders and pages

### POST /repository/file/flatlist

The prefix chooses the course folder; pageNumber starts at 1.

Observed status: 201. Full sanitized response: `list_files/42-list-page-one/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/flatlist";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "prefix": "course-files-1009/",
  "pageNumber": 1,
  "maxKeys": 2,
  "recursive": true,
  "checkPrivacy": true
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/flatlist";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "prefix": "course-files-1009/",
  "pageNumber": 1,
  "maxKeys": 2,
  "recursive": true,
  "checkPrivacy": true
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/flatlist'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"prefix": "course-files-1009/", "pageNumber": 1, "maxKeys": 2, "recursive": true, "checkPrivacy": true}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/flatlist'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### POST /repository/file/flatlist

Same prefix, pageNumber 2: imported image and private text document.

Observed status: 201. Full sanitized response: `list_files/43-list-page-two/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/flatlist";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "prefix": "course-files-1009/",
  "pageNumber": 2,
  "maxKeys": 2,
  "recursive": true,
  "checkPrivacy": true
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/flatlist";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "prefix": "course-files-1009/",
  "pageNumber": 2,
  "maxKeys": 2,
  "recursive": true,
  "checkPrivacy": true
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/flatlist'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"prefix": "course-files-1009/", "pageNumber": 2, "maxKeys": 2, "recursive": true, "checkPrivacy": true}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/flatlist'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```


## Check existence, metadata and file content

### POST /repository/file/exists

Does this exact object path exist?

Observed status: 201. Full sanitized response: `inspect_read/09-exists-image/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/exists";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "video-lab-mut4jkwd/course-files-1009/cedar-botanical-print.png"
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/exists";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "video-lab-mut4jkwd/course-files-1009/cedar-botanical-print.png"
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/exists'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"location": "video-lab-mut4jkwd/course-files-1009/cedar-botanical-print.png"}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/exists'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### POST /repository/file/stat

Actual metadata for the 52,048-byte botanical PNG.

Observed status: 201. Full sanitized response: `inspect_read/08-stat-image/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/stat";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "video-lab-mut4jkwd/course-files-1009/cedar-botanical-print.png"
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/stat";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "video-lab-mut4jkwd/course-files-1009/cedar-botanical-print.png"
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/stat'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"location": "video-lab-mut4jkwd/course-files-1009/cedar-botanical-print.png"}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/stat'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### POST /repository/file

Read a text fixture as UTF-8; do not decode a PNG or PDF as plain text.

Observed status: 201. Full sanitized response: `inspect_read/10-read-text/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "video-lab-mut4jkwd/course-files-1009/private/supplier-notes.txt",
  "encoding": "utf8"
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "video-lab-mut4jkwd/course-files-1009/private/supplier-notes.txt",
  "encoding": "utf8"
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"location": "video-lab-mut4jkwd/course-files-1009/private/supplier-notes.txt", "encoding": "utf8"}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### POST /repository/file/signurl

Use the object opening link for binary media such as this PDF.

Observed status: 201. Full sanitized response: `inspect_read/11-sign-private/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/signurl";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "video-lab-mut4jkwd/course-files-1009/private/supplier-sheet.pdf",
  "options": {
    "expiry": 900
  }
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/signurl";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "video-lab-mut4jkwd/course-files-1009/private/supplier-sheet.pdf",
  "options": {
    "expiry": 900
  }
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/signurl'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"location": "video-lab-mut4jkwd/course-files-1009/private/supplier-sheet.pdf", "options": {"expiry": 900}}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/signurl'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```


## Upload a private document

### POST /repository/file/upload

Private PDF: multipart text value true, using a separate document path.

Observed status: 201. Full sanitized response: `private_upload/06-upload-private-pdf/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/upload";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN};
import {readFile} from "node:fs/promises";
const filename = process.env.FILE || "supplier-sheet.pdf";
const selectedFile = new File([await readFile(filename)], filename.split("/").pop());
const location = "course-files-1009/private";
const isPrivate = "true";
const form: FormData = new FormData();
form.set("file", selectedFile);
form.set("location", location);
form.set("isPrivate", isPrivate);
const response = await fetch(base + route, {
  method: "POST", headers, body: form
});
console.log(await response.json());
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/upload";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN};
import {readFile} from "node:fs/promises";
const filename = process.env.FILE || "supplier-sheet.pdf";
const selectedFile = new File([await readFile(filename)], filename.split("/").pop());
const location = "course-files-1009/private";
const isPrivate = "true";
const form = new FormData();
form.set("file", selectedFile);
form.set("location", location);
form.set("isPrivate", isPrivate);
const response = await fetch(base + route, {
  method: "POST", headers, body: form
});
console.log(await response.json());
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/upload'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
filename = os.environ.get("FILE", 'supplier-sheet.pdf')
location = 'course-files-1009/private'
isPrivate = 'true'
import requests
with open(filename, "rb") as source:
  response = requests.post(base + route,
    headers=headers, files={"file": source},
    data={"location": location,
          "isPrivate": isPrivate}, timeout=60)
print(response.status_code, response.json())
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/upload'
curl -sS -i -X POST "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@supplier-sheet.pdf" \
  -F "location=course-files-1009/private" \
  -F "isPrivate=true"
```


#### Postman
```txt
POST {{base}}{{route}}
Headers: orgid + Authorization

Body → form-data
file       File  supplier-sheet.pdf
location   Text  course-files-1009/private
isPrivate  Text  true
Let Postman create Content-Type.
```


## Create an expiring download link

### POST /repository/file/signurl

The saved private path identifies which document receives a temporary opening link.

Observed status: 201. Full sanitized response: `signed_link/11-sign-private/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/signurl";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "video-lab-mut4jkwd/course-files-1009/private/supplier-sheet.pdf",
  "options": {
    "expiry": 900
  }
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/signurl";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "video-lab-mut4jkwd/course-files-1009/private/supplier-sheet.pdf",
  "options": {
    "expiry": 900
  }
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/signurl'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"location": "video-lab-mut4jkwd/course-files-1009/private/supplier-sheet.pdf", "options": {"expiry": 900}}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/signurl'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```


## Change access and check the actual URL

### POST /repository/file/make-public

locations is plural and contains an array of exact stored paths.

Observed status: 201. Full sanitized response: `visibility/17-private-to-public/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/make-public";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "locations": [
    "video-lab-mut4jkwd/course-files-1009/private/supplier-sheet.pdf"
  ]
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/make-public";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "locations": [
    "video-lab-mut4jkwd/course-files-1009/private/supplier-sheet.pdf"
  ]
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/make-public'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"locations": ["video-lab-mut4jkwd/course-files-1009/private/supplier-sheet.pdf"]}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/make-public'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### POST /repository/file/make-private

After the public test returned 200, this request restores the PDF to private.

Observed status: 201. Full sanitized response: `visibility/19-public-to-private/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/make-private";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "locations": [
    "video-lab-mut4jkwd/course-files-1009/private/supplier-sheet.pdf"
  ]
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/make-private";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "locations": [
    "video-lab-mut4jkwd/course-files-1009/private/supplier-sheet.pdf"
  ]
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/make-private'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"locations": ["video-lab-mut4jkwd/course-files-1009/private/supplier-sheet.pdf"]}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/make-private'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### POST /repository/file/signurl

The separate 5-second training link later returned 403 after expiration. Immediate revocation is a different requirement.

Observed status: 201. Full sanitized response: `visibility/21-sign-short-expiry/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/signurl";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "video-lab-mut4jkwd/course-files-1009/private/supplier-sheet.pdf",
  "options": {
    "expiry": 5
  }
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/signurl";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "video-lab-mut4jkwd/course-files-1009/private/supplier-sheet.pdf",
  "options": {
    "expiry": 5
  }
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/signurl'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"location": "video-lab-mut4jkwd/course-files-1009/private/supplier-sheet.pdf", "options": {"expiry": 5}}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/signurl'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```


## Upload, list and delete as a customer

### POST /repository/customer/file/upload

Customer routes use JSON. This is a harmless text fixture encoded in base64.

Observed status: 403. Full sanitized response: `customer_files/35-customer-direct-upload/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/customer/file/upload";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "fileName": "course-order-1009.txt",
  "base64Data": "data:text/plain;base64,VHJhaW5pbmcgY3VzdG9tZXIgYXJ0d29yayByZXF1ZXN0CkNlZGFyIGJvdGFuaWNhbCBwcmludCwgQTMgbWF0dGUuCg=="
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/customer/file/upload";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "fileName": "course-order-1009.txt",
  "base64Data": "data:text/plain;base64,VHJhaW5pbmcgY3VzdG9tZXIgYXJ0d29yayByZXF1ZXN0CkNlZGFyIGJvdGFuaWNhbCBwcmludCwgQTMgbWF0dGUuCg=="
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/customer/file/upload'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"fileName": "course-order-1009.txt", "base64Data": "data:text/plain;base64,VHJhaW5pbmcgY3VzdG9tZXIgYXJ0d29yayByZXF1ZXN0CkNlZGFyIGJvdGFuaWNhbCBwcmludCwgQTMgbWF0dGUuCg=="}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/customer/file/upload'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### POST /repository/customer/file/flatlist

Actual customer list request also returned 403. Source contract for delete uses filePath.

Observed status: 403. Full sanitized response: `customer_files/36-customer-direct-list/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/customer/file/flatlist";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "prefix": "course-order-1009"
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/customer/file/flatlist";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "prefix": "course-order-1009"
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/customer/file/flatlist'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"prefix": "course-order-1009"}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/customer/file/flatlist'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```


## Copy and move files

### POST /repository/file/copy

Copy the private text to an expendable working copy. The original stays available.

Observed status: 201. Full sanitized response: `copy_move/22-copy-text/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/copy";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "src": "video-lab-mut4jkwd/course-files-1009/private/supplier-notes.txt",
  "dest": "course-files-1009/work/supplier-notes-copy.txt"
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/copy";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "src": "video-lab-mut4jkwd/course-files-1009/private/supplier-notes.txt",
  "dest": "course-files-1009/work/supplier-notes-copy.txt"
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/copy'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"src": "video-lab-mut4jkwd/course-files-1009/private/supplier-notes.txt", "dest": "course-files-1009/work/supplier-notes-copy.txt"}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/copy'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### POST /repository/file/move

Move the working copy to supplier-notes-moved.txt. Existing record references do not update automatically.

Observed status: 201. Full sanitized response: `copy_move/23-move-text/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/move";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "src": "course-files-1009/work/supplier-notes-copy.txt",
  "dest": "course-files-1009/work/supplier-notes-moved.txt"
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/move";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "src": "course-files-1009/work/supplier-notes-copy.txt",
  "dest": "course-files-1009/work/supplier-notes-moved.txt"
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/move'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"src": "course-files-1009/work/supplier-notes-copy.txt", "dest": "course-files-1009/work/supplier-notes-moved.txt"}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/move'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### POST /repository/file/exists

After move, the old working-copy path returns exists false.

Observed status: 201. Full sanitized response: `copy_move/24-copy-source-absent/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/exists";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "course-files-1009/work/supplier-notes-copy.txt"
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/exists";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "course-files-1009/work/supplier-notes-copy.txt"
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/exists'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"location": "course-files-1009/work/supplier-notes-copy.txt"}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/exists'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### POST /repository/file/exists

New destination exists true. Existence alone does not verify its public/private opening behavior.

Observed status: 201. Full sanitized response: `copy_move/25-move-destination-present/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/exists";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "course-files-1009/work/supplier-notes-moved.txt"
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/exists";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "course-files-1009/work/supplier-notes-moved.txt"
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/exists'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"location": "course-files-1009/work/supplier-notes-moved.txt"}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/exists'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```


## Import an existing image from a URL

### POST /repository/file/upload-url

Source is our owned public botanical image. The full public URL is in the companion.

Observed status: 201. Full sanitized response: `url_import/31-upload-url/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/upload-url";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "url": "https://fundu-space-sfo3-dev.sfo3.digitaloceanspaces.com/video-lab-mut4jkwd/course-files-1009/cedar-botanical-print.png",
  "location": "course-files-1009/imported",
  "name": "cedar-import.png",
  "isPrivate": true,
  "thumbnails": true
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/upload-url";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "url": "https://fundu-space-sfo3-dev.sfo3.digitaloceanspaces.com/video-lab-mut4jkwd/course-files-1009/cedar-botanical-print.png",
  "location": "course-files-1009/imported",
  "name": "cedar-import.png",
  "isPrivate": true,
  "thumbnails": true
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/upload-url'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"url": "https://fundu-space-sfo3-dev.sfo3.digitaloceanspaces.com/video-lab-mut4jkwd/course-files-1009/cedar-botanical-print.png", "location": "course-files-1009/imported", "name": "cedar-import.png", "isPrivate": true, "thumbnails": true}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/upload-url'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```


## Folders, thumbnails and the file index

### POST /repository/file/createfolder

A dedicated empty folder is represented by a storage path.

Observed status: 201. Full sanitized response: `folders_index/29-create-folder/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/createfolder";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "course-files-1009/empty/"
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/createfolder";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "course-files-1009/empty/"
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/createfolder'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"location": "course-files-1009/empty/"}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/createfolder'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### POST /repository/file/index

Index scans stored objects and creates Repository fileinfo references.

Observed status: 201. Full sanitized response: `folders_index/32-index-folder/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/index";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "course-files-1009/",
  "recursive": true,
  "skipExisting": true
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/index";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "course-files-1009/",
  "recursive": true,
  "skipExisting": true
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/index'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"location": "course-files-1009/", "recursive": true, "skipExisting": true}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/index'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### POST /repository/find/fileinfo

Selected actual indexed record. The complete result contains six matching records.

Observed status: 201. Full sanitized response: `folders_index/33-index-records/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/find/fileinfo";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "query": {
    "data.path": {
      "$regex": "course-files-1009/"
    }
  },
  "options": {
    "page": 1,
    "pageSize": 20
  }
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/find/fileinfo";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "query": {
    "data.path": {
      "$regex": "course-files-1009/"
    }
  },
  "options": {
    "page": 1,
    "pageSize": 20
  }
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/find/fileinfo'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"query": {"data.path": {"$regex": "course-files-1009/"}}, "options": {"page": 1, "pageSize": 20}}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/find/fileinfo'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### POST /repository/file/thumbnails

Regenerate image previews, then inspect the actual returned array.

Observed status: 201. Full sanitized response: `folders_index/30-rebuild-thumbnails/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/thumbnails";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "video-lab-mut4jkwd/course-files-1009/cedar-botanical-print.png"
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/thumbnails";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "video-lab-mut4jkwd/course-files-1009/cedar-botanical-print.png"
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/thumbnails'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"location": "video-lab-mut4jkwd/course-files-1009/cedar-botanical-print.png"}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/thumbnails'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```


## Remove files and check remaining references

### GET /repository/get/sf_product/6ac99bdff5d6b011f6e10eeb

The product gallery now references the distinct interior image. Both owned images remain available.

Observed status: 200. Full sanitized response: `delete_cleanup/62-replacement-readback/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/get/sf_product/6ac99bdff5d6b011f6e10eeb";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = null;
const response: Response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/get/sf_product/6ac99bdff5d6b011f6e10eeb";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = null;
const response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/get/sf_product/6ac99bdff5d6b011f6e10eeb'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('null')
import requests
response = requests.request(
  "GET", base + route, headers=headers, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/get/sf_product/6ac99bdff5d6b011f6e10eeb'
curl -sS -i -X GET \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN"
```


#### Postman
```txt
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```

### POST /repository/file/delete

Only the expendable moved text is deleted. The product image is retained.

Observed status: 201. Full sanitized response: `delete_cleanup/45-delete-copy/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/delete";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "course-files-1009/work/supplier-notes-moved.txt"
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/delete";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "course-files-1009/work/supplier-notes-moved.txt"
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/delete'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"location": "course-files-1009/work/supplier-notes-moved.txt"}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/delete'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### POST /repository/file/exists

Fresh storage check proves that the expendable object path is absent.

Observed status: 201. Full sanitized response: `delete_cleanup/46-check-deleted-copy/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/exists";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "course-files-1009/work/supplier-notes-moved.txt"
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/exists";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "course-files-1009/work/supplier-notes-moved.txt"
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/exists'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"location": "course-files-1009/work/supplier-notes-moved.txt"}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/exists'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```


## Additional operations, permissions and limits

### POST /repository/file/append

S3-backed append returned an actual 500. The text remained unchanged.

Observed status: 500. Full sanitized response: `options_limits/26-append-test/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/append";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "course-files-1009/work/supplier-notes-moved.txt",
  "content": "Appended course note.\n"
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/append";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "course-files-1009/work/supplier-notes-moved.txt",
  "content": "Appended course note.\n"
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/append'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"location": "course-files-1009/work/supplier-notes-moved.txt", "content": "Appended course note.\\n"}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/append'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### POST /repository/file/prepend

Prepend also returned 500. Upload a revised file instead of retrying this unsupported path.

Observed status: 500. Full sanitized response: `options_limits/27-prepend-test/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/prepend";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "course-files-1009/work/supplier-notes-moved.txt",
  "content": "Course file header.\n"
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/prepend";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "course-files-1009/work/supplier-notes-moved.txt",
  "content": "Course file header.\n"
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/prepend'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"location": "course-files-1009/work/supplier-notes-moved.txt", "content": "Course file header.\\n"}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/prepend'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### POST /repository/file/buffer

Selected first 12 bytes from the actual JSON byte array, not a binary download.

Observed status: 201. Full sanitized response: `options_limits/39-buffer-read/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/buffer";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "video-lab-mut4jkwd/course-files-1009/private/supplier-notes.txt"
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/buffer";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "video-lab-mut4jkwd/course-files-1009/private/supplier-notes.txt"
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/buffer'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"location": "video-lab-mut4jkwd/course-files-1009/private/supplier-notes.txt"}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/buffer'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### POST /repository/file/stream

Observed serialized internal stream object. Use the tested signed-link download.

Observed status: 201. Full sanitized response: `options_limits/40-stream-read/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/stream";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "video-lab-mut4jkwd/course-files-1009/private/supplier-notes.txt"
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/stream";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "video-lab-mut4jkwd/course-files-1009/private/supplier-notes.txt"
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/stream'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"location": "video-lab-mut4jkwd/course-files-1009/private/supplier-notes.txt"}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/stream'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### POST /repository/file/create_favicon

Created only after confirming both root icon paths were absent; generated fixtures were cleaned up.

Observed status: 201. Full sanitized response: `options_limits/50-create-favicon/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/create_favicon";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "video-lab-mut4jkwd/course-files-1009/cedar-botanical-print.png"
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/create_favicon";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "video-lab-mut4jkwd/course-files-1009/cedar-botanical-print.png"
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/create_favicon'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"location": "video-lab-mut4jkwd/course-files-1009/cedar-botanical-print.png"}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/create_favicon'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```

### GET /repository/file/driver

Safe storage name only; do not expose provider credentials.

Observed status: 200. Full sanitized response: `options_limits/47-driver/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/driver";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = null;
const response: Response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/driver";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = null;
const response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/driver'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('null')
import requests
response = requests.request(
  "GET", base + route, headers=headers, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/driver'
curl -sS -i -X GET \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN"
```


#### Postman
```txt
GET {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}

Send; inspect Status and Body.
```

### POST /repository/file/upload-url

These operations check the organization’s storage allowance. Quota exhaustion was not induced in this training run.

Observed status: 201. Full sanitized response: `options_limits/31-upload-url/observed.json`.


#### TypeScript
```ts
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/upload-url";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "url": "https://fundu-space-sfo3-dev.sfo3.digitaloceanspaces.com/video-lab-mut4jkwd/course-files-1009/cedar-botanical-print.png",
  "location": "course-files-1009/imported",
  "name": "cedar-import.png",
  "isPrivate": true,
  "thumbnails": true
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### JavaScript
```js
const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/upload-url";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "url": "https://fundu-space-sfo3-dev.sfo3.digitaloceanspaces.com/video-lab-mut4jkwd/course-files-1009/cedar-botanical-print.png",
  "location": "course-files-1009/imported",
  "name": "cedar-import.png",
  "isPrivate": true,
  "thumbnails": true
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
```


#### Python
```py
import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/file/upload-url'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"url": "https://fundu-space-sfo3-dev.sfo3.digitaloceanspaces.com/video-lab-mut4jkwd/course-files-1009/cedar-botanical-print.png", "location": "course-files-1009/imported", "name": "cedar-import.png", "isPrivate": true, "thumbnails": true}')
import requests
response = requests.request(
  "POST", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
```


#### curl
```sh
#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/upload-url'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```


#### Postman
```txt
POST {{base}}{{route}}

Headers
  orgid: {{orgid}}
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body → raw → JSON
Use the complete request.json.
```
