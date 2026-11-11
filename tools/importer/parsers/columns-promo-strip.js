/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-promo-strip (www.shopmyexchange.com, template: home).
 * Source: #mt_id_taxfree > div.grid > div (two linked promo images).
 * Output: one row, one column per linked image: [linked img | linked img].
 */
export default function parse(element, { document, params }) {
  const grid = element.querySelector(':scope > div.grid') || element;
  let items = Array.from(grid.children).filter((child) => child.querySelector('img'));
  if (!items.length) items = Array.from(element.querySelectorAll('a')).filter((a) => a.querySelector('img'));

  const row = items.map((item) => {
    const link = item.matches('a') ? item : item.querySelector('a');
    const img = item.querySelector('img');
    if (link && img && link.contains(img)) {
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      const image = document.createElement('img');
      image.src = img.getAttribute('src');
      if (img.getAttribute('alt')) image.alt = img.getAttribute('alt');
      a.append(image);
      return a;
    }
    return img || '';
  });

  const cells = row.length ? [row] : [];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-promo-strip', cells });
  element.replaceWith(block);
}
