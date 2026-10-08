const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const p = clamp(value); return p * p * (3 - 2 * p); };

// A single forward camera passes the foreground; the complete gallery is behind it.
export function startCollectionIntro(dialog, wall, images, onFinish) {
  const width = dialog.clientWidth, height = dialog.clientHeight, compact = width < 600;
  const perspective = height * 1.15, distance = perspective * 3;
  const lateral = compact ? width * .60 : Math.min(width * .5, perspective * .7);
  const scene = document.createElement('div'); scene.className = 'collection-flight';
  scene.setAttribute('aria-hidden', 'true'); scene.style.perspective = `${perspective}px`;
  const camera = document.createElement('div'); camera.className = 'collection-flight-camera'; scene.append(camera);
  const moonSource = document.querySelector('.pixel-moon canvas');
  if (moonSource) {
    const moon = document.createElement('canvas'); moon.className = 'collection-flight-moon';
    moon.width = moonSource.width; moon.height = moonSource.height;
    moon.getContext('2d').drawImage(moonSource, 0, 0); scene.append(moon);
  }
  const clouds = [...document.querySelectorAll('.pixel-cloud')].slice(0, 2).map((source, index) => {
    const cloud = source.cloneNode(); cloud.className = `collection-flight-cloud flight-cloud-${index}`;
    cloud.alt = ''; scene.append(cloud); return cloud;
  });
  const positions = compact ? [
    [0,-.08,-.15,0,0], [-.90,-.30,-.70,.75,10], [.95,.35,-1.13,1.05,-10],
    [-1.15,.18,-1.56,1.40,8], [1.20,-.20,-1.95,1.70,-8], [-1.30,-.15,-2.35,2,8]
  ] : [
    [0,-.08,-.15,0,0], [-.52,.08,-.60,.50,10], [.54,.15,-.82,.72,-10],
    [-.90,-.20,-1.14,.95,8], [1.05,-.12,-1.30,1.10,-8],
    [-1.20,.34,-1.56,1.25,8], [1.30,.04,-1.78,1.40,-10],
    [-1.50,-.04,-1.92,1.55,10], [1.60,.28,-2.06,1.65,-8], [-1.70,.12,-2.18,1.75,8]
  ];
  // Fewer foreground images on a phone leave the central viewing passage clear.
  const actors = images.slice(0, compact ? 6 : 10).map((source, index) => {
    const [x,y,z,at,angle] = positions[index];
    const item = document.createElement('div'); item.className = 'collection-flight-work';
    const image = source.cloneNode(); image.alt = ''; image.removeAttribute('loading');
    item.append(image); camera.append(item);
    item.dataset.enter = String(at); item.dataset.depth = String(z);
    item.style.width = `${compact ? width * .55 : height * .34}px`;
    item.style.height = `${height * .34}px`;
    item.style.transform = `translate3d(${x * lateral}px,${y * height * .2}px,${z * perspective}px) translate(-50%,-50%) rotateY(${angle}deg)`;
    return { item, image, z, at, transform: item.style.transform };
  });
  let frame, start, stopped = false;
  function stop() {
    if (stopped) return;
    stopped = true; cancelAnimationFrame(frame); scene.remove();
    wall.style.removeProperty('transform'); wall.style.removeProperty('transform-origin'); wall.style.removeProperty('opacity');
    dialog.removeAttribute('data-collection-phase');
  }
  dialog.dataset.collectionPhase = 'loading';
  wall.style.opacity = '0';
  dialog.append(scene);
  const rect = wall.getBoundingClientRect();
  wall.style.transformOrigin = `50% ${height * .43 - rect.top}px`;
  function draw(now) {
    if (stopped) return;
    start ??= now;
    const time = (now - start) / 1000;
    const travel = smooth((time - .95) / 2.6), cameraZ = distance * travel;
    const cameraX = compact ? 0 : -lateral * .26 * smooth((time - .95) / .65) * (1 - smooth((time - 2.1) / 1.45));
    camera.style.transform = `translate3d(${-cameraX}px,0,${cameraZ}px)`;
    for (const { item,z,at } of actors) {
      const nearFade = 1 - smooth((z + cameraZ / perspective - .15) / .30);
      item.style.opacity = smooth((time - at) / .32) * nearFade * (1 - smooth((time - 2.95) / .35));
    }
    if (compact) actors[0].item.style.transform = `translateX(${-width * .65 * smooth((time - .95) / .6)}px) ${actors[0].transform}`;
    const scale = perspective / (perspective + distance - cameraZ);
    wall.style.transform = `translateX(${-cameraX * scale}px) scale(${scale})`;
    wall.style.opacity = smooth((time - 2.4) / .65);
    dialog.dataset.collectionPhase = time < .95 ? 'opening' : time < 2.4 ? 'travel' : time < 3.55 ? 'arrival' : 'settled';
    scene.style.opacity = 1 - smooth((time - 3.05) / .55);
    clouds.forEach((cloud,index) => {
      cloud.style.transform = `translate(${(index ? 1 : -1) * travel * width * .10}px,${travel * height * .25}px)`;
    });
    if (time < 4) frame = requestAnimationFrame(draw);
    else { stop(); onFinish(); }
  }
  Promise.allSettled(actors.map(actor => actor.image.decode())).then(() => {
    if (stopped) return;
    if (!actors.some(actor => actor.image.naturalWidth)) { stop(); onFinish(); return; }
    frame = requestAnimationFrame(draw);
  });
  return stop;
}
