import os,json,urllib.request,urllib.error,pathlib
base=os.environ['APPENGINE_URL']
headers={'orgid':os.environ['APPENGINE_ORG'],'Content-Type':'application/json'}
headers['Authorization']='Bearer '+os.environ['APPENGINE_TOKEN']
route='/repository/find/form_submission'
body=json.loads(pathlib.Path(__file__).with_name('request.json').read_text())
request=urllib.request.Request(base+route,headers=headers,method='POST',data=json.dumps(body).encode())
try: response=urllib.request.urlopen(request,timeout=30)
except urllib.error.HTTPError as error: response=error
raw=response.read().decode()
print(response.status,json.loads(raw) if raw else None)
