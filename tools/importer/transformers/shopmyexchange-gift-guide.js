/* eslint-disable */
/* global WebImporter */

/**
 * Gift-guide transformer for www.shopmyexchange.com (template: gift-guide only;
 * only import-gift-guide.js uses it, so home/deals/category/store are unaffected).
 * Every rule is gated on the holiday gift guide band (.bg-holidaygiftguide).
 *
 * preprocess: the CMS tiles (section.bg-holidaygiftguide .lpcategory-container)
 *   link through an empty overlay <a> next to the image. The Helix importer drops
 *   text-less links between preprocess and transform, so move each image into its
 *   overlay link to keep the destination for the parsers.
 * afterTransform (must run before the DM transformer): text-only heading images
 *   ("Gifts Under") become real headings; the copy was read from the art.
 */

const HEADINGS = {
  'LP-gift-guide-2026-gifts-under01': { text: 'Gifts Under', level: 'h2' },
};

function assetName(src) {
  return decodeURIComponent(((src || '').split('?')[0].split('/').pop()) || '');
}

export default function transform(hookName, element, payload) {
  if (hookName === 'preprocess') {
    element.querySelectorAll('section.bg-holidaygiftguide .lpcategory-container > div').forEach((tile) => {
      const img = tile.querySelector(':scope > img');
      const a = tile.querySelector(':scope > a[href]');
      if (!img || !a || a.textContent.trim() || a.querySelector('img')) return;
      a.prepend(img);
    });
    return;
  }

  if (hookName === 'afterTransform') {
    const document = element.ownerDocument;
    element.querySelectorAll('img').forEach((img) => {
      if (img.closest('table')) return;
      const entry = HEADINGS[assetName(img.getAttribute('src'))];
      if (!entry) return;
      const heading = document.createElement(entry.level || 'h2');
      heading.textContent = entry.text;
      const link = img.closest('a');
      (link && link.textContent.trim() === '' ? link : img).replaceWith(heading);
    });
  }
}
