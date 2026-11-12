import { createOptimizedPicture } from '../../scripts/aem.js';

function isUrlText(text) {
  return /^(https?:)?\/\//.test(text) || text.startsWith('/');
}

/**
 * Image-only linked card. Content model: [image | destination link]. The picture is
 * wrapped in the destination link; the link text is not shown and becomes the
 * accessible label only when the image has no alt text.
 */
function decorateCard(li) {
  const pic = li.querySelector('picture');
  const link = [...li.querySelectorAll('a[href]')].find((a) => !a.contains(pic)) || null;
  let anchor = pic ? pic.closest('a') : null;

  if (pic && !anchor && link) {
    anchor = link.cloneNode(false);
    anchor.removeAttribute('title');
  }

  const media = document.createElement('div');
  media.className = 'cards-logo-circle-card-image';
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

// Wide logos (width/height at or above this) are rectangular brand tiles, not circles.
const TILE_MIN_RATIO = 2;

/**
 * Category-page brand tiles (source: .lpcategory-container > .brandtile) are wide
 * rectangles laid out 2/4/6 per row with no gap. Round logos (homepage, about 312x330)
 * keep the default grid. Uses the authored `tiles` variant when present, otherwise
 * the first logo's natural size once it loads. The images carry no width/height, so
 * the block has no height until then and switching layout causes no extra shift.
 */
function markTiles(block) {
  const TILES = 'cards-logo-circle-tiles';
  if (block.classList.contains('tiles')) {
    block.classList.add(TILES);
    return;
  }
  const imgs = [...block.querySelectorAll('img')];
  let decided = false;
  const check = (img) => {
    if (decided || !img.naturalWidth || !img.naturalHeight) return;
    decided = true;
    if (img.naturalWidth / img.naturalHeight >= TILE_MIN_RATIO) block.classList.add(TILES);
  };
  imgs.forEach((img) => {
    if (img.complete) check(img);
    else img.addEventListener('load', () => check(img), { once: true });
  });
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    if (!row.querySelector('picture, img, a')) return; // skip empty rows authors leave behind
    const li = document.createElement('li');
    li.className = 'cards-logo-circle-card';
    while (row.firstElementChild) li.append(row.firstElementChild);
    decorateCard(li);
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }]));
  });

  block.replaceChildren(ul);
  markTiles(block);
}
