// A small, stepped crescent with broad moonlit planes; the CSS halo stays behind it.
export function createPixelMoon(host) {
  const moon = document.createElement('div'); moon.className = 'pixel-moon'; moon.setAttribute('aria-hidden','true');
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 48;
  const ctx = canvas.getContext('2d');
  const palette = ['#6a859e','#8ca5b7','#b6c9d0','#d5dcd4'];
  for (let y = 5; y < 44; y++) {
    for (let x = 5; x < 44; x++) {
      const radius = Math.hypot(x-24,y-24);
      if (radius > 18) continue;
      if (Math.hypot(x-31,y-18) < 17) {
        ctx.fillStyle = '#7896ae0b';
      } else {
        let shade = radius > 16.5 ? 1 : x+y < 45 ? 3 : 2;
        if ((x >= 11 && x <= 14 && y >= 23 && y <= 27) || (x >= 21 && x <= 25 && y >= 36 && y <= 38)) shade = Math.max(0,shade-1);
        ctx.fillStyle = palette[shade];
      }
      ctx.fillRect(x,y,1,1);
    }
  }
  moon.append(canvas); host.append(moon);
}
