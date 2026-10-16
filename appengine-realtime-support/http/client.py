"""HTTP setup/reference examples; guest auth and session restoration were demonstrated."""
import os,json,pathlib,sys,urllib.request,urllib.error,urllib.parse,uuid
HERE=pathlib.Path(__file__).resolve().parent
OPS=json.loads((HERE/'operations.json').read_text())
def env(key):
    value=os.environ.get(key)
    if not value:raise ValueError('Set '+key)
    return value
def expand(value):
    import re
    if isinstance(value,str):return re.sub(r'\$\{([A-Z_]+)\}',lambda m:env(m.group(1)),value)
    if isinstance(value,list):return [expand(x) for x in value]
    if isinstance(value,dict):return {k:expand(v) for k,v in value.items()}
    return value
def request_parts(action,file=None):
    import re
    op=OPS[action];route=re.sub(r'\{([A-Z_]+)\}',lambda m:urllib.parse.quote(env(m.group(1)),safe=''),op['path'])
    headers={'orgid':env('APPENGINE_ORG')}
    if op.get('staff'):headers['Authorization']='Bearer '+env('APPENGINE_STAFF_TOKEN')
    if op.get('guestToken'):headers['Authorization']='Bearer '+env('APPENGINE_GUEST_TOKEN')
    if op.get('guest'):headers['appId']=env('APPENGINE_APP_ID')
    data=None
    if op.get('multipart'):
        if not file:raise ValueError('Provide a local attachment filename')
        f=pathlib.Path(file);boundary='AppmintCourse'+uuid.uuid4().hex
        # Controlled local fixtures; quotes/newlines must not become multipart headers.
        name=f.name.replace('"','_').replace('\r','_').replace('\n','_')
        data=(f'--{boundary}\r\nContent-Disposition: form-data; name="files"; filename="{name}"\r\nContent-Type: application/octet-stream\r\n\r\n'.encode()+f.read_bytes()+f'\r\n--{boundary}--\r\n'.encode())
        headers['Content-Type']='multipart/form-data; boundary='+boundary
    elif op.get('body'):
        data=json.dumps(expand(json.loads((HERE/'json'/op['body']).read_text()))).encode();headers['Content-Type']='application/json'
    return op,env('APPENGINE_URL').rstrip('/')+route,headers,data
if __name__=='__main__':
    action=sys.argv[1];op,url,headers,data=request_parts(action,sys.argv[2] if len(sys.argv)>2 else None)
    if op.get('guest'):print('Guest authentication: existing app identity required; may create a guest customer record.',file=sys.stderr)
    request=urllib.request.Request(url,data=data,headers=headers,method=op['method'])
    try:
        with urllib.request.urlopen(request,timeout=30) as response:status=response.status;raw=response.read().decode()
    except urllib.error.HTTPError as error:status=error.code;raw=error.read().decode()
    try:result=json.loads(raw) if raw else None
    except json.JSONDecodeError:result=raw
    print(json.dumps({'status':status,'body':result},indent=2));sys.exit(0 if status<400 else 1)
