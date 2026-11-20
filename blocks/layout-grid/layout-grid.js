import { toClassName } from '../../scripts/aem.js';

const LAYOUTS = [
  'two-columns',
  'three-columns',
  'four-columns',
  'feature-left',
  'feature-right',
  'wide-left',
  'wide-right',
];

export default function decorate(block) {
  const rows = [...block.children];
  const options = rows[0];
  if (options && !options.querySelector('picture, img')) {
    const value = [...options.children]
      .map((cell) => cell.textContent.trim()).filter(Boolean).pop();
    const layout = toClassName(value || '');
    if (!LAYOUTS.some((variant) => block.classList.contains(variant))) {
      block.classList.add(LAYOUTS.includes(layout) ? layout : 'three-columns');
    }
    rows.shift();
  }

  const list = document.createElement('ul');

  rows.forEach((row) => {
    const image = row.querySelector('picture, img');
    if (!image) return;

    const imageLink = image.closest('a[href]');
    const destination = imageLink || row.querySelector('a[href]');
    const tile = document.createElement('li');
    tile.className = 'layout-grid-tile';

    if (destination) {
      const link = destination.cloneNode(false);
      link.classList.remove('button', 'primary', 'secondary');
      const label = destination.textContent.trim();
      const img = image.matches('img') ? image : image.querySelector('img');
      if (!img?.alt && !link.hasAttribute('aria-label') && label && !/^(https?:|\/)/i.test(label)) {
        link.setAttribute('aria-label', label);
      }
      link.append(image);
      tile.append(link);
    } else {
      tile.append(image);
    }

    list.append(tile);
  });

  block.replaceChildren(list);
}
