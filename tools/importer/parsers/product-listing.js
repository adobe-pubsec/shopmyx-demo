/* eslint-disable */
/* global WebImporter */

/**
 * Parser for product-listing (www.shopmyexchange.com, template: category).
 * Source: main > div.w-full:has(#product-list-container) — the live search listing
 *   (item count, filters, APO/FPO toggle, sort, view, 36 product cards with in-grid ad
 *   tiles). The products come from the store's search system and are NOT imported.
 * Output: one row: [Category | <store category path>], e.g. "Electronics > Computers",
 *   taken from the page's pageCategories parameter. The block renders a "Shop all ..."
 *   link to the live listing until it is connected to the search system.
 */
function categoryPath(url) {
  try {
    const raw = new URL(url).searchParams.get('pageCategories') || '';
    return raw.split('>').map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean).join(' > ');
  } catch (e) {
    return '';
  }
}

export default function parse(element, { document, params }) {
  const path = categoryPath(params.originalURL);
  if (!path) {
    element.remove();
    return;
  }
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'product-listing',
    cells: [['Category', path]],
  });
  element.replaceWith(block);
}
