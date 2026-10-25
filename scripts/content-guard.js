// Deters casual copying of the artwork and writing: right-click / long-press menus, dragging,
// selecting and copying are blocked everywhere except form fields visitors need to type in.
// A browser must download a page to show it, so this cannot stop screenshots or developer tools.
const editable = 'input,textarea,select,[contenteditable=""],[contenteditable="true"]';

function inField(target) {
  return target instanceof Element && Boolean(target.closest(editable));
}

export function guardContent(root = document) {
  for (const type of ['contextmenu', 'dragstart', 'selectstart', 'copy', 'cut']) {
    root.addEventListener(type, event => { if (!inField(event.target)) event.preventDefault(); }, { capture: true });
  }
  // Mark images as non-draggable as they appear, for browsers that ignore the CSS rule.
  const lock = node => {
    if (!(node instanceof Element)) return;
    for (const image of node.matches('img') ? [node] : node.querySelectorAll('img')) image.draggable = false;
  };
  lock(document.body);
  new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(lock))).observe(document.body, { childList: true, subtree: true });
}
