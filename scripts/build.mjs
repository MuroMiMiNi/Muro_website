import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { root, syncArtworks } from './sync-artworks.mjs';

const catalog = await syncArtworks();
const output = path.join(root, 'dist');
// Only the generated directory under this project may be replaced.
if (path.dirname(output) !== path.resolve(root) || path.basename(output) !== 'dist') throw new Error('Unsafe build path');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const item of ['index.html', 'assets', 'styles', 'scripts']) {
  await cp(path.join(root, item), path.join(output, item), { recursive: true });
}
console.log(`Built example E with ${catalog.length} artworks → dist/`);
