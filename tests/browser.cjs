const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');

(async () => {
  await fs.mkdir('.test-results', { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const errors = [];
  const watch = page => {
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  };
  const inside = async (page, selector) => {
    const box = await page.locator(selector).boundingBox();
    const viewport = page.viewportSize();
    assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width + 1 && box.y + box.height <= viewport.height + 1, `${selector} outside viewport: ${JSON.stringify(box)}`);
  };
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } }); watch(page);
    await page.goto('http://127.0.0.1:5505'); await page.waitForLoadState('networkidle');
    const catalog = JSON.parse(await fs.readFile('scripts/data/artwork-catalog.json', 'utf8'));
    const firstTitle = catalog[0].title.zh;
    assert.equal(await page.locator('.work-button').count(), catalog.length);
    assert.equal(await page.locator('.mobile-rig').count(), 1);
    assert.equal(await page.locator('.timeline-branch').count(), new Set(catalog.map(item => item.date?.slice(0, 7) ?? 'undated')).size);
    assert.equal(await page.locator('.work-meta').count(), catalog.filter(item => item.date).length);
    assert.equal(await page.getByRole('link', { name: '回到頂端', exact: true }).count(), 1);
    for (const removed of ['作品收藏', '把喜歡的，掛在星空裡', '我是木洛。畫角色', '星空下的收藏', '件作品 ·', '讓作品輕輕搖晃', '讓時間慢慢流過', '像素之間，收藏微光', '往下，遇見作品', "Muro's little universe"]) {
      assert.ok(!(await page.locator('body').innerText()).includes(removed), `Unwanted copy remains: ${removed}`);
    }
    assert.equal(await page.locator('.work-button img[loading="lazy"]').count(), catalog.length);
    assert.ok(await page.locator('.portrait img').evaluate(img => img.complete && img.naturalWidth === 2078));
    const pose = await page.locator('.hanging-work').first().getAttribute('style');
    const depth = await page.locator('.hanging-work').first().getAttribute('data-depth');
    await page.waitForTimeout(1200);
    assert.notEqual(await page.locator('.hanging-work').first().getAttribute('style'), pose);
    assert.notEqual(await page.locator('.hanging-work').first().getAttribute('data-depth'), depth);
    const firstBox = await page.locator('.work-button').first().boundingBox();
    await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
    await page.locator('#scope').waitFor({ state: 'visible' }); await inside(page, '#scope');
    const pausedTime = await page.locator('.mobile-rig').getAttribute('data-motion-time');
    await page.waitForTimeout(500);
    assert.equal(await page.locator('.mobile-rig').getAttribute('data-motion-time'), pausedTime);
    await page.screenshot({ path: '.test-results/desktop-preview.png' });
    await page.mouse.move(20, 550);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => matchMedia('(prefers-reduced-motion: reduce)').matches && document.querySelector('.mobile-rig').dataset.motionTime === '0.000');
    const stillPose = await page.locator('.hanging-work').first().getAttribute('style');
    await page.waitForTimeout(500);
    assert.equal(await page.locator('.hanging-work').first().getAttribute('style'), stillPose);
    await page.evaluate(() => scrollTo(0, 500)); await page.waitForTimeout(100);
    assert.ok(await page.locator('#siteHeader').evaluate(node => node.classList.contains('is-hidden')));
    const position = await page.evaluate(() => scrollY);
    await page.locator('.work-button').first().click();
    assert.equal(await page.locator('#dialogTitle').innerText(), firstTitle);
    await page.getByRole('button', { name: '查看委託須知', exact: true }).click();
    assert.equal(await page.locator('#dialogTitle').innerText(), '委託須知');
    await page.getByRole('button', { name: '下一步：價目表' }).click();
    assert.equal(await page.locator('tbody tr').count(), 3);
    await page.getByRole('button', { name: '下一步：委託表單' }).click();
    await page.getByLabel('委託方案', { exact: true }).selectOption('half-body');
    const form = new URL(await page.getByRole('link', { name: '填寫委託表單' }).getAttribute('href'));
    assert.equal(form.searchParams.get('entry.1679931923'), '半身委託－NT$1100');
    assert.equal(await page.getByRole('link', { name: '填寫委託表單' }).getAttribute('target'), '_blank');
    await page.screenshot({ path: '.test-results/commission-form.png' });
    for (const expected of ['價目表', '委託須知', firstTitle]) {
      await page.locator('#stepBack').click(); assert.equal(await page.locator('#dialogTitle').innerText(), expected);
    }
    await page.locator('#closeDialog').click();
    await page.waitForFunction(() => document.body.style.position === '');
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - position) < 2);
    assert.equal(await page.evaluate(() => document.activeElement.dataset.artwork), catalog[0].id);
    await page.keyboard.press('Enter'); assert.ok(await page.locator('#detailDialog').evaluate(node => node.open));
    await page.keyboard.press('Escape'); await page.waitForFunction(() => document.body.style.position === ''); assert.ok(!await page.locator('#detailDialog').evaluate(node => node.open));
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(100);
    await page.screenshot({ path: '.test-results/desktop.png' });
    await page.locator('#language').click(); assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    await page.getByRole('button', { name: 'Games', exact: true }).click(); assert.equal(await page.locator('#dialogTitle').innerText(), 'Games');
    await page.keyboard.press('Escape'); await page.waitForFunction(() => document.body.style.position === ''); await page.locator('#language').click();
    // Real pointer drag, clamped at viewport edges.
    const egg = await page.locator('#floatingGif').boundingBox();
    await page.mouse.move(egg.x + 20, egg.y + 20); await page.mouse.down(); await page.mouse.move(4, 4); await page.mouse.up(); await inside(page, '#floatingGif');
    await page.locator('#floatingGif').dblclick(); assert.equal(await page.locator('#dialogTitle').innerText(), '關於木洛'); await page.keyboard.press('Escape'); await page.waitForFunction(() => document.body.style.position === '');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 1440, height: 200 });
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(150);
    const offscreenTime = await page.locator('.mobile-rig').getAttribute('data-motion-time');
    await page.waitForTimeout(600);
    assert.equal(await page.locator('.mobile-rig').getAttribute('data-motion-time'), offscreenTime);
    console.log('PASS desktop: one connected timeline rig, removed copy, depth changes, pause, reduced motion, navigation, commission flow, return position, keyboard, language, mascot');

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' }); watch(mobile);
    await mobile.goto('http://127.0.0.1:5505'); await mobile.waitForLoadState('networkidle');
    await mobile.screenshot({ path: '.test-results/mobile.png' });
    await mobile.evaluate(() => scrollTo(0, 700)); await mobile.waitForTimeout(100);
    await mobile.screenshot({ path: '.test-results/mobile-gallery.png' });
    const mobileWork = mobile.locator('.work-button').first();
    await mobileWork.tap();
    assert.ok(!await mobile.locator('#detailDialog').evaluate(node => node.open));
    await mobile.locator('#scope').waitFor({ state: 'visible' }); await inside(mobile, '#scope');
    await mobile.screenshot({ path: '.test-results/mobile-preview.png' });
    await mobile.locator('#scope').tap();
    assert.equal(await mobile.locator('#dialogTitle').innerText(), firstTitle);
    await mobile.locator('#closeDialog').tap(); await mobile.waitForFunction(() => document.body.style.position === '');
    // Two taps on the same artwork also open details.
    await mobileWork.tap(); await mobileWork.tap();
    assert.ok(await mobile.locator('#detailDialog').evaluate(node => node.open)); await mobile.locator('#closeDialog').tap(); await mobile.waitForFunction(() => document.body.style.position === '');
    for (let i = 0; i < catalog.length; i++) {
      await mobile.locator('.work-button').nth(i).tap();
      await mobile.locator('#scope').tap();
      assert.equal(await mobile.locator('#dialogTitle').innerText(), catalog[i].title.zh);
      await mobile.locator('#closeDialog').tap(); await mobile.waitForFunction(() => document.body.style.position === '');
    }
    for (const width of [320, 390, 768, 1024]) {
      await mobile.setViewportSize({ width, height: 844 });
      await mobile.evaluate(() => scrollTo(0, 0)); await mobile.waitForTimeout(100);
      assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}`);
      if (width === 768) await mobile.screenshot({ path: '.test-results/tablet.png' });
    }
    await mobile.setViewportSize({ width: 320, height: 640 });
    await mobile.locator('#language').tap();
    assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'English overflow at 320px');
    await mobile.setViewportSize({ width: 844, height: 390 });
    await mobile.locator('.work-button').first().scrollIntoViewIfNeeded();
    await mobile.locator('.work-button').first().tap(); await inside(mobile, '#scope');
    console.log('PASS touch: first tap preview, second tap details, 320–1024px layouts, landscape preview bounds');
    const dated = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' }); watch(dated);
    const fixture = catalog.map((work, i) => ({ ...work, date: i < 10 ? '2026-10-04' : i < 12 ? '2026-09-30' : i < 14 ? '2025-12-31' : null }));
    await dated.route('**/scripts/data/artwork-catalog.json', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify(fixture) }));
    await dated.goto('http://127.0.0.1:5505'); await dated.waitForLoadState('networkidle');
    assert.deepEqual(await dated.locator('.timeline-branch').evaluateAll(nodes => nodes.map(node => node.dataset.period)), ['2026-10', '2026-09', '2025-12', 'undated']);
    assert.equal(await dated.locator('[data-period="2026-10"] .work-button').count(), 10);
    const branchBounds = await dated.locator('.timeline-branch').evaluateAll(nodes => nodes.map(node => {
      const boxes = [...node.querySelectorAll('.work-button')].map(button => button.getBoundingClientRect());
      return { top: Math.min(...boxes.map(box => box.top)), bottom: Math.max(...boxes.map(box => box.bottom)) };
    }));
    for (let i = 1; i < branchBounds.length; i++) assert.ok(branchBounds[i].top > branchBounds[i - 1].bottom, 'Older period appeared above newer work');
    await dated.close();
    console.log('PASS dated fixture: month branches, 10 works remain together, newer periods above older');
    await page.goto('http://127.0.0.1:5505/dist/index.html'); await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('.work-button').count(), catalog.length);
    assert.ok(await page.locator('.portrait img').evaluate(img => img.complete && img.naturalWidth > 0));
    console.log('PASS built dist site and relative asset paths');
    assert.deepEqual(errors, []);
    console.log('PASS no browser errors or failed HTTP responses');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
