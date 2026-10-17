// AppEngine OIDC relying-party lab. Node22.12+, openid-client6.6.2.
// Server-side training sessions; no tokens in the browser. Serve through an HTTPS reverse proxy preserving Host. Not a production session store.
import http from 'node:http';
import { randomBytes } from 'node:crypto';
import * as oidc from 'openid-client';
const env=name=>{if(!process.env[name])throw Error(`Missing ${name}`);return process.env[name];};
const issuer=new URL(env('OIDC_ISSUER')), clientId=env('OIDC_CLIENT_ID');
const secret=process.env.OIDC_CLIENT_SECRET;
const origin=env('APP_ORIGIN').replace(/\/$/,''), callback=`${origin}/auth/callback`, sessions=new Map();
const appUrl=new URL(origin);
if(appUrl.protocol!=='https:'||appUrl.pathname!=='/'||appUrl.search||appUrl.hash||appUrl.username||appUrl.password)throw Error('APP_ORIGIN must be an HTTPS origin without path, query, fragment or credentials');
if(issuer.protocol!=='https:') throw Error('Use the public HTTPS AppEngine issuer, including /idp');
const config=await oidc.discovery(issuer,clientId,
  secret?{client_secret:secret,token_endpoint_auth_method:'client_secret_basic'}:{token_endpoint_auth_method:'none'},
  secret?oidc.ClientSecretBasic(secret):oidc.None(),
  {execute:[oidc.enableNonRepudiationChecks]});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cookie=id=>`ae_oidc=${id}; HttpOnly; SameSite=Lax; Secure; Path=/; Max-Age=1800`;
const fresh=()=>({csrf:randomBytes(24).toString('hex'),until:Date.now()+1800000});
http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
  if(req.headers.host!==appUrl.host){res.writeHead(400);return res.end('Open the configured relying-application origin');}
  const url=new URL(req.url,origin);
  let id=req.headers.cookie?.match(/(?:^|; )ae_oidc=([a-f0-9]{64})(?:;|$)/)?.[1], s=sessions.get(id);
  if(!s||s.until<Date.now()){if(id)sessions.delete(id);id=randomBytes(32).toString('hex');s=fresh();sessions.set(id,s);}
  res.setHeader('Set-Cookie',cookie(id));
  const redirect=location=>{res.writeHead(303,{Location:location});res.end();};
  try {
    if(req.method==='GET'&&url.pathname==='/auth/callback') {
      const flow=s.flow;delete s.flow;
      if(!flow||flow.until<Date.now())throw Error('Missing or expired login attempt; start sign-in again');
      const tokens=await oidc.authorizationCodeGrant(config,url,{pkceCodeVerifier:flow.verifier,expectedState:flow.state,expectedNonce:flow.nonce,idTokenExpected:true});
      const claims=tokens.claims();if(!claims?.sub)throw Error('No validated identity returned');
      // Rotation prevents the pre-login session ID from becoming an authenticated ID.
      sessions.delete(id);id=randomBytes(32).toString('hex');s={...fresh(),tokens,claims};sessions.set(id,s);res.setHeader('Set-Cookie',cookie(id));
      return redirect('/');
    }
    if(req.method==='POST') {
      if(req.headers.origin!==origin){res.writeHead(403);return res.end('Origin refused');}
      let raw='';for await(const c of req){raw+=c;if(raw.length>4000)throw Error('Request too large');}
      if(new URLSearchParams(raw).get('csrf')!==s.csrf){res.writeHead(403);return res.end('CSRF refused');}
      if(url.pathname==='/login') {
        const verifier=oidc.randomPKCECodeVerifier(),state=oidc.randomState(),nonce=oidc.randomNonce();
        s.flow={verifier,state,nonce,until:Date.now()+300000};
        return redirect(oidc.buildAuthorizationUrl(config,{redirect_uri:callback,scope:'openid profile email org',response_type:'code',code_challenge:await oidc.calculatePKCECodeChallenge(verifier),code_challenge_method:'S256',state,nonce}).href);
      }
      if(url.pathname==='/logout'||url.pathname==='/issuer-logout') {
        const hint=s.tokens?.id_token;sessions.delete(id);res.setHeader('Set-Cookie','ae_oidc=; HttpOnly; SameSite=Lax; Secure; Path=/; Max-Age=0');
        if(url.pathname==='/issuer-logout'&&hint) return redirect(oidc.buildEndSessionUrl(config,{id_token_hint:hint,post_logout_redirect_uri:`${origin}/`}).href);
        return redirect('/');
      }
      if(!s.tokens)throw Error('Sign in first');
      if(url.pathname==='/userinfo') s.info=await oidc.fetchUserInfo(config,s.tokens.access_token,s.claims.sub);
      else if(url.pathname==='/refresh') {
        if(!s.tokens.refresh_token)throw Error('No refresh token; check registration and reauthenticate');
        const next=await oidc.refreshTokenGrant(config,s.tokens.refresh_token);
        const renewedClaims=next.claims();
        if(renewedClaims && renewedClaims.sub!==s.claims.sub)throw Error('Refreshed identity does not match this session');
        // Preserve an unrotated refresh token and the prior identity if no new ID token is issued.
        s.tokens={...next,refresh_token:next.refresh_token||s.tokens.refresh_token,id_token:next.id_token||s.tokens.id_token};
        s.claims=renewedClaims||s.claims;s.note='Refresh completed; reload userinfo with the new access token.';
      } else {res.writeHead(404);return res.end('Unknown action');}
      return redirect('/');
    }
    if(req.method!=='GET'||url.pathname!=='/'){res.writeHead(404);return res.end('Not found');}
  }catch(error){s.note=`Flow failed: ${error.code||error.name}. Recheck the course recovery steps. No token or authorization code has been logged.`;}
  const form=(path,label)=>`<form method="post" action="${path}"><input type="hidden" name="csrf" value="${s.csrf}"><button>${label}</button></form>`;
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.end(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AppEngine OIDC lab</title><style>body{font:18px system-ui;max-width:850px;padding:2rem;margin:auto}button{font:inherit;margin:.4rem;padding:.6rem}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style><h1>AppEngine staff SSO</h1><p>Issuer: ${esc(issuer.href)}. Credentials and tokens remain in this local server.</p><p>${esc(s.note)}</p>${s.tokens?form('/userinfo','Read userinfo')+form('/refresh','Refresh access')+form('/logout','End local session')+form('/issuer-logout','End local and issuer session'):`<p>No validated local session.</p>${form('/login','Sign in through AppEngine')}`}<pre>${s.claims?esc(JSON.stringify({validatedClaims:s.claims,userinfo:s.info},null,2)):''}</pre></html>`);
}).listen(Number(process.env.PORT||4300),'127.0.0.1',()=>console.log('Relying application ready behind its configured HTTPS origin'));
setInterval(()=>{for(const [id,s]of sessions)if(s.until<Date.now())sessions.delete(id);},60000).unref();
