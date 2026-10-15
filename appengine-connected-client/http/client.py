"""Python 3 standard-library equivalent. Tokens remain in process memory."""
import json
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from urllib.parse import quote
class AppEngineError(Exception):
    def __init__(self,status,body):
        self.status,self.body=status,body
        super().__init__(body.get('error') or body.get('message','Request refused'))
class AppEngineCustomer:
    def __init__(self,base,org):
        self.base,self.org,self.token,self.refresh_token=base.rstrip('/'),org,'',''
    def request(self,method,path,body=None,authenticated=True):
        headers={'Content-Type':'application/json','orgid':self.org}
        if authenticated and self.token: headers['Authorization']='Bearer '+self.token
        req=Request(self.base+path,data=None if body is None else json.dumps(body).encode(),headers=headers,method=method)
        try:
            with urlopen(req,timeout=30) as response:return json.loads(response.read())
        except HTTPError as error:
            raw=error.read().decode()
            try: body=json.loads(raw)
            except ValueError: body={'message':raw}
            raise AppEngineError(error.code,body) from None
    def sign_in(self,email,password):
        value=self.request('POST','/profile/customer/signin',{'email':email,'password':password},False)
        self.token=value.get('token') or value.get('access_token','')
        self.refresh_token=value.get('refresh_token') or value.get('refreshToken','')
        return {'signed_in':True} if self.token else {'signed_in':False,'challenge':value}
    def refresh(self):
        v=self.request('POST','/profile/customer/refresh',{'refresh_token':self.refresh_token},False)
        self.token=v.get('token') or v.get('access_token','')
        self.refresh_token=v.get('refresh_token') or v.get('refreshToken') or self.refresh_token
        return bool(self.token)
    def definitions(self):return self.request('GET','/crm/reservations/definitions',authenticated=False)
    def slots(self,definition,service,day):return self.request('POST','/crm/reservations/slots',{'reservationDefinitionId':definition,'serviceName':service,'serviceDate':day})
    def schema(self,name):return self.request('GET','/repository/collections/'+quote(name,safe=''))
    def book(self,definition,service,start,answers=None,end=None):return self.request('POST','/client-data/reservations',{'reservationDefinitionId':definition,'service':service,'startTime':start,**({'endTime':end} if end else {}),**({'form':answers} if answers is not None else {})})
    def mine(self):return self.request('GET','/client-data/reservations')
    def read(self,record_id):return self.request('GET','/client-data/reservations/'+quote(record_id,safe=''))
    def move(self,record_id,start):return self.request('POST','/crm/reservations/reschedule/'+quote(record_id,safe=''),{'startTime':start,'reason':'Customer requested change','notify':False})
    def cancel(self,record_id):
        d=self.read(record_id)['data']
        return self.request('DELETE','/crm/reservations/cancel/'+quote(d['customer']['email'],safe='')+'/'+quote(d['name'],safe=''))
    def sign_out(self):self.token,self.refresh_token='',''
