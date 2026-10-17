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
