// Own two children only; never stop an existing listener or shared service.
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
const children=[];let stopping=false;
function stop(code=0){if(stopping)return;stopping=true;for(const child of children)child.kill('SIGTERM');process.exitCode=code;}
for(const [script,env] of [['../simulation/server.mjs',{...process.env,PORT:'4081'}],['node_modules/vite/bin/vite.js',process.env]]){
 const child=spawn(process.execPath,[script],{cwd:root,env,stdio:'inherit'});children.push(child);
 child.on('error',e=>{console.error(e.message);stop(1)});child.on('exit',code=>stop(code||0));
}
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop());
