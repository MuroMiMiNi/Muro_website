const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const base = process.env.TEST_URL || 'http://127.0.0.1:5510';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const errors = [];
  try {
    for (const width of [1440, 1101, 1024, 768, 601, 600, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base); await page.waitForLoadState('networkidle');
      await page.waitForSelector('#mobileGallery[data-ready]');
      assert.deepEqual(await page.locator('#primaryNavigation button').evaluateAll(buttons => buttons.map(button => button.textContent)), ['委託', '所有作品', '遊戲', '關於']);
      assert.equal(await page.locator('#headerSocials a').count(), 6);
      assert.ok(await page.locator('#headerSocials img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth === 32)));
      const headerFits = () => page.evaluate(() => {
        const boxes = ['.signature', '#primaryNavigation', '#headerSocials', '#language'].map(selector => document.querySelector(selector).getBoundingClientRect());
        return boxes.every(box => box.left >= 0 && box.right <= innerWidth + .5) && boxes.every((box,index) => boxes.slice(index+1).every(other => box.right <= other.left + .5 || other.right <= box.left + .5 || box.bottom <= other.top + .5 || other.bottom <= box.top + .5));
      });
      assert.ok(await headerFits(), `Header elements do not overlap at ${width}px`);
      assert.ok(await page.evaluate(() => document.querySelector('.portrait-hanger').getBoundingClientRect().top >= document.querySelector('#siteHeader').getBoundingClientRect().bottom), 'Header does not cover the portrait');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      const wavePosition = () => page.locator('#headerSocials img').evaluateAll(images => images.map(image => new DOMMatrixReadOnly(getComputedStyle(image).transform).m42));
      const mainBefore = await wavePosition(); await page.waitForTimeout(400);
      assert.ok((await wavePosition()).some((value,index) => Math.abs(value-mainBefore[index]) > 1), 'The production header wave moves');
      if (width === 1440 || width === 390) await page.screenshot({ path: `.test-results/version-e-socials-${width}.png` });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const commission = page.locator('#siteHeader [data-page="guide"]');
      await commission.click();
      assert.equal(await page.locator('#dialogTitle').textContent(), '委託須知');
      const reference = page.locator('.guideline-heading');
      assert.equal(await reference.locator('h3').textContent(), '參考圖片');
      await reference.getByRole('link', { name: '所有作品' }).click();
      await page.waitForSelector('.collection-work');
      await page.getByRole('button', { name: '← 返回委託須知', exact: true }).click();
      assert.equal(await page.locator('#dialogTitle').textContent(), '委託須知');
      await page.getByRole('button', { name: '← 返回床鈴', exact: true }).click();
      await page.waitForFunction(() => !document.querySelector('#detailDialog').open);
      assert.equal(await commission.evaluate(node => document.activeElement === node), true);
      if (width === 1440 || width === 390) {
        await commission.click();
        await page.screenshot({ path: `.test-results/commission-links-${width}.png` });
        await page.keyboard.press('Escape');
      }
      await page.locator('#language').click();
      assert.equal(await commission.textContent(), 'Commission');
      assert.ok(await headerFits(), `English header elements do not overlap at ${width}px`);
      assert.ok(await page.locator('#primaryNavigation').evaluate(nav => nav.getBoundingClientRect().right <= innerWidth), `Header fits at ${width}px in English`);
      await commission.click();
      await page.getByRole('link', { name: 'All works', exact: true }).click();
      await page.waitForSelector('.collection-work');
      await page.keyboard.press('Escape');
      await page.locator('#siteHeader [data-page="allWorks"]').click();
      await page.waitForSelector('.collection-work');
      assert.equal(await page.locator('#stepBack').textContent(), '← Back to mobile', 'A direct gallery visit resets the return route');
      await page.close();

      const preview = await browser.newPage({ viewport: { width, height: 900 } });
      preview.on('pageerror', error => errors.push(error.message));
      await preview.goto(`${base}/references/social-wave/index.html`); await preview.waitForLoadState('networkidle');
      for (const row of ['#cornerWave', '#largeWave']) {
        assert.equal(await preview.locator(`${row} a`).count(), 6);
        assert.deepEqual(await preview.locator(`${row} a`).evaluateAll(links => links.map(link => link.getAttribute('aria-label'))), ['Twitter', 'BlueSky', 'VGen', 'Clibo', 'FB', 'Email']);
        assert.ok(await preview.locator(`${row} img`).evaluateAll(images => images.every(image => image.complete && image.naturalWidth === 32)));
      }
      assert.equal(await preview.locator('#cornerWave a').last().getAttribute('href'), 'mailto:mu.roro.mimini@gmail.com');
      assert.ok(await preview.locator('#cornerWave a').evaluateAll(links => links.slice(0,5).every(link => link.target === '_blank' && link.rel.includes('noopener'))));
      const positions = () => preview.locator('#cornerWave img').evaluateAll(images => images.map(image => new DOMMatrixReadOnly(getComputedStyle(image).transform).m42));
      const before = await positions(); await preview.waitForTimeout(400); const after = await positions();
      assert.ok(before.some((value,index) => Math.abs(value-after[index]) > 1), 'The wave moves');
      assert.ok(Math.max(...before)-Math.min(...before) > 3, 'Icons have different phases');
      assert.ok([...before,...after].every(value => Math.abs(value) <= 6.01), 'Actual-size movement stays within its reserved space');
      await preview.locator('#pauseWave').click();
      await preview.waitForFunction(() => [...document.querySelectorAll('#cornerWave img')].every(image => image.getAnimations().every(animation => animation.playState === 'paused' && !animation.pending)));
      const held = await positions(); await preview.waitForTimeout(200);
      assert.deepEqual(await positions(), held, 'Pause freezes the entire row');
      await preview.locator('#pauseWave').click();
      await preview.locator('#cornerWave a').first().focus();
      await preview.keyboard.press('Tab');
      assert.ok(await preview.locator('#cornerWave img').evaluateAll(images => images.every(image => getComputedStyle(image).animationPlayState === 'paused')), 'Keyboard focus pauses the row');
      await preview.locator('#pauseWave').focus();
      assert.ok(await preview.locator('body').evaluate(body => body.scrollWidth <= innerWidth), 'Preview has no horizontal overflow');
      if (width === 1440 || width === 390) await preview.screenshot({ path: `.test-results/social-wave-${width}.png` });
      await preview.emulateMedia({ reducedMotion: 'reduce' });
      assert.ok(await preview.locator('.social-wave-art').evaluateAll(images => images.every(image => getComputedStyle(image).animationName === 'none' && getComputedStyle(image).transform === 'none')));
      await preview.close();
      console.log(`PASS ${width}: commission/gallery routes; six pixel icons, phased wave, pause, focus, reduced motion, responsive preview`);
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
