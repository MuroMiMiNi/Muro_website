// Dreamy pixel colors keep a shaded edge, a bright face and a tiny highlight.
const palettes = [
  ['#9b7547', '#d8b66b', '#f5d893', '#fff3cf'],
  ['#685994', '#aa91d7', '#d5bff5', '#f0e5ff'],
  ['#875a80', '#ce87ad', '#f0b6d0', '#ffe4ed'],
  ['#426b9d', '#79b7da', '#b6e0f2', '#e7f7ff'],
  ['#3d7c7d', '#79c1b1', '#b9e7d2', '#e5fff0']
];
function starFrames(points, colors) {
  return Array.from({ length: 24 }, (_, frame) => {
    const sprite = document.createElement('canvas'); sprite.width = sprite.height = 17;
    const ctx = sprite.getContext('2d');
    ctx.translate(8.5, 8.5); ctx.rotate(frame * Math.PI / 12);
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = i * Math.PI / points - Math.PI / 2, radius = i % 2 ? (points === 4 ? 2 : 3.5) : 8;
      const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
      if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.clip();
    ctx.fillStyle = colors[0]; ctx.fillRect(-9, -9, 18, 18);
    ctx.fillStyle = colors[1]; ctx.fillRect(-8, -8, 15, 13);
    ctx.fillStyle = colors[2]; ctx.fillRect(-6, -6, 10, 8);
    ctx.fillStyle = colors[3]; ctx.fillRect(-3, -4, 3, 3);
    const pixels = ctx.getImageData(0, 0, 17, 17);
    for (let i = 3; i < pixels.data.length; i += 4) pixels.data[i] = pixels.data[i] >= 128 ? 255 : 0;
    ctx.putImageData(pixels, 0, 0);
    return sprite;
  });
}

