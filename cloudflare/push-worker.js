const ORIGINS = new Set(["https://drsandaruwanperera.lk","https://www.drsandaruwanperera.lk","https://drsandaruwanperera.github.io"]);
const PROJECT_FALLBACK="answersheet2026";
const APP_URL="https://drsandaruwanperera.lk/studentportal/announcements.html";
const PAGE_SIZE=25;
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff",...headers}});
const b64url=bytes=>{let raw="";for(const byte of new Uint8Array(bytes))raw+=String.fromCharCode(byte);return btoa(raw).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");};
const pemBytes=pem=>Uint8Array.from(atob(String(pem).replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,"")),c=>c.charCodeAt(0));
const sha256=async value=>{const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,"0")).join("");};
function corsHeaders(origin){return {"access-control-allow-origin":ORIGINS.has(origin)?origin:"https://drsandaruwanperera.lk","access-control-allow-methods":"GET,POST,OPTIONS","access-control-allow-headers":"Content-Type","vary":"Origin"};}
function decodeValue(value){if(!value||typeof value!=="object")return null;if("stringValue"in value)return value.stringValue;if("integerValue"in value)return Number(value.integerValue);if("doubleValue"in value)return Number(value.doubleValue);if("booleanValue"in value)return Boolean(value.booleanValue);if("timestampValue"in value)return value.timestampValue;if("nullValue"in value)return null;if("mapValue"in value)return decodeFields(value.mapValue.fields||{});if("arrayValue"in value)return(value.arrayValue.values||[]).map(decodeValue);return null;}
function decodeFields(fields){return Object.fromEntries(Object.entries(fields||{}).map(([key,value])=>[key,decodeValue(value)]));}
function encodeValue(value){if(typeof value==="boolean")return{booleanValue:value};if(typeof value==="number"&&Number.isInteger(value))return{integerValue:String(value)};if(typeof value==="number")return{doubleValue:value};if(value===null||value===undefined)return{nullValue:null};return{stringValue:String(value)};}
function encodeFields(fields){return Object.fromEntries(Object.entries(fields).map(([key,value])=>[key,encodeValue(value)]));}
async function readBody(request){try{return await request.json();}catch{return null;}}
async function googleAccess(sa){const now=Math.floor(Date.now()/1000);const header=b64url(new TextEncoder().encode(JSON.stringify({alg:"RS256",typ:"JWT"})));const claims=b64url(new TextEncoder().encode(JSON.stringify({iss:sa.client_email,scope:"https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase.messaging",aud:"https://oauth2.googleapis.com/token",iat:now,exp:now+3600})));const unsigned=header+"."+claims;const key=await crypto.subtle.importKey("pkcs8",pemBytes(sa.private_key),{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["sign"]);const signature=await crypto.subtle.sign("RSASSA-PKCS1-v1_5",key,new TextEncoder().encode(unsigned));const assertion=unsigned+"."+b64url(signature);const response=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion})});const result=await response.json().catch(()=>({}));if(!response.ok||!result.access_token)throw new Error("Google service-account authentication failed: "+(result.error_description||result.error||response.status));return result.access_token;}
const firestoreBase=project=>"https://firestore.googleapis.com/v1/projects/"+encodeURIComponent(project)+"/databases/(default)/documents";
async function firestoreRequest(base,access,path,method="GET",body=undefined){const response=await fetch(base+"/"+path,{method,headers:{authorization:"Bearer "+access,...(body===undefined?{}:{"content-type":"application/json"})},...(body===undefined?{}:{body:JSON.stringify(body)})});const data=await response.json().catch(()=>({}));return{response,data};}
async function serviceContext(env){if(!env.FIREBASE_SERVICE_ACCOUNT)throw new Error("Firebase service-account secret has not been configured.");let sa;try{sa=JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);}catch{throw new Error("FIREBASE_SERVICE_ACCOUNT must contain the complete service-account JSON.");}if(!sa.project_id||!sa.client_email||!sa.private_key)throw new Error("Firebase service-account JSON is missing project_id, client_email or private_key.");if(sa.project_id!==PROJECT_FALLBACK)throw new Error("The configured service account does not belong to the LMS Firebase project.");return{access:await googleAccess(sa),base:firestoreBase(sa.project_id),project:sa.project_id,db:env.PUSH_DB};}
async function getAdmin(context,username){const direct=await firestoreRequest(context.base,context.access,"admins/"+encodeURIComponent(username));let doc=direct.data;if(!direct.response.ok&&direct.response.status===404){const query={structuredQuery:{from:[{collectionId:"admins"}],where:{fieldFilter:{field:{fieldPath:"username"},op:"EQUAL",value:{stringValue:username}}},limit:1}};const response=await fetch(context.base+":runQuery",{method:"POST",headers:{authorization:"Bearer "+context.access,"content-type":"application/json"},body:JSON.stringify(query)});const rows=await response.json().catch(()=>[]);doc=Array.isArray(rows)?rows.find(x=>x.document)?.document:null;if(!response.ok)throw new Error("Could not verify the administrator account.");}else if(!direct.response.ok)throw new Error("Could not verify the administrator account.");return doc?decodeFields(doc.fields||{}):null;}
async function requireSuperAdmin(context,username,password){if(!username||!password)return false;const admin=await getAdmin(context,username);if(!admin)return false;const savedUser=String(admin.username||"").trim().toLowerCase();const savedPassword=String(admin.password||"").trim();const role=String(admin.role||"").trim().toLowerCase().replace(/[\s_-]+/g,"");return savedUser===username.trim().toLowerCase()&&savedPassword===password.trim()&&["full","superadmin","superadministrator"].includes(role);}
function audienceMatches(target,grade){const wanted=String(target||"all").toLowerCase();const actual=String(grade||"").toLowerCase();if(wanted==="all")return true;if(wanted==="al")return actual==="al"||actual.startsWith("al");return actual===wanted;}
async function subscribe(request,context){
 const body=await readBody(request);
 const studentId=String(body?.studentId||"").trim().toUpperCase().replace(/\s+/g,"");
 const grade=String(body?.grade||"").trim().toLowerCase();
 const token=String(body?.token||"").trim();
 const platform=String(body?.platform||"web").slice(0,40);
 if(!context.db)return json({error:"The free notification database is not connected.",code:"PUSH_DATABASE_NOT_CONFIGURED"},503);
 if(!studentId||studentId.length>40||!token||token.length<20||token.length>5000)return json({error:"A valid student ID and push token are required."},400);
 if(!["grade10","grade11","al","al2027","al2028"].includes(grade))return json({error:"Unsupported student group."},400);
 // Save only the device token and its audience in D1. No Firestore reads or writes
 // are performed during notification opt-in, so Firestore quota cannot block students.
 const tokenHash=await sha256(token);
 const saved=await context.db.prepare("INSERT INTO push_subscriptions (token_hash,token,student_id,grade,platform,updated_at) VALUES (?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(token_hash) DO UPDATE SET token=excluded.token,student_id=excluded.student_id,grade=excluded.grade,platform=excluded.platform,updated_at=CURRENT_TIMESTAMP").bind(tokenHash,token,studentId,grade,platform).run();
 if(!saved.success)return json({error:"Could not save this device notification registration.",code:"PUSH_SUBSCRIPTION_SAVE_FAILED"},503);
 return json({ok:true,message:"Notifications are enabled for this device.",storage:"cloudflare-d1"});
}
async function sendPage(request,context){
 const body=await readBody(request);
 const username=String(body?.username||"").trim();
 const password=String(body?.password||"");
 if(!(await requireSuperAdmin(context,username,password)))return json({error:"Super Admin credentials were not accepted."},403);
 const title=String(body?.title||"").trim().slice(0,110);
 const messageBody=String(body?.message||"").trim().slice(0,500);
 const grade=String(body?.grade||"all").trim().toLowerCase();
 if(!title||!messageBody||!["all","grade10","grade11","al","al2027","al2028"].includes(grade))return json({error:"A title, message and valid audience are required."},400);
 if(!context.db)return json({error:"The free notification database is not connected.",code:"PUSH_DATABASE_NOT_CONFIGURED"},503);
 const parsedOffset=Number.parseInt(String(body?.pageToken||"0"),10);
 const offset=Number.isFinite(parsedOffset)&&parsedOffset>0?Math.min(parsedOffset,1000000):0;
 let statement;
 if(grade==="all"){
  statement=context.db.prepare("SELECT token,student_id AS studentId,grade,platform FROM push_subscriptions ORDER BY updated_at DESC,token_hash LIMIT ? OFFSET ?").bind(PAGE_SIZE+1,offset);
 }else if(grade==="al"){
  statement=context.db.prepare("SELECT token,student_id AS studentId,grade,platform FROM push_subscriptions WHERE grade IN ('al','al2027','al2028') ORDER BY updated_at DESC,token_hash LIMIT ? OFFSET ?").bind(PAGE_SIZE+1,offset);
 }else{
  statement=context.db.prepare("SELECT token,student_id AS studentId,grade,platform FROM push_subscriptions WHERE grade = ? ORDER BY updated_at DESC,token_hash LIMIT ? OFFSET ?").bind(grade,PAGE_SIZE+1,offset);
 }
 const page=await statement.all();
 if(!page.success)return json({error:"Could not load notification subscriptions from Cloudflare D1.",code:"PUSH_DATABASE_READ_FAILED"},503);
 const rows=Array.isArray(page.results)?page.results:[];
 const hasMore=rows.length>PAGE_SIZE;
 const docs=rows.slice(0,PAGE_SIZE);
 const gradeCounts={};
 for(const item of docs){const g=String(item.grade||"unknown");gradeCounts[g]=(gradeCounts[g]||0)+1;}
 const targets=docs.filter(item=>item.token);
 let sent=0,failed=0;
 const failureDetails=[];
 for(let i=0;i<targets.length;i+=5){
  const group=targets.slice(i,i+5);
  const outcomes=await Promise.all(group.map(async target=>{
   try{
    const response=await fetch("https://fcm.googleapis.com/v1/projects/"+context.project+"/messages:send",{
     method:"POST",
     headers:{authorization:"Bearer "+context.access,"content-type":"application/json"},
     body:JSON.stringify({message:{
      token:target.token,
      notification:{title,body:messageBody},
      data:{url:APP_URL,announcementId:String(body?.announcementId||"")},
      webpush:{headers:{TTL:"86400",Urgency:"high"},notification:{
       icon:"https://drsandaruwanperera.lk/studentportal/icons/dr-sandaruwan-lms-192.png",
       badge:"https://drsandaruwanperera.lk/studentportal/icons/dr-sandaruwan-lms-192.png",
       tag:"dr-sandaruwan-lms-"+String(body?.announcementId||"announcement"),
       renotify:false
      },fcmOptions:{link:APP_URL}}
     }})
    });
    const raw=await response.text();
    let data={};try{data=raw?JSON.parse(raw):{};}catch{data={raw:raw.slice(0,300)};}
    if(response.ok)return {ok:true};
    return {ok:false,detail:{httpStatus:response.status,code:data?.error?.status||data?.error?.code||"FCM_ERROR",message:data?.error?.message||data?.message||"Firebase Cloud Messaging rejected this device."}};
   }catch(error){return {ok:false,detail:{httpStatus:0,code:"NETWORK_ERROR",message:String(error?.message||error||"Network request failed.")}};}
  }));
  for(const outcome of outcomes){if(outcome.ok)sent++;else{failed++;if(failureDetails.length<10)failureDetails.push(outcome.detail);}}
 }
 return json({ok:true,grade,checked:docs.length,matched:targets.length,sent,failed,gradeCounts,failureDetails,nextPageToken:hasMore?String(offset+PAGE_SIZE):null,done:!hasMore,storage:"cloudflare-d1"});
}
export default{async fetch(request,env){const origin=request.headers.get("Origin")||"";const headers=corsHeaders(origin);if(request.method==="OPTIONS")return new Response(null,{status:204,headers});if(origin&&!ORIGINS.has(origin))return json({error:"Origin not allowed."},403,headers);const url=new URL(request.url);const path=url.pathname.replace(/\/+$/,"")||"/";if(request.method==="GET"&&path==="/health")return json({ok:true,service:"Dr. Sandaruwan LMS Push",configured:Boolean(env.FIREBASE_SERVICE_ACCOUNT)&&Boolean(env.PUSH_DB),pushStorageConfigured:Boolean(env.PUSH_DB),pushStorage:"cloudflare-d1",project:PROJECT_FALLBACK},200,headers);if(request.method!=="POST"||!["/subscribe","/send"].includes(path))return json({error:"Not found."},404,headers);try{const context=path==="/subscribe"?{db:env.PUSH_DB}:{...(await serviceContext(env)),db:env.PUSH_DB};const result=path==="/subscribe"?await subscribe(request,context):await sendPage(request,context);return new Response(result.body,{status:result.status,headers:{...headers,...Object.fromEntries(result.headers)}});}catch(error){const message=String(error?.message||error||"Unexpected push service error.");return json({error:message},message.includes("has not been configured")?503:500,headers);}}};