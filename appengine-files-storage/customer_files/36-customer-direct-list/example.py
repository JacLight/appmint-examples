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
