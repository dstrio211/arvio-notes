// The HTML boot gate prevents unstyled content before route CSS has loaded.
async function startArvio(){
  try{
    if(new URLSearchParams(location.search).has("share")){
      await import("./shared-view.js");
    }else{
      await import("./main.js");
    }
  }catch(error){
    console.error("Arvio could not load",error);
    const message=document.createElement("main");
    message.style.cssText="min-height:100vh;box-sizing:border-box;padding:48px 24px;background:#050608;color:#f5f7fa;font:16px/1.6 system-ui";
    const title=document.createElement("h1");title.textContent="Couldn’t open Arvio";
    const detail=document.createElement("p");detail.textContent="Check your connection, then try again.";
    const retry=document.createElement("button");retry.textContent="Try again";
    retry.style.cssText="padding:12px 20px;background:#17232d;color:#f5f7fa;border:1px solid #435a6b;border-radius:12px;font:inherit";
    retry.addEventListener("click",()=>location.reload());
    message.append(title,detail,retry);document.body.replaceChildren(message);
  }finally{
    document.documentElement.removeAttribute("data-arvio-boot");
  }
}
startArvio();
