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
