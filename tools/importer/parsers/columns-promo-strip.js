/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-promo-strip (www.shopmyexchange.com, template: home).
 * Source: #mt_id_taxfree > div.grid > div (two linked promo images).
 * Output: one row per promo: [image | destination link]; the block lays the
 * promos out side by side.
 */
// Content model shared by every linked-image block: [image | destination link].
// The image cell holds only the image (a DM URL link after the DM transformer);
// the link cell holds the destination, its text describing the image.
function destinationLink(document, href, image) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = (image.alt || '').trim() || href;
  return a;
}

export default function parse(element, { document, params }) {
  const grid = element.querySelector(':scope > div.grid') || element;
  let items = Array.from(grid.children).filter((child) => child.querySelector('img'));
  if (!items.length) items = Array.from(element.querySelectorAll('a')).filter((a) => a.querySelector('img'));

  const cells = [];
  items.forEach((item) => {
    const link = item.matches('a') ? item : item.querySelector('a');
    const img = item.querySelector('img');
    if (!img) return;
    const image = document.createElement('img');
    image.src = img.getAttribute('src');
    if (img.getAttribute('alt')) image.alt = img.getAttribute('alt');
    const href = link && link.contains(img) && link.getAttribute('href');
    cells.push(href ? [image, destinationLink(document, href, image)] : [image, '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-promo-strip', cells });
  element.replaceWith(block);
}
