import { createOptimizedPicture } from '../../scripts/aem.js';

function hasText(el) {
  return el.textContent.trim().length > 0;
}

// a cell is an image cell when it holds a picture and no other text
function isImageCell(cell) {
  return !!cell.querySelector('picture') && !hasText(cell);
}

function stripButton(a) {
  a.classList.remove('button', 'primary', 'secondary', 'accent');
  if (!a.classList.length) a.removeAttribute('class');
  const p = a.closest('.button-wrapper, .button-container');
  if (p) p.classList.remove('button-wrapper', 'button-container');
}

/**
 * Editable promo banner. Content model:
 *  Row 1: [core image | heading + subtitle (+ optional link)]
 *  Row 2 (optional): [decorative full-width border image]
 * A link in the text makes the whole banner clickable (stretched over the banner).
 * Cells are detected by content, so order and extra/missing cells are tolerated.
 */
export default function decorate(block) {
  const rows = [...block.children];
  const mainRow = rows.find((row) => hasText(row)) || null;

  const inner = document.createElement('div');
  inner.className = 'promo-banner-inner';
  const content = document.createElement('div');
  content.className = 'promo-banner-content';
  const media = document.createElement('div');
  media.className = 'promo-banner-media';

  if (mainRow) {
    [...mainRow.children].forEach((cell) => {
      if (isImageCell(cell)) {
        cell.querySelectorAll('picture').forEach((pic) => media.append(pic));
      } else if (hasText(cell)) {
        while (cell.firstChild) content.append(cell.firstChild);
      }
    });
  }

  // headings may be authored as plain paragraphs: first line becomes the title
  if (!content.querySelector('h1, h2, h3, h4, h5, h6')) {
    const first = content.querySelector('p');
    if (first && !first.querySelector('a')) {
      const h = document.createElement('h2');
      h.innerHTML = first.innerHTML;
      first.replaceWith(h);
    }
  }
  content.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h, i) => {
    if (i === 0) h.classList.add('promo-banner-title');
  });
  const title = content.querySelector('.promo-banner-title');
  content.querySelectorAll('p').forEach((p) => {
    const a = p.querySelector('a[href]');
    if (a && p.textContent.trim() === a.textContent.trim()) {
      p.classList.add('promo-banner-cta');
    } else if (title && hasText(p) && !p.querySelector('picture')) {
      p.classList.add('promo-banner-subtitle');
    }
  });

  // pictures authored inside the text cell move to the media column
  content.querySelectorAll('picture').forEach((pic) => {
    const holder = pic.parentElement;
    media.append(pic);
    const empty = holder && !hasText(holder) && !holder.children.length;
    if (empty && holder !== content) holder.remove();
  });

  const cta = content.querySelector('a[href]');
  if (cta) {
    stripButton(cta);
    cta.classList.add('promo-banner-link');
    block.classList.add('promo-banner-clickable');
  }

  if (hasText(content)) inner.append(content);
  if (media.children.length) inner.append(media);

  // any picture-only row other than the main row is the decorative border strip
  const border = document.createElement('div');
  border.className = 'promo-banner-border';
  rows.filter((row) => row !== mainRow && !hasText(row)).forEach((row) => {
    row.querySelectorAll('picture').forEach((pic) => border.append(pic));
  });

  const out = [inner];
  if (border.children.length) out.push(border);
  block.replaceChildren(...out);

  block.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
  // the H1 banner is the page hero (no rounding, larger type)
  if (block.querySelector('h1')) block.classList.add('promo-banner-hero');
}
