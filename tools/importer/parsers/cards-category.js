/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-category (www.shopmyexchange.com, template: home).
 * Source: #mt_id_shopbycategory > div.mx-4.mb-5 > div.grid > div.text-center
 *         > a > (img, span label)   (12 categories)
 * The "Shop sale by category" h3 stays as default content (sibling of the instance).
 * Output: one row per category: [icon image | linked label].
 * The block JS wraps icon + label in the label's link, so the icon cell holds only the
 * image (alt = label, since the source icons have no alt).
 */
export default function parse(element, { document, params }) {
  const grid = element.querySelector(':scope > div.grid') || element.querySelector('div.grid') || element;
  let items = Array.from(grid.children).filter((c) => c.querySelector('a[href]'));
  if (!items.length) items = Array.from(element.querySelectorAll('a[href]')).filter((a) => a.querySelector('img'));

  const cells = [];
  items.forEach((item) => {
    const link = item.matches('a') ? item : item.querySelector('a[href]');
    const img = item.querySelector('img');
    const labelEl = item.querySelector('span');
    const label = ((labelEl ? labelEl.textContent : link && link.textContent) || '').replace(/\s+/g, ' ').trim();
    if (!img && !label) return;

    let imageCell = '';
    if (img && img.getAttribute('src')) {
      const image = document.createElement('img');
      image.src = img.getAttribute('src');
      const alt = (img.getAttribute('alt') || '').trim() || label;
      if (alt) image.alt = alt;
      imageCell = image;
    }

    let labelCell = label;
    if (link && link.getAttribute('href')) {
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.textContent = label || link.getAttribute('href');
      labelCell = a;
    }

    cells.push([imageCell, labelCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-category', cells });
  element.replaceWith(block);
}
