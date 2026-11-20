/* eslint-disable */
/* global WebImporter */

/**
 * Parser for promo-banner (www.shopmyexchange.com, template: gift-guide).
 * Instances: div.banner-container holding one Scene7 banner image with its copy
 * baked in (hero "Merry Everything", "Add Holiday Cheer" gift-card banner). The
 * mobile duplicate <img> is removed by the cleanup transformer.
 *
 * The page is migrated as editable blocks (user request): the copy printed on
 * the art becomes text, and the image becomes its core art: the same Scene7
 * asset with a `crop=x,y,w,h` (native px) that cuts the text away. Copy and
 * crops were read from the art (migration-work/gift-guide/image-conversion-plan.md).
 *
 * Output:
 *   Row 1: [core art | heading + subtitle + optional CTA link]
 *   Row 2 (optional): [decorative border strip]
 * Unknown assets fall back to [image | heading/subtitle from "Heading - subtitle" alt].
 */

const BANNERS = {
  'TB-gift-guide-2026-header01': {
    heading: 'Merry Everything',
    level: 'h1',
    subtitle: 'bright picks for everyone on your list',
    art: { crop: '860,0,550,384', alt: 'Gingerbread man and holiday gift box' },
    border: { crop: '0,384,1410,260', alt: '' },
  },
  'LP-gift-guide-2026-gift-cards01': {
    heading: 'Add Holiday Cheer',
    level: 'h2',
    subtitle: 'with gift cards',
    cta: 'Shop Gift Cards',
    art: { crop: '885,0,525,210', alt: 'Xbox and Visa gift cards with a candy cane' },
  },
};

function assetName(src) {
  return decodeURIComponent(((src || '').split('?')[0].split('/').pop()) || '');
}

function cropped(src, crop) {
  return `${(src || '').split('?')[0]}?crop=${crop}`;
}

function el(document, tag, text) {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}

function image(document, src, alt) {
  const img = document.createElement('img');
  img.setAttribute('src', src);
  img.setAttribute('alt', alt || '');
  return img;
}

function linkPara(document, href, text) {
  const p = document.createElement('p');
  const a = document.createElement('a');
  a.setAttribute('href', href);
  a.textContent = text;
  p.append(a);
  return p;
}

function destinationOf(root) {
  const a = [...root.querySelectorAll('a[href]')]
    .find((link) => !/^javascript:/i.test(link.getAttribute('href')));
  return a ? a.getAttribute('href') : null;
}

export default function parse(element, { document }) {
  const img = element.querySelector('img');
  if (!img) return;
  const src = img.getAttribute('src');
  const href = destinationOf(element);
  const entry = BANNERS[assetName(src)];

  const text = [];
  let art;
  let border = null;
  if (entry) {
    text.push(el(document, entry.level || 'h2', entry.heading));
    if (entry.subtitle) text.push(el(document, 'p', entry.subtitle));
    if (href) text.push(linkPara(document, href, entry.cta || entry.heading));
    art = image(document, cropped(src, entry.art.crop), entry.art.alt);
    if (entry.border) border = image(document, cropped(src, entry.border.crop), entry.border.alt);
  } else {
    const alt = (img.getAttribute('alt') || '').replace(/\s+/g, ' ').trim();
    const [heading, ...rest] = alt.split(/\s+-\s+/);
    if (heading) text.push(el(document, 'h2', heading));
    if (rest.length) text.push(el(document, 'p', rest.join(' - ')));
    if (href) text.push(linkPara(document, href, heading || href));
    art = image(document, src, alt);
  }

  const cells = [[art, text]];
  if (border) cells.push([border]);
  const block = WebImporter.Blocks.createBlock(document, { name: 'promo-banner', cells });
  element.replaceWith(block);
}
