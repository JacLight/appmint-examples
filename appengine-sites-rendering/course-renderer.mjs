// Course-specific server renderer. It consumes AppEngine's actual site/page response.
// Staff credentials stay on the server. Production apps should use an authorized app identity.
import http from 'node:http';
const {API_BASE,SITE_HOST,SITE_NAME,ORG_ID,APP_TOKEN,PORT='3226'}=process.env;
if(!API_BASE||!SITE_HOST||!SITE_NAME||!ORG_ID||!APP_TOKEN)throw Error('Set API_BASE, SITE_HOST, SITE_NAME, ORG_ID and APP_TOKEN');
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
http.createServer(async(req,res)=>{try{
 const path=new URL(req.url,'http://127.0.0.1').pathname.slice(1);
 const response=await fetch(`${API_BASE}/site/page/${encodeURIComponent(SITE_HOST)}/${encodeURIComponent(SITE_NAME)}/${path}`,{headers:{...(ORG_ID?{orgid:ORG_ID}:{}),...(APP_TOKEN?{authorization:`Bearer ${APP_TOKEN}`}:{})}});
 const page=await response.json();if(!response.ok){res.writeHead(response.status,{'content-type':'text/plain'});res.end('Page not available');return;}
 const article=page.requestData?.data?.[0]?.data;if(!article){res.writeHead(404,{'content-type':'text/plain'});res.end('Article not found');return;}
 let document=page.data.html;
 // This supplied journal has one heading, summary, author and article body binding.
 // For a general renderer, use a DOM parser and a defined component/binding contract.
 for(const [field,value] of Object.entries({'data.title':article.title,'data.summary':article.summary,'data.author.name':article.author?.name})){
  const key=field.replaceAll('.','\\.');
  document=document.replace(new RegExp(`(<([a-z0-9]+)[^>]*data-bind="${key}"[^>]*>)[\\s\\S]*?(</\\2>)`,'i'),(_,open,tag,close)=>open+escape(value)+close);
 }
 // Trusted editorial HTML only. Sanitize any untrusted input before storage/rendering.
 document=document.replace(/(<div data-bind-html="data.content">)[\s\S]*?(<\/div>)/,(_,open,close)=>open+(article.content||'')+close);
 document=document.replace('data-source="repository.findAnyId"','data-course-server-bound="true"');
 document=document.replace('</body>','<aside style="position:fixed;bottom:14px;left:20px;padding:9px 14px;border-radius:6px;background:#f5f2e9;color:#37513e;font:14px Arial;box-shadow:0 1px 8px #0002">Course server renderer · authenticated local preview</aside></body>');
 res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});res.end(document);
}catch(error){res.writeHead(502,{'content-type':'text/plain'});res.end('Renderer upstream unavailable');console.error(error.message)}}).listen(Number(PORT),'127.0.0.1',()=>console.log('Course renderer ready on loopback'));
