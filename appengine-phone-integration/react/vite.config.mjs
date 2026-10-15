import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
const target='http://localhost:4081';
const proxy=Object.fromEntries(['/api','/fixture','/fixture-sdk.js'].map(path=>[path,{target,changeOrigin:true,configure(p){p.on('proxyReq',req=>req.setHeader('origin',target));}}]));
export default defineConfig({server:{host:'127.0.0.1',port:4082,strictPort:true,fs:{allow:[fileURLToPath(new URL('..',import.meta.url))]},proxy},preview:{proxy},build:{target:'es2022'}});
