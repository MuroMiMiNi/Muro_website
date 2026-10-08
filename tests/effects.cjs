const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const base = 'http://127.0.0.1:5505';
const entered = page => page.waitForFunction(() => {
  const dialog = document.querySelector('#detailDialog');
  return dialog.open && !dialog.classList.contains('is-arriving');
});
const closed = page => page.waitForFunction(() => !document.querySelector('#detailDialog').open && document.body.style.position === '');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const errors = [];
  try {
    for (const mobile of [false, true]) {
      const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, hasTouch: mobile, isMobile: mobile });
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base); await page.waitForLoadState('networkidle');
      assert.equal(await page.locator('.cloud-track').count(), 3);
      assert.equal(await page.locator('#pixelClouds').evaluate(n => getComputedStyle(n).pointerEvents), 'none');
      const cloudMotion = await page.locator('.cloud-track').first().evaluate(n => getComputedStyle(n).transform);
      await page.waitForTimeout(100);
      assert.notEqual(await page.locator('.cloud-track').first().evaluate(n => getComputedStyle(n).transform), cloudMotion);
      // Each repeated band contains all its silhouettes; no cloud is cut off at a loop seam.
      assert.ok(await page.locator('.cloud-band').evaluateAll(bands => bands.every(b => [...b.children].every(c => c.offsetLeft + c.offsetWidth <= b.offsetWidth + 1))));
      const work = page.locator('.work-button').first();
      await work.scrollIntoViewIfNeeded(); await page.waitForTimeout(150);
      if (mobile) { await work.tap(); await page.locator('#scope').tap(); }
      else { await work.focus(); await page.keyboard.press('Enter'); }
      await page.waitForSelector('.artwork-transit');
      const start = Date.now();
      assert.ok(await page.locator('.detail-art').evaluate(i => i.complete && i.naturalWidth > 0));
      const expected = await page.locator('#dialogTitle').textContent();
      await page.locator('.work-button').nth(1).evaluate(b => { b.click(); b.click(); });
      assert.equal(await page.locator('#dialogTitle').textContent(), expected);
      assert.equal(await page.locator('.artwork-transit').count(), 1);
      await page.waitForTimeout(260);
      await page.screenshot({ path: `.test-results/tunnel-${mobile ? 'mobile' : 'desktop'}.png` });
      await entered(page);
      assert.ok(Date.now() - start < 1200);
      assert.equal(await page.locator('.artwork-transit').count(), 0);
      await page.screenshot({ path: `.test-results/arrived-${mobile ? 'mobile' : 'desktop'}.png` });
      await page.locator('#closeDialog').click(); await closed(page);
      assert.equal(await page.locator('[aria-busy="true"]').count(), 0);
      // Escape cancels an active tunnel without leaving an overlay or scroll lock.
      await work.dispatchEvent('click', { detail: 0 });
      await page.waitForSelector('.artwork-transit'); await page.keyboard.press('Escape'); await closed(page);
      assert.equal(await page.locator('.artwork-transit').count(), 0);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.ok(await page.locator('.cloud-track').evaluateAll(nodes => nodes.every(n => getComputedStyle(n).animationName === 'none')));
      await work.dispatchEvent('click', { detail: 0 });
      await entered(page); await page.locator('#closeDialog').click(); await closed(page);
      // A preference change during flight settles immediately at the loaded picture.
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await work.dispatchEvent('click', { detail: 0 }); await page.waitForSelector('.artwork-transit');
      await page.emulateMedia({ reducedMotion: 'reduce' }); await entered(page);
      await page.locator('#closeDialog').click(); await closed(page);
      console.log(`PASS ${mobile ? 'mobile' : 'desktop'}: cloud layers, single flight, loaded destination, cancellation, reduced motion`);
      await page.close();
    }

    const catalog = JSON.parse(await fs.readFile('scripts/data/artwork-catalog.json', 'utf8'));
    const imageBytes = await fs.readFile(catalog[0].src.replace(/^\.\//, ''));
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/scripts/data/artwork-catalog.json', route => route.fulfill({ json: [{ ...catalog[0], src: '/slow-art.png' }] }));
    await page.route('**/slow-art.png', async route => { await gate; await route.fulfill({ body: imageBytes, contentType: 'image/png' }); });
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    const work = page.locator('.work-button').first(); await work.waitFor();
    await work.dispatchEvent('click', { detail: 0 });
    await page.waitForSelector('[aria-busy="true"]');
    assert.ok(!await page.locator('#detailDialog').evaluate(d => d.open));
    assert.equal(await page.locator('.artwork-transit').count(), 0);
    await page.keyboard.press('Escape');
    await page.waitForSelector('[aria-busy="true"]', { state: 'detached' });
    release(); await page.waitForLoadState('networkidle');
    assert.ok(!await page.locator('#detailDialog').evaluate(d => d.open));
    await work.dispatchEvent('click', { detail: 0 }); await entered(page);
    await page.locator('#closeDialog').click(); await closed(page);
    console.log('PASS delayed loading and Escape cancellation');
    // A failed image never opens an empty viewer and can be retried.
    await page.route('**/slow-art.png', route => route.abort());
    await page.reload({ waitUntil: 'networkidle' });
    await work.dispatchEvent('click', { detail: 0 });
    await page.waitForFunction(() => document.querySelector('#artworkStatus').textContent.includes('無法載入'));
    assert.ok(!await page.locator('#detailDialog').evaluate(d => d.open));
    await page.unroute('**/slow-art.png');
    await page.route('**/slow-art.png', route => route.fulfill({ body: imageBytes, contentType: 'image/png' }));
    await work.dispatchEvent('click', { detail: 0 }); await entered(page);
    await page.locator('#closeDialog').click(); await closed(page);
    assert.deepEqual(errors, []);
    console.log('PASS delayed image: no empty dialog, cancellation, retry after network error; no runtime errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
