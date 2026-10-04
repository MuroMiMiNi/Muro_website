// Five authored cloud profiles. Rasterize once; only the three tracks move.
const profiles = [
  [[21,38,20,10],[43,30,26,19],[73,34,29,16],[101,40,31,10],[137,44,36,6]],
  [[26,41,25,8],[48,32,27,17],[71,40,21,10],[116,35,28,14],[145,43,30,6]],
  [[23,43,21,9],[49,34,27,16],[79,27,24,21],[106,36,25,15],[138,41,34,10]],
  [[27,38,26,7],[60,34,35,11],[100,37,33,8],[134,42,40,5],[125,50,29,3]],
  [[29,36,25,16],[52,24,24,23],[79,34,26,15],[112,39,35,11],[145,44,28,6]]
];
const palette = ['#14253f','#1d3453','#294667','#3b5875','#58748d'];

function cloudSprite(lobes, variant) {
  const canvas = document.createElement('canvas');
  canvas.width = 184; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const cells = new Int8Array(canvas.width * canvas.height).fill(-1);
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      let depth = -1, shade = 0;
      for (const [cx, cy, rx, ry] of lobes) {
        const nx = (x - cx) / rx, ny = (y - cy) / ry;
        const inside = 1 - nx * nx - ny * ny;
        if (inside > 0 && inside > depth) {
          depth = inside;
          // Broad curved planes, not noise or a uniform inset outline.
          shade = Math.max(0, Math.min(3, Math.floor(1.8 - ny * 1.7 - nx * .55)));
        }
      }
      if (depth >= 0) cells[y * canvas.width + x] = shade;
    }
  }
  for (let y = 1; y < canvas.height; y++) {
    for (let x = 1; x < canvas.width - 1; x++) {
      const i = y * canvas.width + x;
      if (cells[i] < 0) continue;
      // Broken moonlit crests and short shadow clefts between cloud shoulders.
      if (cells[i - canvas.width] < 0 && cells[i] >= 2 && (x + variant * 13) % 43 < 22) cells[i] = 4;
      ctx.fillStyle = palette[cells[i]];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  ctx.fillStyle = palette[1];
  ctx.fillRect(38 + variant * 6, 55, 21, 2);
  ctx.fillRect(90 - variant * 5, 58, 32, 1);
  ctx.fillStyle = palette[2];
  ctx.fillRect(120 + variant * 3, 52, 18, 1);
  return canvas.toDataURL();
}

export function createPixelClouds(host) {
  const sprites = profiles.map(cloudSprite);
  const arrangements = [[0,3,1], [2,0,4], [4,1,3]];
  arrangements.forEach((variants, layer) => {
    const track = document.createElement('div'); track.className = `cloud-track cloud-layer-${layer}`;
    for (let copy = 0; copy < 2; copy++) {
      const band = document.createElement('div'); band.className = 'cloud-band';
      variants.forEach((variant, index) => {
        const cloud = new Image(); cloud.className = `pixel-cloud cloud-${index}`;
        cloud.src = sprites[variant]; cloud.alt = ''; cloud.width = 184; cloud.height = 64;
        band.append(cloud);
      });
      track.append(band);
    }
    host.append(track);
  });
}
