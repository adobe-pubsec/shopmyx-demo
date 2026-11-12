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
  media.className = 'cards-promo-wide-card-image';
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

// Wide strip banners are ~4:1; landing-page banner pairs (e.g. category pages) are ~1.55:1.
const TALL_RATIO = 2;

/**
 * Adds the `tall` modifier once every loaded banner image is narrower than TALL_RATIO:1.
 * Content-derived, so wide-strip instances never get it. Authors can also set it explicitly.
 */
function watchBannerShape(block) {
  if (block.classList.contains('tall')) return;
  const imgs = [...block.querySelectorAll('img')];
  if (!imgs.length) return;
  const update = () => {
    const loaded = imgs.filter((img) => img.complete && img.naturalWidth && img.naturalHeight);
    if (!loaded.length) return;
    const tall = loaded.every((img) => img.naturalWidth / img.naturalHeight < TALL_RATIO);
    block.classList.toggle('tall', tall);
  };
  imgs.forEach((img) => {
    if (!img.complete) img.addEventListener('load', update, { once: true });
  });
  update();
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    if (!row.querySelector('picture, img, a')) return; // skip empty rows authors leave behind
    const li = document.createElement('li');
    li.className = 'cards-promo-wide-card';
    while (row.firstElementChild) li.append(row.firstElementChild);
    decorateCard(li);
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '900' }]));
  });

  block.replaceChildren(ul);
  watchBannerShape(block);
}
