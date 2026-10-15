import json, os, sys, urllib.request, urllib.parse
from pathlib import Path
items=json.loads(Path(__file__).with_name('requests.json').read_text())
if len(sys.argv)!=2:raise SystemExit('Pass one request name: '+', '.join(x['name'] for x in items))
r=next(x for x in items if x['name']==sys.argv[1])
if r['sideEffect'] and os.environ.get('ENABLE_SIDE_EFFECTS')!='true':raise SystemExit('Explicit action disabled: configure owned facilities and set ENABLE_SIDE_EFFECTS=true deliberately')
values={k.lower():v for k,v in os.environ.items()}
def substitute(v,path=False):
 if isinstance(v,str):
  for k in ['phone_id','device_id','from','to','assistant_id']:
   marker='{{'+k+'}}'
   if marker in v:
    value=values.get(k,'')
    if not value:raise SystemExit('Missing '+k.upper())
    v=v.replace(marker,urllib.parse.quote(value,safe='') if path else value)
  return v
 if isinstance(v,list):return [substitute(x) for x in v]
 if isinstance(v,dict):return {k:substitute(x) for k,x in v.items()}
 return v
url=os.environ['APPMINT_URL'].rstrip('/')+substitute(r['path'],True)
body=substitute(r['body'])
request=urllib.request.Request(url,method=r['method'],headers={'orgid':os.environ['APPMINT_ORG'],'Authorization':'Bearer '+os.environ['STAFF_TOKEN'],'Content-Type':'application/json'},data=None if body is None else json.dumps(body).encode())
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):return None
with urllib.request.build_opener(NoRedirect).open(request,timeout=30) as response:
 raw=response.read()
def display(v):
 if isinstance(v,dict):return {k:('[redacted]' if any(word in k.lower() for word in ['token','secret','password','authorization','apikey']) else display(x)) for k,x in v.items()}
 if isinstance(v,list):return [display(x) for x in v]
 return v
print(json.dumps(display(json.loads(raw)),indent=2) if raw else '(empty response)')
