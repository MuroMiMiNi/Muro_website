const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const base = process.env.TEST_URL || 'http://127.0.0.1:5505';
const settled = page => page.waitForFunction(() => !document.querySelector('#detailDialog').hasAttribute('data-revealing'));
const open = async page => {
  await page.locator('[data-page="allWorks"]').click();
  await page.waitForSelector('.is-collection[open]');
};

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const mobile = JSON.parse(await fs.readFile('scripts/data/artwork-catalog.json', 'utf8'));
  const catalog = JSON.parse(await fs.readFile('scripts/data/all-artwork-catalog.json', 'utf8'));
  const errors = [];
  try {
    for (const width of [1440, 768, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base); await page.waitForSelector('#mobileGallery[data-ready]');
      const ids = await page.locator('.work-button').evaluateAll(nodes => nodes.map(node => node.dataset.artwork));
      assert.deepEqual(ids, mobile.map(work => work.id));
      await open(page); await page.waitForSelector('[data-revealing]');
      await page.waitForTimeout(450);
      const timings = await page.locator('.collection-flight-work').evaluateAll(nodes => nodes.map(node => +node.dataset.enter));
      assert.equal(timings.length, Math.min(catalog.length, width < 600 ? 6 : 10));
      assert.ok(timings[1] > timings[0], 'Foreground works enter separately');
      assert.equal(await page.locator('.collection-wall').evaluate(node => getComputedStyle(node).opacity), '0', 'No premature gallery flash');
      const before = await page.locator('.collection-flight-camera').evaluate(node => new DOMMatrix(getComputedStyle(node).transform).m43);
      await page.waitForTimeout(1000);
      const after = await page.locator('.collection-flight-camera').evaluate(node => new DOMMatrix(getComputedStyle(node).transform).m43);
      assert.ok(after > before, 'One shared camera moves forward through the depth planes');
      assert.ok(await page.locator('.collection-work').evaluateAll(nodes => nodes.every(node => getComputedStyle(node).transform === 'none')), 'Gallery pictures never move individually');
      await settled(page);
      assert.equal(await page.locator('.collection-work').count(), catalog.length);
      assert.ok(await page.locator('#detailDialog').evaluate(dialog => dialog.scrollWidth <= dialog.clientWidth));
      assert.ok(await page.locator('.collection-work img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0 && getComputedStyle(image).objectFit === 'contain')));
      await page.locator('[data-category="半身"]').first().click();
      const halfCount = catalog.filter(work => work.category === '半身').length;
      assert.equal(await page.locator('.collection-work:visible').count(), halfCount);
      assert.equal(await page.locator('.collection-status').textContent(), halfCount ? `${halfCount} 件作品` : '這個分類還沒有作品。');
      await page.locator('[data-category="頭像"]').first().click();
      assert.equal(await page.locator('.collection-work:visible').count(), catalog.filter(work => work.category === '頭像').length);
      const chosen = page.locator('.collection-work:visible').first();
      const selectedTitle = await chosen.getAttribute('aria-label');
      await chosen.click(); await page.waitForSelector('#detailDialog.is-artwork[open]');
      await page.waitForSelector('.flying-art', { state: 'detached' });
      assert.equal(await page.locator('#dialogTitle').textContent(), selectedTitle);
      await page.getByRole('button', { name: '返回所有作品', exact: true }).click(); await settled(page);
      assert.equal(await page.locator('.collection-filters [aria-pressed="true"]').getAttribute('data-category'), '頭像');
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('#detailDialog').open);
      assert.equal(await page.locator('[data-page="allWorks"]').evaluate(node => node === document.activeElement), true);
      await page.locator('#language').click();
      assert.equal(await page.locator('[data-page="allWorks"]').textContent(), 'All works');
      await page.emulateMedia({ reducedMotion: 'reduce' }); await open(page);
      assert.equal(await page.locator('[data-revealing]').count(), 0);
      assert.equal(await page.locator('#dialogTitle').textContent(), 'All works');
      assert.equal(await page.locator('.collection-work').evaluateAll(nodes => nodes.flatMap(node => node.getAnimations()).length), 0);
      if (width === 1440 || width === 390) await page.screenshot({ path: `.test-results/all-works-final-${width}.png` });
      await page.keyboard.press('Escape');
      await page.emulateMedia({ reducedMotion: 'no-preference' }); await open(page);
      await page.waitForSelector('[data-revealing]'); await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      assert.equal(await page.locator('[data-revealing]').count(), 0);
      assert.equal(await page.evaluate(() => document.body.style.position), '');
      console.log(`PASS ${width}: depth passage, no gallery flash, stable wall, categories, detail return, language, reduced motion, interruption`);
      await page.close();
    }
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    const half = path.resolve('assets/all-artworks/半身/test-2099-01-01.png');
    const full = path.resolve('assets/all-artworks/全身/test-2099-01-02.png');
    try {
      await fs.copyFile(path.resolve('assets/artworks', mobile[0].id), half);
      await fs.copyFile(path.resolve('assets/artworks', mobile[0].id), full);
      await page.goto(base); await page.waitForSelector('#mobileGallery[data-ready]'); await open(page);
      assert.equal(await page.locator('.collection-work').count(), catalog.length + 2);
      for (const category of ['半身', '全身']) {
        await page.locator(`.collection-filters [data-category="${category}"]`).click();
        assert.equal(await page.locator('.collection-work:visible').count(), catalog.filter(work => work.category === category).length + 1);
      }
      assert.deepEqual(await page.locator('.work-button').evaluateAll(nodes => nodes.map(node => node.dataset.artwork)), mobile.map(work => work.id));
    } finally {
      await fs.unlink(half).catch(() => {}); await fs.unlink(full).catch(() => {});
      await page.request.get(`${base}/scripts/data/all-artwork-catalog.json`);
    }
    await page.locator('#closeDialog').click();
    const many = Array.from({ length: 45 }, (_, index) => ({ ...catalog[index % catalog.length], id: `fixture-${index}` }));
    await page.route('**/scripts/data/all-artwork-catalog.json', route => route.fulfill({ json: many }));
    await open(page); assert.equal(await page.locator('.collection-work').count(), 45);
    await page.locator('#closeDialog').click();
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await open(page);
    await page.waitForSelector('[data-revealing]'); await page.waitForTimeout(100);
    const longDelays = await page.locator('.collection-flight-work').evaluateAll(nodes => nodes.map(node => +node.dataset.enter));
    assert.equal(new Set(longDelays).size, 10, 'The cinematic foreground stays bounded with a large collection');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('[data-revealing]').count(), 0, 'Keyboard focus skips the introduction');
    await page.locator('#closeDialog').click(); await open(page); await page.waitForSelector('[data-revealing]');
    await page.setViewportSize({ width: 390, height: 844 }); await settled(page);
    assert.equal(await page.locator('.collection-work').count(), 45);
    await page.close();
    const slow = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    slow.on('pageerror', error => errors.push(error.message));
    await slow.addInitScript(() => {
      window.collectionFrames = [];
      function sample(now) {
        const dialog = document.querySelector('#detailDialog'), wall = document.querySelector('.collection-wall');
        if (dialog?.hasAttribute('data-revealing') && wall) window.collectionFrames.push({ time: now, phase: dialog.dataset.collectionPhase, opacity: getComputedStyle(wall).opacity });
        requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    });
    await slow.route('**/assets/all-artworks/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 700)); await route.continue();
    });
    await slow.goto(base); await slow.waitForSelector('#mobileGallery[data-ready]'); await open(slow);
    await slow.waitForSelector('[data-collection-phase="loading"]'); await settled(slow);
    const samples = await slow.evaluate(() => collectionFrames);
    for (const phase of ['loading', 'opening', 'travel']) {
      const frames = samples.filter(frame => frame.phase === phase);
      assert.ok(frames.length > 0, `Captured ${phase} frames`);
      assert.ok(frames.every(frame => frame.opacity === '0'), `No gallery flash during ${phase}`);
    }
    assert.ok(samples.some(frame => frame.phase === 'arrival' && +frame.opacity > 0), 'Gallery appears only at the destination');
    assert.equal(await slow.locator('.collection-flight').count(), 0);
    assert.equal(await slow.locator('.collection-wall').evaluate(node => getComputedStyle(node).transform), 'none');
    const travelFrames = samples.filter(frame => frame.phase === 'travel');
    const gaps = travelFrames.slice(1).map((frame,index) => frame.time - travelFrames[index].time).sort((a,b) => a-b);
    console.log(`PASS delayed images: no initial flash; median camera frame ${gaps[Math.floor(gaps.length / 2)].toFixed(1)} ms`);
    await slow.close();
    assert.deepEqual(errors, []);
    console.log('PASS live additions/removals, independent folder sources, all works beyond the mobile limit');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
