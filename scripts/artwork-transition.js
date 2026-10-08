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
  const scale = Math.min(box.width / image.naturalWidth, box.height / image.naturalHeight);
  const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
  return { x: box.x + (box.width - width) / 2, y: box.y + (box.height - height) / 2, width, height };
}

export function artworkOrigin(button) {
  if (!button.artworkBounds) return paintedBounds(button.querySelector('img'));
  const bounds = button.artworkBounds();
  return { x: bounds.x, y: bounds.y, width: bounds.w, height: bounds.h };
}

const mix = (a, b, t) => a + (b - a) * t;
const clamp = t => Math.max(0, Math.min(1, t));
const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };

export async function enterArtwork(dialog, image, origin, signal) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const target = paintedBounds(image);
  const clone = image.cloneNode();
  clone.className = 'flying-art'; clone.alt = '';
  clone.setAttribute('aria-hidden', 'true');
  clone.style.width = `${target.width}px`; clone.style.height = `${target.height}px`;
  dialog.append(clone);
  const clouds = document.querySelectorAll('.pixel-cloud');
  dialog.querySelectorAll('.arrival-cloud').forEach((cloud, index) => {
    cloud.style.backgroundImage = `url("${clouds[index + 2].src}")`;
  });
  let frame, finish;
  const done = new Promise(resolve => { finish = resolve; });
  const stop = () => finish();
  signal.addEventListener('abort', stop, { once: true });
  reduced.addEventListener('change', stop);
  window.addEventListener('resize', stop, { once: true });
  const start = performance.now(), duration = reduced.matches ? 160 : 1100;
  const draw = now => {
    const p = clamp((now - start) / duration), travel = 1 - Math.pow(1 - p, 3);
    const width = mix(origin.width, target.width, travel), height = mix(origin.height, target.height, travel);
    clone.style.transform = `translate(${mix(origin.x, target.x, travel)}px,${mix(origin.y, target.y, travel)}px) scale(${width / target.width},${height / target.height})`;
    clone.style.opacity = 1 - smooth((p - .78) / .22);
    dialog.style.setProperty('--art-arrival', smooth((p - .78) / .22));
    dialog.style.setProperty('--arrival', smooth(p / .85));
    document.body.style.setProperty('--scene', 1 - smooth(p / .65));
    dialog.style.setProperty('--arrival-ui', smooth((p - .25) / .65));
    dialog.style.setProperty('--drift', travel);
    dialog.style.setProperty('--cloud-opacity', .38 + Math.sin(p * Math.PI) * .25);
    if (reduced.matches) {
      clone.hidden = true;
      dialog.style.setProperty('--art-arrival', 1);
      dialog.style.setProperty('--arrival-ui', p);
    }
    if (p < 1) frame = requestAnimationFrame(draw); else finish();
  };
  draw(start);
  try { await done; }
  finally {
    cancelAnimationFrame(frame); clone.remove();
    dialog.classList.remove('is-arriving');
    for (const name of ['--arrival', '--arrival-ui', '--art-arrival', '--drift', '--cloud-opacity']) dialog.style.removeProperty(name);
    if (dialog.open) document.body.style.setProperty('--scene', 0);
    signal.removeEventListener('abort', stop); reduced.removeEventListener('change', stop);
    window.removeEventListener('resize', stop);
  }
}
