import os,json,sys,urllib.request,urllib.error
from pathlib import Path
p=Path(sys.argv[1]);r=json.loads((p/'route.json').read_text());body=json.loads((p/'request.json').read_text())
headers={'Content-Type':'application/json','orgid':os.environ['ORG_ID']}
if r['identity']!='public':headers['Authorization']='Bearer '+os.environ['CUSTOMER_TOKEN' if r['identity']=='customer' else 'STAFF_TOKEN']
req=urllib.request.Request(os.environ['APPENGINE_ENDPOINT'].rstrip('/')+r['path'],headers=headers,method=r['method'],data=json.dumps(body).encode() if body is not None else None)
try:response=urllib.request.urlopen(req,timeout=30)
except urllib.error.HTTPError as error:response=error
text=response.read().decode()
try:result=json.loads(text) if text else None
except ValueError:result=text
print(json.dumps({'status':response.status,'result':result},indent=2))
if response.status>=400:sys.exit(1)
