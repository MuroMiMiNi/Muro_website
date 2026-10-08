const {chromium}=require('C:/Users/peter/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:5505/?v=physics');await page.waitForSelector('#mobileGallery[data-ready]');
    const states=()=>page.evaluate(()=>document.querySelector('#mobileGallery').mobile3D.picturePendulums.map(p=>({...p.state,index:p.index})));
    const initial=await states();assert.equal(initial.length,await page.locator('.work-button').count());
    assert.ok(new Set(initial.map(s=>s.yaw.toFixed(3))).size>4,'Pictures have independent orientations');
    assert.ok(await page.evaluate(()=>document.querySelector('#mobileGallery').mobile3D.cords.every(c=>c.mesh.geometry.type==='TubeGeometry'&&Math.abs(c.state.bend)>0)),'Real curved cord meshes');
    const initialBends=await page.evaluate(()=>document.querySelector('#mobileGallery').mobile3D.cords.map(c=>c.state.bend));
    const rect=await page.locator('.mobile-canvas').boundingBox();
    await page.mouse.move(rect.x+rect.width*.3,rect.y+30);await page.mouse.down();
    for(const [dx,dy] of [[70,35],[-90,-30],[85,30],[-60,-20]]){
      await page.mouse.move(rect.x+rect.width*.3+dx,rect.y+30+dy,{steps:12});await page.waitForTimeout(100);
    }
    await page.mouse.up();await page.waitForTimeout(180);const released=await states();
    const supports=await page.evaluate(()=>document.querySelector('#mobileGallery').mobile3D.hangingPendulums.slice(0,5).map(p=>p.state));
    assert.equal(supports.length,5);
    assert.ok(supports.every(s=>Math.hypot(s.vx,s.vz,s.vy)>.001),'All support beams have independent physical motion');
    assert.ok(released.every(s=>Math.hypot(s.vx,s.vz,s.vy)>.001),'Each picture responds to moving support');
    assert.ok(new Set(released.map(s=>s.yaw.toFixed(3))).size>10,'Pictures do not rotate as one rigid piece');
    const bends=await page.evaluate(()=>document.querySelector('#mobileGallery').mobile3D.cords.map(c=>c.state.bend));
    assert.ok(bends.some((b,i)=>Math.abs(b-initialBends[i])>.002),'Cords flex when disturbed');
    assert.ok(await page.evaluate(()=>document.querySelector('#mobileGallery').mobile3D.audit().every(j=>j.topError<1e-6&&j.bottomError<1e-6)),'All moving cord/ring contacts stay connected');
    await page.locator('#mobileGallery').screenshot({path:'.test-results/e-flex-moving.png'});
    await page.waitForTimeout(250);const later=await states();
    assert.ok(later.every((s,i)=>Math.hypot(s.yaw-released[i].yaw,s.x-released[i].x,s.z-released[i].z)>.0001),'Every picture retains inertia after release');
    await page.evaluate(()=>document.querySelector('#mobileGallery').mobile3D.setView(-.22,.08));await page.waitForTimeout(1000);
    const before=await states();await page.waitForTimeout(4000);const after=await states();
    const energy=items=>items.reduce((sum,s)=>sum+s.vx*s.vx+s.vz*s.vz+30*(s.x*s.x+s.z*s.z),0);
    assert.ok(energy(after)<energy(before),'Damping reduces swing energy');
    assert.ok(after.every(s=>Math.abs(s.yaw)<=.85),'No paper-thin picture orientation');
    await page.locator('#mobileGallery').screenshot({path:'.test-results/e-flex-settled.png'});
    await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);
    assert.ok((await states()).every(s=>s.x===0&&s.z===0&&s.vx===0&&s.vz===0&&s.vy===0));
    assert.deepEqual(errors,[]);console.log('PASS independent artwork and support pendulums, flexible geometry, inertia, damping, connected moving chains, reduced motion');
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
