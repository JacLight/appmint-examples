import json, os, re, sys
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
ops=json.loads(Path(__file__).with_name('operations.json').read_text())
op=ops[sys.argv[1]]
def substitute(text):
    def value(m):
        key=m.group(1).upper()
        if not os.environ.get(key): raise ValueError('Set '+key)
        return os.environ[key]
    return re.sub(r'\{(\w+)\}',value,text)
token=os.environ['APPENGINE_STAFF_TOKEN' if op['actor']=='staff' else 'APPENGINE_CUSTOMER_TOKEN']
body=json.dumps(json.loads(substitute(json.dumps(op['body'])))).encode() if 'body' in op else None
request=Request(os.environ['APPENGINE_API_ORIGIN'].rstrip('/')+substitute(op['path']),method=op['method'],data=body,headers={'orgid':os.environ['APPENGINE_ORG_ID'],'Authorization':'Bearer '+token,'Content-Type':'application/json'})
try:
    with urlopen(request) as response: print(json.dumps({'status':response.status,'result':json.load(response)},indent=2))
except HTTPError as error:
    print(json.dumps({'status':error.code,'result':error.read().decode()},indent=2));sys.exit(1)
