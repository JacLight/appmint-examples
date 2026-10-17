'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {addLine} from '@/lib/cart-storage';
import type {Product} from '@/lib/types';
export function AddToCart({sku,name,unitPrice,attributes=[]}:{sku:string;name:string;unitPrice:number;attributes?:Product['attributes']}){
 const router=useRouter();
 const [values,setValues]=useState<Record<string,string>>(()=>Object.fromEntries(attributes.map(a=>[a.name,a.options[0]?.value||''])));
 return <div>{attributes.map(a=><label key={a.name} style={{display:'block',marginBottom:18}}>{a.title||a.name}<select aria-label={a.title||a.name} value={values[a.name]} onChange={e=>setValues({...values,[a.name]:e.target.value})} style={{display:'block',fontSize:22,padding:12,marginTop:8,minWidth:220}}>{a.options.map(o=><option key={o.value} value={o.value}>{o.label||o.value}</option>)}</select></label>)}<button className="primary" onClick={()=>{addLine({sku,name,unitPrice,quantity:1,options:attributes.map(a=>({name:a.name,value:values[a.name]}))});router.push('/cart')}}>Add to cart</button></div>;
}
