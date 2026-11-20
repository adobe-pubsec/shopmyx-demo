/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-gift-tile (www.shopmyexchange.com, template: gift-guide).
 * Instance: section.bg-holidaygiftguide div.lpcategory-container with the
 * "-tile-" assets. Each tile div holds the tile image, moved into its overlay
 * link by the gift-guide transformer's preprocess hook.
 *
 * Cards convention, 2 cells per row: [image | text]. The tile art has its label
 * printed on a teal bar along the bottom (bar starts at y=447 of 420x509). The
 * page is migrated as editable blocks (user request): the image is the same
 * asset cropped above the bar, and the label becomes the CTA link text, which
 * the block renders as the bar.
 * Output: one row per tile: [cropped photo | destination link (label)].
 * Unknown assets keep their image uncropped and use the alt text as label.
 */

const TILE_CROP = '0,0,420,445';
// Label = the text printed on the art (alt text differs for two tiles).
const TILE_LABELS = {
  'LP-gift-guide-2026-tile-ultimate-gifts01': 'Ultimate Gifts',
  'LP-gift-guide-2026-tile-for-her01': 'For Her',
  'LP-gift-guide-2026-tile-for-him01': 'For Him',
  'LP-gift-guide-2026-tile-stocking-stuffers01': 'Stocking Stuffers',
  'LP-gift-guide-2026-tile-top-toys01': 'Top Toys',
  'LP-gift-guide-2026-tile-gift-sets01': 'Gift Sets',
  'LP-gift-guide-2026-tile-family-pjs01': 'Family PJs',
  'LP-gift-guide-2026-tile-handbags01': 'Handbags',
  'LP-gift-guide-2026-tile-electronics01': 'Electronics',
  'LP-gift-guide-2026-tile-fan-shop01': 'Fan Shop',
  'LP-gift-guide-2026-tile-fitness-buffs01': 'Fitness Buffs',
  'LP-gift-guide-2026-tile-pet-lovers01': 'Pet Lovers',
  'LP-gift-guide-2026-tile-gourmet-foods01': 'Gourmet Foods',
  'LP-gift-guide-2026-tile-jewelry01': 'Jewelry',
  'LP-gift-guide-2026-tile-home-cozy01': 'Home & Cozy',
  'LP-gift-guide-2026-tile-for-the-traveler01': 'For the Traveler',
};

function assetName(src) {
  return decodeURIComponent(((src || '').split('?')[0].split('/').pop()) || '');
}

export default function parse(element, { document }) {
  const cells = [];
  [...element.children].forEach((tile) => {
    const img = tile.querySelector('img');
    if (!img) return;
    const src = img.getAttribute('src');
    const name = assetName(src);
    const known = Object.prototype.hasOwnProperty.call(TILE_LABELS, name);
    const alt = (img.getAttribute('alt') || '').replace(/\s+/g, ' ').trim();
    const label = known ? TILE_LABELS[name] : alt;

    const image = document.createElement('img');
    image.setAttribute('src', known ? `${src.split('?')[0]}?crop=${TILE_CROP}` : src);
    image.setAttribute('alt', label || alt);

    const dest = [...tile.querySelectorAll('a[href]')]
      .find((a) => !/^javascript:/i.test(a.getAttribute('href')));
    let text = label || '';
    if (dest) {
      text = document.createElement('a');
      text.setAttribute('href', dest.getAttribute('href'));
      text.textContent = label || dest.getAttribute('href');
    }
    cells.push([image, text]);
  });
  if (!cells.length) return;
  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-gift-tile', cells });
  element.replaceWith(block);
}
