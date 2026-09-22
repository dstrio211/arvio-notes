import {readSharedNote} from "./supabase.js";
import "./styles/shared-view.css";
import "./styles/branding.css";
import "./styles/note-content.css";

// Preserve presentation only. Never forward event handlers, arbitrary classes,
// positioning, external CSS, or active content from shared HTML.
const sharedTextProperties=["color","background-color","font-family","font-size","font-weight","font-style","font-variant","line-height","letter-spacing","word-spacing","text-align","text-decoration-line","text-decoration-color","text-decoration-style","text-indent","text-transform","white-space","tab-size","vertical-align","list-style-type","margin-top","margin-bottom","margin-left","margin-right","padding-top","padding-bottom","padding-left","padding-right","border-top-color","border-bottom-color","border-left-color","border-right-color","border-top-style","border-bottom-style","border-left-style","border-right-style","border-top-width","border-bottom-width","border-left-width","border-right-width","border-radius"];
function copySharedPresentation(source,target){
  for(const property of sharedTextProperties){
    const value=source.style.getPropertyValue(property);
    if(!value || value.length>256 || /url|var\(|attr\(|expression|[\\<>@]/i.test(value)) continue;
    // No negative spacing or calculated geometry that could obscure nearby text.
    if(/^(margin|padding|text-indent|border.*width)/.test(property) && !/^(?:0|\d+(?:\.\d+)?(?:px|em|rem|%|pt))$/.test(value)) continue;
    target.style.setProperty(property,value);
  }
  if(source.tagName==="FONT"){
    for(const [attribute,property] of [["color","color"],["face","font-family"]]){
      const value=source.getAttribute(attribute)||"";
      if(value.length<200 && !/[\\<>@]|url|var\(/i.test(value) && !target.style.getPropertyValue(property)) target.style.setProperty(property,value);
    }
    const size=source.getAttribute("size");
    if(/^[1-7]$/.test(size||"")) target.style.fontSize=["","x-small","small","medium","large","x-large","xx-large","xxx-large"][Number(size)];
  }
  for(const attribute of ["start","value","colspan","rowspan"]){
    const value=source.getAttribute(attribute);
    if(value && /^\d{1,4}$/.test(value)) target.setAttribute(attribute,value);
  }
  if(source.tagName==="OL" && source.hasAttribute("reversed")) target.setAttribute("reversed","");
  if(["ltr","rtl","auto"].includes(source.getAttribute("dir"))) target.dir=source.getAttribute("dir");
}
export function safeSharedContent(html){
  const parsed=new DOMParser().parseFromString(String(html||""),"text/html");
  const allowed=new Set("P BR DIV SPAN STRONG B EM I U S STRIKE H1 H2 H3 H4 H5 H6 BLOCKQUOTE UL OL LI PRE CODE HR A IMG MARK FONT SUB SUP SMALL TABLE THEAD TBODY TFOOT TR TH TD CAPTION COLGROUP COL DL DT DD".split(" "));
  const blocked=new Set("SCRIPT STYLE IFRAME OBJECT EMBED SVG MATH FORM INPUT BUTTON TEXTAREA SELECT VIDEO AUDIO".split(" "));
  function copy(node){
    if(node.nodeType===Node.TEXT_NODE) return document.createTextNode(node.textContent);
    const fragment=document.createDocumentFragment();
    if(node.nodeType!==Node.ELEMENT_NODE || blocked.has(node.tagName) || node.classList.contains("note-image-controls")) return fragment;
    const out=allowed.has(node.tagName)?document.createElement(node.tagName==="FONT"?"span":node.tagName.toLowerCase()):fragment;
    if(out.nodeType===Node.ELEMENT_NODE) copySharedPresentation(node,out);
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
const home=document.createElement("a");home.href="/";home.className="shared-brand";home.setAttribute("aria-label","Arvio home");
const logo=document.createElement("img");logo.src="/arvio-logo.png";logo.alt="Arvio";logo.className="brand-logo sidebar-brand-logo";home.append(logo);
const label=document.createElement("p");label.textContent="SHARED NOTE · VIEW ONLY";
const title=document.createElement("h1");title.className="shared-note-title";title.textContent="Loading shared note…";
const status=document.createElement("p");status.setAttribute("role","status");
const content=document.createElement("article");content.className="shared-note-body";
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
