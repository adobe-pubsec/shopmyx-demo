/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-promo-bento (www.shopmyexchange.com, template: home).
 * Instances: "#mt_id_hp4 > div.grid" and "#mt_id_hp5 > div.grid" (3 tiles each).
 * Each outer grid has two children: a nested 2-tile grid and one wide tile.
 * In hp4 the DOM order is [nested grid (order-2), wide tile (order-1)], so tiles are
 * re-sorted by their Tailwind order-* classes to match the visual order:
 *   WOW Deals (wide), Audio, Smartwatches, Computers, Gaming Deals, Soundbars (wide).
 * Both grids form one block (the block makes the first tile of odd groups and the last
 * tile of even groups double-width); the hp4 parse merges the hp5 grid and removes it.
 * Output: one row per tile: [linked image | (empty link cell)].
 */

const MERGED_ATTR = 'data-cards-promo-bento-merged';
const BREAKPOINTS = ['', 'sm', 'md', 'lg', 'xl', '2xl'];

/** Resolve the effective (widest breakpoint) Tailwind order value for an element. */
function orderOf(el) {
  const resolved = {};
  (el.getAttribute('class') || '').split(/\s+/).forEach((token) => {
    if (!token) return;
    const idx = token.indexOf(':');
    const bp = idx > -1 ? token.slice(0, idx) : '';
    const value = idx > -1 ? token.slice(idx + 1) : token;
    if (!BREAKPOINTS.includes(bp)) return;
    let order = null;
    if (value === 'order-first') order = -9999;
    else if (value === 'order-last') order = 9999;
    else if (value === 'order-none') order = 0;
    else {
      const m = value.match(/^order-(\d+)$/);
      if (m) order = parseInt(m[1], 10);
    }
    if (order !== null) resolved[bp] = order;
  });
  let order = 0;
  BREAKPOINTS.forEach((bp) => {
    if (resolved[bp] !== undefined) order = resolved[bp];
  });
  return order;
}

function sortByOrder(nodes) {
  return nodes
    .map((node, index) => ({ node, index, order: orderOf(node) }))
    .sort((a, b) => (a.order - b.order) || (a.index - b.index))
    .map((entry) => entry.node);
}

/** Tiles of one outer grid, in visual order. */
function collectTiles(grid) {
  const tiles = [];
  sortByOrder(Array.from(grid.children)).forEach((child) => {
    if (!child.querySelector('a img')) return;
    const nested = child.matches('div.grid') ? child : null;
    if (nested) {
      sortByOrder(Array.from(nested.children))
        .filter((c) => c.querySelector('a img'))
        .forEach((c) => tiles.push(c));
    } else {
      tiles.push(child);
    }
  });
  if (!tiles.length) {
    Array.from(grid.querySelectorAll('a')).filter((a) => a.querySelector('img')).forEach((a) => tiles.push(a));
  }
  return tiles;
}

function findMergePartner(element) {
  const parent = element.parentElement;
  if (!parent || parent.id !== 'mt_id_hp4') return null;
  const partner = element.ownerDocument.querySelector('#mt_id_hp5 > div.grid');
  return partner && partner !== element ? partner : null;
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

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-promo-bento', cells });
  element.replaceWith(block);

  if (partner) {
    const wrapper = partner.parentElement;
    partner.setAttribute(MERGED_ATTR, '');
    partner.remove();
    // #mt_id_hp5 only holds an empty heading once its grid is merged.
    if (wrapper && wrapper.id === 'mt_id_hp5' && !wrapper.textContent.trim()
      && !wrapper.querySelector('img, a[href], table')) {
      wrapper.remove();
    }
  }
}
