import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { root, syncArtworks, syncAllArtworks } from './sync-artworks.mjs';

await syncArtworks();
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.gif': 'image/gif', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
http.createServer(async (req, res) => {
  try {
    const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative) || relative.split(path.sep).some(part => part.startsWith('.'))) {
      res.writeHead(403).end(); return;
    }
    if (name === '/scripts/data/artwork-catalog.json') await syncArtworks();
    if (name === '/scripts/data/all-artwork-catalog.json') await syncAllArtworks();
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(Number(process.env.PORT ?? 5505), '127.0.0.1', () => console.log('Example E: http://127.0.0.1:5505'));
