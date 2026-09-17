import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const code=main.slice(main.indexOf('async function bootstrapApplication(){'),main.indexOf('// v3.4.4 — temporarily'));
for(const scenario of ['permission','offline','signed-out','success']){
 const events=[];
 const ctx={console:{error(){}},setTimeout(fn){Promise.resolve().then(fn);},hydrateLibraryStateFromIndexedDB:async()=>{},cloudConfigured:true,cloudAuth:{getSession:async()=>{
 if(scenario==='offline') throw new Error('Network unavailable');
 return scenario==='signed-out'?null:{user:{email:'test@example.com',user_metadata:{display_name:'Test'}}};
 }},hydrateCloudWorkspace:async()=>{if(scenario==='permission')throw new Error('permission denied');},splashToAuth:()=>events.push('auth'),splashToWorkspace:()=>events.push('workspace'),switchAuthStage:()=>{},setAuthMessage:()=>events.push('message'),applyPrototypeEmail(){},updateLocalProfile(){},applyPrototypeDisplayName(){}};
 vm.runInNewContext(code,ctx);
 await new Promise(resolve=>setImmediate(resolve));
 assert(events.includes(scenario==='success'?'workspace':'auth'),scenario);
 if(['permission','offline'].includes(scenario))assert(events.includes('message'),scenario);
 assert(!events.includes('workspace')||scenario==='success');
}
const raw=readFileSync(new URL('../src/supabase.js',import.meta.url),'utf8').replaceAll('import.meta.env.VITE_SUPABASE_URL','"https://example.supabase.co"').replaceAll('import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY','"test"').replaceAll('export ','');
const session={access_token:'test',expires_at:Date.now()/1000+3600};
let value=JSON.stringify(session);
const ctx={AbortController,URLSearchParams,location:{hash:''},localStorage:{getItem:()=>value,setItem:(_,v)=>value=v,removeItem:()=>value=null},setTimeout:fn=>setTimeout(fn,5),clearTimeout,fetch:(_,opts)=>new Promise((_,reject)=>opts.signal.addEventListener('abort',()=>reject(new Error('Timeout'))))};
vm.runInNewContext(raw+'\nglobalThis.auth=cloudAuth;',ctx);
await assert.rejects(ctx.auth.getSession(),/Timeout/);
assert(value,'A timeout must retain the existing session');
console.log('PASS: permission failure, network failure, signed-out startup, successful startup, request timeout and session preservation');
