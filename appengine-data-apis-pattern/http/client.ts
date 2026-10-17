export type ActorSession = { origin: string; orgId: string; token: string };
export type RecordEnvelope<T> = { sk: string; datatype: string; data: T };
export type CampaignData = { name: string; description: string; budget: number; status: string; startedAt?: string; launchedBy?: string };
export class AppEngineDataClient {
  constructor(private readonly session: ActorSession) {}
  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(this.session.origin.replace(/\/$/, '') + path, {method, headers:{'Content-Type':'application/json',orgid:this.session.orgId,Authorization:`Bearer ${this.session.token}`}, ...(body===undefined?{}:{body:JSON.stringify(body)})});
    const text=await response.text();const data=text?JSON.parse(text):null;
    if(!response.ok)throw new Error(`${response.status}: ${data?.message||text}`);
    return data as T;
  }
  findCampaigns(name: string,page=1) { return this.request<{data:RecordEnvelope<CampaignData>[];total:number}>('POST','/repository/find/campaign',{query:{'data.name':{$regex:name,$options:'i'}},options:{page,pageSize:2,sort:'data.name',sortType:1}}); }
  changeDescription(id:string,description:string) {return this.request('POST',`/repository/update-partial/campaign/${encodeURIComponent(id)}`,{'data.description':description});}
  launch(id:string) {return this.request('POST',`/crm/marketing/campaign-manager/${encodeURIComponent(id)}/launch`,{});}
  feed(pageId:string,pageNum=1) {return this.request('GET',`/client/community/feed?page=${encodeURIComponent(pageId)}&pageNum=${pageNum}&limit=2&sort=latest`);}
  post(pageId:string,content:string) {return this.request<RecordEnvelope<{content:string;author:string;hashtags:string[]}>>('POST','/client/community/posts',{page:pageId,content,contentType:'text'});}
  review(reportId:string,action:'dismissed'|'action_taken',notes:string) {return this.request('POST',`/community/reports/${encodeURIComponent(reportId)}/review`,{action,notes});}
}
// Construct separate clients from the real staff/customer sessions. This type does not grant authority.
