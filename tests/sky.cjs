const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const settle = () => new Promise(resolve => setTimeout(resolve,150));
(async () => {
 const browser = await chromium.launch({channel:'msedge',headless:true});
 try {
  for (const width of [390,1440]) {
   const page = await browser.newPage({viewport:{width,height:900}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.clock.install();
   await page.addInitScript(()=>{
    let seed=315;
    Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    window.skyFrames=[];
    const clear=CanvasRenderingContext2D.prototype.clearRect;
    const draw=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.clearRect=function(...args){
     if(this.canvas.className==='pixel-meteors') window.skyFrames.push({time:performance.now(),heads:[]});
     return clear.apply(this,args);
    };
    CanvasRenderingContext2D.prototype.drawImage=function(...args){
     if(this.canvas.className==='pixel-meteors') window.skyFrames.at(-1).heads.push({x:args[1],y:args[2],size:args[3],sprite:args[0].toDataURL()});
     return draw.apply(this,args);
    };
   });
   await page.goto('http://127.0.0.1:5505');await page.waitForLoadState('networkidle');
   assert.equal(await page.locator('.pixel-moon').count(),1);
   assert.equal(await page.locator('.pixel-meteors').evaluate(n=>getComputedStyle(n).pointerEvents),'none');
   await page.clock.runFor(5000);
   await page.screenshot({path:`.test-results/sky-${width}.png`});
   await page.clock.runFor(13000);
   const frames=await page.evaluate(()=>window.skyFrames);
   const first=frames.filter(f=>f.heads.length).slice(0,60);
   assert.ok(first.at(-1).heads[0].x < first[0].heads[0].x);
   assert.ok(first.at(-1).heads[0].y > first[0].heads[0].y);
   assert.ok(new Set(first.map(f=>f.heads[0].sprite)).size>3,'Star should rotate');
   assert.ok(new Set(frames.flatMap(f=>f.heads.map(h=>h.size))).size>2,'Star sizes should vary');
   const maximum=Math.max(...frames.map(f=>f.heads.length));
   assert.ok(maximum>1&&maximum<=10);
   for(let i=1;i<frames.length;i++) assert.ok(frames[i].heads.length-frames[i-1].heads.length<=1,'No simultaneous batch launch');
   await page.emulateMedia({reducedMotion:'reduce'});await settle();
   assert.ok(!await page.locator('.pixel-meteors').isVisible());
   assert.ok(await page.locator('.pixel-moon').isVisible());
   await page.clock.runFor(20000);assert.ok(!await page.locator('.pixel-meteors').isVisible());
   await page.emulateMedia({reducedMotion:'no-preference'});await settle();await page.clock.runFor(3500);
   assert.ok(await page.locator('.pixel-meteors').isVisible());
   await page.locator('.work-button').first().dispatchEvent('click',{detail:0});
   await page.waitForSelector('.flying-art');await page.clock.runFor(1200);
   await page.waitForFunction(()=>document.querySelector('#detailDialog').open&&!document.querySelector('#detailDialog').classList.contains('is-arriving'));
   await page.locator('#closeDialog').click();assert.deepEqual(errors,[]);
   console.log(`PASS ${width}px: moon, curved down-left motion, rotation, sizes, staggered launch, peak ${maximum}, reduced motion, open/close`);
   // Force rapid individual launches to exercise the hard cap, without changing the source.
   await page.evaluate(()=>{
    const timeout=window.setTimeout;
    window.setTimeout=(fn,ms,...args)=>timeout(fn,fn.name==='launch'?100:ms,...args);
    window.skyFrames=[];
   });
   await page.setViewportSize({width:width-2,height:898});await settle();await page.clock.runFor(6000);
   const peak=await page.evaluate(()=>Math.max(...window.skyFrames.map(f=>f.heads.length)));
   assert.equal(peak,10,'Must reach but never exceed the cap under rapid launch pressure');
   console.log(`PASS ${width}px: hard concurrent cap = ${peak}`);
   await page.close();
  }
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
