import {defineConfig} from 'vite';
export default defineConfig(({command})=>{const origin=process.env.APPENGINE_API_ORIGIN;if(command==='serve'&&!origin)throw Error('Set APPENGINE_API_ORIGIN to your assigned AppEngine backend.');return {server:{port:4163,proxy:origin?{'/api':{target:origin,changeOrigin:true,rewrite:p=>p.replace(/^\/api/,'')}}:undefined}}});
