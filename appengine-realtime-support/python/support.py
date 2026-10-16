"""Customer-side Socket.IO example. Uses an existing customer/guest token."""
import os,json,pathlib,socketio
base=os.environ['APPENGINE_URL'].rstrip('/')
org=os.environ['APPENGINE_ORG'];token=os.environ['APPENGINE_TOKEN']
config=os.environ.get('APPENGINE_CHAT_CONFIG')
store=pathlib.Path(os.environ.get('APPENGINE_SESSION_FILE','.chat-session-python.json'))
saved=json.loads(store.read_text()) if store.exists() else {}
context={'chatSessionId':saved['chatSessionId']} if saved.get('orgId')==org and saved.get('chatSessionId') else {}
sio=socketio.Client();state={};answers={}
@sio.on('authenticate',namespace='/chat')
def authenticate(result):
    state.update(result)
    if result.get('success') and result.get('chatSessionId'):
        store.write_text(json.dumps({'orgId':org,'chatSessionId':result['chatSessionId']}));store.chmod(0o600)
@sio.on('chat-stream',namespace='/chat')
def stream(item):
    mid=item['messageId']
    if item['event']=='chunk':answers[mid]=answers.get(mid,'')+(item.get('data') or '')
    elif item['event']=='end':print('Answer complete:',json.dumps({'messageId':mid,'savedId':item.get('sk'),'content':answers.get(mid,'')}))
@sio.on('message',namespace='/chat')
def message(item):print('Message:',json.dumps(item))
@sio.on('agent-assigned',namespace='/chat')
def assigned(item):print('Staff assigned:',json.dumps(item))
try:
    # Ready means AppEngine authenticate succeeded, not just a transport connection.
    sio.connect(base,transports=['websocket'],auth={'token':token,'orgId':org,'configId':config,'context':context},namespaces=['/chat'])
    for _ in range(200):
        if 'success' in state:break
        sio.sleep(.1)
    if not state.get('success'):raise RuntimeError(state.get('message') or state.get('error') or 'Authentication timed out')
    email=state['user']['email'];session=state.get('chatSessionId')
    chat=f'customer:{session}:{email}' if state.get('isGuest') else f'customer::{email}'
    def call(name,data):return sio.call(name,data,namespace='/chat',timeout=30)
    print('History:',json.dumps(call('chat-history',{'chatId':chat,'chatSessionId':session})))
    while True:
        line=input('Message (/quit to stop): ')
        if line=='/quit':break
        print('Acknowledgement:',json.dumps(call('chat-message',{'message':line,'chatId':chat,'chatSessionId':session})))
finally:
    if sio.connected:sio.disconnect()
