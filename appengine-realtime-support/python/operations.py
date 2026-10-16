"""One explicit Socket.IO operation. Uses the same exact JSON templates as Node."""
import os,json,pathlib,re,sys,threading,time
import socketio
def env(k):
    v=os.environ.get(k)
    if not v:raise ValueError('Set '+k)
    return v
def expand(v):
    if isinstance(v,str):return re.sub(r'\$\{([A-Z_]+)\}',lambda m:env(m.group(1)),v)
    if isinstance(v,list):return [expand(x) for x in v]
    if isinstance(v,dict):return {k:expand(x) for k,x in v.items()}
    return v
ops=json.loads((pathlib.Path(__file__).resolve().parents[1]/'node/operations.json').read_text())
operation=sys.argv[1]
if operation not in ops:raise ValueError('Choose '+', '.join(ops))
sio=socketio.Client();ready=threading.Event();authenticated={}
@sio.on('authenticate',namespace='/chat')
def auth(value):authenticated.update(value);ready.set()
for event in ['message','agent-assigned','queued','queue-update','chat-ended','status','update','error']:
    sio.on(event,lambda value,event=event:print(event,json.dumps(value)),namespace='/chat')
def call(event,data):
    value=sio.call(event,data,namespace='/chat',timeout=30)
    if value.get('success') is False:raise RuntimeError(json.dumps(value))
    return value
try:
    credentials={'orgId':env('APPENGINE_ORG'),'token':env('APPENGINE_TOKEN')}
    if os.environ.get('APPENGINE_CHAT_CONFIG'):credentials['configId']=env('APPENGINE_CHAT_CONFIG')
    sio.connect(env('APPENGINE_URL'),auth=credentials,namespaces=['/chat'],transports=['websocket'])
    if not ready.wait(20) or not authenticated.get('success'):raise RuntimeError('Authentication failed or timed out')
    if operation in ['set-status','queue-stats','pick-next','takeover-chat','sendMessage','resume-ai','close-chat'] and authenticated.get('user',{}).get('role')!='agent':raise RuntimeError('Authorized staff session required')
    if operation=='pick-next':
        target=env('APPENGINE_CHAT_ID')
        if env('APPENGINE_CONFIRM_PICK_CHAT_ID')!=target or env('APPENGINE_ISOLATED_QUEUE')!='yes':raise RuntimeError('Confirm exact owned target and isolated queue')
        stats=call('queue-stats',{});position=call('queue-position',{'chatId':target})
        if stats.get('stats',{}).get('size')!=1 or position.get('position')!=1:raise RuntimeError('Refusing pickup: target must be the only queued chat')
        result=call(operation,{})
        print('ack',json.dumps(result))
        if result.get('chat',{}).get('chatId')!=target:raise RuntimeError('Queue changed: inspect assignment; do not retry')
    else:print('ack',json.dumps(call(operation,expand(ops[operation]))))
    time.sleep(float(os.environ.get('APPENGINE_LISTEN_SECONDS','10')))
finally:
    sio.disconnect()
