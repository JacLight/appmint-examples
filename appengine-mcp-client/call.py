import json,os,sys,urllib.request,urllib.error
from pathlib import Path
p=Path(sys.argv[1]);meta=json.loads((p/'route.json').read_text());body=json.loads((p/'request.json').read_text())
if meta['write'] and '--allow-write' not in sys.argv:raise SystemExit('Inspect target; intentional writes require --allow-write')
req=urllib.request.Request(os.environ['APPENGINE_ENDPOINT'].rstrip('/')+meta['path'],method=meta['method'],headers={'orgid':os.environ['ORG_ID'],'Authorization':'Bearer '+os.environ['STAFF_TOKEN'],'Content-Type':'application/json'},data=json.dumps(body).encode() if body is not None else None)
try:
 try:r=urllib.request.urlopen(req,timeout=30)
 except urllib.error.HTTPError as e:r=e
 with r:
  text=r.read().decode();result=json.loads(text) if text else None
  print(json.dumps({'status':r.status,'result':result},indent=2))
  if r.status>=400 or (isinstance(result,dict) and (result.get('error') or result.get('result',{}).get('isError'))):sys.exit(1)
except (urllib.error.URLError,TimeoutError):
 raise SystemExit('Outcome unresolved. Read the exact target before retrying any write.')
