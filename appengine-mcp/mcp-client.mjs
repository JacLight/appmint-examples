import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
const base=process.env.APPENGINE_ENDPOINT?.replace(/\/$/,'');
const org=process.env.ORG_ID,token=process.env.STAFF_TOKEN,number=process.env.ORDER_NUMBER;
if(!base||!org||!token||!number)throw Error('Set APPENGINE_ENDPOINT, ORG_ID, STAFF_TOKEN, ORDER_NUMBER');
const client=new Client({name:'appengine-course-client',version:'1.0'});
try{
 await client.connect(new StreamableHTTPClientTransport(new URL(base+'/mcp'),{requestInit:{headers:{orgid:org,Authorization:'Bearer '+token}}}));
 console.log('Tools:',(await client.listTools()).tools.map(t=>t.name));
 const result=await client.callTool({name:'call_service',arguments:{service:'RepositoryCrudService',method:'findByAttribute',args:['sf_order','number',number,{page:1,pageSize:5}]}});
 if(result.isError)throw Error(JSON.stringify(result.content));
 const block=result.content.find(b=>b.type==='text');if(!block)throw Error('Missing text result');
 console.log(JSON.stringify(JSON.parse(block.text),null,2));
}finally{await client.close();}
