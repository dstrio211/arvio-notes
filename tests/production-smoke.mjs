import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { preview } from 'vite';
const server=await preview({preview:{host:'127.0.0.1',port:4173,strictPort:true}});
const browser=await chromium.launch({executablePath:process.env.ARVIO_BROWSER_EXECUTABLE || undefined,args:process.env.ARVIO_BROWSER_ARGS ? JSON.parse(process.env.ARVIO_BROWSER_ARGS) : []});
try{
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3});
  await ctx.addInitScript(()=>{try{localStorage.setItem('arvioLocalSession_v350','true')}catch{}});
  const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173');
  await page.waitForSelector('#workspace.active');await page.waitForTimeout(1200);
  await page.locator('.mobile-nav [data-page="library"]').tap();
  await page.locator('[data-library-item-menu="Toyota"]').first().tap();
  const toggle=page.locator('[data-library-action="quick-access"]');
  await toggle.tap();
  await page.waitForFunction(()=>document.querySelector('[data-library-action="quick-access"]')?.getAttribute('aria-pressed')==='true');
  const ids=await page.locator('[data-quick-access-id]').evaluateAll(es=>es.map(e=>e.dataset.quickAccessId));
  assert.equal(ids.length,1);
  await page.locator('.library-item-cancel').tap();
  await page.reload();await page.waitForSelector('#workspace.active');await page.waitForTimeout(1200);
  assert.deepEqual(await page.locator('[data-quick-access-id]').evaluateAll(es=>es.map(e=>e.dataset.quickAccessId)),ids);
  const allIds=await page.locator('[id]').evaluateAll(es=>es.map(e=>e.id));assert.equal(allIds.length,new Set(allIds).size);
  assert.equal(await page.evaluate(()=>typeof window.__qa),'undefined');
  assert.deepEqual(errors,[]);
  console.log('PASS production bundle: touch pin control, persistence after reload, unique DOM IDs, no test hook and no runtime errors');
}finally{await browser.close();await new Promise(resolve=>server.httpServer.close(resolve))}
