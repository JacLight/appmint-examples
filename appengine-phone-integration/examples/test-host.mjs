import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {mkdtemp,writeFile,rm} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {pathToFileURL} from 'node:url';import net from 'node:net';
test('read-only host protects staff session, blocks writes and survives missing asset',async()=>{
 const tmp=await mkdtemp(path.join(os.tmpdir(),'phone-host-test-'));const probe=net.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
 await writeFile(path.join(tmp,'sdk.mjs'),`export class AppmintClient {async request(method,path){if(method!=='GET')throw Error('Unexpected write');if(path.endsWith('/app'))return{ready:false,token:'must-not-leak'};return path.endsWith('/devices')?{devices:[]}:[];}}`);
 await writeFile(path.join(tmp,'index.html'),'<title>Offline test fixture</title>');
 const child=spawn(process.execPath,[new URL('./phone-host.mjs',import.meta.url).pathname],{env:{...process.env,PORT:String(port),PHONE_PRIVATE_FILE:'',PHONE_CLIENT_DIR:tmp,PHONE_ASSET_DIR:tmp,APPMINT_URL:'https://unreachable.invalid',APPMINT_ORG:'offline-fixture',STAFF_TOKEN:'private-test-marker',APPMINT_SDK_MODULE:pathToFileURL(path.join(tmp,'sdk.mjs')).href,PHONE_ALLOW_DEVICE_REGISTRATION:'false',PHONE_ALLOW_CONTROLLED_ACTIONS:'false'},stdio:['ignore','pipe','pipe']});
 try{await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('exit',c=>reject(Error('Host exit '+c)));setTimeout(()=>reject(Error('Startup timeout')),3000).unref();});
 const base=`http://localhost:${port}`,get=await fetch(base);assert.equal(get.status,200);const cookie=get.headers.get('set-cookie').split(';')[0];
 assert.equal((await fetch(base+'/api/state')).status,401);
 const state=await(await fetch(base+'/api/state',{headers:{cookie}})).json();assert.equal(state.capabilities.register,false);assert.equal(state.voiceApp.token,undefined);assert.ok(!JSON.stringify(state).includes('private-test-marker'));
 const blocked=await fetch(base+'/api/action',{method:'POST',headers:{cookie,origin:base,'content-type':'application/json'},body:JSON.stringify({method:'register',args:[{deviceId:'test-owned'}]})});assert.equal(blocked.status,409);assert.equal((await blocked.json()).source,'teaching-host-policy');
 assert.equal((await fetch(base+'/assets/logo.svg')).status,404);assert.equal((await fetch(base)).status,200);
 }finally{child.kill();await new Promise(r=>child.once('exit',r));await rm(tmp,{recursive:true,force:true});}
});
