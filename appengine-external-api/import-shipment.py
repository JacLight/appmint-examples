"""AppEngine external supplier adapter. Python 3.10+, standard library only.
Run on a trusted server. Same single-host lock/reconciliation contract as Node.
"""
import hashlib,json,os,sys,urllib.request,urllib.parse,urllib.error
from pathlib import Path

def import_shipment(shipment_id,env=os.environ):
    names=['APPENGINE_ENDPOINT','ORG_ID','STAFF_TOKEN','SUPPLIER_URL','SUPPLIER_KEY','LOCATION_ID']
    for name in names:
        if not env.get(name): raise ValueError('Missing '+name)
    if not shipment_id or len(shipment_id)>100: raise ValueError('Shipment ID required, up to 100 characters')
    reference='northwind:'+shipment_id
    state=Path(env.get('STATE_DIR','.supplier-state'));state.mkdir(parents=True,exist_ok=True)
    state_key=hashlib.sha256(json.dumps([env['ORG_ID'],reference],separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
    lock=state/(state_key+'.lock')
    try: lock.mkdir()
    except FileExistsError: raise RuntimeError('Shipment has an active or interrupted worker; reconcile before clearing the lock')
    def api(method,path,body=None):
        req=urllib.request.Request(env['APPENGINE_ENDPOINT'].rstrip('/')+path,method=method,
            headers={'orgid':env['ORG_ID'],'Authorization':'Bearer '+env['STAFF_TOKEN'],'Content-Type':'application/json'},
            data=None if body is None else json.dumps(body).encode())
        try:
            with urllib.request.urlopen(req,timeout=15) as r: return json.load(r)
        except urllib.error.HTTPError as e: raise
    def existing():
        page=1;matches=[]
        while True:
            r=api('GET','/storefront/inventory/intakes?q='+urllib.parse.quote(reference,safe='')+'&p='+str(page)+'&ps=50')
            hits=[x for x in r['data'] if x['data'].get('reference')==reference and x['data'].get('status')!='cancelled']
            matches.extend(hits)
            if len(matches)>1: raise RuntimeError('Duplicate intake references need manual review')
            if page*50>=r['total'] or not r['data']:return matches[0] if matches else None
            page+=1
    try:
        saved=existing()
        if saved:return {'action':'reused','intake':saved}
        outcome=state/(state_key+'.json')
        previous=json.loads(outcome.read_text()) if outcome.exists() else {}
        if previous.get('status') in ['dispatching','uncertain']:raise RuntimeError('Previous intake creation outcome is uncertain; reconcile before clearing the job marker')
        request=urllib.request.Request(env['SUPPLIER_URL'].rstrip('/')+'/shipments/'+urllib.parse.quote(shipment_id,safe=''),headers={'x-supplier-key':env['SUPPLIER_KEY']})
        try:
            with urllib.request.urlopen(request,timeout=float(env.get('SUPPLIER_TIMEOUT_MS','5000'))/1000) as r:notice=json.load(r)
        except urllib.error.HTTPError as e:raise RuntimeError('Supplier HTTP '+str(e.code)) from e
        if notice.get('shipmentId')!=shipment_id or not isinstance(notice.get('lines'),list) or not notice['lines']:raise ValueError('Unexpected supplier shipment contract')
        if notice.get('currency')!=env.get('CURRENCY','USD'):raise ValueError('Supplier currency differs from receiving location; do not silently convert')
        items=[];seen=set()
        import math
        for line in notice['lines']:
            quantity,cost=line.get('quantity'),line.get('unitPrice')
            if not line.get('supplierSku') or isinstance(quantity,bool) or not isinstance(quantity,(int,float)) or not math.isfinite(quantity) or quantity<=0 or isinstance(cost,bool) or not isinstance(cost,(int,float)) or not math.isfinite(cost) or cost<0:raise ValueError('Invalid supplier SKU, quantity or cost')
            match=api('POST','/repository/find/sf_product',{'query':{'data.supplierSku':line['supplierSku']},'options':{'page':1,'pageSize':2}})['data']
            if len(match)!=1:raise ValueError(line['supplierSku']+': expected exactly one mapped product; found '+str(len(match)))
            sku=match[0]['data']['sku']
            if sku in seen:raise ValueError('Two supplier lines map to the same SKU; consolidate explicitly')
            seen.add(sku);items.append({'sku':sku,'quantity':quantity,'unitCost':cost})
        body={'vendorName':'Northwind Timber — teaching supplier','locationId':env['LOCATION_ID'],'items':items,'reference':reference,'expectedDate':notice.get('estimatedArrival'),'notes':'Synthetic course shipment. Source purchase order '+str(notice.get('purchaseOrder'))}
        outcome.write_text(json.dumps({'reference':reference,'status':'dispatching'}))
        try:intake=api('POST','/storefront/inventory/intakes',body)
        except Exception as failure:
            if isinstance(failure,urllib.error.HTTPError) and 400<=failure.code<500:
                outcome.unlink();raise
            saved=existing()
            if saved:
                outcome.write_text(json.dumps({'reference':reference,'status':'verified','intakeId':saved['sk']}))
                return {'action':'reconciled','intake':saved}
            outcome.write_text(json.dumps({'reference':reference,'status':'uncertain'}))
            raise RuntimeError('Intake creation outcome uncertain; reconcile before retrying') from failure
        outcome.write_text(json.dumps({'reference':reference,'status':'verified','intakeId':intake['sk'],'intakeNumber':intake['data']['intakeNumber']},indent=2))
        return {'action':'created','intake':intake}
    finally:lock.rmdir()
if __name__=='__main__':
    try:
        result=import_shipment(sys.argv[1] if len(sys.argv)>1 else '')
        print(json.dumps({'action':result['action'],'intakeId':result['intake']['sk'],**result['intake']['data']},indent=2))
    except Exception as e:print(str(e),file=sys.stderr);sys.exit(1)
