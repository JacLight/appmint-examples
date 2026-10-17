import argparse,json,os,re,sys,urllib.request,urllib.error
from pathlib import Path
from datetime import datetime,timedelta,timezone
p=argparse.ArgumentParser();p.add_argument('step',nargs='?',default='inspect');p.add_argument('--write',action='store_true');args=p.parse_args()
ops=json.loads(Path(__file__).with_name('operations.json').read_text())
if args.step not in ops:sys.exit('Choose: '+', '.join(ops))
for key in ('APPMINT_BASE','ORG_ID','STAFF_TOKEN'):
 if not os.environ.get(key):sys.exit('Set '+key)
values=dict(os.environ,PREFIX=os.environ.get('PREFIX','my-job-course'),PAST_25H=(datetime.now(timezone.utc)-timedelta(hours=25)).isoformat(),FUTURE_1H=(datetime.now(timezone.utc)+timedelta(hours=1)).isoformat())
def substitute(m):
 key=m.group(1)
 if not values.get(key):raise ValueError('Set '+key)
 return json.dumps(values[key])[1:-1]
op=json.loads(re.sub(r'\{\{([A-Z0-9_]+)\}\}',substitute,json.dumps(ops[args.step])))
if op['method']!='GET' and args.step!='get-tasks' and not args.write:sys.exit('Review operations.json; add --write only for an owned training fixture.')
headers={'orgid':os.environ['ORG_ID'],'Authorization':'Bearer '+os.environ['STAFF_TOKEN'],'Content-Type':'application/json'}
request=urllib.request.Request(os.environ['APPMINT_BASE'].rstrip('/')+op['path'],data=json.dumps(op['body']).encode() if 'body'in op else None,headers=headers,method=op['method'])
try:
 with urllib.request.urlopen(request,timeout=60)as response:status=response.status;text=response.read().decode()
except urllib.error.HTTPError as error:status=error.code;text=error.read().decode()
print(json.dumps({'status':status,'result':json.loads(text)if text else None},indent=2))
if status>=400:sys.exit(1)
