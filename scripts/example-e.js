import { siteData, socialLinks } from './data/siteData.js';

const $ = selector => document.querySelector(selector);
const gallery = $('#mobileGallery');
const scope = $('#scope');
const dialog = $('#detailDialog');
const content = $('#dialogContent');
const touch = matchMedia('(hover: none), (pointer: coarse)');
let lang = 'zh';
let artworks = [];
let preview = null;
let previewTrigger = null;
let hideTimer;
let page = null;
let selected = null;
let returnFocus = null;
let returnY = 0;
let selectedPlan = 'avatar';
const t = (zh, en) => lang === 'zh' ? zh : en;
const text = value => typeof value === 'string' ? value : value?.[lang] ?? '';
const title = artwork => text(artwork.title);
const plans = [
  { id: 'avatar', zh: '頭像委託', en: 'Avatar', price: 'NT$ 500', time: { zh: '7 天', en: '7 days' }, value: '頭像委託－NT$500' },
  { id: 'half-body', zh: '半身委託', en: 'Half body', price: 'NT$ 1,100 起', priceEn: 'From NT$ 1,100', time: { zh: '7–14 天', en: '7–14 days' }, value: '半身委託－NT$1100' },
  { id: 'full-body', zh: '全身委託', en: 'Full body', price: 'NT$ 2,800 起', priceEn: 'From NT$ 2,800', time: { zh: '14 天', en: '14 days' }, value: '全身委託－NT$2800' }
];
function element(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value !== undefined) node.textContent = value;
  return node;
}
function action(label, handler) {
  const button = element('button', 'action', label);
  button.type = 'button'; button.addEventListener('click', handler);
  return button;
}
function imageFor(artwork, className) {
  const image = element('img', className);
  image.src = artwork.src; image.alt = title(artwork); image.decoding = 'async';
  return image;
}

// Deterministic, sparse stars: no canvas render loop or image filtering.
for (let i = 0; i < 72; i++) {
  const star = element('i', `star${i % 11 === 0 ? ' cross' : ''}`);
  star.style.left = `${(i * 37.71 + 3) % 100}%`;
  star.style.top = `${(i * 23.37 + 7) % 100}%`;
  star.style.setProperty('--opacity', .18 + (i % 5) * .11);
  $('#stars').append(star);
}
$('#year').textContent = new Date().getFullYear();
const visibility = new IntersectionObserver(entries => {
  entries.forEach(entry => entry.target.classList.toggle('is-visible', entry.isIntersecting));
}, { rootMargin: '100px' });

