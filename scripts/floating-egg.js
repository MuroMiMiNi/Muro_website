// Shared draggable mascot egg: same position on every page, a click opens About.
const storageKey = 'muro-egg-position';

export function mountFloatingEgg(egg, onOpen) {
  let drag = null;
  function moveEgg(x, y) {
    egg.style.left = `${Math.max(0, Math.min(innerWidth - egg.offsetWidth, x))}px`;
    egg.style.top = `${Math.max(0, Math.min(innerHeight - egg.offsetHeight, y))}px`;
    egg.style.right = 'auto'; egg.style.bottom = 'auto';
  }
  function clampEgg() { if (egg.style.left) { const box = egg.getBoundingClientRect(); moveEgg(box.left, box.top); } }
  function savePosition() {
    try { sessionStorage.setItem(storageKey, JSON.stringify({ x: egg.offsetLeft / innerWidth, y: egg.offsetTop / innerHeight })); } catch {}
  }
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey));
    if (saved) moveEgg(saved.x * innerWidth, saved.y * innerHeight);
  } catch {}
  egg.addEventListener('pointerdown', event => {
    const box = egg.getBoundingClientRect();
    drag = { x: event.clientX - box.left, y: event.clientY - box.top, startX: event.clientX, startY: event.clientY, moved: false };
    egg.setPointerCapture(event.pointerId);
  });
  egg.addEventListener('pointermove', event => {
    if (!drag) return;
    // A few pixels of movement still counts as a click, so taps are not lost.
    if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 6) return;
    drag.moved = true; moveEgg(event.clientX - drag.x, event.clientY - drag.y);
  });
  egg.addEventListener('pointerup', () => { if (drag?.moved) { egg.dataset.dragged = 'true'; savePosition(); } drag = null; });
  egg.addEventListener('pointercancel', () => { drag = null; });
  egg.addEventListener('click', event => {
    if (egg.dataset.dragged) { delete egg.dataset.dragged; event.preventDefault(); return; }
    onOpen();
  });
  window.addEventListener('resize', clampEgg);
}
