import {io} from '/socket.io.esm.min.js';

// Browser counterpart of the Node client: listeners before connect, exact
// message-ID stream assembly, and explicit AppEngine authentication readiness.
export async function connectSupport({endpoint,orgId,configId,token,sessionId,onEvent,onSession}) {
  const socket=io(endpoint.replace(/\/$/,'')+'/chat',{autoConnect:false,transports:['websocket'],auth:{token,orgId,configId,context:sessionId?{chatSessionId:sessionId}:{}}});
  const answers=new Map();
  socket.on('chat-stream',m=>{
    if(m.event==='chunk') {answers.set(m.messageId,(answers.get(m.messageId)||'')+(m.data||''));onEvent('stream',{...m,content:answers.get(m.messageId)});}
    if(m.event==='end')onEvent('answer',{messageId:m.messageId,savedId:m.sk,content:answers.get(m.messageId)||''});
  });
  for(const name of ['message','agent-assigned','queued','queue-update','chat-ended','status','update','error','token_expired'])socket.on(name,data=>onEvent(name,data));
  const ready=new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error('AppEngine authentication timed out')),20000);
    socket.once('authenticate',auth=>{clearTimeout(timer);auth.success?resolve(auth):reject(Error(auth.message||auth.error||'Authentication refused'));});
    socket.once('connect_error',error=>{clearTimeout(timer);reject(error);});
  });
  try {
    socket.connect();const auth=await ready;
    if(auth.user?.role!=='customer')throw Error('This browser example accepts customer/guest sessions only. Never use a staff token here.');
    if(auth.isGuest&&!auth.chatSessionId)throw Error('Guest authenticate did not supply a conversation session ID.');
    onSession(auth.chatSessionId);
    const chatId=auth.isGuest?`customer:${auth.chatSessionId}:${auth.user.email}`:`customer::${auth.user.email}`;
    const call=(event,body)=>new Promise((resolve,reject)=>socket.timeout(30000).emit(event,body,(error,result)=>error?reject(error):resolve(result)));
    await call('join-chat',{chatId});
    return {auth,chatId,disconnect:()=>socket.disconnect(),history:()=>call('chat-history',{chatId,chatSessionId:auth.chatSessionId}),send:(message,files)=>call('chat-message',{message,files,chatId,chatSessionId:auth.chatSessionId})};
  }catch(error){socket.disconnect();throw error;}
}