function renderGallery() {
  visibility.disconnect();
  gallery.replaceChildren();
  if (!artworks.length) gallery.append(element('p', 'loading', t('作品整理中，稍後見。', 'More artworks are on their way.')));
  for (let index = 0; index < artworks.length; index += 2) {
    const tier = element('div', 'tier');
    for (const decoration of ['beam', 'joint', 'hanging-charm']) {
      const node = element('span', decoration); node.setAttribute('aria-hidden', 'true'); tier.append(node);
    }
    artworks.slice(index, index + 2).forEach((artwork, side) => {
      const figure = element('figure', 'hanging-work');
      const alternating = (index / 2) % 2;
      const drop = side === 0 ? 100 : 160;
      const beamY = 36 + (side === 0 ? 25 : -25) * (alternating ? -1 : 1);
      const mobileDrop = side === 0 ? 83 : 153;
      figure.style.cssText = `--left:${side ? 78 : 22}%;--size:${side ? 232 : 208}px;--drop:${drop}px;--wire:${drop - beamY}px;--mobile-left:${side ? 77 : 23}%;--mobile-size:${side ? 'min(36vw, 155px)' : 'min(33vw, 145px)'};--mobile-drop:${mobileDrop}px;--mobile-wire:${mobileDrop - (18 + (side ? -11 : 11) * (alternating ? -1 : 1))}px;--duration:${12 + index % 5}s;--delay:-${index + side * 4}s`;
      const wire = element('span', 'suspension'); wire.setAttribute('aria-hidden', 'true');
      const motion = element('div', 'work-motion');
      const button = element('button', 'metal-frame work-button');
      button.type = 'button'; button.dataset.artwork = artwork.id;
      button.setAttribute('aria-label', t(`預覽 ${title(artwork)}`, `Preview ${title(artwork)}`));
      button.setAttribute('aria-haspopup', 'dialog');
      const image = imageFor(artwork); image.loading = 'lazy'; image.width = 400; image.height = 400;
      button.append(image);
      button.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse' && !touch.matches) showPreview(artwork, button); });
      button.addEventListener('pointerleave', queueHide);
      button.addEventListener('focus', () => { if (!touch.matches) showPreview(artwork, button); });
      button.addEventListener('blur', queueHide);
      button.addEventListener('click', event => {
        if ((touch.matches || event.pointerType === 'touch') && event.detail !== 0 && preview?.id !== artwork.id) showPreview(artwork, button);
        else openPage('artwork', artwork, button);
      });
      const caption = element('figcaption');
      caption.append(element('span', 'work-title', title(artwork)), element('span', 'work-meta', artwork.date ?? t('作品收藏', 'From the collection')));
      motion.append(button, caption); figure.append(wire, motion); tier.append(figure);
    });
    gallery.append(tier); visibility.observe(tier);
  }
  $('#galleryHint').textContent = t(`${artworks.length} 件作品 · ${touch.matches ? '點按預覽，再點按看詳情' : '停留觀測，點按看詳情'}`, `${artworks.length} artworks · ${touch.matches ? 'Tap to preview; tap again to explore' : 'Hover to observe, click to explore'}`);
}
function queueHide() {
  if (!touch.matches) hideTimer = setTimeout(() => { if (!scope.matches(':hover') && document.activeElement !== scope) hidePreview(); }, 240);
}
function hidePreview() { clearTimeout(hideTimer); scope.hidden = true; preview = null; previewTrigger = null; }
function showPreview(artwork, trigger) {
  clearTimeout(hideTimer);
  if (dialog.open) return;
  preview = artwork; previewTrigger = trigger;
  $('#scopeImage').src = artwork.src; $('#scopeImage').alt = title(artwork);
  $('#scopeCaption').textContent = title(artwork);
  scope.setAttribute('aria-label', t(`查看 ${title(artwork)} 詳情`, `Explore ${title(artwork)}`));
  scope.hidden = false;
  const rect = trigger.getBoundingClientRect();
  const width = scope.offsetWidth; const height = scope.offsetHeight; const gap = 16;
  let left = rect.right + gap;
  if (left + width > innerWidth - 12) left = rect.left - width - gap;
  if (touch.matches) left = (innerWidth - width) / 2;
  let top = rect.top + rect.height / 2 - height / 2;
  if (touch.matches) {
    const above = rect.top - height - 16;
    top = above >= 12 ? above : rect.bottom + 16;
  }
  scope.style.left = `${Math.max(12, Math.min(innerWidth - width - 12, left))}px`;
  scope.style.top = `${Math.max(12, Math.min(innerHeight - height - 12, top))}px`;
}
scope.addEventListener('pointerenter', () => clearTimeout(hideTimer));
scope.addEventListener('pointerleave', queueHide);
scope.addEventListener('focus', () => clearTimeout(hideTimer));
scope.addEventListener('blur', queueHide);
scope.addEventListener('click', () => { if (preview) openPage('artwork', preview, previewTrigger); });
document.addEventListener('pointerdown', event => { if (!event.target.closest('.work-button, #scope')) hidePreview(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') hidePreview(); });

function openPage(next, artwork = selected, trigger = document.activeElement) {
  if (!dialog.open) {
    returnY = scrollY; returnFocus = trigger; selected = artwork;
    hidePreview();
    document.body.style.position = 'fixed'; document.body.style.top = `-${returnY}px`;
    document.body.style.width = '100%';
    dialog.showModal();
  }
  page = next; renderDialog();
  dialog.scrollTop = 0;
  $('#dialogTitle').focus({ preventScroll: true });
}
function closeDialog() { dialog.close(); }
dialog.addEventListener('close', () => {
  document.body.style.position = ''; document.body.style.top = ''; document.body.style.width = '';
  window.scrollTo({ top: returnY, behavior: 'instant' });
  previousY = returnY;
  returnFocus?.focus({ preventScroll: true });
  hidePreview(); page = null;
});
$('#closeDialog').addEventListener('click', closeDialog);
$('#stepBack').addEventListener('click', () => {
  const previous = { guide: selected ? 'artwork' : 'about', prices: 'guide', form: 'prices' }[page];
  if (previous) openPage(previous); else closeDialog();
});
dialog.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) closeDialog();
});
function heading(value) { const h = element('h2', '', value); h.id = 'dialogTitle'; h.tabIndex = -1; return h; }
function renderDialog() {
  content.replaceChildren();
  $('#stepBack').textContent = t(page === 'artwork' || page === 'about' || page === 'games' ? '← 返回作品' : '← 上一步', page === 'artwork' || page === 'about' || page === 'games' ? '← Back to works' : '← Previous step');
  if (['guide', 'prices', 'form'].includes(page)) {
    const steps = element('div', 'step-indicator');
    ['guide', 'prices', 'form'].forEach((key, index) => {
      const step = element('span', key === page ? 'current' : '', `${index + 1}. ${t(['委託須知', '價目表', '委託表單'][index], ['Guidelines', 'Pricing', 'Request'][index])}`);
      if (key === page) step.setAttribute('aria-current', 'step'); steps.append(step);
    }); content.append(steps);
  }
  if (page === 'artwork' && selected) {
    const layout = element('div', 'detail-layout');
    const details = element('div');
    details.append(element('div', 'detail-meta', selected.date ?? t('木洛的作品收藏', "Muro's art collection")), heading(title(selected)));
    if (selected.category) details.append(element('p', '', selected.category));
    if (selected.description) details.append(element('p', '', text(selected.description)));
    details.append(element('p', '', t('想委託屬於你的角色？\n先看看委託須知，再挑選適合的方案。', 'A character of your own?\nRead the guidelines, then find your commission type.')), action(t('查看委託須知', 'Read commission guidelines'), () => openPage('guide')));
    layout.append(imageFor(selected, 'detail-art'), details); content.append(layout);
  } else if (page === 'guide') {
    content.append(heading(t('委託須知', 'Commission guidelines')));
    const copy = siteData[1].subs[1].copy;
    if (lang === 'en' && copy.en === 'Coming Soon') content.append(element('p', '', 'Guidelines are currently available in Traditional Chinese. Please review the original terms below before requesting a commission.'));
    content.append(element('p', '', copy.zh), action(t('下一步：價目表', 'Next: pricing'), () => openPage('prices')));
  } else if (page === 'prices') {
    content.append(heading(t('價目表', 'Commission pricing')));
    const table = element('table', 'price-table');
    const head = element('thead'); const row = element('tr');
    [t('委託項目', 'Type'), t('繪製時間', 'Turnaround'), t('非商用價格', 'Personal use')].forEach(value => { const th = element('th', '', value); th.scope = 'col'; row.append(th); }); head.append(row); table.append(head);
    const body = element('tbody');
    plans.forEach(plan => { const row = element('tr'); [plan[lang], text(plan.time), lang === 'en' ? plan.priceEn ?? plan.price : plan.price].forEach(value => row.append(element('td', '', value))); body.append(row); }); table.append(body); content.append(table);
    content.append(element('p', '', t('另有頭像驚喜包 NT$ 400。簡易背景 +NT$ 20；商用與買斷倍率請見委託須知。', 'Surprise avatar pack: NT$ 400. Simple background: +NT$ 20. See guidelines for commercial and buyout rates.')), action(t('下一步：委託表單', 'Next: commission request'), () => openPage('form')));
  } else if (page === 'form') {
    content.append(heading(t('委託表單', 'Commission request')), element('p', '', t('選好方案後，前往委託表單填寫角色與聯絡資料。\n表單會在新分頁開啟，作品瀏覽位置會留在這裡。', 'Choose a type, then enter your character and contact details in the request form.\nThe form opens in a new tab; your place here is saved.')));
    const label = element('label', 'form-label', t('委託方案', 'Commission type')); const select = element('select', 'plan-select');
    label.htmlFor = 'commissionPlan'; select.id = 'commissionPlan';
    plans.forEach(plan => { const option = element('option', '', `${plan[lang]} — ${lang === 'en' ? plan.priceEn ?? plan.price : plan.price}`); option.value = plan.id; select.append(option); }); select.value = selectedPlan;
    content.append(label, select);
    const link = element('a', 'action', t('填寫委託表單 ↗', 'Open request form ↗')); link.target = '_blank'; link.rel = 'noopener noreferrer';
    function updateLink() {
      selectedPlan = select.value;
      const url = new URL('https://docs.google.com/forms/d/e/1FAIpQLScz-wA6XRU7o_87RGlznglArbdHelW0qvfYUtk-48su-KPFqw/viewform');
      url.searchParams.set('usp', 'pp_url'); url.searchParams.set('entry.1679931923', plans.find(plan => plan.id === selectedPlan).value); link.href = url.href;
    }
    select.addEventListener('change', updateLink); updateLink(); content.append(link);
  } else if (page === 'about') {
    const layout = element('div', 'detail-layout'); const img = element('img', 'detail-art'); img.src = './assets/profile/muro-night.png'; img.alt = '木洛 Muro';
    const copy = element('div'); copy.append(heading(t('關於木洛', 'About Muro')), element('p', '', text(siteData[0].subs[0].copy)), action(t('委託須知', 'Commission guidelines'), () => openPage('guide'))); layout.append(img, copy); content.append(layout);
    const socials = element('div', 'dialog-social'); addSocials(socials); content.append(socials);
  } else if (page === 'games') {
    content.append(heading(t('遊戲', 'Games')), element('p', '', text(siteData[2].subs[0].copy)), element('h3', '', text(siteData[0].subs[1].title)), element('p', '', text(siteData[0].subs[1].copy)), element('h3', '', text(siteData[0].subs[2].title)), element('p', '', text(siteData[0].subs[2].copy)));
  }
}
document.querySelectorAll('[data-page]').forEach(button => button.addEventListener('click', () => openPage(button.dataset.page, null, button)));
function addSocials(host) {
  host.replaceChildren();
  socialLinks.forEach(item => { const link = element('a', '', text(item.label)); link.href = item.url; if (!item.url.startsWith('mailto:')) { link.target = '_blank'; link.rel = 'noopener noreferrer'; } host.append(link); });
}
function setLanguage() {
  document.documentElement.lang = lang === 'zh' ? 'zh-TW' : 'en';
  document.title = t('木洛 Muro｜夜空作品室', 'Muro | A little universe');
  document.querySelectorAll('[data-zh]').forEach(node => { node.textContent = node.dataset[lang]; });
  $('#language').textContent = t('語系 中文', 'Language EN');
  $('#language').setAttribute('aria-label', t('Switch to English', '切換繁體中文'));
  addSocials($('#socialLinks')); renderGallery(); hidePreview();
  if (dialog.open) renderDialog();
}
$('#language').addEventListener('click', () => { lang = lang === 'zh' ? 'en' : 'zh'; setLanguage(); });
let previousY = scrollY;
let scrollPending = false;
window.addEventListener('scroll', () => {
  if (dialog.open || scrollPending) return;
  scrollPending = true;
  requestAnimationFrame(() => {
    const y = scrollY;
    if (y < 80 || y < previousY - 3) $('#siteHeader').classList.remove('is-hidden');
    else if (y > 160 && y > previousY + 3) $('#siteHeader').classList.add('is-hidden');
    if (y !== previousY) hidePreview();
    previousY = y; scrollPending = false;
  });
}, { passive: true });
window.addEventListener('resize', () => { hidePreview(); clampEgg(); });

