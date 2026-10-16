import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('build/web');
const settings={endpoint:process.env.APPENGINE_URL,org:process.env.APPENGINE_ORG,configId:process.env.APPENGINE_CHAT_CONFIG};
if(Object.values(settings).some(v=>!v))throw Error('Set APPENGINE_URL, APPENGINE_ORG and APPENGINE_CHAT_CONFIG.');
const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.wasm':'application/wasm','.png':'image/png','.ttf':'font/ttf','.woff2':'font/woff2'};
http.createServer((req,res)=>{
 if(req.url==='/course-settings'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(settings));return;}
 const url=new URL(req.url,'http://127.0.0.1');let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
 if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end();return;}
 if(file===root||!fs.existsSync(file))file=path.join(root,'index.html');
 res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).on('error',()=>res.writeHead(404).end()).pipe(res);
}).listen(4092,'127.0.0.1',()=>console.log('Course Flutter host listening on port 4092'));
