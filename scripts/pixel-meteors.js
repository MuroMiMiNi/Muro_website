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
  let timer, frame, meteors = [];
  const allowed = () => !document.hidden && !reduced.matches;
  const random = (min,max) => min + Math.random()*(max-min);
  const point = (meteor,t) => {
    const u = 1-t;
    return {
      x: u*u*meteor.start.x + 2*u*t*meteor.bend.x + t*t*meteor.end.x,
      y: u*u*meteor.start.y + 2*u*t*meteor.bend.y + t*t*meteor.end.y
    };
  };
  function stop() {
    clearTimeout(timer); cancelAnimationFrame(frame); frame = 0; meteors = [];
    ctx.clearRect(0,0,canvas.width,canvas.height); canvas.hidden = true;
  }
  function schedule(first = false) {
    if (allowed()) timer = setTimeout(launch, first ? random(1200,3000) : random(450,2400));
  }
  function launch() {
    if (!allowed()) return;
    if (meteors.length < 10) {
      const w = canvas.width, h = canvas.height, compact = innerWidth <= 600;
      const start = { x: w*random(.55,1.12), y: h*random(-.12,.3) };
      const end = { x: w*random(-.2,.25), y: h*random(.75,1.15) };
      meteors.push({
        start, end,
        bend: { x: start.x+(end.x-start.x)*random(.28,.58), y: start.y+(end.y-start.y)*random(.04,.26) },
        size: Math.round(compact ? random(8,15) : random(10,20)),
        duration: random(3800,9200), born: performance.now(), opacity: random(.24,.48),
        spin: (Math.random() < .5 ? -1 : 1)*random(.6,1.2)
      });
      canvas.hidden = false;
      if (!frame) frame = requestAnimationFrame(draw);
    }
    // One launch per timer: a full sky waits for room, never releases a queued batch.
    schedule();
  }
  function draw(now) {
    frame = 0;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    meteors = meteors.filter(meteor => now-meteor.born < meteor.duration);
    for (const meteor of meteors) {
      const progress = (now-meteor.born)/meteor.duration;
      const head = point(meteor,progress);
      const fade = Math.min(1,progress/.13,(1-progress)/.22)*meteor.opacity;
      // Sample earlier points on the same curve so the pixel embers bend with the flight.
      for (let piece = 27; piece >= 0; piece--) {
        const age = piece/27;
        const past = progress-(.012+age*.14)*meteor.size/17;
        if (past < 0) continue;
        const ember = point(meteor,past);
        const scatter = piece % 3 === 0 ? Math.sin(piece*2.4)*age*3 : 0;
        const size = piece < 6 ? 3 : piece < 17 ? 2 : 1;
        ctx.globalAlpha = fade*(1-age*.65);
        ctx.fillStyle = age < .2 ? '#c9d9cc' : age < .48 ? '#789dad' : age < .76 ? '#446486' : '#2a4268';
        ctx.fillRect(Math.round(ember.x+scatter),Math.round(ember.y-scatter),size,size);
      }
      const rotation = ((Math.floor((now-meteor.born)/65*meteor.spin)%24)+24)%24;
      ctx.globalAlpha = fade;
      ctx.drawImage(sprites[rotation],Math.round(head.x-meteor.size/2),Math.round(head.y-meteor.size/2),meteor.size,meteor.size);
    }
    ctx.globalAlpha = 1;
    if (meteors.length) frame = requestAnimationFrame(draw);
    else canvas.hidden = true;
  }
  function restart() {
    stop();
    canvas.width = Math.ceil(innerWidth/2); canvas.height = Math.ceil(innerHeight/2);
    ctx.imageSmoothingEnabled = false; schedule(true);
  }
  document.addEventListener('visibilitychange', restart);
  reduced.addEventListener('change', restart);
  window.addEventListener('resize', restart);
  restart();
}
