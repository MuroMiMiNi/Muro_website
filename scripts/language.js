// The chosen language carries between the main page and the queue board.
// Storage can be blocked (private windows, cleared site data), so Chinese is the fallback.
const key = 'muro-lang';
export function savedLanguage() {
  try { return localStorage.getItem(key) === 'en' ? 'en' : 'zh'; } catch { return 'zh'; }
}
export function saveLanguage(lang) {
  try { localStorage.setItem(key, lang); } catch {}
}
