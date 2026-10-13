"""Python 3.10+ customer portal workflows. No third-party dependencies.
Keep this instance on your trusted server. An authenticated session supplies token.
No write runs when this file is executed; see README for explicit method examples.
"""
import json
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from urllib.parse import quote, urlencode

class PortalError(Exception):
    def __init__(self,status,body):
        self.status,self.body=status,body
        super().__init__(f'AppEngine returned {status}: {body}')

class Portal:
    def __init__(self,api,org,token,save_session=None):
        self.api,self.org,self.token=api.rstrip('/'),org,token
        self.save_session=save_session or (lambda session: None)
    def call(self,method,path,body=None,query=None):
        url=self.api+path
        if query: url+='?'+urlencode({k:v for k,v in query.items() if v is not None})
        request=Request(url,data=None if body is None else json.dumps(body).encode(),method=method,headers={'orgid':self.org,'Authorization':'Bearer '+self.token,'Content-Type':'application/json'})
        try:
            with urlopen(request,timeout=30) as response: return json.loads(response.read() or b'null')
        except HTTPError as e:
            raw=e.read().decode()
            try: value=json.loads(raw)
            except ValueError: value=raw
            raise PortalError(e.code,value) from e
    def profile(self): return self.call('GET','/client-data/profile')
    def update_profile(self,**patch):
        if not patch or set(patch)-{'firstName','lastName','phone'}: raise ValueError('Only firstName, lastName, phone')
        self.call('PUT','/client-data/profile',patch)
        return self.profile()
    def reservations(self): return self.call('GET','/client-data/reservations')
    def reservation(self,sk): return self.call('GET','/client-data/reservations/'+quote(sk,safe=''))
    def cart(self): return self.call('GET','/storefront/cart/mine')
    def orders(self): return self.call('GET','/client-data/orders')
    def order(self,number): return self.call('GET','/client-data/orders/'+quote(number,safe=''))
    def tickets(self,status=None): return self.call('GET','/client-data/tickets',query={'status':status})
    def ticket(self,number): return self.call('GET','/client-data/tickets/'+quote(number,safe=''))
    def forms(self,page=1,limit=20): return self.call('GET','/client-data/forms',query={'page':page,'limit':limit})
    def open_ticket(self,title,description,collection_id=None):
        body={'data':{'title':title,'description':description}}
        if collection_id: body['collectionId']=collection_id
        saved=self.call('POST','/client-data/tickets',body)
        return self.ticket(saved['data']['name'])
    def availability(self,sk,day,days=7):
        row=self.reservation(sk); data=row['data']
        definition=data.get('reservationDefinitionId') or row.get('owner',{}).get('id')
        if not definition or not data.get('service'): raise ValueError('Missing saved definition/service')
        return self.call('POST','/crm/reservations/availability',{'reservationDefinitionId':definition,'serviceName':data['service'],'from':day,'days':days,'excludeReservationId':row['sk']})
    def move(self,sk,start_time,reason='Customer requested change'):
        self.reservation(sk)
        self.call('POST','/crm/reservations/reschedule/'+quote(sk,safe=''),{'startTime':start_time,'reason':reason,'notify':False})
        return self.reservation(sk)
    def cancel(self,sk):
        row=self.reservation(sk); data=row['data']
        email=data.get('customer',{}).get('email') or data.get('email') or data.get('customerEmail')
        if not email or not data.get('name'): raise ValueError('Verified booking lacks email/code')
        self.call('DELETE','/crm/reservations/cancel/'+quote(email,safe='')+'/'+quote(data['name'],safe=''))
        return self.reservation(sk)
    def members(self,account_id): return self.call('GET','/client-data/shared-accounts/'+quote(account_id,safe='')+'/members')
    def company_orders(self,account_id,page=1,limit=20): return self.call('GET','/client-data/shared-accounts/'+quote(account_id,safe='')+'/orders',query={'page':page,'limit':limit})
    def invite(self,account_id,email,role='buyer'):
        if role not in ('manager','buyer'): raise ValueError('Invalid role')
        return self.call('POST','/client-data/shared-accounts/'+quote(account_id,safe='')+'/invites',{'email':email,'role':role})
    def member(self,account_id,association_id,**patch):
        if not patch or set(patch)-{'role','status'} or patch.get('role','buyer') not in ('manager','buyer') or patch.get('status','active') not in ('active','suspended'): raise ValueError('Invalid membership patch')
        return self.call('PUT','/client-data/shared-accounts/'+quote(account_id,safe='')+'/members/'+quote(association_id,safe=''),patch)
    def switch_account(self,account_id=None):
        session=self.call('POST','/profile/customer/shared-account',{'accountId':account_id} if account_id else {})
        if not session.get('token'): raise ValueError('Account switch returned no token')
        self.save_session(session); self.token=session['token']
        return session['customer']
    def validate_invite(self,token): return self.call('GET','/client-data/shared-accounts/invites/validate/'+quote(token,safe=''))
    def accept_invite(self,token): return self.call('POST','/client-data/shared-accounts/invites/accept/'+quote(token,safe=''))

if __name__=='__main__':
    import os
    client=Portal(os.environ.get('API','https://appengine.appmint.io'),os.environ['ORG'],os.environ['CUSTOMER_TOKEN'])
    for name in ['profile','reservations','orders','tickets','forms']:
        print(name,json.dumps(getattr(client,name)(),indent=2))
