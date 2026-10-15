"""Trusted Python host. No automatic retries of calls, sends or provisioning."""
import json, urllib.request, urllib.parse
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs): return None
class Phone:
    def __init__(self, base_url, org, token):
        self.base=base_url.rstrip('/'); self.org=org; self.token=token
    def request(self, method, path, body=None, query=None):
        url=self.base+path+('?' + urllib.parse.urlencode(query) if query else '')
        headers={'orgid':self.org,'Authorization':'Bearer '+self.token,'Content-Type':'application/json'}
        req=urllib.request.Request(url,data=None if body is None else json.dumps(body).encode(),headers=headers,method=method)
        with urllib.request.build_opener(NoRedirect).open(req,timeout=30) as r:
            raw=r.read();return json.loads(raw) if raw else None
    def user_phones(self): return self.request('GET','/phone/user-phones')
    def numbers(self): return self.request('GET','/phone/numbers')
    def voice_app(self): return self.request('GET','/phone/voice/app')
    def devices(self): return self.request('GET','/phone/voice/devices')
    def call_history(self, **query): return self.request('GET','/crm/communications/calls',query=query)
    def register(self, device_id, platform='web', label=None, capabilities=None, apns_environment=None):
        if not device_id: raise ValueError('Persist the device ID before registration')
        if platform not in ['web','ios','android']: raise ValueError('Unsupported platform')
        body={'deviceId':device_id,'platform':platform,'capabilities':capabilities or ['voice']}
        if label:body['label']=label
        if apns_environment:
            if platform!='ios':raise ValueError('APNs environment is iOS-only')
            body['apnsEnvironment']=apns_environment
        return self.request('POST','/phone/voice/register-device',body)
    def heartbeat(self, device_id):return self.request('POST','/phone/voice/heartbeat',{'deviceId':device_id})
    def unregister(self, device_id):return self.request('POST','/phone/voice/unregister-device',{'deviceId':device_id})
    def enable_outbound(self, force=False):return self.request('POST','/phone/voice/app',{'force':force})
    def route_number(self, phone_id, mode):
        if mode not in ['voice','ivr']:raise ValueError('Choose voice or ivr')
        return self.request('POST','/phone/numbers/'+urllib.parse.quote(phone_id,safe='')+'/routing',{'mode':mode})
    def sms_status(self, phone_id):return self.request('GET','/phone/numbers/sms-status/'+urllib.parse.quote(phone_id,safe=''))
    def sms_requirements(self, phone_id):return self.request('GET','/phone/numbers/'+urllib.parse.quote(phone_id,safe='')+'/sms-requirements')
    def send_sms(self, sender, recipients, text):
        if not sender or not recipients or not text:raise ValueError('Select sender, recipient and message')
        return self.request('POST','/crm/inbox/update',{'data':{'deliveryType':'sms','from':sender,'to':recipients,'text':text}},query={'send':'true'})
    def call_ai(self, recipient, reason, **options):
        if not recipient or not reason.strip():raise ValueError('Select controlled recipient and explicit purpose')
        return self.request('POST','/phone/calls/ai',{'to':recipient,'reason':reason,**options})
