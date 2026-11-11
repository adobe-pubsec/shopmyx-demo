import { createOptimizedPicture } from '../../scripts/aem.js';

function optimizePictures(root) {
  root.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
}

/**
 * Wraps a lone picture in the cell's only link when the image is not already linked,
 * so an author can write "image + link" or a linked image and get the same result.
 */
function linkPicture(cell) {
  const pic = cell.querySelector('picture');
  if (!pic || pic.closest('a')) return;
  const links = [...cell.querySelectorAll('a')];
  if (links.length !== 1) return;
  const [link] = links;
  const label = link.textContent.trim();
  const otherText = cell.textContent.replace(link.textContent, '').trim();
  if (otherText) return;
  const anchor = link.cloneNode(false);
  if (label && !/^(https?:)?\/\//.test(label) && !label.startsWith('/')) {
    anchor.setAttribute('aria-label', label);
  }
  const holder = link.closest('p') || link;
  pic.replaceWith(anchor);
  anchor.append(pic);
  if (holder !== anchor && holder.isConnected) holder.remove();
}

export default function decorate(block) {
  const firstRow = block.firstElementChild;
  if (!firstRow) return;
  const cols = [...firstRow.children];
  block.classList.add(`columns-promo-strip-${cols.length}-cols`);

  [...block.children].forEach((row) => {
    row.classList.add('columns-promo-strip-row');
    [...row.children].forEach((col) => {
      col.classList.add('columns-promo-strip-col');
      linkPicture(col);
      if (col.querySelector('picture') && !col.textContent.trim()) {
        col.classList.add('columns-promo-strip-img-col');
      }
      if (!col.children.length && !col.textContent.trim()) col.classList.add('columns-promo-strip-empty');
    });
  });

  optimizePictures(block);
}
