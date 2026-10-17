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
