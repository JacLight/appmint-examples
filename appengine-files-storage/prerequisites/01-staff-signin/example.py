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
