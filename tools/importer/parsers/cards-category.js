/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-category (www.shopmyexchange.com, template: home).
 * Source: #mt_id_shopbycategory > div.mx-4.mb-5 > div.grid > div.text-center
 *         > a > (img, span label)   (12 categories)
 * The "Shop sale by category" h3 stays as default content (sibling of the instance).
 *
 * Template: deals (www.shopmyexchange.com/deals). Same item pattern, the instance IS the grid:
 *  - div.cat-container:not(#mt-deals) -> div.cat-box > a.banner-link > (img, span label)  (5 WOW deals)
 *  - #mt-deals                         -> div.cat-box > a.banner-link > (img, span label)  (50 deals)
 *  - #mt_id_shopbycategory > div.mx-4.mb-5 -> as on the homepage (12 categories)
 *  The label span holds an empty chevron span; textContent drops it. Labels are lowercase in the
 *  source and uppercased by CSS. The WOW DEALS / ALL WEEK DEALS h2s stay as default content.
 *
 * Template: category (www.shopmyexchange.com/browse?pageCategories=...). No div.grid; the
 * instance's direct children are the tiles, each with img + p label + an empty overlay <a>
 * sibling (not wrapping the image):
 *  - #category > div.lpcategory-container    -> div.categorytile > (img, p label, a)   (10)
 *  - #sizecharts:not(.hidden) > div.guide-container -> div.guidetile > (img,
 *    p label + span.exchevron "5" chevron glyph, a)  (2 guides). The chevron is dropped.
 * Output: one row per category: [icon image | linked label].
 * The block JS wraps icon + label in the label's link, so the icon cell holds only the
 * image (alt = label, since the source icons have no alt).
 */
// Category tiles carry their label in a <p> (guide tiles append a chevron icon-font glyph
// span.exchevron "5"); home/deals tiles have no <p>, so they fall through to the span logic.
function paragraphLabel(item, clean) {
  return [...item.querySelectorAll('p')].map((p) => {
    const copy = p.cloneNode(true);
    copy.querySelectorAll('.exchevron').forEach((s) => s.remove());
    return clean(copy.textContent);
  }).find(Boolean) || '';
}

export default function parse(element, { document, params }) {
  const grid = element.querySelector(':scope > div.grid') || element.querySelector('div.grid') || element;
  let items = Array.from(grid.children).filter((c) => c.querySelector('a[href]'));
  if (!items.length) items = Array.from(element.querySelectorAll('a[href]')).filter((a) => a.querySelector('img'));
  // Category tiles whose (empty, overlay) link was dropped: keep the image + label unlinked.
  if (!items.length) items = Array.from(grid.children).filter((c) => c.querySelector('img'));

  const cells = [];
  items.forEach((item) => {
    const link = item.matches('a') ? item : item.querySelector('a[href]');
    const img = item.querySelector('img');
    // label: first span with text (the live deals tiles can carry other spans), then the
    // link text, then the image alt (deal tiles repeat their label in the alt)
    const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();
    const labelEl = [...item.querySelectorAll('span')].find((s) => clean(s.textContent));
    const label = paragraphLabel(item, clean)
      || clean(labelEl && labelEl.textContent)
      || clean(link && link.textContent)
      || clean(img && img.getAttribute('alt'));
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

  // Category panels that hide tiles behind "See More" (flagged by the cleanup
  // transformer) keep that behavior as the authored `see-more` option.
  const name = element.hasAttribute('data-see-more') ? 'cards-category (see-more)' : 'cards-category';
  const block = WebImporter.Blocks.createBlock(document, { name, cells });
  element.replaceWith(block);
}
