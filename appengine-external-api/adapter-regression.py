"""No-network regressions for paginated duplicate detection and tenant state."""
import importlib.util,json,hashlib,tempfile,io,urllib.request
from pathlib import Path
spec=importlib.util.spec_from_file_location('adapter',Path(__file__).with_name('import-shipment.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
with tempfile.TemporaryDirectory(prefix='supplier-regression-') as d:
 env=dict(APPENGINE_ENDPOINT='https://api.invalid',ORG_ID='org-a',STAFF_TOKEN='test',SUPPLIER_URL='https://supplier.invalid',SUPPLIER_KEY='test',LOCATION_ID='receiving',STATE_DIR=d);sid='same-shipment';ref='northwind:'+sid;original=urllib.request.urlopen;pages=[]
 def response(v):return io.BytesIO(json.dumps(v).encode())
 def paged(req,**kwargs):
  from urllib.parse import urlparse,parse_qs
  u=urlparse(req.full_url);assert u.hostname=='api.invalid';page=int(parse_qs(u.query)['p'][0]);pages.append(page)
  return response({'total':51,'data':([{'sk':'first','data':{'reference':ref,'status':'pending'}}]+[{'sk':str(i),'data':{'reference':str(i),'status':'pending'}}for i in range(49)])if page==1 else[{'sk':'second','data':{'reference':ref,'status':'pending'}}]})
 try:
  urllib.request.urlopen=paged
  try:m.import_shipment(sid,env);raise AssertionError('Duplicate accepted')
  except RuntimeError as e:assert 'Duplicate intake references' in str(e)
  assert pages==[1,2]
  key=lambda org:hashlib.sha256(json.dumps([org,ref],separators=(',',':')).encode()).hexdigest()
  marker=Path(d)/(key('org-a')+'.json');marker.write_text(json.dumps({'reference':ref,'status':'uncertain'}));creates=[]
  def fake(req,**kwargs):
   if req.full_url.startswith('https://supplier.invalid'):return response({'shipmentId':sid,'currency':'USD','lines':[{'supplierSku':'SUP-1','quantity':1,'unitPrice':2}],'purchaseOrder':'PO','estimatedArrival':'2026-10-15'})
   if '/repository/find/' in req.full_url:return response({'data':[{'data':{'sku':'LOCAL-1'}}]})
   if req.method=='GET':return response({'total':0,'data':[]})
   creates.append(req);return response({'sk':'org-b-intake','data':{'intakeNumber':'INT-B','status':'pending'}})
  urllib.request.urlopen=fake
  try:m.import_shipment(sid,env);raise AssertionError('Uncertainty accepted')
  except RuntimeError as e:assert 'outcome is uncertain' in str(e)
  assert len(creates)==0;assert m.import_shipment(sid,{**env,'ORG_ID':'org-b'})['action']=='created';assert len(creates)==1
  assert json.loads(marker.read_text())['status']=='uncertain';assert json.loads((Path(d)/(key('org-b')+'.json')).read_text())['status']=='verified'
  print('python: cross-page duplicate rejected; org A uncertainty preserved; org B independent')
 finally:urllib.request.urlopen=original
