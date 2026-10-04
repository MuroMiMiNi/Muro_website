// Render rotation frames once on a tiny grid, keeping every star edge pixel-sharp.
function starFrames() {
  return Array.from({ length: 24 }, (_, frame) => {
    const sprite = document.createElement('canvas'); sprite.width = sprite.height = 17;
    const ctx = sprite.getContext('2d');
    ctx.translate(8.5,8.5); ctx.rotate(frame * Math.PI / 12);
    ctx.beginPath();
    for (let point = 0; point < 10; point++) {
      const angle = point * Math.PI / 5 - Math.PI / 2, radius = point % 2 ? 3.5 : 8;
      const x = Math.cos(angle)*radius, y = Math.sin(angle)*radius;
      if (!point) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath(); ctx.clip();
    ctx.fillStyle = '#718ead'; ctx.fillRect(-9,-9,18,18);
    ctx.fillStyle = '#c8d9de'; ctx.fillRect(-9,-7,18,10);
    ctx.fillStyle = '#f1e6b9'; ctx.fillRect(-4,-4,7,6);
    ctx.fillStyle = '#fff3cf'; ctx.fillRect(-2,-3,3,3);
    const pixels = ctx.getImageData(0,0,17,17);
    for (let i = 3; i < pixels.data.length; i += 4) pixels.data[i] = pixels.data[i] >= 128 ? 255 : 0;
    ctx.putImageData(pixels,0,0);
    return sprite;
  });
}

export function createPixelMeteors(host) {
  const canvas = document.createElement('canvas'); canvas.className = 'pixel-meteors'; canvas.hidden = true;
  canvas.setAttribute('aria-hidden','true'); host.append(canvas);
  const ctx = canvas.getContext('2d'), sprites = starFrames();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let timer, frame;
  const allowed = () => !document.hidden && !reduced.matches;
  function stop() {
    clearTimeout(timer); cancelAnimationFrame(frame);
    ctx.clearRect(0,0,canvas.width,canvas.height); canvas.hidden = true;
  }
  function schedule(first = false) {
    if (allowed()) timer = setTimeout(fly, first ? 4000 + Math.random()*4000 : 12000 + Math.random()*12000);
  }
  function fly() {
    if (!allowed()) return;
    canvas.width = Math.ceil(innerWidth/2); canvas.height = Math.ceil(innerHeight/2);
    ctx.imageSmoothingEnabled = false; canvas.hidden = false;
    const w = canvas.width, h = canvas.height, compact = innerWidth <= 600;
    const direction = Math.random() < .5 ? -1 : 1;
    const sizes = compact ? [8,10,12,14] : [10,13,17,20];
    const size = sizes[Math.floor(Math.random()*sizes.length)];
    const tail = (compact ? 42 : 65) * size / (compact ? 13 : 17);
    const fromX = direction > 0 ? -tail : w+tail;
    const fromY = h*(.1 + Math.random()*.32);
    const dx = direction*(w+tail*2), dy = h*(.18 + Math.random()*.16);
    const length = Math.hypot(dx,dy), ux = dx/length, uy = dy/length;
    const duration = compact ? 2100 : 2600;
    const spin = Math.random() < .5 ? -1 : 1;
    const start = performance.now();
    const draw = now => {
      const progress = Math.min(1,(now-start)/duration);
      const x = fromX+dx*progress, y = fromY+dy*progress;
      ctx.clearRect(0,0,w,h);
      ctx.globalAlpha = Math.min(1,progress/.12,(1-progress)/.18)*.78;
      // Short square embers taper to cool blue, following the flight rather than the spin.
      for (let piece = 27; piece >= 0; piece--) {
        const age = piece/27, distance = 7+age*tail;
        const scatter = piece % 3 === 0 ? Math.sin(piece*2.4)*age*4 : 0;
        const size = piece < 6 ? 3 : piece < 17 ? 2 : 1;
        const px = Math.round(x-ux*distance-uy*scatter), py = Math.round(y-uy*distance+ux*scatter);
        ctx.fillStyle = age < .2 ? '#c9d9cc' : age < .48 ? '#789dad' : age < .76 ? '#446486' : '#2a4268';
        ctx.fillRect(px,py,size,size);
      }
      const rotation = ((Math.floor((now-start)/65)*spin)%24+24)%24;
      ctx.drawImage(sprites[rotation],Math.round(x-size/2),Math.round(y-size/2),size,size);
      ctx.globalAlpha = 1;
      if (progress < 1) frame = requestAnimationFrame(draw);
      else { canvas.hidden = true; ctx.clearRect(0,0,w,h); schedule(); }
    };
    frame = requestAnimationFrame(draw);
  }
  document.addEventListener('visibilitychange', () => { stop(); schedule(true); });
  reduced.addEventListener('change', () => { stop(); schedule(true); });
  window.addEventListener('resize', () => { stop(); schedule(true); });
  schedule(true);
}
