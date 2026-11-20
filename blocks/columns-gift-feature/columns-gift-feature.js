import { createOptimizedPicture } from '../../scripts/aem.js';

function isUrlText(text) {
  return /^(https?:)?\/\//.test(text) || text.startsWith('/');
}

const HEADING = 'h1, h2, h3, h4, h5, h6';

/**
 * Tile cell (image + link): the whole tile is the link, the link text is the label bar.
 */
function decorateTile(cell) {
  const pic = cell.querySelector('picture');
  const links = [...cell.querySelectorAll('a[href]')].filter((a) => !a.contains(pic));
  const link = links.find((a) => a.textContent.trim()) || links[0] || (pic && pic.closest('a')) || null;
  let labelText = link && !link.contains(pic) ? link.textContent.trim() : '';
  if (!labelText) labelText = cell.textContent.trim();
  if (isUrlText(labelText)) labelText = '';

  const target = link ? link.cloneNode(false) : document.createElement('div');
  target.removeAttribute('title');
  target.removeAttribute('class');
  target.className = 'columns-gift-feature-tile-link';

  if (pic) {
    const image = document.createElement('span');
    image.className = 'columns-gift-feature-tile-image';
    image.append(pic);
    target.append(image);
  }
  if (labelText) {
    const label = document.createElement('span');
    label.className = 'columns-gift-feature-tile-label';
    label.textContent = labelText;
    target.append(label);
    target.querySelectorAll('img').forEach((img) => { img.alt = ''; });
  }

  cell.className = 'columns-gift-feature-tile';
  cell.replaceChildren(target);
}

/**
 * Feature cell (heading): display headline, script subtitle, image underneath.
 */
function decorateFeature(cell) {
  cell.className = 'columns-gift-feature-feature';
  const heading = cell.querySelector(HEADING);
  heading.classList.add('columns-gift-feature-title');

  const pics = [...cell.querySelectorAll('picture')];
  const media = document.createElement('div');
  media.className = 'columns-gift-feature-media';
  pics.forEach((pic) => {
    const holder = pic.parentElement;
    media.append(pic);
    const empty = holder && !holder.textContent.trim() && !holder.children.length;
    if (empty && holder !== cell) holder.remove();
  });

  cell.querySelectorAll('p').forEach((p) => {
    if (p.textContent.trim() && !p.querySelector('a[href]')) p.classList.add('columns-gift-feature-subtitle');
  });
  if (media.children.length) cell.append(media);
}

export default function decorate(block) {
  const row = [...block.children].find((r) => r.textContent.trim() || r.querySelector('picture')) || null;
  if (!row) return;
  const cells = [...row.children].filter((c) => c.textContent.trim() || c.querySelector('picture'));

  cells.forEach((cell) => {
    if (cell.querySelector(HEADING)) {
      decorateFeature(cell);
    } else if (cell.querySelector('picture') || cell.querySelector('a[href]')) {
      decorateTile(cell);
    } else {
      cell.className = 'columns-gift-feature-text';
    }
  });

  const grid = document.createElement('div');
  grid.className = 'columns-gift-feature-row';
  grid.append(...cells);
  block.replaceChildren(grid);
  block.classList.add(`columns-gift-feature-${cells.length}-cols`);

  block.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
}
