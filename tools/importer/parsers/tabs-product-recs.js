/* eslint-disable */
/* global WebImporter */

/**
 * Parser for tabs-product-recs (www.shopmyexchange.com, template: home).
 * Source: #mt-tabbed-recs
 *  - h2#mt-tabbed-recs-title ("Featured Products") -> emitted as default content before the block
 *  - button.mt-aafes-recs__tab (#mt-recs-tab-{key}) -> tab labels
 *  - div.mt-aafes-recs__panel (#mt-recs-panel-{key}) -> product slider
 *      .mt-merch-item > a.mt-aafes-product-link > (.mt-image img, span.aafes-item-name)
 *      .mt-merch-item > .custom-price-info (price / "Log in for Exchange pricing")
 *    Slider arrows (button.aafes-block-arrow) and pagination dots are skipped.
 * Output: one row per tab: [tab label | ul > li (p > img, p > a name, p price)].
 * The image stays unlinked: the block JS links it to the product name link and uses the
 * first non-image link as the product name.
 */

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function findPanel(element, tab, index, panels) {
  const controls = tab.getAttribute('aria-controls');
  if (controls) {
    const byAria = panels.find((p) => p.id === controls);
    if (byAria) return byAria;
  }
  const key = (tab.id || '').replace(/^mt-recs-tab-/, '');
  if (key) {
    const byId = panels.find((p) => p.id === `mt-recs-panel-${key}`);
    if (byId) return byId;
  }
  return panels[index] || null;
}

function buildProduct(item, document) {
  const link = item.querySelector('a.mt-aafes-product-link') || item.querySelector('a[href]');
  const img = item.querySelector('.mt-image img') || item.querySelector('img');
  const nameEl = item.querySelector('.aafes-item-name');
  const name = clean(nameEl ? nameEl.textContent : (img && img.getAttribute('alt')) || (link && link.textContent));
  if (!img && !name) return null;

  const li = document.createElement('li');

  if (img && img.getAttribute('src')) {
    const p = document.createElement('p');
    const image = document.createElement('img');
    image.src = img.getAttribute('src');
    const alt = clean(img.getAttribute('alt')) || name;
    if (alt) image.alt = alt;
    p.append(image);
    li.append(p);
  }

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
    li.append(p);
  }

  const priceInfo = item.querySelector('.custom-price-info');
  if (priceInfo) {
    // Join the individual price parts (regular price, sale price) with a space.
    const leaves = Array.from(priceInfo.querySelectorAll('span, p'))
      .filter((el) => !el.querySelector('span, p'))
      .map((el) => clean(el.textContent))
      .filter(Boolean);
    const priceText = leaves.length ? leaves.join(' ') : clean(priceInfo.textContent);
    if (priceText) {
      const p = document.createElement('p');
      p.textContent = priceText;
      li.append(p);
    }
  }

  return li;
}

export default function parse(element, { document, params }) {
  const tabs = Array.from(element.querySelectorAll('button.mt-aafes-recs__tab'));
  const panels = Array.from(element.querySelectorAll('div.mt-aafes-recs__panel'));

  const cells = [];
  const tabSources = tabs.length ? tabs : panels.map(() => null);
  tabSources.forEach((tab, index) => {
    const panel = tab ? findPanel(element, tab, index, panels) : panels[index];
    const label = clean(tab ? tab.textContent : '') || `Tab ${index + 1}`;
    if (!panel) return;

    let items = Array.from(panel.querySelectorAll('.mt-merch-item'));
    if (!items.length) {
      items = Array.from(panel.querySelectorAll('li'))
        .filter((li) => li.querySelector('a[href]') && li.querySelector('img'));
    }

    // The source slider clones its slides for infinite looping, so the same product
    // appears more than once per panel. Keep the first occurrence of each product URL.
    const seen = new Set();
    items = items.filter((item) => {
      const href = (item.querySelector('a.mt-aafes-product-link, a[href]') || {}).getAttribute?.('href');
      if (!href) return true;
      if (seen.has(href)) return false;
      seen.add(href);
      return true;
    });

    const ul = document.createElement('ul');
    items.forEach((item) => {
      const li = buildProduct(item, document);
      if (li) ul.append(li);
    });

    cells.push([label, ul.children.length ? ul : '']);
  });

  // Section heading "Featured Products" stays as default content before the block.
  const title = element.querySelector('#mt-tabbed-recs-title, h2.mt-aafes-recs__title');
  if (title && clean(title.textContent)) {
    const h2 = document.createElement('h2');
    h2.textContent = clean(title.textContent);
    element.before(h2);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-product-recs', cells });
  element.replaceWith(block);
}
