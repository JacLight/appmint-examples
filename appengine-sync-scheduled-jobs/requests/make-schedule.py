"""Print a fresh request body; does not send a network request.
python3 make-schedule.py --datatype YOUR_TYPE --target YOUR_RECORD_ID > request.json
Add --cron for a bounded every-minute repeat. Both examples update data.status.
"""
import argparse,json
from datetime import datetime,timedelta,timezone
p=argparse.ArgumentParser();p.add_argument('--datatype',required=True);p.add_argument('--target',required=True);p.add_argument('--cron',action='store_true');a=p.parse_args()
now=datetime.now(timezone.utc);iso=lambda dt:dt.isoformat(timespec='milliseconds').replace('+00:00','Z')
d={'name':'course-status-'+now.strftime('%Y%m%d%H%M%S'),'title':'Course isolated timed action','type':'cron' if a.cron else 'simple','status':'active','target':[{'datatype':a.datatype,'id':a.target}]}
if a.cron:d.update(cron={'value':'* * * * *','timezone':'America/Chicago','action':'update-status','actionArgs':'ready'},end={'date':iso(now+timedelta(minutes=3))})
else:d.update(start={'date':iso(now+timedelta(minutes=2)),'action':'update-status','actionArgs':'ready'},end={'date':iso(now+timedelta(minutes=3)),'action':'update-status','actionArgs':'finished'})
print(json.dumps({'datatype':'schedule','isNew':True,'data':d},indent=2))
