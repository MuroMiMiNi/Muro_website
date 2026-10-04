// Only the short entrance uses a canvas; artwork stays at its original resolution.
export function decodeArtwork(image, signal) {
  let abort;
  return Promise.race([
    image.decode(),
    new Promise((_, reject) => {
      abort = () => reject(new DOMException('Cancelled', 'AbortError'));
      signal.addEventListener('abort', abort, { once: true });
    })
  ]).finally(() => signal.removeEventListener('abort', abort));
}

function paintedBounds(image) {
  const box = image.getBoundingClientRect();
  const naturalWidth = image.naturalWidth || box.width, naturalHeight = image.naturalHeight || box.height;
  const scale = Math.min(box.width / naturalWidth, box.height / naturalHeight);
  const width = naturalWidth * scale, height = naturalHeight * scale;
  return { x: box.x + (box.width - width) / 2, y: box.y + (box.height - height) / 2, width, height };
}

export function artworkOrigin(image) { return paintedBounds(image); }

export async function enterArtwork(dialog, image, origin, signal) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const overlay = document.createElement('div');
  overlay.className = 'artwork-transit'; overlay.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas');
  const clone = image.cloneNode(); clone.className = 'transit-image'; clone.alt = '';
  overlay.append(canvas, clone); dialog.append(overlay);
  const target = paintedBounds(image);
  clone.style.width = `${target.width}px`; clone.style.height = `${target.height}px`;
  const width = innerWidth, height = innerHeight;
  canvas.width = Math.ceil(width / 4); canvas.height = Math.ceil(height / 4);
  const ctx = canvas.getContext('2d');
  let frame, finish;
  const done = new Promise(resolve => { finish = resolve; });
  const stop = () => finish();
  signal.addEventListener('abort', stop, { once: true });
  reduced.addEventListener('change', stop);
  // If the viewport changes, reveal the responsive destination immediately.
  window.addEventListener('resize', stop, { once: true });
  const duration = reduced.matches ? 140 : 680;
  const start = performance.now();
  const targetScale = Math.min(width * .82 / target.width, height * .82 / target.height, 1.65);
  const middle = { x: (width - target.width * targetScale) / 2, y: (height - target.height * targetScale) / 2 };
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);
  const draw = now => {
    const p = Math.min(1, (now - start) / duration);
    if (reduced.matches) {
      clone.hidden = true;
      dialog.style.setProperty('--arrival', p);
    } else {
      const first = p < .58;
      const q = smooth(first ? p / .58 : (p - .58) / .42);
      const x = first ? mix(origin.x, middle.x, q) : mix(middle.x, target.x, q);
      const y = first ? mix(origin.y, middle.y, q) : mix(middle.y, target.y, q);
      const scale = first ? mix(origin.width / target.width, targetScale, q) : mix(targetScale, 1, q);
      clone.style.transform = `translate(${x}px,${y}px) scale(${scale})`;
      clone.style.opacity = p > .85 ? (1 - p) / .15 : 1;
      dialog.style.setProperty('--arrival', Math.max(0, (p - .65) / .35));
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = mix(origin.x + origin.width / 2, width / 2, smooth(Math.min(1, p / .58))) / 4;
      const cy = mix(origin.y + origin.height / 2, height / 2, smooth(Math.min(1, p / .58))) / 4;
      const reach = Math.hypot(canvas.width, canvas.height);
      const fade = Math.sin(p * Math.PI) * .65;
      // Low-resolution stepped rays stretch outward from the selected picture.
      for (let i = 0; i < 42; i++) {
        const angle = i * 2.39996;
        const depth = ((i * .173 + p * 1.7) % 1) ** 2;
        const r = 12 + depth * reach;
        const length = (5 + depth * 65) * Math.sin(p * Math.PI);
        ctx.strokeStyle = i % 5 === 0 ? `rgba(215,200,153,${fade * .7})` : `rgba(157,194,224,${fade})`;
        ctx.lineWidth = i % 4 === 0 ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(Math.round(cx + Math.cos(angle) * r), Math.round(cy + Math.sin(angle) * r));
        ctx.lineTo(Math.round(cx + Math.cos(angle) * (r + length)), Math.round(cy + Math.sin(angle) * (r + length)));
        ctx.stroke();
      }
      for (let i = 0; i < 4; i++) {
        const size = 16 + (((i / 4 + p * .9) % 1) ** 2) * reach;
        ctx.strokeStyle = `rgba(111,155,198,${fade * .28})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(Math.round(cx - size), Math.round(cy - size * .7), Math.round(size * 2), Math.round(size * 1.4));
      }
    }
    if (p < 1) frame = requestAnimationFrame(draw); else finish();
  };
  draw(start);
  try { await done; }
  finally {
    cancelAnimationFrame(frame); overlay.remove();
    dialog.classList.remove('is-arriving'); dialog.style.removeProperty('--arrival');
    signal.removeEventListener('abort', stop); reduced.removeEventListener('change', stop);
    window.removeEventListener('resize', stop);
  }
}
