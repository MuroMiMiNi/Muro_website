export function mountSocialWave(host, links) {
  for (const [index, item] of links.entries()) {
    const link = document.createElement('a');
    link.className = 'social-wave-link'; link.href = item.url;
    const name = item.id === 'twitter' ? 'Twitter' : item.id === 'facebook' ? 'FB' : item.label.zh;
    link.setAttribute('aria-label', name); link.title = name;
    if (!item.url.startsWith('mailto:')) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
    const image = document.createElement('img');
    image.className = 'social-wave-art'; image.alt = ''; image.width = 32; image.height = 32;
    image.src = new URL(`../assets/social-icons/${item.id}.svg`, import.meta.url).href;
    image.style.setProperty('--wave-delay', `${-index * .38}s`);
    const label = document.createElement('span'); label.className = 'social-wave-name'; label.textContent = name;
    link.append(image, label); host.append(link);
  }
}
