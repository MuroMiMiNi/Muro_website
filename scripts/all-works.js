import { startCollectionIntro } from './collection-intro.js';

export const categories = [['全部', 'All'], ['頭像', 'Avatar'], ['半身', 'Half body'], ['全身', 'Full body']];
// Each category gets its own grid so avatar, half-body and full-body sizes can be styled separately.
export const groupClasses = { 頭像: 'is-avatar', 半身: 'is-half-body', 全身: 'is-full-body' };

export function mountAllWorks(host, works, lang, title, onSelect, initialCategory = '全部', playIntro = true) {
  const node = (tag, className, text) => {
    const item = document.createElement(tag);
    item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  };
  const filters = node('nav', 'collection-filters');
  filters.setAttribute('aria-label', lang === 'zh' ? '作品分類' : 'Artwork categories');
  const groupsHost = node('div', 'collection-groups');
  const groups = new Map();
  const groupFor = value => {
    if (groups.has(value)) return groups.get(value);
    const label = categories.find(([zh]) => zh === value);
    const section = node('section', `collection-group ${groupClasses[value] ?? 'is-other'}`);
    section.dataset.category = value;
    const heading = node('h3', 'collection-group-title', label ? (lang === 'zh' ? label[0] : label[1]) : (value || (lang === 'zh' ? '其他' : 'Other')));
    const grid = node('div', 'collection-grid');
    section.append(heading, grid); groupsHost.append(section);
    groups.set(value, grid);
    return grid;
  };
  const status = node('p', 'collection-status');
  status.setAttribute('role', 'status');
  const buttons = [];
  const dialog = host.closest('dialog');
  const wall = node('div', 'collection-wall');
  let category = initialCategory, stopIntro = null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function finish() {
    stopIntro?.(); stopIntro = null;
    dialog.removeAttribute('data-revealing');
  }
  function filter(value) {
    finish(); category = value;
    filters.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === value)));
    buttons.forEach(button => { button.hidden = value !== '全部' && button.dataset.category !== value; });
    groupsHost.querySelectorAll('.collection-group').forEach(section => { section.hidden = value !== '全部' && section.dataset.category !== value; });
    const count = buttons.filter(button => !button.hidden).length;
    status.textContent = count ? (lang === 'zh' ? `${count} 件作品` : `${count} artworks`) : (lang === 'zh' ? '這個分類還沒有作品。' : 'No artworks in this category yet.');
  }
  for (const [zh, en] of categories) {
    const count = works.filter(work => zh === '全部' || work.category === zh).length;
    const button = node('button', '', `${lang === 'zh' ? zh : en} ${count}`);
    button.type = 'button'; button.dataset.category = zh;
    button.addEventListener('click', () => filter(zh)); filters.append(button);
    if (zh !== '全部' && count) groupFor(zh);
  }
  for (const work of works) {
    const button = node('button', 'collection-work');
    button.type = 'button'; button.dataset.category = work.category ?? '';
    button.dataset.artwork = work.id; button.setAttribute('aria-label', title(work));
    button.setAttribute('aria-haspopup', 'dialog');
    const image = node('img', ''); image.src = work.src; image.alt = title(work); image.decoding = 'async';
    button.append(image);
    button.addEventListener('click', () => { finish(); onSelect(work, button); });
    groupFor(work.category ?? '').append(button); buttons.push(button);
  }
  wall.append(host.querySelector('#dialogTitle'), filters, status, groupsHost);
  host.append(wall); filter(category);
  const visible = buttons.filter(button => !button.hidden);
  if (playIntro && !reduced.matches && visible.length) {
    // Hide the final wall synchronously, before decoding or the first animation frame.
    dialog.setAttribute('data-revealing', 'true');
    stopIntro = startCollectionIntro(dialog, wall, visible.map(button => button.querySelector('img')), finish);
  }
  const settle = () => { if (reduced.matches) finish(); };
  reduced.addEventListener('change', settle);
  window.addEventListener('resize', finish);
  // Focus or filtering can end the introduction immediately for keyboard use.
  const focus = event => { if (event.target.matches('.collection-filters button,.collection-work')) finish(); };
  host.addEventListener('focusin', focus);
  const key = event => { if (event.key === 'Tab') finish(); };
  dialog.addEventListener('keydown', key);
  return {
    get category() { return category; },
    destroy() { finish(); reduced.removeEventListener('change', settle); window.removeEventListener('resize', finish); host.removeEventListener('focusin', focus); dialog.removeEventListener('keydown', key); }
  };
}
