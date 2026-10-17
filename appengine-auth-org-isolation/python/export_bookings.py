"""Server-side export; standard library only. Credentials come from the environment."""
import csv,json,os,re,urllib.request,urllib.error
from datetime import date
origin=os.environ['APPENGINE_API_ORIGIN'].rstrip('/')
org=os.environ['APPENGINE_ORG'];key=os.environ['APPENGINE_JOB_KEY']
start=os.environ['EXPORT_FROM'];end=os.environ['EXPORT_BEFORE']
if date.fromisoformat(start)>=date.fromisoformat(end):raise ValueError('Start must precede exclusive end')
rows=[];page=1
while True:
    payload={'query':{'data.status':'confirmed','data.startTime':{'$gte':start+'T00:00:00.000Z','$lt':end+'T00:00:00.000Z'}},'options':{'page':page,'pageSize':50}}
    req=urllib.request.Request(origin+'/repository/find/reservation',data=json.dumps(payload).encode(),headers={'orgid':org,'x-api-key':key,'Content-Type':'application/json'},method='POST')
    try:
        with urllib.request.urlopen(req,timeout=30) as r:result=json.load(r)
    except urllib.error.HTTPError as e:raise RuntimeError(f'Export refused: HTTP {e.code}') from None
    if not isinstance(result.get('data'),list):raise ValueError('Unexpected repository response')
    rows.extend(result['data'])
    if not result.get('hasNext'):break
    page+=1
    if page>100:raise RuntimeError('Safety page limit; narrow dates or add durable checkpoints')
def safe(v):
    text='' if v is None else str(v)
    return "'"+text if re.match(r'^\s*[=+\-@]|^[\t\r\n]',text) else text
out=os.environ.get('EXPORT_FILE','confirmed-bookings.csv')
fd=os.open(out,os.O_WRONLY|os.O_CREAT|os.O_TRUNC,0o600)
with os.fdopen(fd,'w',newline='') as f:
    w=csv.writer(f);w.writerow(['id','title','start','status'])
    for r in rows:
        d=r['data'];w.writerow(map(safe,[r['sk'],d.get('title')or d.get('serviceName')or d.get('name'),d.get('startTime'),d.get('status')]))
print(f'Exported {len(rows)} bookings across {page} API pages')
