import {io} from 'socket.io-client';
import readline from 'node:readline/promises';
import fs from 'node:fs';
type AuthSuccess = { success: true; user: { email: string; name?: string; role: string }; chatSessionId?: string; isGuest?: boolean; handoff?: unknown };
type AuthResult = AuthSuccess | { success: false; message?: string; error?: string };
type StreamEvent = { messageId: string; event: 'chunk' | 'end' | 'error'; data?: string; sk?: string };
type SavedSession = { orgId?: string; chatSessionId?: string };
const {APPENGINE_URL:base,APPENGINE_ORG:orgId,APPENGINE_TOKEN:token,APPENGINE_CHAT_CONFIG:configId}=process.env;
if(!base||!orgId||!token)throw Error('Set APPENGINE_URL, APPENGINE_ORG and APPENGINE_TOKEN. Never put staff tokens in a visitor app.');
const mode=process.env.APPENGINE_ROLE||'customer';
const store=process.env.APPENGINE_SESSION_FILE||'.chat-session.json';
const saved: SavedSession = fs.existsSync(store) ? JSON.parse(fs.readFileSync(store, 'utf8')) : {};
let sessionId=saved.orgId===orgId?saved.chatSessionId:undefined;
const socket=io(base+'/chat',{autoConnect:false,transports:['websocket'],auth:{token,orgId,...(configId?{configId}:{}),context:sessionId?{chatSessionId:sessionId}:{}}});
const streams=new Map<string, string>();
function event(name: string, body: unknown){console.log(name,JSON.stringify(body));}
// Register all listeners BEFORE connect. A greeting may arrive immediately.
socket.on('chat-stream',(m: StreamEvent)=>{
 const content=streams.get(m.messageId)||'';
 if(m.event==='chunk')streams.set(m.messageId,content+(m.data||''));
 if(m.event==='end'){
  const answer={messageId:m.messageId,savedId:m.sk,content:streams.get(m.messageId)||''};
  event('answer complete',answer);
 }
});
for(const e of ['message','agent-assigned','queued','queue-update','chat-ended','status','update','error'])socket.on(e,(m: unknown)=>event(e,m));
const ready=new Promise<AuthSuccess>((ok,no)=>{const timer=setTimeout(()=>no(Error('Authentication timed out')),20000);socket.once('authenticate',(a: AuthResult)=>{clearTimeout(timer);a.success?ok(a):no(Error(a.message||a.error));});socket.once('connect_error',no);});
const call=(name: string,data: Record<string, unknown>)=>new Promise<unknown>((ok,no)=>socket.timeout(30000).emit(name,data,(err: Error | null,res: unknown)=>err?no(err):ok(res)));
try{
 socket.connect();const auth=await ready;sessionId=auth.chatSessionId;
 if(sessionId)fs.writeFileSync(store,JSON.stringify({orgId,chatSessionId:sessionId}),{mode:0o600});
 const email=auth.user.email;
 const chatId=mode==='staff'?process.env.APPENGINE_CHAT_ID:(auth.isGuest?`customer:${sessionId}:${email}`:`customer::${email}`);
 if(!chatId)throw Error('Staff actions require APPENGINE_CHAT_ID from the intended conversation.');
 event('authenticated',{role:auth.user.role,chatId,handoff:auth.handoff});
 await call('join-chat',{chatId});event('history',await call('chat-history',{chatId,...(auth.isGuest?{chatSessionId:sessionId}:{})}));
 const rl=readline.createInterface({input:process.stdin,output:process.stdout});
 console.log('Type a message. Commands: /history, /quit; staff: /takeover, /resume, /close.');
 for await(const line of rl){
  if(line==='/quit')break;
  let r: unknown;
  if(line==='/history')r=await call('chat-history',{chatId,chatSessionId:sessionId});
  else if(mode==='staff'&&line==='/takeover')r=await call('takeover-chat',{chatId,customerEmail:process.env.APPENGINE_CUSTOMER_EMAIL});
  else if(mode==='staff'&&line==='/resume')r=await call('resume-ai',{chatId,customerEmail:process.env.APPENGINE_CUSTOMER_EMAIL,assistantId:process.env.APPENGINE_ASSISTANT});
  else if(mode==='staff'&&line==='/close')r=await call('close-chat',{chatId,sendTranscript:false});
  else if(mode==='staff')r=await call('sendMessage',{chatId,to:process.env.APPENGINE_CUSTOMER_EMAIL,content:line,type:'user'});
  else r=await call('chat-message',{message:line,chatId,chatSessionId:sessionId});
  event('acknowledgement',r);
 }
 rl.close();
}finally{socket.disconnect();}
