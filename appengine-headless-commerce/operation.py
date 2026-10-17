"""Python3 standard library: python3 operation.py json/operations/option-quote.json"""
import json,os,sys,urllib.request,urllib.error
op=json.load(open(sys.argv[1]));base=os.environ['APPENGINE_ENDPOINT'].rstrip('/');org=os.environ['ORG_ID']
if op.get('identity') not in ('public','staff','customer') or not op.get('path','').startswith('/') or op['path'].startswith('//'):raise SystemExit('Invalid operation identity or relative API path')
token=None if op['identity']=='public' else os.environ.get('STAFF_TOKEN' if op['identity']=='staff' else 'CUSTOMER_TOKEN')
if op['identity']!='public' and not token:raise SystemExit('Set the matching identity token')
if op.get('mutation') and os.environ.get('CONFIRM_TEST_OPERATION')!='yes':raise SystemExit('Review request and set CONFIRM_TEST_OPERATION=yes for sandbox mutation')
if any(v in json.dumps(op) for v in ['YOUR_','SAVED_','SELECTED_','REPLACE_']):raise SystemExit('Replace marked values from your saved response')
h={'orgid':org};h.update({'Authorization':'Bearer '+token} if token else {})
body=json.dumps(op['body']).encode() if 'body' in op else None
if body is not None:h['Content-Type']='application/json'
req=urllib.request.Request(base+op['path'],data=body,headers=h,method=op['method'])
try:
 with urllib.request.urlopen(req,timeout=30) as r:print(json.dumps(json.load(r),indent=2))
except urllib.error.HTTPError as e:
 print(e.read().decode());sys.exit(1)
