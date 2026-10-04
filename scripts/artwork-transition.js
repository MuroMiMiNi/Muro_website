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
const section = [[-.58,-1],[.58,-1],[1,-.58],[1,.58],[.58,1],[-.58,1],[-1,.58],[-1,-.58]];
const wallColors = ['#101e34','#14283d','#102238','#0d1b30','#0a1528','#0f2034','#14283d','#182d42'];

function polygon(ctx, points, color) {
  ctx.fillStyle = color; ctx.beginPath();
  points.forEach(([x,y], i) => i ? ctx.lineTo(Math.round(x), Math.round(y)) : ctx.moveTo(Math.round(x), Math.round(y)));
  ctx.closePath(); ctx.fill();
}
function outline(ctx, points, color, width = 1) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
  points.forEach(([x,y], i) => i ? ctx.lineTo(Math.round(x), Math.round(y)) : ctx.moveTo(Math.round(x), Math.round(y)));
  ctx.closePath(); ctx.stroke();
}

// Subtle facets, broken light ribbons and silver arcs share one Z projection.
function drawTunnel(ctx, w, h, p, center, entry, mobile) {
  const focal = Math.min(w, h) * .94;
  const travel = 7.4 * (p * p * (3 - 2 * p));
  const project = (point, z, radius = 1) => [
    center.x + (point[0] * radius + Math.sin(z * .34) * .065) * focal / z,
    center.y + point[1] * radius * .84 * focal / z
  ];
  const ring = (z, radius = 1) => section.map(point => project(point, z, radius));
  const gate = section.map(([x,y]) => [center.x + x * entry, center.y + y * entry * .84]);
  const environment = smooth(p / .18) * (1 - smooth((p - .79) / .11));
  ctx.clearRect(0, 0, w, h);
  ctx.save(); ctx.globalAlpha = environment;
  ctx.beginPath(); gate.forEach(([x,y], i) => i ? ctx.lineTo(Math.round(x),Math.round(y)) : ctx.moveTo(Math.round(x),Math.round(y))); ctx.closePath(); ctx.clip();
  ctx.fillStyle = '#070f21'; ctx.fillRect(0, 0, w, h);
  const far = ring(9.4), outer = ring(.07);
  for (let face = 0; face < 8; face++) {
    const next = (face + 1) % 8;
    polygon(ctx, [outer[face],outer[next],far[next],far[face]], wallColors[face]);
  }
  const count = mobile ? 6 : 8;
  const spacing = 8 / count;
  const depths = Array.from({ length: count }, (_, i) => .22 + ((i * spacing - travel) % 8 + 8) % 8).sort((a,b) => b-a);
  for (const z of depths) {
    const front = ring(z), inset = ring(z, .982), back = ring(z + .07);
    const light = clamp(1 - z / 12);
    for (let face = 0; face < 8; face++) {
      const next = (face + 1) % 8;
      polygon(ctx, [front[face],front[next],back[next],back[face]], face < 4 ? '#0d1c30' : '#1a3045');
      if ((face + Math.floor(z + travel)) % 3 !== 0) {
        polygon(ctx, [front[face],front[next],inset[next],inset[face]], face % 3 === 0 ? '#476078' : '#243c51');
        const point = t => [mix(section[face][0],section[next][0],t),mix(section[face][1],section[next][1],t)];
        // Long, slender fragments of light; no framed windows or solid housings.
        const a = point(.34), b = point(.356);
        const ribbon = [project(a,z+.19),project(b,z+.19),project(b,z+.88),project(a,z+.88)];
        polygon(ctx,ribbon,`rgba(119,173,199,${light * .56})`);
        const core = [project(a,z+.20),project(b,z+.20),project(b,z+.38),project(a,z+.38)];
        polygon(ctx,core,`rgba(190,217,224,${light * .55})`);
      }
    }
    // Interrupt the bright rim: only three surfaces catch the moonlight.
    for (const face of [0,2,7].filter(face => (face + Math.floor(z + travel)) % 3 !== 0)) {
      ctx.strokeStyle = `rgba(169,199,209,${light * .65})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(...inset[face].map(Math.round)); ctx.lineTo(...inset[(face+1)%8].map(Math.round)); ctx.stroke();
    }
  }
  // Short glints track the walls. They support the geometry instead of replacing it.
  for (let i = 0; i < (mobile ? 24 : 34); i++) {
    const angle = i * 2.39996;
    const z = .35 + ((i * .719 - travel * 1.3) % 8 + 8) % 8;
    const point = [Math.cos(angle) * 1.05,Math.sin(angle) * .88];
    const a = project(point,z), b = project(point,z+.12+clamp(p/.5)*.2);
    ctx.strokeStyle = i % 9 === 0 ? '#ac9e78' : '#527f9b';
    ctx.lineWidth = z < 1.5 ? 2 : 1;
    ctx.beginPath(); ctx.moveTo(...a.map(Math.round)); ctx.lineTo(...b.map(Math.round)); ctx.stroke();
  }
  ctx.restore();
  if (p < .34) {
    ctx.globalAlpha = Math.sin(clamp(p/.34)*Math.PI) * .8;
    outline(ctx,gate,'#617e94',3); outline(ctx,gate,'#bbced4',1);
    ctx.globalAlpha = 1;
  }
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
  const cruiseScale = Math.max(startScale, Math.min(Math.min(width,height) * .23 / target.width, .7));
  let frame, finish;
  const done = new Promise(resolve => { finish = resolve; });
  const stop = () => finish();
  signal.addEventListener('abort', stop, { once: true });
  reduced.addEventListener('change', stop);
  window.addEventListener('resize', stop, { once: true });
  const duration = reduced.matches ? 140 : 720;
  const start = performance.now();
  const draw = now => {
    const p = clamp((now - start) / duration);
    if (reduced.matches) {
      clone.hidden = true;
      dialog.style.setProperty('--arrival', p);
    } else {
      const align = smooth((p - .07) / .7);
      const center = {
        x: mix(origin.x + origin.width / 2, target.x + target.width / 2, align),
        y: mix(origin.y + origin.height / 2, target.y + target.height / 2, align)
      };
      const approach = smooth((p - .69) / .23);
      const earlyScale = mix(startScale,cruiseScale,smooth(p/.36));
      const scale = mix(earlyScale * (1 + .035 * smooth((p-.36)/.33)),1,approach);
      const x = center.x - target.width * scale / 2, y = center.y - target.height * scale / 2;
      clone.style.transform = `translate(${x}px,${y}px) scale(${scale})`;
      clone.style.opacity = 1 - smooth((p - .93) / .07);
      const growth = clamp(p/.24) ** 5;
      const entry = mix(Math.max(origin.width,origin.height) * .53,Math.hypot(width,height),growth) / pixel;
      drawTunnel(ctx,canvas.width,canvas.height,p,{x:center.x/pixel,y:center.y/pixel},entry,mobile);
      // A silver, stepped exit bezel anchors transparent artwork in the distant room.
      const margin = mix(5,0,approach), left = x/pixel-margin, top = y/pixel-margin;
      const right = (x+target.width*scale)/pixel+margin, bottom = (y+target.height*scale)/pixel+margin;
      ctx.globalAlpha = smooth((p-.14)/.18) * (1-smooth((p-.79)/.11));
      const bevel = 4;
      const exit = [[left+bevel,top],[right-bevel,top],[right,top+bevel],[right,bottom-bevel],[right-bevel,bottom],[left+bevel,bottom],[left,bottom-bevel],[left,top+bevel]];
      outline(ctx,exit,'#213b56',4); outline(ctx,exit,'#91afc0',1); ctx.globalAlpha = 1;
      dialog.style.setProperty('--arrival', smooth((p - .885) / .115));
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
