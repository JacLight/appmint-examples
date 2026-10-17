import os, json
base = os.environ.get("BASE", "https://appengine.appmint.io")
route = '/repository/create'
headers = {"orgid": os.environ["ORG_ID"], "Authorization": "Bearer "+os.environ["TOKEN"]}
body = json.loads('{"datatype": "sf_product", "isNew": true, "data": {"name": "Cedar Botanical Print \\u2014 File API course", "sku": "FILES-CEDAR-1009", "description": "Harmless training product for file attachment demonstration", "status": "draft", "price": 12, "images": []}}')
import requests
response = requests.request(
  "PUT", base + route, headers=headers,
  json=body, timeout=30
)
try:
  result = response.json()
except ValueError:
  result = response.text
print(response.status_code, result)
