import { createOptimizedPicture } from '../../scripts/aem.js';

function isUrlText(text) {
  return /^(https?:)?\/\//.test(text) || text.startsWith('/');
}

/**
 * Image-only linked card: the picture becomes the link. Accepts an already linked image,
 * or an image plus a link in either cell. Link text (when not a bare URL) becomes the
 * accessible label; it is not shown.
 */
function decorateCard(li) {
  const pic = li.querySelector('picture');
  const link = [...li.querySelectorAll('a[href]')].find((a) => !a.contains(pic)) || null;
  let anchor = pic ? pic.closest('a') : null;

  if (pic && !anchor && link) {
    anchor = link.cloneNode(false);
    const label = link.textContent.trim();
    if (label && !isUrlText(label)) anchor.setAttribute('aria-label', label);
  }

  const media = document.createElement('div');
  media.className = 'cards-promo-bento-card-image';
  if (pic) {
    if (anchor) {
      if (!anchor.contains(pic)) anchor.append(pic);
      media.append(anchor);
    } else {
      media.append(pic);
    }
  }

  if (anchor && !anchor.getAttribute('aria-label')) {
    const img = anchor.querySelector('img');
    if (!img || !img.alt) {
      const label = link ? link.textContent.trim() : '';
      if (label && !isUrlText(label)) anchor.setAttribute('aria-label', label);
    }
  }

  li.replaceChildren();
  if (pic) li.append(media);
  else if (link) li.append(link);
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    if (!row.querySelector('picture, img, a')) return; // skip empty rows authors leave behind
    const li = document.createElement('li');
    li.className = 'cards-promo-bento-card';
    while (row.firstElementChild) li.append(row.firstElementChild);
    decorateCard(li);
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });

  block.replaceChildren(ul);
}
