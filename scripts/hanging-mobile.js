// Calendar ordering is retained when arranging the Three.js picture chains.
export function buildTimeline(artworks) {
  const periods = new Map();
  artworks.forEach(artwork => {
    const key = artwork.date?.slice(0, 7) ?? 'undated';
    if (!periods.has(key)) periods.set(key, { key, year: artwork.date?.slice(0, 4) ?? null, works: [] });
    periods.get(key).works.push(artwork);
  });
  return [...periods.values()].sort((a, b) => a.key === 'undated' ? 1 : b.key === 'undated' ? -1 : b.key.localeCompare(a.key))
    .map(period => ({ ...period, works: period.works.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')) }));
}
