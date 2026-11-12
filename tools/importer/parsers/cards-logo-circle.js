/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-logo-circle (www.shopmyexchange.com, template: home).
 * Source: #mt_id_moreways + div.grid > div.banner-tile > a.coverlink > img (6 logos).
 * The "More ways to save" heading (#mt_id_moreways) stays as default content.
 *
 * Template: category (www.shopmyexchange.com/browse?pageCategories=...).
 * Source: #brands > div.lpcategory-container > div.brandtile > (img, p.hidden, a[href])
 *   (6 logos). The link is an empty overlay sibling of the image, not its wrapper,
 *   so the tile's own link is used when the image has no <a> ancestor.
 * Output: one row per logo: [logo image | destination link].
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
  let tiles = Array.from(element.querySelectorAll(':scope > div.banner-tile'));
  if (!tiles.length) tiles = Array.from(element.children).filter((c) => c.querySelector('a img'));
  if (!tiles.length) tiles = Array.from(element.querySelectorAll('a')).filter((a) => a.querySelector('img'));
  // Category brand tiles: image + sibling overlay link.
  if (!tiles.length) tiles = Array.from(element.children).filter((c) => c.querySelector('img'));

  const cells = [];
  tiles.forEach((tile) => {
    const img = tile.querySelector('img');
    if (!img) return;
    const image = document.createElement('img');
    image.src = img.getAttribute('src');
    if (img.getAttribute('alt')) image.alt = img.getAttribute('alt').replace(/\s+/g, ' ').trim();
    const link = img.closest('a') || (tile.matches('a') ? null : tile.querySelector('a[href]'));
    const href = link && link.getAttribute('href');
    if (href && !/^javascript:/i.test(href)) {
      cells.push([image, destinationLink(document, href, image)]);
    } else {
      cells.push([image, '']);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-logo-circle', cells });
  element.replaceWith(block);
}
