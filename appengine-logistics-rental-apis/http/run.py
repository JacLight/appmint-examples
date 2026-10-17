import json,os,re,sys
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.parse import quote
from urllib.error import HTTPError
op=json.loads(Path(__file__).with_name('operations.json').read_text())[sys.argv[1]]
def replace(s,url=False):
 def value(m):
  v=os.environ[m[1]]
  return quote(v,safe='') if url else v
 return re.sub(r'\{([A-Z_]+)\}',value,s)
def expand(v):
 if isinstance(v,str):return replace(v)
 if isinstance(v,list):return [expand(x) for x in v]
 if isinstance(v,dict):return {k:expand(x) for k,x in v.items()}
 return v
path=replace(op['path'],True);body=expand(op.get('body'))
if '--plan' in sys.argv:
 print(json.dumps(dict(actor=op['actor'],method=op['method'],path=path,body=body,note=op['note'],testOnly=op.get('testOnly',False)),indent=2));sys.exit()
if op.get('testOnly') and os.environ.get('APPENGINE_VERIFIED_TEST')!='1':raise ValueError('Verify sandbox provider and original reference; set APPENGINE_VERIFIED_TEST=1')
token=os.environ['APPENGINE_'+op['actor'].upper()+'_TOKEN']
r=Request(os.environ['APPENGINE_API_ORIGIN'].rstrip('/')+path,method=op['method'],data=json.dumps(body).encode() if body is not None else None,headers={'orgid':os.environ['APPENGINE_ORG_ID'],'Authorization':'Bearer '+token,'Content-Type':'application/json'})
try:
 with urlopen(r) as response:print(json.dumps(dict(status=response.status,result=json.load(response)),indent=2))
except HTTPError as e:
 print(json.dumps(dict(status=e.code,result=e.read().decode()),indent=2));sys.exit(1)