export function createClickStars() {
  const stars = palettes.map(colors => starFrames(5, colors)), glints = palettes.map(colors => starFrames(4, colors));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const random = (min, max) => min + Math.random() * (max - min);
  const spread = t => 1 - (1 - t) ** 3;
  const fade = t => Math.min(1, t / .1) * Math.min(1, (1 - t) / .55);
  let bursts = [], frame = 0, press = null;

  function clear() {
    cancelAnimationFrame(frame); frame = 0; press = null;
    for (const burst of bursts) burst.canvas.remove();
    bursts = [];
  }
  function launch(x, y) {
    if (document.hidden) return;
    if (bursts.length === 6) bursts.shift().canvas.remove();
    const canvas = document.createElement('canvas'); canvas.className = 'click-stars';
    canvas.setAttribute('aria-hidden', 'true'); canvas.setAttribute('popover', 'manual');
    const dpr = Math.min(devicePixelRatio || 1, 2), compact = innerWidth <= 600 ? .85 : 1;
    canvas.width = canvas.height = 160 * dpr;
    canvas.style.left = `${x - 80}px`; canvas.style.top = `${y - 80}px`;
    document.body.append(canvas);
    // The top layer keeps stars visible over modal artwork, without taking focus.
    canvas.showPopover();
    const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr); ctx.imageSmoothingEnabled = false;
    const particles = [13, 11, 9, 7, 6].map((size, i) => {
      const angle = [-2.1, -.9, 2.7, .35, 1.6][i] + random(-.18, .18), distance = random(25, 48) * compact;
      return { size: size * compact, dx: Math.cos(angle) * distance, dy: Math.sin(angle) * distance,
        delay: 10 + i * 11, duration: random(460, 650), spin: random(20, 40) * (i % 2 ? -1 : 1),
        rotation: random(-20, 20), fall: random(8, 14), glint: i === 4 };
    });
    const dust = Array.from({ length: 7 }, (_, i) => {
      const angle = i * 2.4 + random(-.3, .3), distance = random(18, 55) * compact;
      return { dx: Math.cos(angle) * distance, dy: Math.sin(angle) * distance, size: i % 3 + 1,
        delay: random(35, 110), duration: random(350, 720), color: palettes[i % 5][i < 5 ? 2 : 1] };
    });
    bursts.push({ canvas, ctx, particles, dust, born: performance.now(), reduced: reduced.matches });
    if (!frame) frame = requestAnimationFrame(draw);
  }
  function sprite(ctx, frames, x, y, size, angle, alpha) {
    const index = ((Math.round(angle / 15) % 24) + 24) % 24;
    ctx.globalAlpha = alpha;
    ctx.drawImage(frames[index], Math.round(x - size / 2), Math.round(y - size / 2), Math.round(size), Math.round(size));
  }
  function draw(now) {
    frame = 0;
    bursts = bursts.filter(burst => {
      const age = now - burst.born, { ctx } = burst;
      if (age >= (burst.reduced ? 160 : 830)) { burst.canvas.remove(); return false; }
      ctx.clearRect(0, 0, 160, 160);
      if (burst.reduced) {
        sprite(ctx, glints[0], 80, 80, 10, 0, 1 - age / 160); return true;
      }
      if (age < 180) {
        const t = age / 180;
        const glow = ctx.createRadialGradient(80, 80, 0, 80, 80, 12);
        glow.addColorStop(0, '#a9cee5'); glow.addColorStop(1, '#a9cee500');
        ctx.globalAlpha = .16 * (1 - t); ctx.fillStyle = glow; ctx.fillRect(68, 68, 24, 24);
        sprite(ctx, glints[0], 80, 80, 14 * (1 - t * .55), 0, Math.min(1, age / 25) * (1 - t));
      }
      for (const p of burst.dust) {
        const t = (age - p.delay) / p.duration;
        if (t <= 0 || t >= 1) continue;
        const travel = spread(t);
        ctx.globalAlpha = fade(t) * .65; ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(80 + p.dx * travel), Math.round(80 + p.dy * travel + 12 * t * t), p.size, p.size);
      }
      burst.particles.forEach((p, i) => {
        const t = (age - p.delay) / p.duration;
        if (t <= 0 || t >= 1) return;
        const travel = spread(t), x = 80 + p.dx * travel, y = 80 + p.dy * travel + p.fall * t * t;
        const scale = t < .13 ? .65 + .35 * spread(t / .13) : 1 - .45 * (t - .13) / .87;
        // Two broken, fading pinpoints suggest a trail, without long comet streaks.
        if (i < 2 && t < .6) {
          ctx.fillStyle = palettes[i][1];
          for (let n = 1; n <= 2; n++) {
            ctx.globalAlpha = fade(t) * .24 / n;
            ctx.fillRect(Math.round(x - p.dx * .045 * n), Math.round(y - p.dy * .045 * n), 1, 1);
          }
        }
        sprite(ctx, p.glint ? glints[i] : stars[i], x, y, p.size * scale, p.rotation + p.spin * travel, fade(t));
        if ((i === 2 || i === 4) && Math.abs(age - (i === 2 ? 145 : 185)) < 22) {
          ctx.globalAlpha = (1 - Math.abs(age - (i === 2 ? 145 : 185)) / 22) * .65;
          ctx.fillStyle = palettes[i][3]; ctx.fillRect(Math.round(x - 1), Math.round(y - 2), 1, 1);
        }
      });
      return true;
    });
    if (bursts.length) frame = requestAnimationFrame(draw);
  }
  document.addEventListener('pointerdown', event => {
    press = event.isPrimary && event.button === 0 ? { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false } : null;
  }, { capture: true, passive: true });
  document.addEventListener('pointermove', event => {
    if (press && event.pointerId === press.id && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 6) press.moved = true;
  }, { capture: true, passive: true });
  document.addEventListener('pointercancel', () => { press = null; }, { capture: true, passive: true });
  window.addEventListener('click', event => {
    const clicked = press; press = null;
    if (!clicked || clicked.moved || event.button !== 0 || event.detail === 0) return;
    // Window bubbling runs after the clicked control opens/closes its modal.
    launch(event.clientX, event.clientY);
  }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
  reduced.addEventListener('change', clear);
  window.addEventListener('resize', clear);
}
