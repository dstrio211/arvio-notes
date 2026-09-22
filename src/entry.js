// Shared links never hydrate, save, or expose the visitor's private workspace.
if(new URLSearchParams(location.search).has("share")){
  import("./shared-view.js");
}else{
  import("./main.js");
}
