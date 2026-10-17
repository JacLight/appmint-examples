export interface Session { orgId:string;token:string }
export interface RecordEnvelope<T> {sk:string;datatype:string;data:T}
export interface PayInput {payPeriodStart:string;payPeriodEnd:string;payDate:string;employeeIds:string[];businessLocationId:string;type:'regular'}
export interface Run {status:string;approvalTaskId?:string;runNumber:string;totals:Record<string,number>}
export class AccountingClient {
 constructor(private origin:string,private session:Session){}
 async request<T>(method:string,path:string,body?:unknown):Promise<T>{const r=await fetch(this.origin.replace(/\/$/,'')+path,{method,headers:{orgid:this.session.orgId,Authorization:`Bearer ${this.session.token}`,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});if(!r.ok)throw Error(`${r.status}: ${await r.text()}`);return await r.json() as T;}
 preview(input:PayInput){return this.request<{stubs:unknown[];totals:Record<string,number>;readiness:{ready:boolean;missing:string[]}}> ('POST','/business-made/payroll/run/preview',input)}
 createRun(input:PayInput){return this.request<RecordEnvelope<Run>>('POST','/business-made/payroll/runs',input)}
 run(id:string){return this.request<RecordEnvelope<Run>>('GET',`/business-made/payroll/runs/${encodeURIComponent(id)}`)}
 calculate(id:string){return this.request<RecordEnvelope<Run>>('POST',`/business-made/payroll/runs/${encodeURIComponent(id)}/calculate`,{})}
 submit(id:string,comment:string){return this.request<RecordEnvelope<Run>>('POST',`/business-made/payroll/runs/${encodeURIComponent(id)}/submit-for-approval`,{comment})}
 task(id:string){return this.request<{id:string;status:string;required:number;mayDecide:boolean}>('GET',`/approval/task/${encodeURIComponent(id)}`)}
 decide(taskId:string,decision:'approve'|'reject',note:string){return this.request('POST',`/approval/task/${encodeURIComponent(taskId)}/${decision}`,{note})}
 async process(id:string){const run=await this.run(id);if(run.data.status!=='approved')throw Error('Run is not approved; read its workflow task.');return this.request<RecordEnvelope<Run>>('POST',`/business-made/payroll/runs/${encodeURIComponent(id)}/process`,{})}
 stubs(id:string){return this.request<{data:Array<RecordEnvelope<{grossPay:number;netPay:number}>>}>('GET',`/business-made/payroll/stubs/run/${encodeURIComponent(id)}?pageSize=100`)}
 generateBankFile(id:string){return this.request<{file:string;transferCount:number;totalAmount:number;effectiveDate:string;reused?:boolean}>('POST',`/business-made/payroll/runs/${encodeURIComponent(id)}/ach/generate`,{})}
}
