/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-logo-circle (www.shopmyexchange.com, template: home).
 * Source: #mt_id_moreways + div.grid > div.banner-tile > a.coverlink > img (6 logos).
 * The "More ways to save" heading (#mt_id_moreways) stays as default content.
 * Output: one row per logo: [linked logo image | (empty link cell)].
 */
export default function parse(element, { document, params }) {
  let tiles = Array.from(element.querySelectorAll(':scope > div.banner-tile'));
  if (!tiles.length) tiles = Array.from(element.children).filter((c) => c.querySelector('a img'));
  if (!tiles.length) tiles = Array.from(element.querySelectorAll('a')).filter((a) => a.querySelector('img'));

  const cells = [];
  tiles.forEach((tile) => {
    const img = tile.querySelector('img');
    if (!img) return;
    const image = document.createElement('img');
    image.src = img.getAttribute('src');
    if (img.getAttribute('alt')) image.alt = img.getAttribute('alt').replace(/\s+/g, ' ').trim();
    const link = img.closest('a');
    const href = link && link.getAttribute('href');
    if (href && !/^javascript:/i.test(href)) {
      const a = document.createElement('a');
      a.href = href;
      a.append(image);
      cells.push([a, '']);
    } else {
      cells.push([image, '']);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-logo-circle', cells });
  element.replaceWith(block);
}
