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

const mix = (a, b, t) => a + (b - a) * t;
const clamp = t => Math.max(0, Math.min(1, t));
const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
// Open, stepped arcs and stars pass the viewer once; nothing wraps back into view.
function drawStars(ctx, w, h, p, advance, center, mobile, sourceSize) {
  ctx.clearRect(0, 0, w, h);
  const veil = smooth(p / .24) * (1 - smooth((p - .6) / .4));
  ctx.fillStyle = `rgba(5,13,30,${veil * .92})`;
  ctx.fillRect(0, 0, w, h);
  const visibility = smooth(p / .15) * (1 - smooth((p - .65) / .35));
  const travel = advance * 4;
  const focal = Math.min(w, h) * .52;
  const speed = 6 * clamp(p / .8) * (1 - clamp(p / .8));
  const project = (x, y, z) => [center.x + x * focal / z, center.y + y * focal / z];
  // Integer steps keep the light crisp, without blurring the original artwork.
  const trace = (points, color, width) => {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
    points.forEach(([x,y], i) => {
      x = Math.round(x); y = Math.round(y);
      if (!i) ctx.moveTo(x,y);
      else {
        const [lastX,lastY] = points[i-1];
        const steps = Math.ceil(Math.max(Math.abs(x-lastX),Math.abs(y-lastY)));
        for (let step = 1; step <= steps; step++) {
          const nextX = Math.round(mix(lastX,x,step/steps));
          ctx.lineTo(nextX,Math.round(mix(lastY,y,(step-1)/steps)));
          ctx.lineTo(nextX,Math.round(mix(lastY,y,step/steps)));
        }
      }
    });
    ctx.stroke();
  };
  ctx.save();
  ctx.globalAlpha = visibility;
  for (let layer = 0; layer < (mobile ? 3 : 4); layer++) {
    const z = 1.05 + layer * (mobile ? 1.4 : .93) - travel;
    if (z <= .08) continue;
    const radius = Math.max(.58, sourceSize / focal * .7) * (1 + layer * .12);
    const phase = layer * 1.73;
    // Unequal, separated crescents, rather than closed architectural frames.
    for (const [angle, length] of [[phase,.83],[phase+2.3,1.12]]) {
      const points = [];
      for (let n = 0; n <= 28; n++) {
        const theta = angle + length * n / 28;
        points.push(project(Math.cos(theta)*radius,Math.sin(theta)*radius*.9,z));
      }
      trace(points,'#19364f',3);
      trace(points,layer % 2 ? '#52798d' : '#7197a7',1);
      trace(points.slice(5,11),'#b4cdd0',1);
    }
  }
  for (let i = 0; i < (mobile ? 56 : 84); i++) {
    const angle = i * 2.39996;
    const initialZ = 1.1 + ((i * .731) % 5.2);
    const z = initialZ - travel;
    if (z <= .12) continue;
    const radius = .42 + ((i * .317) % 1.9);
    const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
    const head = project(x,y,z);
    if (head[0] < -30 || head[0] > w+30 || head[1] < -30 || head[1] > h+30) continue;
    const tail = project(x,y,z + speed * (i % 4 ? .10 : .30));
    ctx.globalAlpha = visibility * Math.min(.8,.24 + .65/z);
    trace([tail,head],i % 11 === 0 ? '#c3b993' : '#739bac',z < .8 ? 2 : 1);
    if (i % 7 === 0) {
      ctx.fillStyle = '#bed1d5';
      ctx.fillRect(Math.round(head[0])-1,Math.round(head[1]),3,1);
      ctx.fillRect(Math.round(head[0]),Math.round(head[1])-1,1,3);
    }
  }
  ctx.restore();
}

export async function enterArtwork(dialog, image, origin, signal) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const overlay = document.createElement('div');
  overlay.className = 'artwork-transit'; overlay.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas');
  const clone = image.cloneNode(); clone.className = 'transit-image'; clone.alt = '';
  overlay.append(canvas, clone); dialog.append(overlay);
  const target = paintedBounds(image);
  clone.style.width = `${target.width}px`; clone.style.height = `${target.height}px`;
  const width = innerWidth, height = innerHeight, mobile = width <= 600;
  const pixel = mobile ? 2 : 3;
  canvas.width = Math.ceil(width / pixel); canvas.height = Math.ceil(height / pixel);
  const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
  const startScale = origin.width / target.width;
  let frame, finish;
  const done = new Promise(resolve => { finish = resolve; });
  const stop = () => finish();
  signal.addEventListener('abort', stop, { once: true });
  reduced.addEventListener('change', stop);
  window.addEventListener('resize', stop, { once: true });
  const duration = reduced.matches ? 140 : 700;
  const start = performance.now();
  const draw = now => {
    const p = clamp((now - start) / duration);
    if (reduced.matches) {
      clone.hidden = true;
      dialog.style.setProperty('--arrival', p);
      dialog.style.setProperty('--arrival-ui', p);
      dialog.style.setProperty('--art-arrival', 1);
    } else {
      // One uninterrupted advance drives the artwork, parallax and acceleration.
      const advance = smooth(p / .8);
      const center = {
        x: mix(origin.x + origin.width / 2, target.x + target.width / 2, advance),
        y: mix(origin.y + origin.height / 2, target.y + target.height / 2, advance)
      };
      const scale = mix(startScale,1,advance);
      const x = center.x - target.width * scale / 2, y = center.y - target.height * scale / 2;
      clone.style.transform = `translate(${x}px,${y}px) scale(${scale})`;
      drawStars(ctx,canvas.width,canvas.height,p,advance,{x:center.x/pixel,y:center.y/pixel},mobile,Math.max(origin.width,origin.height)/pixel);
      // A brief edge reflection originates on the selected image, not a new frame.
      ctx.globalAlpha = Math.sin(clamp(p/.32)*Math.PI) * .7;
      ctx.fillStyle = '#bfd4dc';
      ctx.fillRect(Math.round(x/pixel),Math.round(y/pixel)-1,Math.round(target.width*scale/pixel*.3),1);
      ctx.fillRect(Math.round((x+target.width*scale)/pixel),Math.round((y+target.height*scale*.72)/pixel),1,Math.round(target.height*scale/pixel*.28));
      ctx.globalAlpha = 1;
      dialog.style.setProperty('--arrival', smooth((p - .6) / .3));
      dialog.style.setProperty('--arrival-ui', smooth((p - .8) / .2));
    }
    if (p < 1) frame = requestAnimationFrame(draw); else finish();
  };
  draw(start);
  try { await done; }
  finally {
    cancelAnimationFrame(frame); overlay.remove();
    dialog.classList.remove('is-arriving'); dialog.style.removeProperty('--arrival');
    dialog.style.removeProperty('--arrival-ui'); dialog.style.removeProperty('--art-arrival');
    signal.removeEventListener('abort', stop); reduced.removeEventListener('change', stop);
    window.removeEventListener('resize', stop);
  }
}