// Keep the existing draggable mascot, including touch and viewport bounds.
const egg = $('#floatingGif'); let drag = null;
function moveEgg(x, y) {
  egg.style.left = `${Math.max(0, Math.min(innerWidth - egg.offsetWidth, x))}px`;
  egg.style.top = `${Math.max(0, Math.min(innerHeight - egg.offsetHeight, y))}px`;
  egg.style.right = 'auto'; egg.style.bottom = 'auto';
}
function clampEgg() { const box = egg.getBoundingClientRect(); moveEgg(box.left, box.top); }
egg.addEventListener('pointerdown', event => { const box = egg.getBoundingClientRect(); drag = { x: event.clientX - box.left, y: event.clientY - box.top }; egg.setPointerCapture(event.pointerId); });
egg.addEventListener('pointermove', event => { if (drag) moveEgg(event.clientX - drag.x, event.clientY - drag.y); });
egg.addEventListener('pointerup', () => { drag = null; }); egg.addEventListener('pointercancel', () => { drag = null; });
egg.addEventListener('dblclick', () => openPage('about', null, egg));
egg.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openPage('about', null, egg); } });

try {
  const response = await fetch('./scripts/data/artwork-catalog.json');
  if (!response.ok) throw new Error('Artwork catalog unavailable');
  artworks = await response.json(); setLanguage();
} catch (error) {
  gallery.replaceChildren(element('p', 'loading', '作品暫時無法載入，請重新整理。 / Please reload to try again.'));
  console.error(error);
}
