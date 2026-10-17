import { NextRequest, NextResponse } from 'next/server';
export async function POST(req:NextRequest){
 if(!req.headers.get('origin') || new URL(req.headers.get('origin')!).host !== req.headers.get('host'))return NextResponse.json({error:'Origin mismatch'},{status:403});
 const {email,password}=await req.json();
 const r=await fetch(process.env.APPENGINE_ENDPOINT+'/profile/customer/signin',{method:'POST',headers:{'Content-Type':'application/json',orgid:process.env.ORG_ID!},body:JSON.stringify({email,password})});
 const value=await r.json();
 if(!r.ok)return NextResponse.json({error:value.error||value.message||'Sign-in failed'},{status:r.status});
 if(!value.token)return NextResponse.json({error:'Complete verification or password change through API Foundations, then return. The checkout companion supports verification-code continuation.'},{status:409});
 const res=NextResponse.json({signedIn:true});res.cookies.set('appmint_token',value.token,{httpOnly:true,sameSite:'lax',secure:new URL(req.url).protocol==='https:',path:'/',maxAge:3600});return res;
}
export async function DELETE(req:NextRequest){
 if(!req.headers.get('origin') || new URL(req.headers.get('origin')!).host !== req.headers.get('host'))return NextResponse.json({error:'Origin mismatch'},{status:403});
 const res=NextResponse.json({signedOut:true});res.cookies.set('appmint_token','',{httpOnly:true,sameSite:'lax',path:'/',maxAge:0});return res;
}
