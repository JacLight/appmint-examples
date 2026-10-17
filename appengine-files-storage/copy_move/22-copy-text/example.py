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
