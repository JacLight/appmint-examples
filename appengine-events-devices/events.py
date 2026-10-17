"""Python stdlib host adapter; no claimed Python SDK, no automatic write retries."""
import json,urllib.request,urllib.parse
class Client:
    def __init__(self,url,org,staff_token):self.url=url.rstrip('/');self.org=org;self.token=staff_token
    def request(self,method,path,body=None,query=None):
        url=self.url+'/'+path.lstrip('/')
        if query:url+='?'+urllib.parse.urlencode(query)
        req=urllib.request.Request(url,data=None if body is None else json.dumps(body).encode(),method=method,headers={'orgid':self.org,'Authorization':'Bearer '+self.token,'Content-Type':'application/json'})
        class NoRedirect(urllib.request.HTTPRedirectHandler):
            def redirect_request(self,*args,**kwargs):return None
        with urllib.request.build_opener(NoRedirect).open(req,timeout=30) as res:
            raw=res.read();return json.loads(raw) if raw else None
class Venue:
    def __init__(self,client,event_id,zone,entrance,benefit_point=None,credential_entrance=None):
        self.client=client;self.event=event_id;self.zone=zone;self.entrance=entrance;self.benefit_point=benefit_point;self.credential_entrance=credential_entrance
    def scan(self,code,point=None):return {'eventId':self.event,'zone':self.zone,'checkpoint':point or self.entrance,'code':code}
    def occupancy(self):return self.client.request('GET','/events/'+urllib.parse.quote(self.event,safe='')+'/occupancy')
    def admit(self,code):
        result=self.client.request('POST','/events/checkin',self.scan(code))
        return self.readback(result)
    def exit(self,code):
        result=self.client.request('POST','/events/checkout',self.scan(code))
        return self.readback(result)
    def readback(self,result):
        try:return {'decision':result,'occupancy':self.occupancy()}
        except Exception:return {'decision':result,'occupancy':None,'refreshError':'Count refresh failed; retry the read, not the saved action.'}
    def benefit(self,code,redeem=False):
        if not self.benefit_point:raise ValueError('Choose a configured benefit point')
        return self.client.request('POST','/events/verify-scan',{**self.scan(code,self.benefit_point),'redeem':redeem})
    def assign_credential(self,code,ticket_id):return self.client.request('POST','/events/credentials/assign',{'credentialCode':code,'ticketId':ticket_id})
    def badge(self,ticket_id):return self.client.request('GET','/events/tickets/'+urllib.parse.quote(ticket_id,safe='')+'/badge')
    def event_record(self):return self.client.request('GET','/events/'+urllib.parse.quote(self.event,safe=''))
    def tickets(self):return self.client.request('GET','/events/'+urllib.parse.quote(self.event,safe='')+'/tickets')
    def stats(self):return self.client.request('GET','/events/'+urllib.parse.quote(self.event,safe='')+'/checkin-stats')
    def fresh_qr(self,ticket_id):return self.client.request('GET','/events/tickets/'+urllib.parse.quote(ticket_id,safe='')+'/qr')
    def perks(self,ticket_id):return self.client.request('GET','/events/tickets/'+urllib.parse.quote(ticket_id,safe='')+'/perks')
    def import_credential(self,code):return self.client.request('POST','/events/'+urllib.parse.quote(self.event,safe='')+'/credentials/import',{'codes':[code],'type':'wristband','codeFormat':'barcode'})
    def revoke_credential(self,code):return self.client.request('POST','/events/credentials/'+urllib.parse.quote(code,safe='')+'/revoke',{'reason':'Training credential retired'})
    def preview_badge_dispatch(self,ticket_id):
        badge=self.badge(ticket_id);data=badge['badgeData']
        result=self.client.request('POST','/device-integrations/call',{'capability':'print','data':{'ticketType':'label','lines':[{'kind':'text','text':data.get('holderName') or 'Guest'},{'kind':'text','text':data['eventTitle']},{'kind':'barcode','data':data['code'],'type':'CODE128'}]}},{'adapter':'console'})
        return {'badge':badge,'dispatch':result,'physicalOutputVerified':False}

    def admit_credential(self,code):
        if not self.credential_entrance:raise ValueError('Choose an entrance configured with matchField credential_code')
        return self.readback(self.client.request('POST','/events/checkin',self.scan(code,self.credential_entrance)))
