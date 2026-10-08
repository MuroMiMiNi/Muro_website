import { siteData, socialLinks } from './data/siteData.js';
import { buildTimeline } from './hanging-mobile.js';
import { mountMobile } from './mobile-three.js';
import { artworkOrigin, decodeArtwork, enterArtwork } from './artwork-transition.js';
import { createPixelClouds } from './pixel-clouds.js';
import { createPixelMeteors } from './pixel-meteors.js';
import { createPixelMoon } from './pixel-moon.js';
import { createClickStars } from './click-stars.js';
import { mountAllWorks } from './all-works.js';
import { mountSocialWave } from './social-wave.js';

const $ = selector => document.querySelector(selector);
const gallery = $('#mobileGallery');
const dialog = $('#detailDialog');
const content = $('#dialogContent');
let lang = 'zh';
let artworks = [];
let mobileMotion = null;
let page = null;
let selected = null;
let returnFocus = null;
let returnY = 0;
let selectedPlan = 'avatar';
let artworkEntry = null;
let allWorks = [], collection = null, collectionCategory = '全部', collectionLoading = false;
let collectionIntro = true, collectionScroll = 0;
let artworkSource = 'mobile';
let guideOrigin = 'about', collectionFromGuide = false, collectionGuideArtwork = null;
const t = (zh, en) => lang === 'zh' ? zh : en;
const text = value => typeof value === 'string' ? value : value?.[lang] ?? '';
const title = artwork => text(artwork.title);
const profile = { src: './assets/profile/muro-night.png', title: { zh: '木洛 Muro', en: 'Muro' } };
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

// Sparse, distant stars; only a few gently twinkle on staggered CSS cycles.
for (let i = 0; i < 72; i++) {
  const star = element('i', `star${i % 11 === 0 ? ' cross' : ''}`);
  star.style.left = `${(i * 37.71 + 3) % 100}%`;
  star.style.top = `${(i * 23.37 + 7) % 100}%`;
  star.style.setProperty('--opacity', .18 + (i % 5) * .11);
  if (i % 6 === 2) {
    const twinkle = Math.floor(i / 6), depth = twinkle % 3;
    star.classList.add('twinkle');
    star.style.setProperty('--opacity', .12 + depth * .03);
    star.style.setProperty('--twinkle-peak', .28 + depth * .04);
    star.style.setProperty('--star-blur', `${.85 - depth * .15}px`);
    star.style.setProperty('--twinkle-duration', `${22 + (twinkle % 5) * 3}s`);
    star.style.setProperty('--twinkle-delay', `${-twinkle * 7.37}s`);
  }
  $('#stars').append(star);
}
$('#year').textContent = new Date().getFullYear();
mountSocialWave($('#headerSocials'), socialLinks);
createPixelClouds($('#pixelClouds'));
createPixelMoon($('.night-sky'));
createPixelMeteors($('.night-sky'));
createClickStars();
document.addEventListener('visibilitychange', () => {
  $('#pixelClouds').classList.toggle('is-paused', document.hidden);
  $('#stars').classList.toggle('is-paused', document.hidden);
  $('#headerSocials').toggleAttribute('data-paused', document.hidden);
});
async function renderGallery() {
  gallery.replaceChildren();
  const visibleArtworks = buildTimeline(artworks).flatMap(period => period.works).slice(0, 20);
  if (!artworks.length) gallery.append(element('p', 'loading', t('作品整理中，稍後見。', 'More artworks are on their way.')));
  if (artworks.length) mobileMotion = await mountMobile(gallery, visibleArtworks, openArtwork, title);
}
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') artworkEntry?.abort();
});

