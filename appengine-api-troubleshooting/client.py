"""Python3.10+. Read-only diagnostics; no token or password is printed."""
import os,json,urllib.request,urllib.error
class ApiFailure(Exception):
 def __init__(self,status,body):self.status=status;self.body=body;super().__init__(f'AppEngine HTTP {status}')
def request(method,path,body=None):
 base=os.environ['APPENGINE_ENDPOINT'].rstrip('/');org=os.environ['ORG_ID'];token=os.environ.get('CUSTOMER_TOKEN','')
 headers={'orgid':org,'Content-Type':'application/json'}
 if token:headers['Authorization']='Bearer '+token
 req=urllib.request.Request(base+path,data=json.dumps(body).encode() if body is not None else None,headers=headers,method=method)
 try:r=urllib.request.urlopen(req,timeout=10)
 except urllib.error.HTTPError as e:r=e
 raw=r.read().decode()
 try:value=json.loads(raw)
 except json.JSONDecodeError:value=raw
 if not 200<=r.status<300:raise ApiFailure(r.status,value)
 return value
def booking_view(record):
 data=record.get('data',{})
 if not isinstance(record.get('sk'),str) or not isinstance(data.get('service'),str) or not isinstance(data.get('status'),str):raise ValueError('Unexpected booking response shape')
 return {'id':record['sk'],'code':data.get('name'),'service':data['service'],'status':data['status'],'startTime':data.get('startTime'),'timezone':data.get('timezone'),'customer':data.get('customer',{}).get('name')}
def diagnose(record_id):
 import re
 if not re.fullmatch(r'[a-fA-F0-9]{24}',record_id):raise ValueError('BOOKING_ID must be an actual saved record ID')
 version=request('GET','/version');profile=request('GET','/client-data/profile');booking=request('GET','/client-data/reservations/'+record_id)
 return {'version':version,'customer':profile.get('data',{}).get('firstName'),'booking':booking_view(booking)}
if __name__=='__main__':
 try:print(json.dumps(diagnose(os.environ['BOOKING_ID']),indent=2))
 except ApiFailure as e:print(json.dumps({'status':e.status,'response':e.body},indent=2));raise SystemExit(1)
