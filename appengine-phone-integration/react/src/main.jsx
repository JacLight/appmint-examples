import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {PhoneSession,action,snapshot,fixtureEvent} from './session.mjs';
import './style.css';

function App(){
 const [data,setData]=useState(null),[state,setState]=useState({state:'offline'}),[incoming,setIncoming]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[to,setTo]=useState('+12025550118'),[from,setFrom]=useState(''),[muted,setMuted]=useState(false),[text,setText]=useState('Hello from the React phone example.'),[receipt,setReceipt]=useState(null);
 const session=useRef(null),actionLock=useRef(false);
 const refresh=async()=>{const next=await snapshot();setData(next);setFrom(previous=>previous||next.userPhones?.[0]?.phoneNumber||'');};
 useEffect(()=>{
  let live=true;
  session.current=new PhoneSession({onState:s=>{if(!live)return;setState(s);if(['ended','ready','offline'].includes(s.state)){setIncoming(null);setMuted(false);}},onIncoming:c=>{if(live)setIncoming(c)}});
  refresh().catch(e=>{if(live)setError(e.message)});
  return()=>{live=false;session.current?.disconnect().catch(()=>{});};
 },[]);
 const run=async(fn,{refreshAfter=true}={})=>{
  if(actionLock.current)return;actionLock.current=true;setBusy(true);setError('');
  try{await fn();if(refreshAfter)try{await refresh()}catch(e){setError('Action finished; refresh failed: '+e.message+'. Inspect history before repeating.')}}
  catch(e){setError(e.message)}finally{actionLock.current=false;setBusy(false)};
 };
 const active=['dialing','ringing','connected'].includes(state.state);
 const connected=state.state==='connected';
 const controls=session.current?.active;
 const disconnect=()=>run(async()=>{await session.current.disconnect();setIncoming(null);setMuted(false);});
 const simulator=(fn)=>run(async()=>{await fn();});
 const messages=data?.messages||[];
 return <main>
  <header><span className="brand">AppEngine · React example</span><h1>Calling inside your app</h1><p className="banner">LOCAL SIMULATION — no carrier, microphone, real call or SMS delivery. Numbers, credentials and outcomes are fixtures.</p></header>
  {error&&<p className="error" role="alert">{error}</p>}
  <section className="connection"><div><small>SDK / call state</small><strong role="status">{state.state}</strong><p>{state.reason||'Registration, SDK readiness and an active call are separate states.'}</p></div><div className="buttons"><button disabled={busy||!data||!['offline','error','renewal-failed'].includes(state.state)} onClick={()=>run(async()=>{if(session.current.phone)await session.current.disconnect();await session.current.connect()})}>Connect phone</button><button disabled={busy||state.state==='offline'} onClick={disconnect}>Disconnect</button><button disabled={busy} onClick={()=>run(refresh,{refreshAfter:false})}>Refresh records</button></div></section>
  <div className="grid"><section><h2>Call</h2><label>Assigned caller ID<select value={from} onChange={e=>setFrom(e.target.value)}>{(data?.userPhones||[]).map(p=><option key={p.phoneNumber}>{p.phoneNumber}</option>)}</select></label><label>Destination<input value={to} onChange={e=>setTo(e.target.value)} type="tel"/></label>
   {incoming&&state.state==='ringing'&&<div className="incoming"><strong>Incoming: {incoming.from}</strong><div className="buttons"><button disabled={busy} onClick={()=>run(()=>incoming.accept())}>Accept</button><button disabled={busy} onClick={()=>run(()=>incoming.reject())}>Reject</button></div></div>}
   <div className="buttons"><button disabled={busy||state.state!=='ready'||!from||!to.trim()} onClick={()=>run(()=>session.current.dial(to,from))}>Dial</button><button disabled={busy||!active} onClick={()=>run(()=>controls?.hangUp())}>Hang up</button><button disabled={busy||!connected} onClick={()=>run(async()=>{await controls?.mute(!muted);setMuted(!muted)},{refreshAfter:false})}>{muted?'Unmute':'Mute'}</button></div>
   <p>{muted?'Your microphone is muted (simulated).':'Keypad sends DTMF digits on a connected call.'}</p><div className="keypad">{'123456789*0#'.split('').map(d=><button key={d} disabled={busy||!connected} onClick={()=>run(()=>controls?.sendDigits(d),{refreshAfter:false})}>{d}</button>)}</div>
  </section><section><h2>Text message</h2><p>Uses the selected caller ID and destination. A saved pending message is not delivery.</p><label>Message<textarea value={text} onChange={e=>setText(e.target.value)}/></label><button disabled={busy||!from||!to.trim()||!text.trim()} onClick={()=>run(async()=>{const saved=await action('sendSms',{from,to:[to],text});setReceipt(saved)})}>Send SMS</button>
   {receipt&&<p role="status">Saved result: <b>{receipt.sk}</b> · {receipt.data?.status}. This receipt stays visible if refresh fails.</p>}
   <ul className="messages">{messages.map(m=><li key={m.sk}><b>{m.data.status}</b> · {m.data.to.join(', ')}<p>{m.data.text}</p><small>{m.sk}</small><div className="buttons">{['sent','delivered','undelivered'].map(status=><button key={status} disabled={busy} onClick={()=>simulator(()=>fixtureEvent('message-status',{id:m.sk,status}))}>Simulate {status}</button>)}</div></li>)}</ul>
  </section></div>
  <section><h2>Simulator controls</h2><p>These buttons produce fixture SDK events. They are not production controls.</p><div className="buttons"><button disabled={busy||state.state!=='ready'} onClick={()=>simulator(()=>window.phoneFixture.incoming())}>Simulate incoming</button><button disabled={busy||state.state!=='dialing'} onClick={()=>simulator(()=>window.phoneFixture.answer())}>Simulate remote answer</button><button disabled={busy||state.state!=='ready'} onClick={()=>simulator(()=>window.phoneFixture.renew())}>Simulate token expiry</button><button disabled={busy||!session.current?.phone} onClick={()=>simulator(()=>window.phoneFixture.error())}>Simulate network error</button></div></section>
  <section><h2>Call history</h2><p>Refresh after a disconnect or uncertain result before placing a duplicate call. Rows below come from the local communications fixture.</p><div className="table"><table><thead><tr><th>Provider SID</th><th>Direction</th><th>From → To</th><th>Status</th><th>Seconds</th></tr></thead><tbody>{(data?.callHistory?.data||[]).map(c=><tr key={c.callLogSk}><td>{c.sid}</td><td>{c.direction}</td><td>{c.from} → {c.to}</td><td>{c.status}</td><td>{c.duration}</td></tr>)}</tbody></table></div>{!data?.callHistory?.data?.length&&<p>No simulated calls yet.</p>}</section>
  <footer>React handles rendering. The shared browser-softphone helper owns SDK registration, heartbeat, renewal and cleanup. Never put the staff bearer in this component.</footer>
 </main>;
}
createRoot(document.getElementById('root')).render(<App/>);
