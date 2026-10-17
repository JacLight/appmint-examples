const $=s=>document.querySelector(s);const q=new URLSearchParams(location.search);for(const k of ['org','auth','mapping'])if(q.has(k))$('#'+k).value=q.get(k);
function escape(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function load(){
 const p=new URLSearchParams(Object.fromEntries(['org','auth','mapping'].map(k=>[k,$('#'+k).value])));$('#view').innerHTML='<div class="loading">Loading your booking…</div>';
 const result=await fetch('/api/booking?'+p).then(r=>r.json());window.lastResult=result;
 $('#request').textContent=result.request.method+' '+result.request.path;$('#status').textContent='HTTP '+result.status+(result.clientError?' · Client mapping failed':'');$('#status').className=result.status===200?'ok':'';
 const selected=result.status===200?{sk:result.body.sk,data:{name:result.body.data?.name,service:result.body.data?.service,status:result.body.data?.status,startTime:result.body.data?.startTime,timezone:result.body.data?.timezone}}:result.body;
 $('#response').textContent=JSON.stringify(selected,null,2);
 if(!result.booking){$('#view').innerHTML='<div class="failure"><i>!</i><div><h2>We couldn’t load this booking</h2><p>Please try again. If the problem continues, contact support.</p></div></div>';return}
 const b=result.booking,dt=new Date(b.startTime),date=new Intl.DateTimeFormat('en-US',{timeZone:b.timezone,month:'long',day:'numeric',year:'numeric'}).format(dt),time=new Intl.DateTimeFormat('en-US',{timeZone:b.timezone,hour:'numeric',minute:'2-digit'}).format(dt);
 $('#view').innerHTML=`<div class="bookingtop"><div class="calendar"><span>${escape(new Intl.DateTimeFormat('en-US',{month:'short',timeZone:b.timezone}).format(dt)).toUpperCase()}</span><strong>${escape(new Intl.DateTimeFormat('en-US',{day:'numeric',timeZone:b.timezone}).format(dt))}</strong></div><div><h2>${escape(b.service)}</h2><span class="status">${escape(b.status)}</span></div></div><div class="details"><div><small>Booking reference</small><b>${escape(b.code)}</b></div><div><small>Customer</small><b>${escape(b.customer)}</b></div><div><small>Date and time</small><b>${escape(date)} · ${escape(time)}</b></div><div><small>Timezone</small><b>${escape(b.timezone)}</b></div></div><div class="notice">This cancelled booking remains in your history. No new booking was created.</div>`;
}
$('#reload').onclick=load;$('#apply').onclick=load;$('#inspect').onclick=()=>{$('#inspector').hidden=!$('#inspector').hidden};load();