function openArtwork(artwork, trigger) { return openImagePage('artwork', artwork, trigger); }
async function openCollection(trigger) {
  if (collectionLoading || artworkEntry || (dialog.open && page !== 'guide')) return;
  const fromGuide = dialog.open && page === 'guide', guideArtwork = selected;
  collectionLoading = true; trigger.setAttribute('aria-busy', 'true');
  $('#artworkStatus').textContent = t('正在載入所有作品…', 'Loading all artworks…');
  try {
    const response = await fetch('./scripts/data/all-artwork-catalog.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('All artwork catalog unavailable');
    allWorks = await response.json(); collectionCategory = '全部'; collectionIntro = true; collectionScroll = 0;
    $('#artworkStatus').textContent = '';
    if (fromGuide ? dialog.open && page === 'guide' : !dialog.open) {
      collectionFromGuide = fromGuide; collectionGuideArtwork = guideArtwork;
      openPage('allWorks', null, trigger);
    }
  } catch {
    $('#artworkStatus').textContent = t('所有作品無法載入，請再次點按重試。', 'Could not load artworks. Tap again to retry.');
  } finally {
    collectionLoading = false; trigger.removeAttribute('aria-busy');
  }
}
async function openImagePage(next, artwork, trigger) {
  if (artworkEntry || (dialog.open && page !== 'allWorks')) return;
  if (page === 'allWorks') collectionScroll = dialog.scrollTop;
  artworkSource = page === 'allWorks' ? 'collection' : 'mobile';
  const controller = new AbortController(); artworkEntry = controller;
  const origin = artworkOrigin(trigger);
  trigger.setAttribute('aria-busy', 'true');
  $('#artworkStatus').textContent = t('正在載入圖片…', 'Loading artwork…');
  try {
    const image = imageFor(artwork, 'detail-art');
    await decodeArtwork(image, controller.signal);
    if (controller.signal.aborted) return;
    $('#artworkStatus').textContent = '';
    dialog.classList.add('is-arriving');
    openPage(next, next === 'artwork' ? artwork : null, trigger, image);
    await enterArtwork(dialog, image, origin, controller.signal);
  } catch (error) {
    if (error.name !== 'AbortError') {
      $('#artworkStatus').textContent = t('圖片無法載入，請再次點按重試。', 'Image could not load. Tap again to retry.');
    }
  } finally {
    if ($('#artworkStatus').textContent === t('正在載入圖片…', 'Loading artwork…')) $('#artworkStatus').textContent = '';
    trigger.removeAttribute('aria-busy');
    if (artworkEntry === controller) artworkEntry = null;
  }
}
function openPage(next, artwork = selected, trigger = document.activeElement, preparedImage = null) {
  if (artworkEntry && !preparedImage) return;
  if (next === 'guide' && !['guide', 'prices', 'form', 'allWorks'].includes(page)) guideOrigin = page === 'artwork' ? 'artwork' : page === 'about' ? 'about' : 'mobile';
  if (!dialog.open) {
    returnY = scrollY; returnFocus = trigger;
    document.body.style.position = 'fixed'; document.body.style.top = `-${returnY}px`;
    document.body.style.width = '100%';
    dialog.showModal();
  }
  selected = artwork;
  page = next;
  dialog.classList.toggle('is-artwork', next === 'artwork' || next === 'about');
  dialog.classList.toggle('is-collection', next === 'allWorks');
  renderDialog(preparedImage);
  dialog.scrollTop = next === 'allWorks' ? collectionScroll : 0;
  $('#dialogTitle').focus({ preventScroll: true });
}
function closeDialog() { dialog.close(); }
dialog.addEventListener('close', () => {
  artworkEntry?.abort();
  collection?.destroy(); collection = null;
  document.body.style.removeProperty('--scene');
  document.body.style.position = ''; document.body.style.top = ''; document.body.style.width = '';
  window.scrollTo({ top: returnY, behavior: 'instant' });
  previousY = returnY;
  returnFocus?.focus({ preventScroll: true });
  dialog.classList.remove('is-artwork', 'is-collection'); page = null;
});
$('#closeDialog').addEventListener('click', closeDialog);
$('#stepBack').addEventListener('click', () => {
  const previous = { guide: guideOrigin === 'mobile' ? null : guideOrigin, prices: 'guide', form: 'prices' }[page];
  if (page === 'allWorks' && collectionFromGuide) openPage('guide', collectionGuideArtwork);
  else if (page === 'artwork' && artworkSource === 'collection') openPage('allWorks', null);
  else if (previous) openPage(previous); else closeDialog();
});
dialog.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) closeDialog();
});
function heading(value) { const h = element('h2', '', value); h.id = 'dialogTitle'; h.tabIndex = -1; return h; }
function renderGuidelines(copy) {
  const names = ['委託與付款', '參考圖片', '繪製與展示', '用途與買斷'];
  const groups = copy.split(/\n\/\n/);
  groups.forEach((group, index) => {
    const section = element('section', 'guideline-section');
    const label = element('h3', '', names[index]);
    label.id = `guideline-${index}`; section.setAttribute('aria-labelledby', label.id);
    if (index === 1) {
      const row = element('div', 'guideline-heading');
      const link = element('a', 'guideline-artworks', t('所有作品', 'All works'));
      link.href = '#all-works'; link.setAttribute('aria-haspopup', 'dialog');
      link.addEventListener('click', event => { event.preventDefault(); openCollection(link); });
      row.append(label, link); section.append(row);
    } else section.append(label);
    const lines = group.split('\n').map(line => line.replace(/^[✎♠︎♥︎♦︎♣︎ꕤ]+/u, ''));
    if (index === 3) {
      const list = element('dl', 'usage-prices');
      lines.forEach(line => {
        const [name, value] = line.split(' - ');
        const row = element('div', 'usage-row');
        const term = element('dt', '', name);
        if (name.endsWith('買斷價格')) term.replaceChildren(document.createTextNode(name.slice(0, -4)), element('span', 'usage-term', '買斷價格'));
        row.append(term, element('dd', '', value.replace(/X(\d+)/, ' × $1')));
        list.append(row);
      }); section.append(list);
    } else {
      const list = element('ul', 'guideline-list');
      lines.forEach(line => list.append(element('li', '', line)));
      section.append(list);
    }
    content.append(section);
  });
}
function renderDialog(preparedImage = null) {
  if (collection) { collectionCategory = collection.category; collection.destroy(); collection = null; }
  content.replaceChildren();
  const commission = ['guide', 'prices', 'form'].includes(page);
  $('#stepBack').textContent = t(page === 'artwork' || page === 'about' || page === 'games' ? '← 返回作品' : '← 上一步', page === 'artwork' || page === 'about' || page === 'games' ? '← Back to works' : '← Previous step');
  if (page === 'guide') $('#stepBack').textContent = guideOrigin === 'mobile' ? t('← 返回床鈴', '← Back to mobile') : t(selected ? '← 返回作品' : '← 返回關於', selected ? '← Back to artwork' : '← Back to about');
  if (commission) {
    const steps = element('div', 'step-indicator');
    ['guide', 'prices', 'form'].forEach((key, index) => {
      const step = element('span', key === page ? 'current' : '', `${index + 1}. ${t(['委託須知', '價目表', '委託表單'][index], ['Guidelines', 'Pricing', 'Request'][index])}`);
      if (key === page) step.setAttribute('aria-current', 'step'); steps.append(step);
    }); content.append(steps);
  }
  if (page === 'allWorks') {
    $('#stepBack').textContent = collectionFromGuide ? t('← 返回委託須知', '← Back to guidelines') : t('← 返回床鈴', '← Back to mobile');
    content.append(heading(t('所有作品', 'All works')));
    collection = mountAllWorks(content, allWorks, lang, title, openArtwork, collectionCategory, collectionIntro);
    collectionIntro = false;
  } else if (page === 'artwork' && selected) {
    if (artworkSource === 'collection') $('#stepBack').textContent = t('← 返回所有作品', '← Back to all works');
    const layout = element('div', 'detail-layout');
    const details = element('div', 'details');
    details.append(element('span', 'little-star', '✦'), element('p', 'meta', t('木洛的作品', 'Artwork by Muro')));
    if (selected.date) details.append(element('div', 'detail-meta', selected.date));
    details.append(heading(title(selected)));
    if (selected.category) details.append(element('p', '', selected.category));
    if (selected.description) details.append(element('p', '', text(selected.description)));
    details.append(element('p', '', t('想委託屬於你的角色？\n先看看委託須知，再挑選適合的方案。', 'A character of your own?\nRead the guidelines, then find your commission type.')), action(t('查看委託須知', 'Read commission guidelines'), () => openPage('guide')));
    details.append(artworkSource === 'collection'
      ? action(t('返回所有作品', 'Back to all works'), () => openPage('allWorks', null))
      : action(t('返回床鈴', 'Back to mobile'), closeDialog));
    const artSpace = element('div', 'art-space');
    artSpace.append(preparedImage ?? imageFor(selected, 'detail-art'));
    layout.append(artSpace, details); content.append(layout);
  } else if (page === 'guide') {
    content.append(heading(t('委託須知', 'Commission guidelines')));
    const copy = siteData[1].subs[1].copy;
    if (lang === 'en' && copy.en === 'Coming Soon') content.append(element('p', '', 'Guidelines are currently available in Traditional Chinese. Please review the original terms below before requesting a commission.'));
    renderGuidelines(copy.zh);
    content.append(action(t('下一步：價目表', 'Next: pricing'), () => openPage('prices')));
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
    const layout = element('div', 'detail-layout');
    const artSpace = element('div', 'art-space');
    artSpace.append(preparedImage ?? imageFor(profile, 'detail-art'));
    const copy = element('div', 'details');
    copy.append(element('span', 'little-star', '✦'), heading(t('關於木洛', 'About Muro')), element('p', '', text(siteData[0].subs[0].copy)), action(t('委託須知', 'Commission guidelines'), () => openPage('guide')), action(t('返回床鈴', 'Back to mobile'), closeDialog));
    const socials = element('div', 'dialog-social'); addSocials(socials); copy.append(socials);
    layout.append(artSpace, copy); content.append(layout);
  } else if (page === 'games') {
    content.append(heading(t('遊戲', 'Games')), element('p', '', text(siteData[2].subs[0].copy)), element('h3', '', text(siteData[0].subs[1].title)), element('p', '', text(siteData[0].subs[1].copy)), element('h3', '', text(siteData[0].subs[2].title)), element('p', '', text(siteData[0].subs[2].copy)));
  }
  if (commission) {
    const actions = element('div', 'dialog-actions');
    [...content.children].filter(node => node.classList.contains('action')).forEach(node => actions.append(node));
    content.append(actions);
  }
}
document.querySelectorAll('[data-page]').forEach(button => button.addEventListener('click', () => {
  if (button.matches('.portrait')) openImagePage('about', profile, button);
  else if (button.dataset.page === 'allWorks') openCollection(button);
  else openPage(button.dataset.page, null, button);
}));
function addSocials(host) {
  host.replaceChildren();
  socialLinks.forEach(item => { const link = element('a', '', text(item.label)); link.href = item.url; if (!item.url.startsWith('mailto:')) { link.target = '_blank'; link.rel = 'noopener noreferrer'; } host.append(link); });
}
function setLanguage() {
  document.documentElement.lang = lang === 'zh' ? 'zh-TW' : 'en';
  document.title = t('木洛 Muro', 'Muro');
  document.querySelectorAll('[data-zh]').forEach(node => { node.textContent = node.dataset[lang]; });
  $('#language').textContent = t('EN', '中文');
  $('#language').setAttribute('aria-label', t('Switch to English', '切換繁體中文'));
  addSocials($('#socialLinks')); mobileMotion?.refreshLabels();
  if (dialog.open) renderDialog();
}
$('#language').addEventListener('click', () => { if (artworkEntry) return; lang = lang === 'zh' ? 'en' : 'zh'; setLanguage(); });
let previousY = scrollY;
let scrollPending = false;
window.addEventListener('scroll', () => {
  if (dialog.open || scrollPending) return;
  scrollPending = true;
  requestAnimationFrame(() => {
    const y = scrollY;
    if (y < 80 || y < previousY - 3) $('#siteHeader').classList.remove('is-hidden');
    else if (y > 160 && y > previousY + 3) $('#siteHeader').classList.add('is-hidden');
    previousY = y; scrollPending = false;
  });
}, { passive: true });
window.addEventListener('resize', clampEgg);

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
  artworks = await response.json();
  await renderGallery(); setLanguage();
} catch (error) {
  gallery.replaceChildren(element('p', 'loading', '作品暫時無法載入，請重新整理。 / Please reload to try again.'));
  console.error(error);
}
