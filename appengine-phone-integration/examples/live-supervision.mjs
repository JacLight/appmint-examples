/** Inject socket.io-client's io and the supervisor's OWN completed staff session.
 * ACK means server control accepted, not audible handoff. No automatic action retries.
 */
export function supervise({io,baseUrl,orgId,token,onEvent=()=>{}}){
 const socket=io(baseUrl.replace(/\/$/,'')+'/live-calls',{transports:['websocket'],auth:{token,orgId},autoConnect:false});
 let selected=null,closed=false;
 const ask=(name,body={})=>new Promise((resolve,reject)=>socket.timeout(10000).emit(name,body,(err,result)=>{if(err)return reject(Error('Acknowledgement missing; reconcile state before repeating control'));if(!result?.ok)return reject(Error(result?.error||'Operation refused'));resolve(result);}));
 for(const event of ['calls','call.started','call.ended','line','audio'])socket.on(event,data=>{if(event==='call.ended'&&data.callSid===selected)selected=null;onEvent(event,data);});
 socket.on('connect',async()=>{try{const result=await ask('list');onEvent('calls',result.calls);if(selected&&!closed){const r=await ask('listen',{callSid:selected});onEvent('snapshot',r);}}catch(error){onEvent('error',{message:error.message});}});
 socket.on('connect_error',error=>onEvent('error',{message:error.message}));socket.connect();
 return{async listen(callSid){if(selected&&selected!==callSid)await ask('unlisten',{callSid:selected});selected=callSid;const r=await ask('listen',{callSid});onEvent('snapshot',r);return r;},async unlisten(){if(!selected)return;const id=selected;selected=null;return ask('unlisten',{callSid:id});},list:()=>ask('list'),whisper:(callSid,text)=>ask('whisper',{callSid,text}),takeover:callSid=>ask('takeover',{callSid}),hangup:callSid=>ask('hangup',{callSid}),close(){closed=true;selected=null;socket.disconnect();}};
}
