"""Standard-library AppEngine client. Staff and employee sessions stay separate."""
import json
import urllib.request
import urllib.parse
import urllib.error

def enc(value):
    return urllib.parse.quote(str(value), safe='')

class Client:
    def __init__(self, base_url, org_id, token):
        self.base_url, self.org_id, self.token = base_url.rstrip('/'), org_id, token
    def request(self, method, path, body=None, query=None):
        url = self.base_url + '/' + path.lstrip('/')
        if query:
            url += '?' + urllib.parse.urlencode({k:v for k,v in query.items() if v is not None})
        req = urllib.request.Request(url, data=None if body is None else json.dumps(body).encode(), method=method,
            headers={'orgid':self.org_id, 'Authorization':'Bearer '+self.token, 'Content-Type':'application/json'})
        # No automatic retry: a lost write response can conceal a saved mutation.
        with urllib.request.urlopen(req, timeout=45) as res:
            raw=res.read().decode()
            return json.loads(raw) if raw else None

class Employees:
    def __init__(self, client, name, workspace_id=None, conversation_id=None, assistant_id=None):
        self.client,self.name,self.workspace,self.conversation,self.assistant=client,name,workspace_id,conversation_id,assistant_id
    def detail(self): return self.client.request('GET', '/ai-employees/'+enc(self.name))
    def config(self): return self.client.request('GET','/ai-employees/config')
    def templates(self): return self.client.request('GET','/ai-employees/templates')
    def create(self,profile): return self.client.request('POST','/ai-employees',profile)
    def access(self,groups=None): return self.client.request('GET' if groups is None else 'PUT','/ai-employees/'+enc(self.name)+'/access',None if groups is None else {'groups':groups})
    def instructions(self): return self.client.request('GET','/ai-employees/'+enc(self.name)+'/instructions')
    def update(self,changes): return self.client.request('PUT','/ai-employees/'+enc(self.name),changes)
    def provider_status(self): return self.client.request('GET','/ai-employees/'+enc(self.name)+'/provider-status')
    def provision(self): return self.client.request('POST','/ai-employees/'+enc(self.name)+'/provision',{})
    def switch_on(self): return self.client.request('POST','/ai-employees/'+enc(self.name)+'/switch-on',{})
    def pause(self): return self.client.request('POST','/ai-employees/'+enc(self.name)+'/pause',{})
    def work(self): return self.client.request('GET','/ai-employees/work',query={'employee':self.name,'pageSize':50})
    def work_detail(self,work_id): return self.client.request('GET','/ai-employees/work/'+enc(work_id))
    def give_work(self,title,instructions): return self.client.request('POST','/ai-employees/'+enc(self.name)+'/work',{'title':title,'instructions':instructions})
    def assign_task(self,title,description,email):
        return self.client.request('POST','/workspace/'+enc(self.workspace)+'/item',{'type':'task','title':title,'task':{'title':title,'description':description,'assignTo':[email]}})
    def messages(self,shared=False): return self.client.request('GET','/workspace/'+enc(self.workspace if shared else self.conversation)+'/items',query={'limit':50})
    def say(self,message,shared=False,email=None):
        if shared and not email: raise ValueError('Mention the selected employee')
        return self.client.request('POST','/workspace/'+enc(self.workspace if shared else self.conversation)+'/item',{'type':'message','message':message,**({'mentions':[email]} if shared else {})})
    def decide(self,work_id,decision,note=None):
        if decision not in ('approved','rejected'): raise ValueError('Choose approved or rejected')
        return self.client.request('POST','/ai-employees/work/'+enc(work_id)+'/decide',{'decision':decision,'note':note})
    def retry(self,work_id): return self.client.request('POST','/ai-employees/work/'+enc(work_id)+'/retry',{})
    def summary(self,since): return self.client.request('GET','/ai-employees/worker/'+enc(self.name)+'/summary',query={'since':since})
    def execute_assistant(self,task):
        if not self.assistant: raise ValueError('Select the configured Assistant')
        return self.client.request('POST','/crm/ai-assistant/'+enc(self.assistant)+'/execute',{'task':task})

class EmployeeWorker:
    def __init__(self,client,name,worker): self.client,self.name,self.worker=client,name,worker
    def hello(self,runtime): return self.client.request('POST','/ai-employees/me/hello',runtime)
    def step(self,work_id,text): return self.action(work_id,'step',{'kind':'note','text':text})
    def briefing(self): return self.client.request('GET','/ai-employees/me/briefing')
    def lease(self): return self.client.request('POST','/ai-employees/worker/'+enc(self.name)+'/lease',{'worker':self.worker})
    def action(self,work_id,action,payload): return self.client.request('POST','/ai-employees/worker/work/'+enc(work_id)+'/'+action,{**payload,'worker':self.worker})
    def approval(self,work_id,summary): return self.action(work_id,'approval',{'action':'other','summary':summary})
    def complete(self,work_id,result,cost_usd=0): return self.action(work_id,'complete',{'result':result,'costUsd':cost_usd})
    def fail(self,work_id,error,retry=False): return self.action(work_id,'fail',{'error':error,'retry':retry})
