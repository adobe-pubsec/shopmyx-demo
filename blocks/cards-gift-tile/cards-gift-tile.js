import { createOptimizedPicture } from '../../scripts/aem.js';

function isUrlText(text) {
  return /^(https?:)?\/\//.test(text) || text.startsWith('/');
}

/**
 * Gift tile: product photo + label bar. Content model: [image | destination link].
 * The link text is the visible label; the whole card becomes the link.
 */
function decorateCard(li) {
  const pic = li.querySelector('picture');
  const links = [...li.querySelectorAll('a[href]')].filter((a) => !a.contains(pic));
  const link = links.find((a) => a.textContent.trim()) || links[0] || (pic && pic.closest('a')) || null;

  let labelText = link && !link.contains(pic) ? link.textContent.trim() : '';
  if (!labelText) {
    labelText = [...li.children]
      .filter((cell) => !cell.querySelector('picture'))
      .map((cell) => cell.textContent.trim())
      .filter(Boolean)
      .join(' ');
  }
  if (isUrlText(labelText)) labelText = '';

  const target = link ? link.cloneNode(false) : document.createElement('div');
  target.removeAttribute('title');
  target.removeAttribute('class');
  target.className = 'cards-gift-tile-link';

  if (pic) {
    const image = document.createElement('span');
    image.className = 'cards-gift-tile-image';
    image.append(pic);
    target.append(image);
  }

  if (labelText) {
    const label = document.createElement('span');
    label.className = 'cards-gift-tile-label';
    label.textContent = labelText;
    target.append(label);
    // the visible label names the card; keep the photo decorative
    target.querySelectorAll('img').forEach((img) => { img.alt = ''; });
  }

  li.replaceChildren(target);
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('picture, img')) return;
    const li = document.createElement('li');
    li.className = 'cards-gift-tile-card';
    while (row.firstElementChild) li.append(row.firstElementChild);
    decorateCard(li);
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '500' }]));
  });

  block.replaceChildren(ul);
}
