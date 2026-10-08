import { socialLinks } from '../../scripts/data/siteData.js';
import { mountSocialWave } from './social-wave.js';

const rows = [document.querySelector('#cornerWave'), document.querySelector('#largeWave')];
rows.forEach(row => mountSocialWave(row, socialLinks));
let paused = false;
function updatePause() {
  rows.forEach(row => row.toggleAttribute('data-paused', paused || document.hidden));
}
const button = document.querySelector('#pauseWave');
button.addEventListener('click', () => {
  paused = !paused; updatePause();
  button.setAttribute('aria-pressed', String(paused));
  button.textContent = paused ? '繼續擺動' : '暫停擺動';
});
document.addEventListener('visibilitychange', updatePause);
