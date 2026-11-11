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
 * Output: one row per card: [linked image | (empty link cell)].
 */

const MERGED_ATTR = 'data-cards-promo-wide-merged';

function findMergePartner(element) {
  const prev = element.previousElementSibling;
  if (!prev || prev.id !== 'mt_id_hp9') return null;
  const doc = element.ownerDocument;
  const partner = doc.querySelector('#mt_id_hp10 + div.grid');
  return partner && partner !== element ? partner : null;
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

function buildRow(card, document) {
  const img = card.querySelector('img');
  if (!img) return null;
  const link = img.closest('a');
  const image = document.createElement('img');
  image.src = img.getAttribute('src');
  if (img.getAttribute('alt')) image.alt = img.getAttribute('alt').replace(/\s+/g, ' ').trim();
  if (link && link.getAttribute('href')) {
    const a = document.createElement('a');
    a.href = link.getAttribute('href');
    a.append(image);
    return [a, ''];
  }
  return [image, ''];
}

export default function parse(element, { document, params }) {
  if (element.hasAttribute(MERGED_ATTR)) {
    // Already merged into the previous "Discover More" block.
    element.remove();
    return;
  }

  const sources = [element];
  const partner = findMergePartner(element);
  if (partner) sources.push(partner);

  const cells = [];
  sources.forEach((src) => {
    collectCards(src).forEach((card) => {
      const row = buildRow(card, document);
      if (row) cells.push(row);
    });
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-promo-wide', cells });
  element.replaceWith(block);

  if (partner) {
    partner.setAttribute(MERGED_ATTR, '');
    partner.remove();
  }
}
