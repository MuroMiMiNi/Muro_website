const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const width of [390, 1440]) {
      for (const trigger of ['.work-button', '.portrait']) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto('http://127.0.0.1:5505');
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => {
        const raf = requestAnimationFrame.bind(window);
        window.motionSamples = [];
        let start;
        window.requestAnimationFrame = fn => raf(now => {
          if (fn.name !== 'draw') return fn(now);
          start ??= now;
          fn(now);
          const image = document.querySelector('.flying-art');
          if (!image) return;
          const box = image.getBoundingClientRect();
          window.motionSamples.push({ t: now - start, x: box.x, y: box.y, w: box.width, h: box.height });
        });
      });
      if (trigger === '.portrait') {
        const box = await page.locator(trigger).boundingBox();
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      } else await page.locator(trigger).first().dispatchEvent('click', { detail: 0 });
      await page.waitForSelector('.flying-art');
      if (trigger === '.portrait') {
        await page.waitForTimeout(300);
        await page.screenshot({ path: `.test-results/profile-arriving-${width}.png` });
      }
      await page.waitForSelector('.flying-art', { state: 'detached' });
      const { samples, target } = await page.evaluate(() => {
        const image = document.querySelector('.detail-art');
        const box = image.getBoundingClientRect();
        const scale = Math.min(box.width / image.naturalWidth, box.height / image.naturalHeight);
        const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
        return { samples: window.motionSamples, target: { x: box.x + (box.width-w)/2, y: box.y + (box.height-h)/2, w, h } };
      });
      const at = time => samples.reduce((best, sample) => Math.abs(sample.t-time) < Math.abs(best.t-time) ? sample : best);
      const early = at(230), late = at(430);
      assert.ok(late.w > early.w * 1.15, 'Artwork must keep approaching through the middle of the passage');
      for (let i = 1; i < samples.length; i++) assert.ok(samples[i].w >= samples[i-1].w - .1, 'Artwork must not recoil');
      const landed = samples.at(-1);
      for (const key of ['x','y','w','h']) assert.ok(Math.abs(landed[key]-target[key]) < 1, `Handoff jumps on ${key}`);
      assert.equal(await page.locator('.detail-art').evaluate(n => getComputedStyle(n).opacity), '1');
      assert.equal(await page.locator('#dialogContent').evaluate(n => getComputedStyle(n).opacity), '1');
      if (trigger === '.portrait') {
        assert.equal(await page.locator('#dialogTitle').textContent(), '關於木洛');
        assert.equal(await page.locator('.dialog-social a').count(), 6);
        await page.screenshot({ path: `.test-results/profile-detail-${width}.png` });
        await page.getByRole('button', { name: '委託須知', exact: true }).click();
        await page.locator('#stepBack').click();
        assert.equal(await page.locator('#dialogTitle').textContent(), '關於木洛');
      }
      await page.locator('#closeDialog').click();
      await page.waitForFunction(() => document.body.style.position === '');
      if (trigger === '.portrait') {
        assert.ok(await page.evaluate(() => document.activeElement.matches('.portrait')));
        await page.keyboard.press('Enter'); await page.waitForSelector('.flying-art');
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !detailDialog.open && document.body.style.position === '');
        await page.waitForSelector('.flying-art', { state: 'detached' });
        assert.equal(await page.locator('[aria-busy="true"]').count(), 0);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => detailDialog.open && !detailDialog.classList.contains('is-arriving'));
        await page.locator('#closeDialog').click();
        await page.waitForFunction(() => !detailDialog.open && document.body.style.position === '');
      }
      console.log(`PASS ${width}px ${trigger}: uninterrupted approach, no recoil, exact image handoff, close restores scrolling`);
      await page.close();
      }
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
