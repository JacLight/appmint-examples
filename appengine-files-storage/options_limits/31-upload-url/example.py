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
