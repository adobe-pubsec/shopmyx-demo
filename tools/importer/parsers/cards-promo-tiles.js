/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-promo-tiles (www.shopmyexchange.com, template: home).
 * Instances:
 *  - #mt_id_hp3              (4 tiles, standalone)
 *  - #mt_id_hp6 > div.grid   (4 luxury tiles)
 *  - #mt_id_hp7 > div.grid   (4 luxury tiles, continuation of hp6, no heading)
 *  - #mt_id_hp8              (4 tiles, standalone)
 * Tiles: div.grid > div.grid > div > a.coverlinkTile > img. The hidden w-0/h-0
 * tracking pixel tile is skipped. The hp6 + hp7 grids are one visual group, so the
 * hp6 parse merges the hp7 grid into one block of 8 tiles (the block renders a flat
 * 4-per-row grid) and removes the hp7 grid.
 * Output: one row per tile: [linked image | (empty link cell)].
 */

const MERGED_ATTR = 'data-cards-promo-tiles-merged';

function findMergePartner(element) {
  const parent = element.parentElement;
  if (!parent || parent.id !== 'mt_id_hp6') return null;
  const partner = element.ownerDocument.querySelector('#mt_id_hp7 > div.grid');
  return partner && partner !== element ? partner : null;
}

function isTrackingPixel(node) {
  if (node.closest('.hidden, .w-0')) return true;
  const img = node.querySelector('img');
  const src = (img && img.getAttribute('src')) || '';
  return /long-transparent/i.test(src);
}

function collectTiles(root) {
  // Inner grid holding the tile divs (a.coverlinkTile > img).
  const grid = root.querySelector('div.grid.gap-4') || root.querySelector('div.grid div.grid') || root;
  let tiles = Array.from(grid.children).filter((c) => c.querySelector('a img') && !isTrackingPixel(c));
  if (!tiles.length) {
    tiles = Array.from(root.querySelectorAll('a.coverlinkTile, a'))
      .filter((a) => a.querySelector('img') && !isTrackingPixel(a));
  }
  return tiles;
}

function buildRow(tile, document) {
  const img = tile.querySelector('img');
  if (!img) return null;
  const link = img.closest('a');
  const image = document.createElement('img');
  image.src = img.getAttribute('src');
  if (img.getAttribute('alt')) image.alt = img.getAttribute('alt').replace(/\s+/g, ' ').trim();
  const href = link && link.getAttribute('href');
  if (href && !/^javascript:/i.test(href)) {
    const a = document.createElement('a');
    a.href = href;
    a.append(image);
    return [a, ''];
  }
  return [image, ''];
}

export default function parse(element, { document, params }) {
  if (element.hasAttribute(MERGED_ATTR)) {
    element.remove();
    return;
  }

  const sources = [element];
  const partner = findMergePartner(element);
  if (partner) sources.push(partner);

  const cells = [];
  sources.forEach((src) => {
    collectTiles(src).forEach((tile) => {
      const row = buildRow(tile, document);
      if (row) cells.push(row);
    });
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-promo-tiles', cells });
  element.replaceWith(block);

  if (partner) {
    const wrapper = partner.parentElement;
    partner.setAttribute(MERGED_ATTR, '');
    partner.remove();
    // #mt_id_hp7 only holds an empty heading once its grid is merged.
    if (wrapper && wrapper.id === 'mt_id_hp7' && !wrapper.textContent.trim()
      && !wrapper.querySelector('img, a[href], table')) {
      wrapper.remove();
    }
  }
}
