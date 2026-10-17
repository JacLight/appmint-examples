// Ticket board: a small Node service that lists your organization's open support tickets.
// Edit the two settings below (or set them as environment variables when running locally).
import {createServer} from 'node:http';

const APPENGINE_ORIGIN = process.env.APPENGINE_ORIGIN || 'https://YOUR-APPENGINE-ORIGIN';
const APPENGINE_ORG = process.env.APPENGINE_ORG || 'YOUR_ORG_ID';
const RELEASE = 'Ticket board · release 1';

const origin = new URL(APPENGINE_ORIGIN).origin;
const page = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Ticket board</title>
<style>body{font:17px system-ui;max-width:820px;margin:6vh auto;padding:16px}input,button{font:inherit;padding:8px}table{border-collapse:collapse;width:100%;margin-top:16px}td,th{border-bottom:1px solid #ddd;padding:6px;text-align:left}</style>
<h1>${RELEASE}</h1>
<p>Paste your AppEngine staff token to load open tickets. The token is used for this one request and is not stored.</p>
<form><label>Staff token <input type="password" autocomplete="off" required></label> <button>Load open tickets</button></form>
<p role="status">Ready</p><table hidden><thead><tr><th>Ticket</th><th>Title</th><th>Priority</th><th>Status</th></tr></thead><tbody></tbody></table>
<script>
const f=document.querySelector('form'),i=document.querySelector('input'),s=document.querySelector('[role=status]'),t=document.querySelector('table'),b=t.querySelector('tbody');
const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
f.onsubmit=async e=>{e.preventDefault();s.textContent='Loading…';t.hidden=true;
 try{const r=await fetch('/tickets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:i.value.trim()})});const d=await r.json();
  if(!r.ok){s.textContent='Could not load tickets ('+r.status+'): '+d.error;return;}
  s.textContent=d.total+' open ticket(s)';b.innerHTML=d.tickets.map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+esc(x.title)+'</td><td>'+esc(x.priority)+'</td><td>'+esc(x.status)+'</td></tr>').join('');t.hidden=false;
 }catch{s.textContent='Network error. Check that the service is running.';}finally{i.value='';}};
</script></html>`;

createServer(async (req, res) => {
  const send = (status, body) => {
    res.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'});
    res.end(JSON.stringify(body));
  };
  if (req.method === 'GET' && req.url === '/health') return send(200, {status: 'ok', release: RELEASE});
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'});
    return res.end(page);
  }
  if (req.method !== 'POST' || req.url !== '/tickets') return send(404, {error: 'Not found'});

  let raw = '';
  for await (const part of req) {
    raw += part;
    if (raw.length > 16384) return send(413, {error: 'Request too large'});
  }
  let token;
  try { token = JSON.parse(raw).token; } catch { return send(400, {error: 'Invalid JSON'}); }
  if (typeof token !== 'string' || !token.trim()) return send(401, {error: 'Staff token required'});
  token = token.replace(/^Bearer\s+/i, '');

  try {
    const upstream = await fetch(`${origin}/repository/find/ticket`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', orgid: APPENGINE_ORG, Authorization: `Bearer ${token}`},
      body: JSON.stringify({
        query: {'data.status': 'open'},
        options: {page: 1, pageSize: 20, sort: 'modifydate', sortType: -1},
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!upstream.ok) return send(upstream.status, {error: 'AppEngine refused the request. Check the token, organization and ticket permissions.'});
    const result = await upstream.json();
    const tickets = (result.data || []).map((r) => ({
      name: r.data?.name, title: r.data?.title, priority: r.data?.priority, status: r.data?.status,
    }));
    return send(200, {release: RELEASE, total: result.total ?? tickets.length, tickets});
  } catch {
    return send(502, {error: 'AppEngine could not be reached from this service.'});
  }
}).listen(Number(process.env.PORT || 3000), '0.0.0.0');
