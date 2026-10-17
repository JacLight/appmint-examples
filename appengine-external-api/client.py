import json,os,sys,urllib.request,urllib.error
method,path=sys.argv[1:3]
body=open(sys.argv[3],'rb').read() if len(sys.argv)>3 else None
req=urllib.request.Request(os.environ['APPENGINE_ENDPOINT'].rstrip('/')+path,method=method,data=body,headers={'orgid':os.environ['ORG_ID'],'Authorization':'Bearer '+os.environ['STAFF_TOKEN'],'Content-Type':'application/json'})
try:
 with urllib.request.urlopen(req,timeout=30) as r: print(json.dumps({'status':r.status,'body':json.load(r)},indent=2))
except urllib.error.HTTPError as e:
 print(json.dumps({'status':e.code,'body':json.load(e)},indent=2));sys.exit(1)
