"""Complete AppEngine form→workflow→reviewer decision, Python3 standard library."""
import os,json,time,urllib.request,urllib.error,urllib.parse
base=os.environ['APPENGINE_URL'];org=os.environ['APPENGINE_ORG'];admin=os.environ['APPENGINE_TOKEN'];reviewer=os.environ['REVIEWER_TOKEN'];email=os.environ['REVIEWER_EMAIL'];name=os.environ.get('FORM_NAME','warranty-'+str(int(time.time()*1000)))
def call(method,path,body=None,token=None):
 headers={'orgid':org,'Content-Type':'application/json'}
 if token:headers['Authorization']='Bearer '+token
 request=urllib.request.Request(base+path,method=method,headers=headers,data=json.dumps(body).encode()if body is not None else None)
 try:r=urllib.request.urlopen(request,timeout=30)
 except urllib.error.HTTPError as e:raise RuntimeError(f'HTTP {e.code}: {e.read().decode()}')from e
 raw=r.read();return json.loads(raw)if raw else None
stages=[{'id':0,'type':'start','name':'Waiting for approval','modelState':'inprogress','modelStatus':'new','assignRule':{'type':'users','users':[email]},'notificationTemplate':[]},{'id':1,'type':'done','name':'Approved','modelState':'completed','modelStatus':'approved','notificationTemplate':[]},{'id':2,'type':'done','name':'Rejected','modelState':'completed','modelStatus':'rejected','notificationTemplate':[]}]
workflow=call('POST','/workflow/definition',{'name':name,'title':'Warranty Claim Approval','enabled':True,'notificationTemplate':[],'stages':stages},admin)
properties={k:{'type':'string','title':label,**({'format':'email'}if k=='email'else{})}for k,label in [('fullName','Full name'),('email','Email'),('orderNumber','Order number'),('bikeModel','Bike model'),('problem','Problem')]}
form=call('PUT','/repository/create',{'datatype':'crm_form','isNew':True,'data':{'name':name,'title':'Warranty claim','status':'open','authenticationType':'email','workflow':name,'schema':{'type':'object','properties':properties,'required':list(properties)}}},admin)
answers={'fullName':'Dana Ruiz','email':os.environ.get('CLAIM_EMAIL','dana@example.invalid'),'orderNumber':'HC-1042','bikeModel':'Harbor Trail 2','problem':'Frame crack after three weeks'}
call('GET','/client/forms/'+name+'?'+urllib.parse.urlencode({'email':answers['email']}))
submission=call('POST','/client/forms/'+name+'/submit',answers)
route='/workflow/position/form_submission/'+submission['sk'];waiting=call('GET',route,token=admin)
if not waiting or not waiting.get('taskSk'):raise RuntimeError('Submission saved but workflow missing. Keep ID '+submission['sk']+' and recover without resubmitting.')
tray=call('GET','/approval/tray',token=reviewer)
if not any(t['id']==waiting['taskSk']for t in tray['waitingOnMe']):raise RuntimeError('Reviewer token is not assigned')
decision=call('POST','/approval/task/'+waiting['taskSk']+'/approve',{'note':'Frame defect confirmed. Replacement approved.'},reviewer)
source=call('GET','/repository/get/form_submission/'+submission['sk'],token=admin);position=call('GET',route,token=admin)
assert position['isFinal']and source['data']['status']=='approved','Final approved state not confirmed'
print(json.dumps({'workflowId':workflow['sk'],'formId':form['sk'],'claimId':submission['sk'],'taskId':waiting['taskSk'],'decision':decision['decision'],'status':source['data']['status'],'history':position['history']},indent=2))
