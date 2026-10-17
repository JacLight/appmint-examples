"""Python3.10+ standard-library direct customer client; no application secret."""
import os,json,sys,urllib.request,urllib.error,getpass
from pathlib import Path
base=os.environ['APPENGINE_ENDPOINT'].rstrip('/');org=os.environ['ORG_ID'];session=Path(os.environ.get('SESSION_FILE',str(Path.home()/'.appengine-commerce-python.json')))
token=os.environ.get('CUSTOMER_TOKEN') or (json.loads(session.read_text()).get('token') if session.exists() else None)
def call(method,route,body=None):
 headers={'orgid':org,'Content-Type':'application/json'}
 if token:headers['Authorization']='Bearer '+token
 req=urllib.request.Request(base+'/'+route,headers=headers,method=method,data=json.dumps(body).encode() if body is not None else None)
 try:
  with urllib.request.urlopen(req,timeout=20) as r:text=r.read().decode();return json.loads(text) if text else None
 except urllib.error.HTTPError as e:raise SystemExit(f'HTTP {e.code}: '+e.read().decode())
args=sys.argv[1:];cmd=args[0] if args else 'products';v=args[1] if len(args)>1 else None
from urllib.parse import quote
if cmd=='signin':
 result=call('POST','profile/customer/signin',{'email':os.environ.get('CUSTOMER_EMAIL') or input('Email: '),'password':os.environ.get('CUSTOMER_PASSWORD') or getpass.getpass('Password: ')})
 if result.get('requiresPasswordChange') or result.get('requiresTwoFactor') or not result.get('token'):raise SystemExit('Complete verification/password change through API Foundations first.')
 session.write_text(json.dumps({'token':result['token']}));session.chmod(0o600);result={'signedIn':True,'sessionFile':str(session)}
elif cmd in ['products','profile','cart','gateways','orders']:result=call('GET',{'products':'storefront/products?p=1&ps=12','profile':'client-data/profile','cart':'storefront/cart/mine','gateways':'storefront/payment-gateways','orders':'client-data/orders'}[cmd])
elif cmd in ['product','order']:result=call('GET',('storefront/product/' if cmd=='product' else 'client-data/orders/')+quote(v,safe=''))
elif cmd in ['shipping','quote']:result=call('POST','shipping/options' if cmd=='shipping' else 'storefront/pricing/calculate-cart',json.loads(Path(v).read_text()))
elif cmd=='save':
 data=json.loads(Path(v).read_text());profile=call('GET','client-data/profile');address=json.loads(Path(args[2]).read_text());result=call('POST','storefront/cart/update/'+quote(data['cartId'],safe=''),{'datatype':'sf_cart','data':dict(data,shippingAddress=address,email=profile['data']['email'],source='website')})
elif cmd=='logout':session.unlink(missing_ok=True);result={'localSessionRemoved':True}
else:raise SystemExit('Use signin/profile/products/product SKU/shipping FILE/quote FILE/save QUOTE ADDRESS/cart/gateways/orders/order NUMBER/logout')
print(json.dumps(result,indent=2))
