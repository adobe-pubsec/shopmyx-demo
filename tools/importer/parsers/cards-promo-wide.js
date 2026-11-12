/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-promo-wide (www.shopmyexchange.com, template: home).
 * Instances:
 *  - #mt_id_hp2            -> div.grid > div.gtm-aafes-promo > a > img (2 cards, standalone)
 *  - #mt_id_hp9 + div.grid -> div > a.coverlink > img (2 cards)
 *  - #mt_id_hp10 + div.grid -> div > a.coverlink > img (2 cards)
 * The hp9 and hp10 grids are one visual "Discover More" group, so the hp9 parse
 * merges the hp10 grid into a single block of 4 cards and removes the hp10 grid.
 *
 * Template: deals (www.shopmyexchange.com/deals).
 * Instance:
 *  - div.banner-container.md:w-1/2 -> a.banner-link > img (desktop, with alt) + img (mobile dup)
 *    The selector matches TWO sibling half-width containers (Home Depot, 60% Clearance) that
 *    form one 2-up row, so the first parse merges the following matching siblings into one
 *    block of 2 cards and removes them; the second instance is skipped if it is still attached.
 * Output: one row per card: [image | destination link].
 */

const MERGED_ATTR = 'data-cards-promo-wide-merged';
const HALF_BANNER = 'div.banner-container.md\\:w-1\\/2';

function findMergePartners(element) {
  // Homepage: the #mt_id_hp9 grid absorbs the #mt_id_hp10 grid.
  const prev = element.previousElementSibling;
  if (prev && prev.id === 'mt_id_hp9') {
    const partner = element.ownerDocument.querySelector('#mt_id_hp10 + div.grid');
    return partner && partner !== element ? [partner] : [];
  }
  // Deals: consecutive half-width banner containers form one row.
  if (element.matches(HALF_BANNER)) {
    const partners = [];
    let next = element.nextElementSibling;
    while (next && next.matches(HALF_BANNER) && !next.hasAttribute(MERGED_ATTR)) {
      partners.push(next);
      next = next.nextElementSibling;
    }
    return partners;
  }
  return [];
}

function collectCards(root) {
  // Each card is a direct child of the grid containing a linked image.
  // Fallback: the grid may be one level down (#mt_id_hp2 > div.grid).
  let grid = root;
  if (!Array.from(grid.children).some((c) => c.querySelector(':scope > a img, :scope > a > img'))) {
    grid = root.querySelector(':scope > div.grid') || root;
  }
  let cards = Array.from(grid.children).filter((c) => c.querySelector('a img'));
  if (!cards.length) {
    cards = Array.from(root.querySelectorAll('a')).filter((a) => a.querySelector('img'));
  }
  return cards;
}

// Content model shared by every linked-image block: [image | destination link].
// The image cell holds only the image (a DM URL link after the DM transformer);
// the link cell holds the destination, its text describing the image.
function destinationLink(document, href, image) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = (image.alt || '').trim() || href;
  return a;
}

function buildRow(card, document) {
  const img = card.querySelector('img');
  if (!img) return null;
  const link = img.closest('a');
  const image = document.createElement('img');
  image.src = img.getAttribute('src');
  if (img.getAttribute('alt')) image.alt = img.getAttribute('alt').replace(/\s+/g, ' ').trim();
  if (link && link.getAttribute('href')) {
    return [image, destinationLink(document, link.getAttribute('href'), image)];
  }
  return [image, ''];
}

export default function parse(element, { document, params }) {
  if (element.hasAttribute(MERGED_ATTR)) {
    // Already merged into the previous "Discover More" block.
    element.remove();
    return;
  }

  const partners = findMergePartners(element);
  const sources = [element, ...partners];

  const cells = [];
  sources.forEach((src) => {
    collectCards(src).forEach((card) => {
      const row = buildRow(card, document);
      if (row) cells.push(row);
    });
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-promo-wide', cells });
  element.replaceWith(block);

  partners.forEach((partner) => {
    partner.setAttribute(MERGED_ATTR, '');
    partner.remove();
  });
}
