/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-product-slider (www.shopmyexchange.com, template: deals).
 * Source: div[id^="mt-slider-"] (Monetate product sliders "Most Popular", "Trending")
 *  - h3 (slider title) -> emitted as default content before the block
 *  - ul > li > .mt-merch-item
 *      > div > a[href] > (.mt-image img, span.aafes-item-name)
 *      > .custom-price-info (regular / sale price, or "Log in for Exchange pricing")
 *      > .promo-container (promo tags, not imported)
 *    Slider arrows (button.aafes-block-arrow) and pagination dots (li > button) are skipped:
 *    only .mt-merch-item elements are read. The slider clones its slides for infinite
 *    looping (40 items / 20 products), so products are deduplicated by href.
 * Output: one row per product: [image | p > a product name, p price line].
 * The image stays unlinked: the block JS links it to the product name link.
 */

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function priceLine(item) {
  const priceInfo = item.querySelector('.custom-price-info');
  if (!priceInfo) return '';
  // Join the individual price parts (regular price, sale price) with a space,
  // same as tabs-product-recs, so the block JS can split "$X $Y Sale".
  const leaves = Array.from(priceInfo.querySelectorAll('span, p'))
    .filter((el) => !el.querySelector('span, p'))
    .map((el) => clean(el.textContent))
    .filter(Boolean);
  return leaves.length ? leaves.join(' ') : clean(priceInfo.textContent);
}

function buildRow(item, document) {
  const link = item.querySelector('a.mt-aafes-product-link') || item.querySelector('a[href]');
  const img = item.querySelector('.mt-image img') || item.querySelector('img');
  const nameEl = item.querySelector('.aafes-item-name');
  const name = clean(nameEl ? nameEl.textContent : (img && img.getAttribute('alt')) || (link && link.textContent));
  if (!img && !name) return null;

  let imageCell = '';
  if (img && img.getAttribute('src')) {
    const image = document.createElement('img');
    image.src = img.getAttribute('src');
    const alt = clean(img.getAttribute('alt')) || name;
    if (alt) image.alt = alt;
    imageCell = image;
  }

  const content = [];
  if (name) {
    const p = document.createElement('p');
    if (link && link.getAttribute('href')) {
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.textContent = name;
      p.append(a);
    } else {
      p.textContent = name;
    }
    content.push(p);
  }

  const price = priceLine(item);
  if (price) {
    const p = document.createElement('p');
    p.textContent = price;
    content.push(p);
  }

  return [imageCell, content.length ? content : ''];
}

export default function parse(element, { document, params }) {
  let items = Array.from(element.querySelectorAll('.mt-merch-item'));
  if (!items.length) {
    items = Array.from(element.querySelectorAll('li'))
      .filter((li) => li.querySelector('a[href]') && li.querySelector('img'));
  }

  // Drop looping clones: keep the first occurrence of each product URL.
  const seen = new Set();
  items = items.filter((item) => {
    const a = item.querySelector('a.mt-aafes-product-link, a[href]');
    const href = a && a.getAttribute('href');
    if (!href) return true;
    if (seen.has(href)) return false;
    seen.add(href);
    return true;
  });

  const cells = [];
  items.forEach((item) => {
    const row = buildRow(item, document);
    if (row) cells.push(row);
  });

  // Slider heading ("Most Popular", "Trending") stays as default content before the block.
  const title = element.querySelector('h3, h2');
  if (title && clean(title.textContent)) {
    const heading = document.createElement(title.tagName.toLowerCase());
    heading.textContent = clean(title.textContent);
    element.before(heading);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-product-slider', cells });
  element.replaceWith(block);
}
