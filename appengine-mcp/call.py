import os,json,sys,urllib.request,urllib.error
from pathlib import Path
p=Path(sys.argv[1]);meta=json.loads((p/'route.json').read_text());body=json.loads((p/'request.json').read_text())
headers={'Content-Type':'application/json','orgid':os.environ['ORG_ID']}
if 'Authorization' in meta['headers']:headers['Authorization']='Bearer '+os.environ['STAFF_TOKEN']
req=urllib.request.Request(os.environ['APPENGINE_ENDPOINT'].rstrip('/')+meta['path'],data=json.dumps(body).encode() if body is not None else None,headers=headers,method=meta['method'])
try:response=urllib.request.urlopen(req,timeout=30)
except urllib.error.HTTPError as e:response=e
with response:
 text=response.read().decode();result=json.loads(text) if text else None
 print(json.dumps({'status':response.status,'result':result},indent=2))
 if response.status>=400 or (isinstance(result,dict) and (result.get('error') or result.get('result',{}).get('isError'))):sys.exit(1)
