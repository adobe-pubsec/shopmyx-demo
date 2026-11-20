/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-gift-feature (www.shopmyexchange.com, template: gift-guide).
 * Instance: section.bg-holidaygiftguide div.lpcategory-container with the
 * "gift-tabs-" assets, shown side by side: toy book tile | "Find the perfect
 * gift" art | gift guide tile.
 *
 * Columns convention: one row, one cell per visual column. The copy is baked
 * into the art; the page is migrated as editable blocks (user request):
 *  - tile cell:    cover image cropped above its label bar (bar starts at y=403
 *                  of 334x452) + destination link whose text is the label
 *  - feature cell: heading + subtitle (read from the art) + cropped gift box
 * Unknown assets become an image cell (+ link when the source has one).
 */

const CELLS = {
  'LP-gift-guide-2026-gift-tabs-toys01': {
    type: 'tile',
    label: 'Shop Toy Book',
    art: { crop: '0,0,334,403', alt: 'Toys for the holidays toy book cover' },
  },
  'LP-gift-guide-2026-gift-tabs-joyful-gifting01': {
    type: 'tile',
    label: 'Shop Gift Guide',
    art: { crop: '0,0,334,403', alt: 'Joyful Gifting gift guide cover' },
  },
  'LP-gift-guide-2026-gift-tabs-find-the-perfect-gift01': {
    type: 'feature',
    heading: 'Find The Perfect Gift',
    subtitle: 'for everyone who is naughty & nice',
    art: { crop: '262,282,218,170', alt: 'Wrapped gift box' },
  },
};

function assetName(src) {
  return decodeURIComponent(((src || '').split('?')[0].split('/').pop()) || '');
}

function para(document, child) {
  const p = document.createElement('p');
  p.append(child);
  return p;
}

function image(document, src, alt) {
  const img = document.createElement('img');
  img.setAttribute('src', src);
  img.setAttribute('alt', alt || '');
  return img;
}

function link(document, href, text) {
  const a = document.createElement('a');
  a.setAttribute('href', href);
  a.textContent = text;
  return a;
}

export default function parse(element, { document }) {
  const row = [];
  [...element.children].forEach((col) => {
    const img = col.querySelector('img');
    if (!img) return;
    const src = img.getAttribute('src');
    const base = src.split('?')[0];
    const dest = [...col.querySelectorAll('a[href]')]
      .find((a) => !/^javascript:/i.test(a.getAttribute('href')));
    const href = dest ? dest.getAttribute('href') : null;
    const entry = CELLS[assetName(src)];
    const cell = [];
    if (entry && entry.type === 'feature') {
      const h2 = document.createElement('h2');
      h2.textContent = entry.heading;
      cell.push(h2);
      if (entry.subtitle) {
        const p = document.createElement('p');
        p.textContent = entry.subtitle;
        cell.push(p);
      }
      cell.push(para(document, image(document, `${base}?crop=${entry.art.crop}`, entry.art.alt)));
      if (href) cell.push(para(document, link(document, href, entry.heading)));
    } else if (entry) {
      cell.push(para(document, image(document, `${base}?crop=${entry.art.crop}`, entry.art.alt)));
      if (href) cell.push(para(document, link(document, href, entry.label)));
    } else {
      const alt = (img.getAttribute('alt') || '').replace(/\s+/g, ' ').trim();
      cell.push(para(document, image(document, src, alt)));
      if (href) cell.push(para(document, link(document, href, alt || href)));
    }
    row.push(cell);
  });
  if (!row.length) return;
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-gift-feature', cells: [row] });
  element.replaceWith(block);
}
