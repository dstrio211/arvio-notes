import {readSharedNote} from "./supabase.js";
import "./styles/shared-view.css";

// Rebuild a narrow set of formatting elements; never attach remote HTML directly.
export function safeSharedContent(html){
  const parsed=new DOMParser().parseFromString(String(html||""),"text/html");
  const allowed=new Set("P BR DIV SPAN STRONG B EM I U S STRIKE H1 H2 H3 H4 BLOCKQUOTE UL OL LI PRE CODE HR A IMG MARK".split(" "));
  const blocked=new Set("SCRIPT STYLE IFRAME OBJECT EMBED SVG MATH FORM INPUT BUTTON TEXTAREA SELECT VIDEO AUDIO".split(" "));
  function copy(node){
    if(node.nodeType===Node.TEXT_NODE) return document.createTextNode(node.textContent);
    const fragment=document.createDocumentFragment();
    if(node.nodeType!==Node.ELEMENT_NODE || blocked.has(node.tagName)) return fragment;
    const out=allowed.has(node.tagName)?document.createElement(node.tagName.toLowerCase()):fragment;
    if(node.tagName==="A"){
      const href=node.getAttribute("href")||"";
      if(/^(https?:\/\/|mailto:)/i.test(href)){
        out.setAttribute("href",href);out.setAttribute("rel","noopener noreferrer");out.setAttribute("target","_blank");
      }
    }
    if(node.tagName==="IMG"){
      const src=node.getAttribute("src")||"";
      out.setAttribute("alt",node.getAttribute("alt")||"Note image");
      out.setAttribute("referrerpolicy","no-referrer");
      if(/^https:\/\//i.test(src) || /^data:image\/(png|jpeg|gif|webp);base64,/i.test(src)) out.setAttribute("src",src);
    }
    node.childNodes.forEach(child=>out.append(copy(child)));
    return out;
  }
  const result=document.createDocumentFragment();
  parsed.body.childNodes.forEach(child=>result.append(copy(child)));
  return result;
}

const main=document.createElement("main");
main.className="public-note";
const home=document.createElement("a");home.href="/";home.textContent="Arvio";
const label=document.createElement("p");label.textContent="SHARED NOTE · VIEW ONLY";
const title=document.createElement("h1");title.textContent="Loading shared note…";
const status=document.createElement("p");status.setAttribute("role","status");
const content=document.createElement("article");
const retry=document.createElement("button");retry.textContent="Try again";retry.hidden=true;
main.append(home,label,title,status,content,retry);
document.body.replaceChildren(main);
async function load(){
  retry.hidden=true;status.textContent="";
  try{
    const note=await readSharedNote(new URLSearchParams(location.search).get("share"));
    if(!note){title.textContent="This link is unavailable";status.textContent="The owner may have removed link access or moved the note to Trash.";return}
    title.textContent=note.title||"Untitled";
    document.title=`${note.title||"Untitled"} — Arvio`;
    content.replaceChildren(safeSharedContent(note.html));
  }catch(error){
    title.textContent="Couldn’t load this note";
    status.textContent=error.status===404 ? "Sharing needs to be set up by the site owner." : "Check your connection and try again.";
    retry.hidden=false;
  }
}
retry.addEventListener("click",load);
load();
