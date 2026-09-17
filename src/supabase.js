const projectUrl=(import.meta.env.VITE_SUPABASE_URL||"").replace(/\/$/,"");
const publishableKey=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||"";
const sessionKey="arvioSupabaseSession_v370";

export const cloudConfigured=Boolean(projectUrl&&publishableKey);

function readSession(){
  try{return JSON.parse(localStorage.getItem(sessionKey)||"null")}catch{return null}
}
function writeSession(session){
  try{
    if(session) localStorage.setItem(sessionKey,JSON.stringify(session));
    else localStorage.removeItem(sessionKey);
  }catch{}
}
function authHeaders(token=null){
  const headers={apikey:publishableKey,"Content-Type":"application/json"};
  if(token) headers.Authorization=`Bearer ${token}`;
  return headers;
}
async function request(path,{method="GET",body,token,headers={}}={}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),12000);
  try{
    const response=await fetch(`${projectUrl}${path}`,{
      method, signal:controller.signal,
      headers:{...authHeaders(token),...headers},
      body:body===undefined?undefined:JSON.stringify(body)
    });
    const data=await response.json().catch(()=>null);
    if(!response.ok){
      const error=new Error(data?.msg||data?.message||data?.error_description||`Request failed (${response.status})`);
      error.status=response.status;
      throw error;
    }
    return data;
  }finally{ clearTimeout(timer); }
}

function sessionFromHash(){
  const params=new URLSearchParams(location.hash.replace(/^#/,""));
  const access_token=params.get("access_token");
  const refresh_token=params.get("refresh_token");
  if(!access_token||!refresh_token) return null;
  const session={access_token,refresh_token,expires_at:Math.floor(Date.now()/1000)+Number(params.get("expires_in")||3600),user:{id:params.get("user_id")||null,email:params.get("email")||null}};
  history.replaceState(history.state,"",`${location.pathname}${location.search}`);
  writeSession(session);
  return session;
}

async function ensureFreshSession(){
  let session=sessionFromHash()||readSession();
  if(!session?.access_token) return null;
  if(Number(session.expires_at||0)>Math.floor(Date.now()/1000)+60) return session;
  try{
    const next=await request("/auth/v1/token?grant_type=refresh_token",{method:"POST",body:{refresh_token:session.refresh_token}});
    writeSession(next);
    return next;
  }catch(error){
    if(error.status===400 || error.status===401){writeSession(null);return null}
    throw error;
  }
}

export const cloudAuth={
  async getSession(){
    const session=await ensureFreshSession();
    if(!session) return null;
    try{
      const user=await request("/auth/v1/user",{token:session.access_token});
      session.user=user;
      writeSession(session);
      return session;
    }catch(error){
      if(error.status===401 || error.status===403){writeSession(null);return null}
      throw error;
    }
  },
  async signInWithPassword({email,password}){
    const session=await request("/auth/v1/token?grant_type=password",{method:"POST",body:{email,password}});
    writeSession(session);
    return session;
  },
  async signUp({email,password,redirectTo}){
    const result=await request("/auth/v1/signup",{method:"POST",body:{email,password,options:{emailRedirectTo:redirectTo}}});
    if(result?.access_token) writeSession(result);
    return result;
  },
  async updateUser(data){
    const session=await ensureFreshSession();
    if(!session) throw new Error("Your session has expired. Please log in again.");
    const user=await request("/auth/v1/user",{method:"PUT",token:session.access_token,body:{data}});
    session.user=user;
    writeSession(session);
    return user;
  },
  async signOut(){
    const session=readSession();
    try{if(session?.access_token) await request("/auth/v1/logout",{method:"POST",token:session.access_token})}catch{}
    writeSession(null);
  }
};

export async function cloudTable(table,{method="GET",query="",body,headers={}}={}){
  const session=await cloudAuth.getSession();
  if(!session?.user?.id) throw new Error("Please log in to sync your notes.");
  return request(`/rest/v1/${table}${query}`,{method,body,token:session.access_token,headers});
}
