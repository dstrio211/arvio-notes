import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createServer } from 'vite';

// Starts Vite, or uses ARVIO_TEST_URL. The hook is injected only into test responses,
// never shipped in the application bundle. Optional executable for managed CI.
const server=process.env.ARVIO_TEST_URL ? null : await createServer({server:{host:'127.0.0.1',port:5173,strictPort:true}});
await server?.listen();
const browser=await chromium.launch({
  executablePath:process.env.ARVIO_BROWSER_EXECUTABLE || undefined,
  args:process.env.ARVIO_BROWSER_ARGS ? JSON.parse(process.env.ARVIO_BROWSER_ARGS) : []
});
const base=process.env.ARVIO_TEST_URL || 'http://127.0.0.1:5173';
const output=process.env.ARVIO_TEST_OUTPUT || 'test-results';
await mkdir(output,{recursive:true});
const errors=[];
const hook=`\nwindow.__qa={
  get state(){return {tree:libraryTree,pins:[...quickAccessIds],trash:libraryTrash,hydrated:libraryStateHydrated,activeKey:activeLocalNoteKey}},
  find:findLibraryNodeById,flatten:()=>flattenTree(libraryTree),
  rename:renameLibraryPath,move:moveLibraryPath,duplicate:duplicateLibraryPath,
  trash:removeLibraryPath,restore:restoreLibraryTrashItem,remove:permanentlyDeleteLibraryTrashItems,
  save:persistLibraryStateNow,render:()=>{renderLibrary();renderQuickAccess()},
  actions:openLibraryItemActions,close:()=>closeLibraryItemActions({immediate:true}),
  activate:activatePage,create:createDraftAtPath,
  setTree(tree,pins=[]){libraryTree.splice(0,libraryTree.length,...tree);quickAccessIds=pins;libraryTrash=[];renderLibrary();renderQuickAccess()},
  readState:()=>readArvioStore(ARVIO_APP_STATE_STORE,ARVIO_LIBRARY_DB_KEY)
};`;
async function context(options={}){
  const ctx=await browser.newContext(options);
  await ctx.addInitScript(()=>{try{localStorage.setItem('arvioLocalSession_v350','true')}catch{}});
  await ctx.route('**/src/main.js',async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:(await response.text())+hook});
  });
  const page=await ctx.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  return {ctx,page};
}
async function ready(page){
  await page.goto(base);
  await page.waitForFunction(()=>window.__qa?.state.hydrated && document.querySelector('#quick-access-list').getAttribute('aria-busy')==='false');
  await page.waitForSelector('#workspace.active');
  await page.waitForTimeout(1200);
}
async function pin(page,id){
  await page.evaluate(id=>{
    __qa.activate('library');
    __qa.actions(__qa.find(id).path.join('›'),document.querySelector('.library-tools'));
  },id);
  const btn=page.locator('[data-library-action="quick-access"]');
  await btn.click();
  await page.waitForFunction(()=>!document.querySelector('[data-library-action="quick-access"]').disabled);
  await page.evaluate(()=>__qa.close());
}
async function pins(page){return page.evaluate(()=>__qa.state.pins)}
async function visible(page){return page.locator('[data-quick-access-id]').evaluateAll(items=>items.map(x=>x.dataset.quickAccessId))}
async function checkpoint(page){await page.evaluate(()=>__qa.save());await page.waitForTimeout(180)}
async function reload(page){await page.reload();await page.waitForFunction(()=>window.__qa?.state.hydrated && document.querySelector('#quick-access-list').getAttribute('aria-busy')==='false');await page.waitForTimeout(1200)}
function check(name){console.log('PASS '+name)}
const {ctx,page}=await context({viewport:{width:1440,height:1000}});
try{
  await ready(page);
  assert.equal(await page.locator('[data-quick-access-id]').count(),0);
  assert.match(await page.locator('.quick-access-empty').textContent(),/Pin notes/);
  const ids=await page.evaluate(()=>Object.fromEntries(__qa.flatten().map(e=>[e.path.join('›'),e.node.id])));
  const root=ids.Toyota, branch=ids['Toyota›Avanza'], leaf=ids['Toyota›Avanza›Durability'], other=ids.Programming;
  await pin(page,root);await pin(page,leaf);await pin(page,other);
  assert.deepEqual(await pins(page),[other,leaf,root]);
  await reload(page);assert.deepEqual(await visible(page),[other,leaf,root]);
  check('empty state, top-level/nested pinning, newest-first order and IndexedDB reload');

  await page.evaluate(({root,leaf})=>{
    __qa.rename(__qa.find(root).path,'Vehicles');
    __qa.rename(__qa.find(leaf).path,'Durability revised');
    __qa.move(__qa.find(leaf).path,['Programming']);__qa.render();
  },{root,leaf});
  assert.deepEqual(await pins(page),[other,leaf,root]);
  assert.equal(await page.locator(`[data-quick-access-id="${leaf}"] .quick-access-title`).textContent(),'Durability revised');
  assert.equal(await page.locator(`[data-quick-access-id="${leaf}"] .quick-access-location`).textContent(),'Programming');
  await page.locator(`[data-quick-access-id="${leaf}"]`).click();
  await page.waitForSelector('#page-note.active');
  assert.equal(await page.evaluate(()=>__qa.state.activeKey),`noteid:${leaf}`);
  await page.locator('.note-title').fill('Renamed in editor');
  await page.locator('.editor-body').fill('Content saved when switching between pins.');
  await page.locator(`[data-quick-access-id="${root}"]`).click();
  await page.waitForFunction(id=>__qa.state.activeKey===`noteid:${id}`,root);
  await page.locator(`[data-quick-access-id="${leaf}"]`).click();
  await page.waitForFunction(id=>__qa.state.activeKey===`noteid:${id}`,leaf);
  await page.waitForTimeout(200);
  assert.equal(await page.locator('.note-title').inputValue(),'Renamed in editor');
  assert.match(await page.locator('.editor-body').textContent(),/Content saved when switching/);
  assert.equal(await page.locator(`[data-quick-access-id="${leaf}"]`).getAttribute('aria-current'),'page');
  await page.locator('.primary-nav [data-page="home"]').click();
  assert.equal(await page.locator('.quick-access [aria-current]').count(),0);
  check('rename/move retain ID and order, editor rename updates rows, switching pins saves edits, Home clears active pin');

  const clone=await page.evaluate(id=>__qa.duplicate(__qa.find(id).path).node.id,other);
  assert(!((await pins(page)).includes(clone)));
  assert.deepEqual(await pins(page),[other,leaf,root]);
  const trashId=await page.evaluate(id=>__qa.trash(__qa.find(id).path,{recordTrash:true}).id,other);
  assert.deepEqual(await visible(page),[root]);
  await checkpoint(page);await reload(page);assert.deepEqual(await pins(page),[other,leaf,root]);assert.deepEqual(await visible(page),[root]);
  await page.evaluate(id=>__qa.restore(id),trashId);
  assert.deepEqual(await visible(page),[other,leaf,root]);
  const deleting=await page.evaluate(id=>__qa.trash(__qa.find(id).path,{recordTrash:true}).id,other);
  await page.evaluate(id=>__qa.remove([id]),deleting);
  assert.deepEqual(await pins(page),[root]);
  await checkpoint(page);await reload(page);assert.deepEqual(await pins(page),[root]);
  check('duplicate stays unpinned, subtree Trash/reload/restore preserves order, permanent subtree deletion cleans pins');

  // Restore under a parent that changed name/location while its child was trashed.
  await pin(page,branch);
  const childTrash=await page.evaluate(id=>__qa.trash(__qa.find(id).path,{recordTrash:true}).id,branch);
  await page.evaluate(id=>__qa.rename(__qa.find(id).path,'Renamed vehicles'),root);
  assert.equal(await page.evaluate(id=>__qa.restore(id).ok,childTrash),true);
  assert.equal(await page.locator(`[data-quick-access-id="${branch}"] .quick-access-location`).textContent(),'Renamed vehicles');
  // A sibling with the original name must not steal the restored identity.
  const collisionTrash=await page.evaluate(id=>__qa.trash(__qa.find(id).path,{recordTrash:true}).id,branch);
  await page.evaluate(id=>{
    const parent=__qa.find(id).node;
    parent.children.push({id:crypto.randomUUID(),title:'Avanza',children:[],createdAt:new Date().toISOString()});
  },root);
  assert.equal(await page.evaluate(id=>__qa.restore(id).ok,collisionTrash),true);
  assert.equal(await page.locator(`[data-quick-access-id="${branch}"] .quick-access-title`).textContent(),'Avanza 2');
  await pin(page,branch);assert.deepEqual(await pins(page),[root]);
  await pin(page,branch);assert.deepEqual(await pins(page),[branch,root]);
  check('restore follows parent ID and avoids name collision, remove/re-pin moves only that pin to top');

  // Exact ID opening even with duplicate titles (possible through the existing editor).
  const collision=await page.evaluate(()=>{
    const now=new Date().toISOString();
    const tree=[{id:'same-a',title:'Same',body:'first exact note',createdAt:now,children:[]},{id:'same-b',title:'Same',body:'second exact note',createdAt:now,children:[]}];
    __qa.setTree(tree,['same-b','same-a']);return 'same-b';
  });
  await page.locator(`[data-quick-access-id="${collision}"]`).click();
  assert.equal(await page.evaluate(()=>__qa.state.activeKey),'noteid:same-b');
  assert.match(await page.locator('.editor-body').textContent(),/second exact note/);
  check('pin navigation selects exact stable ID even when titles/paths collide');

  // Desktop material and layout stress, including long unbroken titles and many pins.
  await page.evaluate(()=>{
    const now=new Date().toISOString();
    const tree=Array.from({length:40},(_,i)=>({id:`layout-${i}`,title:i===0?'VeryLongUnbrokenTitle'.repeat(12):`Pinned note ${i}`,createdAt:now,children:[]}));
    __qa.setTree(tree,tree.map(n=>n.id));__qa.activate('library');
  });
  await page.waitForTimeout(500);
  assert(await page.locator('#quick-access-list').evaluate(el=>el.scrollHeight>el.clientHeight));
  assert(await page.locator('.sidebar').evaluate(el=>el.scrollWidth<=el.clientWidth));
  await page.screenshot({path:`${output}/desktop-quick-access.png`});
  await page.evaluate(()=>__qa.actions(__qa.find('layout-0').path.join('›'),document.querySelector('.library-tools')));
  await page.waitForTimeout(550);
  async function sheetFits(page){
    return page.locator('.library-item-action-sheet').evaluate(el=>{
      const r=el.getBoundingClientRect();
      return r.left>=0 && r.top>=0 && r.right<=innerWidth+1 && r.bottom<=innerHeight+1 && el.scrollWidth<=el.clientWidth+1;
    });
  }
  assert(await sheetFits(page));
  await page.screenshot({path:`${output}/desktop-action-sheet.png`});
  await page.setViewportSize({width:900,height:430});await page.waitForTimeout(200);
  assert(await sheetFits(page));
  await page.locator('[data-library-action="trash"]').scrollIntoViewIfNeeded();
  assert(await sheetFits(page));
  check('desktop sidebar scrolling/truncation, long-title sheet bounds and short viewport scrolling');

  for(const size of [{width:390,height:844},{width:375,height:667},{width:320,height:568},{width:844,height:390}]){
    await page.setViewportSize(size);await page.waitForTimeout(250);
    assert(await sheetFits(page),`sheet overflow ${JSON.stringify(size)}`);
    await page.locator('[data-library-action="quick-access"]').scrollIntoViewIfNeeded();
    await page.locator('[data-library-action="trash"]').scrollIntoViewIfNeeded();
    if(size.width<=760) await page.locator('.library-item-cancel').scrollIntoViewIfNeeded();
    assert(await sheetFits(page));
  }
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>{__qa.close();__qa.actions(__qa.find('layout-1').path.join('›'),document.querySelector('.library-tools'))});
  await page.waitForTimeout(550);
  await page.screenshot({path:`${output}/iphone-action-sheet.png`});
  await page.evaluate(()=>__qa.close());
  for(const route of ['home','library','profile','home']){
    await page.locator(`.mobile-nav [data-page="${route}"]`).click();await page.waitForTimeout(750);
    assert.equal(await page.locator('.mobile-nav .nav-item.active').getAttribute('data-page'),route);
    assert.equal(await page.locator('.mobile-nav-indicator').getAttribute('data-target-key'),route);
  }
  assert.equal(await page.locator('.mobile-nav .nav-item').count(),3);
  await page.screenshot({path:`${output}/iphone-home.png`});
  await checkpoint(page);await reload(page);
  assert.equal(await page.locator('.mobile-nav-indicator').getAttribute('data-target-key'),'home');
  check('390/375/320px mobile and landscape/short viewport sheet bounds, reachable controls, bottom nav and returning session');
  await ctx.close();

  const fallback=await context({viewport:{width:1280,height:900}});
  await fallback.ctx.addInitScript(()=>Object.defineProperty(window,'indexedDB',{configurable:true,get(){throw new Error('Test: IndexedDB blocked')}}));
  await ready(fallback.page);
  const fallbackIds=await fallback.page.evaluate(()=>__qa.flatten().slice(0,3).map(e=>e.node.id));
  await pin(fallback.page,fallbackIds[0]);await pin(fallback.page,fallbackIds[2]);
  await reload(fallback.page);assert.deepEqual(await pins(fallback.page),[fallbackIds[2],fallbackIds[0]]);
  const ft=await fallback.page.evaluate(id=>__qa.trash(__qa.find(id).path,{recordTrash:true}).id,fallbackIds[0]);
  await checkpoint(fallback.page);await reload(fallback.page);assert.deepEqual(await visible(fallback.page),[]);
  await fallback.page.evaluate(id=>__qa.restore(id),ft);
  assert.deepEqual(await visible(fallback.page),[fallbackIds[2],fallbackIds[0]]);
  await fallback.page.evaluate(id=>{const t=__qa.trash(__qa.find(id).path,{recordTrash:true});__qa.remove([t.id])},fallbackIds[0]);
  await checkpoint(fallback.page);await reload(fallback.page);assert.deepEqual(await pins(fallback.page),[]);
  check('localStorage fallback persists order, hidden subtree pins, restoration and permanent cleanup after reload');
  await fallback.ctx.close();
  assert.deepEqual(errors,[]);
  check('no browser JavaScript errors');
}finally{await browser.close();await server?.close()}
