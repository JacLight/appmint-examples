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
