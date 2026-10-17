"""Python 3.10+, standard library only. Select one operation explicitly."""
import json, os, re, sys, urllib.request, urllib.error, urllib.parse
from pathlib import Path
ops=json.loads(Path(__file__).with_name('operations.json').read_text())
name=sys.argv[1] if len(sys.argv)>1 else 'my-profile'
op=next((o for o in ops if o['id']==name),None)
if not op: raise SystemExit('Unknown operation; inspect operations.json')
def required(key):
    value=os.environ.get(key)
    if not value: raise SystemExit('Set '+key)
    return value
def replace(s,path=False):
    return re.sub(r'\{\{([A-Z_]+)\}\}',lambda m:urllib.parse.quote(required(m[1]),safe='') if path else required(m[1]),s)
def bind(v):
    if isinstance(v,str): return replace(v)
    if isinstance(v,list): return [bind(x) for x in v]
    if isinstance(v,dict): return {k:bind(x) for k,x in v.items()}
    return v
body=json.dumps(bind(op['body'])).encode() if 'body' in op else None
request=urllib.request.Request(required('APPENGINE_API_ORIGIN').rstrip('/')+replace(op['path'],True),data=body,method=op['method'],headers={'orgid':required('APPENGINE_ORG_ID'),'Authorization':'Bearer '+required('MANAGER_TOKEN' if op['actor']=='manager' else 'STAFF_TOKEN'),'Content-Type':'application/json'})
try:
    with urllib.request.urlopen(request) as response: result=response.read()
except urllib.error.HTTPError as error: raise SystemExit(f'{error.code}: {error.read().decode()}')
if op.get('binary'):
    if not result.startswith(b'%PDF'): raise SystemExit('Response was not a PDF')
    fd=os.open('my-payslip.pdf',os.O_WRONLY|os.O_CREAT|os.O_TRUNC,0o600)
    with os.fdopen(fd,'wb') as file: file.write(result)
    print('Saved my-payslip.pdf')
else: print(json.dumps(json.loads(result),indent=2))
