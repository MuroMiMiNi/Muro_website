import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { artworksData } from './data/artworksData.js';

export const root = fileURLToPath(new URL('../', import.meta.url));
const supported = /\.(png|jpe?g|webp|gif|avif)$/i;

export function filenameDate(name) {
  const match = name.match(/(?:^|\D)((?:19|20)\d{2})[-_.]?([01]\d)[-_.]?([0-3]\d)(?=\D|$)/);
  if (!match) return null;
  const value = `${match[1]}-${match[2]}-${match[3]}`;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(+date) && date.toISOString().startsWith(value) ? value : null;
}

export async function createCatalog(directory = path.join(root, 'assets/artworks'), prefix = './assets/artworks') {
  async function walk(folder, relative = '') {
    const entries = await readdir(folder, { withFileTypes: true });
    const groups = await Promise.all(entries.map(entry => {
      const next = path.posix.join(relative, entry.name);
      if (entry.isDirectory()) return walk(path.join(folder, entry.name), next);
      return entry.isFile() && supported.test(entry.name) ? [next] : [];
    }));
    return groups.flat();
  }
  const files = await walk(directory);
  return files.map(file => {
    const src = `${prefix}/${file}`;
    const oldIndex = artworksData.findIndex(item => item.src === src);
    const old = artworksData[oldIndex];
    const date = filenameDate(path.basename(file));
    const title = path.basename(file, path.extname(file)).replace(/^(?:19|20)\d{2}[-_.]?\d{2}[-_.]?\d{2}[\s_-]*/, '').replace(/_/g, ' ');
    return {
      id: file, src, date,
      title: old?.title ?? { zh: title, en: title },
      description: old?.description && !/請在這裡|Add the description/.test(old.description.zh + old.description.en) ? old.description : null,
      category: path.dirname(file) === '.' ? null : path.dirname(file),
      order: oldIndex < 0 ? Number.MAX_SAFE_INTEGER : oldIndex
    };
  }).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || a.order - b.order || a.id.localeCompare(b.id, 'en', { numeric: true }))
    .map(({ order, ...item }) => item);
}

export async function syncArtworks() {
  const catalog = await createCatalog();
  await writeFile(path.join(root, 'scripts/data/artwork-catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
  return catalog;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`Synced ${(await syncArtworks()).length} artworks.`);
}
