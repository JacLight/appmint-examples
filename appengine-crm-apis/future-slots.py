# Generates request JSON only; does not contact AppEngine or book anything.
import datetime,json,sys
from zoneinfo import ZoneInfo
if len(sys.argv)!=2:raise SystemExit('Usage: python3 future-slots.py YOUR_DEFINITION_ID')
day=datetime.datetime.now(ZoneInfo('America/Chicago')).date()+datetime.timedelta(days=3)
while day.weekday()>4:day+=datetime.timedelta(days=1)
print(json.dumps({'reservationDefinitionId':sys.argv[1],'serviceName':'API consultation','serviceDate':str(day)},indent=2))
