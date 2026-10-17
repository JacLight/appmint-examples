export type Actor = 'manager' | 'staff';
export interface Session { orgId: string; token: string }
export interface RecordEnvelope<T> { sk: string; datatype: string; data: T }
export interface Employee { employeeId: string; personalInfo: {firstName: string; lastName: string}; employment: {status:string} }
export class WorkforceClient {
 constructor(private origin:string, private sessions:Record<Actor,Session>) {}
 async request<T>(actor:Actor,method:string,path:string,body?:unknown):Promise<T>{
  const s=this.sessions[actor];const r=await fetch(this.origin.replace(/\/$/,'')+path,{method,headers:{orgid:s.orgId,authorization:`Bearer ${s.token}`,'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  if(!r.ok)throw new Error(`${r.status}: ${await r.text()}`);return await r.json() as T;
 }
 myProfile(){return this.request<Employee>('staff','GET','/staff-portal/profile')}
 publishSchedule(savedScheduleId:string){return this.request<RecordEnvelope<{status:string}>>('manager','POST',`/business-made/schedules/${encodeURIComponent(savedScheduleId)}/publish`,{})}
 mySchedule(from:string,to:string){return this.request<unknown[]>('staff','GET','/staff-portal/schedule?'+new URLSearchParams({from,to}))}
 requestTimeOff(leaveTypeId:string,startDate:string,endDate:string,reason:string){return this.request<RecordEnvelope<{status:string}>>('staff','POST','/staff-portal/time-off',{leaveTypeId,startDate,endDate,reason})}
 approveTimeOff(requestId:string,note:string){return this.request<RecordEnvelope<{status:string}>>('manager','POST',`/business-made/leave/requests/${encodeURIComponent(requestId)}/approve`,{note})}
 myPayslip(stubId:string){return this.request<RecordEnvelope<{employeeId:string;netPay:number}>>('staff','GET',`/staff-portal/payslips/${encodeURIComponent(stubId)}`)}
}
// Construct with two separately authenticated sessions. Never put a manager token in a public employee client.
