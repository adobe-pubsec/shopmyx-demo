/* eslint-disable */
/* global WebImporter */

/**
 * Parser for shipping-deadlines (www.shopmyexchange.com, template: gift-guide).
 * Instance: div.banner-container with the "shipping-delivery" banner image,
 * linking to /cp/static-pages/shipping-delivery. Every date and label is baked
 * into the image; the page is migrated as an editable block (user request), so
 * the rows below were read from the art, and the stocking and truck become
 * crops of the same Scene7 asset (migration-work/gift-guide/image-conversion-plan.md).
 *
 * Output rows:
 *   1.   [heading + link]                          (link makes the panel clickable)
 *   2.   [left art (stocking) | right art (truck)]
 *   3+.  [group | date | label]                     (one row per deadline)
 *   last [note]
 * Unknown assets fall back to [alt heading + link] and the uncropped image.
 */

const SHIPPING = {
  'LP-gift-guide-2026-shipping-delivery01': {
    heading: 'Last day to order online for delivery before December 25:',
    linkText: 'Holiday 2026 Shipping & Delivery',
    left: { crop: '0,72,160,285', alt: 'Christmas stocking' },
    right: { crop: '1040,60,370,236', alt: 'Exchange delivery truck' },
    deadlines: [
      ['OCONUS APO/FPO', 'Dec 8', ''],
      ['CONUS', 'Dec 16', 'Regular Ground Shipments'],
      ['CONUS', 'Dec 18', 'Priority Shipments'],
      ['FedEx', 'Dec 21', '2 Day'],
      ['FedEx', 'Dec 23', 'Overnight'],
    ],
    note: 'Some exclusions apply',
  },
};

function assetName(src) {
  return decodeURIComponent(((src || '').split('?')[0].split('/').pop()) || '');
}

function cropped(src, crop) {
  return `${(src || '').split('?')[0]}?crop=${crop}`;
}

function image(document, src, alt) {
  const img = document.createElement('img');
  img.setAttribute('src', src);
  img.setAttribute('alt', alt || '');
  return img;
}

function titleCell(document, heading, href, linkText) {
  const h2 = document.createElement('h2');
  h2.textContent = heading;
  const cell = [h2];
  if (href) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.setAttribute('href', href);
    a.textContent = linkText || heading;
    p.append(a);
    cell.push(p);
  }
  return cell;
}

export default function parse(element, { document }) {
  const img = element.querySelector('img');
  if (!img) return;
  const src = img.getAttribute('src');
  const link = [...element.querySelectorAll('a[href]')]
    .find((a) => !/^javascript:/i.test(a.getAttribute('href')));
  const href = link ? link.getAttribute('href') : null;
  const entry = SHIPPING[assetName(src)];
  const cells = [];

  if (entry) {
    cells.push([titleCell(document, entry.heading, href, entry.linkText)]);
    cells.push([
      image(document, cropped(src, entry.left.crop), entry.left.alt),
      image(document, cropped(src, entry.right.crop), entry.right.alt),
    ]);
    entry.deadlines.forEach(([group, date, label]) => cells.push([group, date, label || '']));
    if (entry.note) cells.push([entry.note]);
  } else {
    const alt = (img.getAttribute('alt') || '').replace(/\s+/g, ' ').trim();
    cells.push([titleCell(document, alt, href, alt)]);
    cells.push([image(document, src, alt)]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'shipping-deadlines', cells });
  element.replaceWith(block);
}
