"""Python 3.10+ client; standard library only. Keeps its cookie jar private."""
import os,json,sys,urllib.request,urllib.error,http.cookiejar,getpass
from pathlib import Path
base=os.environ.get('GATEWAY_BASE','http://127.0.0.1:4320').rstrip('/')
jarpath=Path(os.environ.get('COOKIE_JAR',str(Path.home()/'.appengine-gateway-cookies')))
jar=http.cookiejar.MozillaCookieJar(str(jarpath))
if jarpath.exists():jar.load(ignore_discard=True,ignore_expires=True)
client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
cmd=sys.argv[1]if len(sys.argv)>1 else'profile';data=None;method='GET'
if cmd=='signin':route='/auth/signin';method='POST';data={'email':os.environ.get('CUSTOMER_EMAIL')or input('Customer email: '),'password':os.environ.get('CUSTOMER_PASSWORD')or getpass.getpass('Password: ')}
elif cmd=='logout':route='/auth/logout';method='POST';data={}
elif cmd=='reservation':route='/api/reservations/'+sys.argv[2]
elif cmd in ['profile','reservations']:route='/api/'+cmd
else:raise SystemExit('Use signin, profile, reservations, reservation ID, logout')
r=urllib.request.Request(base+route,method=method,headers={'Content-Type':'application/json'},data=json.dumps(data).encode()if data is not None else None)
try:response=client.open(r,timeout=15)
except urllib.error.HTTPError as e:response=e
with response:print(json.dumps({'status':response.status,'body':json.load(response)},indent=2))
jar.save(ignore_discard=True,ignore_expires=True);os.chmod(jarpath,0o600)
if response.status>=400:sys.exit(1)
