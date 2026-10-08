const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const base = process.env.TEST_URL || 'http://127.0.0.1:5505';
const ready = page => page.waitForSelector('#mobileGallery[data-ready]');
const entered = page => page.waitForFunction(() => {
  const dialog = document.querySelector('#detailDialog');
  return dialog.open && !dialog.classList.contains('is-arriving');
});
const closed = page => page.waitForFunction(() => !document.querySelector('#detailDialog').open && document.body.style.position === '');

(async () => {
  await fs.mkdir('.test-results', { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const errors = [];
  const catalog = JSON.parse(await fs.readFile('scripts/data/artwork-catalog.json', 'utf8')).slice(0, 20);
  try {
    for (const width of [1440, 768, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, isMobile: width < 600, hasTouch: width < 600 });
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
      await page.goto(base); await ready(page); await page.waitForLoadState('networkidle');
      const displayed = () => page.locator('.work-button').evaluateAll(nodes => nodes.map(node => node.dataset.artwork));
      assert.deepEqual(await displayed(), catalog.map(work => work.id));
      const report = await page.evaluate(() => {
        const rig = document.querySelector('#mobileGallery').mobile3D;
        let pictures = 0, backs = 0, rings = 0;
        rig.scene.traverse(object => {
          if (object.name === 'artwork image / uncropped contain') pictures++;
          if (object.userData.imageMeshes) {
            const decoded = object.userData.imageMeshes.every(mesh => mesh.material.map.image.complete);
            if (!decoded) throw Error('Undecoded artwork');
            backs += object.userData.imageMeshes.length - 1;
          }
          if (object.name === 'Free interlocking suspension ring') rings++;
        });
        return { pictures, backs, rings, cords: rig.cords.length, counts: rig.chainCounts, firstY: rig.chainFirstYs, gl: rig.renderer.getContext().constructor.name, contacts: rig.audit() };
      });
      assert.equal(report.gl, 'WebGL2RenderingContext');
      assert.equal(report.pictures, catalog.length); assert.equal(report.backs, catalog.length);
      assert.equal(report.rings, report.cords * 2);
      assert.equal(report.counts.reduce((sum, count) => sum + count, 0), catalog.length);
      assert.ok(report.counts.every(count => count >= 1 && count <= 5));
      assert.ok(Math.max(...report.counts) - Math.min(...report.counts) >= 2);
      assert.ok(Math.max(...report.firstY) - Math.min(...report.firstY) > 2);
      assert.ok(report.contacts.every(joint => joint.topError < 1e-6 && joint.bottomError < 1e-6));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.equal(await page.locator('#scope, .mobile-link').count(), 0);
      await page.screenshot({ path: `.test-results/e-three-${width}.png`, fullPage: true });
      // Real mesh click, preserving scroll and focus when returning.
      const work = page.locator('.work-button').first();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForTimeout(100);
      await work.scrollIntoViewIfNeeded();
      const target = await work.evaluate(button => button.artworkBounds());
      await page.evaluate(y => scrollBy(0, y - innerHeight * .4), target.y + target.h / 2);
      await page.waitForTimeout(100);
      const origin = await work.evaluate(button => button.artworkBounds());
      const position = await page.evaluate(() => scrollY);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.mouse.click(origin.x + origin.w / 2, origin.y + origin.h / 2);
      await page.waitForSelector('.flying-art');
      await page.waitForTimeout(300);
      if (width === 1440 || width === 390) await page.screenshot({ path: `.test-results/e-arriving-${width}.png` });
      await entered(page);
      assert.equal(await page.locator('#dialogTitle').textContent(), catalog[0].title.zh);
      assert.equal(await page.locator('.flying-art').count(), 0);
      assert.equal(await page.locator('.art-space img').evaluate(image => getComputedStyle(image).opacity), '1');
      if (width === 1440 || width === 390) await page.screenshot({ path: `.test-results/e-detail-${width}.png` });
      await page.getByRole('button', { name: '查看委託須知', exact: true }).click();
      assert.ok(!await page.locator('#detailDialog').evaluate(dialog => dialog.classList.contains('is-artwork')));
      await page.getByRole('button', { name: '下一步：價目表' }).click();
      assert.equal(await page.locator('tbody tr').count(), 3);
      await page.getByRole('button', { name: '下一步：委託表單' }).click();
      await page.getByLabel('委託方案', { exact: true }).selectOption('half-body');
      const form = new URL(await page.getByRole('link', { name: '填寫委託表單' }).getAttribute('href'));
      assert.equal(form.searchParams.get('entry.1679931923'), '半身委託－NT$1100');
      for (const expected of ['價目表', '委託須知', catalog[0].title.zh]) {
        await page.locator('#stepBack').click(); assert.equal(await page.locator('#dialogTitle').textContent(), expected);
      }
      await page.getByRole('button', { name: '返回床鈴', exact: true }).click(); await closed(page);
      assert.ok(Math.abs(await page.evaluate(() => scrollY) - position) < 2);
      assert.equal(await page.evaluate(() => document.activeElement.dataset.artwork), catalog[0].id);
      assert.equal(await page.evaluate(() => document.body.style.getPropertyValue('--scene')), '');
      // Cancel during flight; no stuck animation or scroll lock.
      await work.focus(); await page.keyboard.press('Enter'); await page.waitForSelector('.flying-art');
      await page.keyboard.press('Escape'); await closed(page);
      await page.waitForSelector('.flying-art', { state: 'detached' });
      // Language refresh keeps the exact same physical scene and randomized chain layout.
      await page.evaluate(() => { window.originalRig = document.querySelector('#mobileGallery').mobile3D; scrollTo({ top: 0, behavior: 'instant' }); });
      await page.locator('#language').click();
      assert.equal(await page.locator('html').getAttribute('lang'), 'en');
      assert.deepEqual(await displayed(), catalog.map(work => work.id));
      assert.ok(await page.evaluate(() => originalRig === document.querySelector('#mobileGallery').mobile3D));
      assert.equal(await work.textContent(), catalog[0].title.en);
      await page.getByRole('button', { name: 'Games', exact: true }).click();
      assert.equal(await page.locator('#dialogTitle').textContent(), 'Games');
      await page.keyboard.press('Escape'); await closed(page);
      await page.locator('#language').click();
      await page.locator('#floatingGif').dblclick();
      assert.equal(await page.locator('#dialogTitle').textContent(), '關於木洛');
      await page.keyboard.press('Escape'); await closed(page);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      if (width < 600) await work.tap();
      else { await work.focus(); await page.keyboard.press('Enter'); }
      await entered(page);
      await page.locator('#closeDialog').click(); await closed(page);
      console.log(`PASS ${width}: real 3D, joined rings, double-sided catalog, mesh pick, sky arrival, commission, return, keyboard, language, mascot`);
      await page.close();
    }
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    // Date ordering still happens before the twenty-work limit.
    const newest = Array.from({ length: 25 }, (_, index) => ({ ...catalog[index % catalog.length], id: `dated-${index}`, date: `2026-10-${String(index + 1).padStart(2, '0')}` }));
    await page.route('**/scripts/data/artwork-catalog.json', route => route.fulfill({ json: [...catalog, ...newest] }));
    await page.goto(base); await ready(page);
    assert.deepEqual(await page.locator('.work-button').evaluateAll(nodes => nodes.map(node => node.dataset.artwork)), newest.slice(-20).reverse().map(work => work.id));
    await page.unroute('**/scripts/data/artwork-catalog.json');
    await page.route('**/scripts/data/artwork-catalog.json', route => route.fulfill({ json: catalog.slice(0, 1) }));
    await page.reload(); await ready(page); assert.equal(await page.locator('.work-button').count(), 1);
    await page.unroute('**/scripts/data/artwork-catalog.json');
    await page.goto(base + '/dist/index.html'); await ready(page);
    assert.equal(await page.locator('.work-button').count(), catalog.length);
    await page.close();
    assert.deepEqual(errors, []);
    console.log('PASS date-sorted latest twenty, sparse catalog, built relative paths, no browser errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
