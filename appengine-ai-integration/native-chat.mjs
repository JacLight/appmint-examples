/** Native staff Chat, with the ordinary staff session in the Socket.IO handshake. */
export async function nativeChat({io,baseUrl,orgId,token,to,content}) {
 const socket=io(baseUrl.replace(/\/$/,'')+'/chat',{auth:{token,orgId},transports:['websocket'],reconnection:false});
 const emit=(event,data)=>new Promise((resolve,reject)=>socket.timeout(15000).emit(event,data,(error,ack)=>error?reject(Error('Chat acknowledgement was not received; read history before retrying')):ack?.success===false?reject(Error(ack.error||'Chat refused')):resolve(ack)));
 try {
  await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Chat authentication timed out')),15000);socket.once('authenticate',r=>{clearTimeout(t);r.success?resolve(r):reject(Error(r.error||'Chat authentication refused'))});socket.once('connect_error',e=>{clearTimeout(t);reject(e)});});
  const conversation=await emit('create-chat',{participants:[to]});
  const chatId=conversation.chat?.chatId||conversation.chatId||conversation.data?.chatId;if(!chatId)throw Error('Chat did not return its conversation ID');
  const result=content===undefined?null:await emit('sendMessage',{chatId,to,content,type:'text',sentTime:new Date().toISOString()});
  return {chatId,conversation,result};
 } finally {socket.disconnect();}
}
