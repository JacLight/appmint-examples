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
