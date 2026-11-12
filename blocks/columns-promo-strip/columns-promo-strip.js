import { createOptimizedPicture } from '../../scripts/aem.js';

function optimizePictures(root) {
  root.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
}

function isUrlText(text) {
  return /^(https?:)?\/\//.test(text) || text.startsWith('/');
}

/**
 * Content model: one row per promo, [image | destination link]. The rows become the
 * columns of a single row, each holding the picture wrapped in its destination link,
 * so the promos sit side by side. The link text is the accessible label only when the
 * image has no alt text. Rows that don't follow the model are left untouched.
 */
function promoRowsToColumns(block) {
  const promos = [...block.children].map((row) => {
    const [imageCell, linkCell, ...rest] = [...row.children];
    const pic = imageCell && imageCell.querySelector('picture');
    if (!pic || rest.length || imageCell.textContent.trim()) return null;
    const links = linkCell ? [...linkCell.querySelectorAll('a[href]')] : [];
    if (linkCell && (links.length > 1 || linkCell.querySelector('picture, img'))) return null;
    if (links.length && linkCell.textContent.trim() !== links[0].textContent.trim()) return null;
    const col = document.createElement('div');
    if (links.length) {
      const anchor = links[0].cloneNode(false);
      anchor.removeAttribute('title');
      const label = links[0].textContent.trim();
      const hasAlt = Boolean(pic.querySelector('img')?.alt);
      if (!hasAlt && label && !isUrlText(label)) anchor.setAttribute('aria-label', label);
      anchor.append(pic);
      const p = document.createElement('p');
      p.append(anchor);
      col.append(p);
    } else {
      col.append(pic);
    }
    return col;
  });
  if (!promos.length || promos.some((p) => !p)) return;
  const row = document.createElement('div');
  row.append(...promos);
  block.replaceChildren(row);
}

export default function decorate(block) {
  promoRowsToColumns(block);
  const firstRow = block.firstElementChild;
  if (!firstRow) return;
  const cols = [...firstRow.children];
  block.classList.add(`columns-promo-strip-${cols.length}-cols`);

  [...block.children].forEach((row) => {
    row.classList.add('columns-promo-strip-row');
    [...row.children].forEach((col) => {
      col.classList.add('columns-promo-strip-col');
      if (col.querySelector('picture') && !col.textContent.trim()) {
        col.classList.add('columns-promo-strip-img-col');
      }
      if (!col.children.length && !col.textContent.trim()) col.classList.add('columns-promo-strip-empty');
    });
  });

  optimizePictures(block);
}
