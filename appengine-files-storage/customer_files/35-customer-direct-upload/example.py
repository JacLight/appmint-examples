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
