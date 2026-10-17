export interface Session { orgId:string; token:string }
export interface RecordEnvelope<T> {sk:string;datatype:string;data:T}
export interface Customer {id?:string;name:string;email?:string;phone?:string}
export interface WorkOrder {status:string;actualHours?:number;materialCost?:number;completedAt?:string}
export class BusinessOperationsClient {
 constructor(private origin:string, private session:Session) {}
 async request<T>(method:string,path:string,body?:unknown):Promise<T>{const r=await fetch(this.origin.replace(/\/$/,'')+path,{method,headers:{orgid:this.session.orgId,authorization:`Bearer ${this.session.token}`,'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});if(!r.ok)throw new Error(`${r.status}: ${await r.text()}`);return await r.json() as T;}
 readiness(locationName:string){return this.request<{allowed:boolean;reasons:string[]}>('GET','/storefront/pos/readiness?businessLocationId='+encodeURIComponent(locationName));}
 walkIn(locationName:string,customer:Customer){return this.request<RecordEnvelope<{payload:{customer:Customer}}>>('POST','/checkin/walk-in',{businessLocationId:locationName,customer,partySize:1});}
 assignStand(taskId:string,servicePointId:string){return this.request('POST',`/checkin/${encodeURIComponent(taskId)}/assign`,{servicePointId});}
 workOrder(id:string){return this.request<{data:RecordEnvelope<WorkOrder>[]}>('GET','/business-made/work-orders/'+encodeURIComponent(id));}
 openTab(locationName:string,servicePointId:string,customer:Customer,requestId:string){return this.request<RecordEnvelope<{status:string;number:string}>>('POST','/storefront/pos/tab',{businessLocationId:locationName,servicePointId,customer,requestId});}
 breakdown(tabId:string){return this.request<{breakdown:{total:number;balanceDue:number}}> ('GET',`/storefront/pos/tab/${encodeURIComponent(tabId)}/breakdown`);}
 async recordCash(tabId:string){const {breakdown}=await this.breakdown(tabId);if(!(breakdown.balanceDue>0))throw new Error('No balance is due.');return this.request('POST',`/storefront/pos/tab/${encodeURIComponent(tabId)}/settle`,{amount:breakdown.balanceDue,method:'cash',gateway:'manual'});}
 close(tabId:string){return this.request('POST',`/storefront/pos/tab/${encodeURIComponent(tabId)}/close`,{});}
 receipt(tabId:string){return this.request<{lines:Array<{kind:string;text?:string;bold?:boolean;lines?:number}>;width:number}>('GET',`/storefront/pos/tab/${encodeURIComponent(tabId)}/receipt-payload`);}
 clearStand(standId:string){return this.request('POST',`/checkin/service-point/${encodeURIComponent(standId)}/clear`,{finalStatus:'available'});}
}
