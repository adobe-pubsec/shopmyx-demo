/*
 * Vendor list: places vendor fragments on a store page, in row order.
 * One row per vendor, each a link to the vendor's fragment, e.g.
 *   | Vendor List |
 *   | [Starbucks](/store-locator/ft-hood-main-exchange/vendors/starbucks-clear-creek-food-court) |
 * The same fragment can be listed in several vendor lists (a vendor in two categories).
 */
// eslint-disable-next-line import/no-cycle
import { decorateMain } from '../../scripts/scripts.js';
import { loadSections } from '../../scripts/aem.js';

function isPreview() {
  const { hostname } = window.location;
  return hostname === 'localhost' || hostname.endsWith('.aem.page') || hostname.endsWith('.hlx.page');
}

// The local preview serves imported content under /content/<path>.
const BASE = window.location.pathname.startsWith('/content/') ? '/content' : '';

const cache = new Map();

/**
 * Loads a vendor fragment and returns its decorated vendor block(s). Like
 * fragment.js loadFragment, but drops the fragment's metadata table first (it is
 * page metadata such as Robots, not a block to render) and shares one request per
 * fragment across all lists on the page.
 */
function loadVendor(path) {
  if (!cache.has(path)) {
    cache.set(path, (async () => {
      const resp = await fetch(`${BASE}${path}.plain.html`);
      if (!resp.ok) throw new Error(`${resp.status}`);
      const main = document.createElement('main');
      main.innerHTML = await resp.text();
      main.querySelectorAll('div.metadata').forEach((m) => m.remove());
      main.querySelectorAll('img[src^="./media_"]').forEach((img) => {
        img.src = new URL(img.getAttribute('src'), new URL(`${BASE}${path}`, window.location)).href;
      });
      decorateMain(main);
      await loadSections(main);
      return main;
    })());
  }
  return cache.get(path).then((main) => [...main.querySelectorAll('.vendor.block')]
    .map((v) => v.cloneNode(true)));
}

function fragmentPath(link) {
  try {
    const url = new URL(link.getAttribute('href'), window.location);
    if (url.origin !== window.location.origin) return null;
    return url.pathname.replace(/^\/content(?=\/)/, '').replace(/\.(plain\.)?html$/, '');
  } catch {
    return null;
  }
}

/** Text of the nearest heading before this list (its subcategory or category). */
function groupHeading(block) {
  const wrapper = block.closest('.vendor-list-wrapper');
  for (let el = wrapper && wrapper.previousElementSibling; el; el = el.previousElementSibling) {
    const headings = el.querySelectorAll('h2, h3');
    if (headings.length) return headings[headings.length - 1].textContent.trim();
  }
  return '';
}

export default function decorate(block) {
  const links = [...block.querySelectorAll('a[href]')];
  const ul = document.createElement('ul');
  const items = links.map((link) => {
    const li = document.createElement('li');
    li.className = 'vendor-list-item loading';
    ul.append(li);
    return { li, link, path: fragmentPath(link) };
  });
  block.replaceChildren(ul);

  // Not awaited: each card fills its reserved slot when its fragment arrives. When all
  // have arrived (or failed), `vendor-list:loaded` bubbles up, e.g. for vendor-search.
  const settled = items.map(({ li, link, path }) => {
    const fail = (reason) => {
      li.classList.remove('loading');
      if (isPreview()) {
        li.classList.add('vendor-list-error');
        li.textContent = `Vendor fragment not found: ${link.getAttribute('href')} (${reason})`;
      } else {
        li.remove();
      }
    };
    if (!path) {
      fail('not a fragment link');
      return Promise.resolve();
    }
    return loadVendor(path)
      .then((vendors) => {
        if (!vendors.length) {
          fail('no vendor block');
          return;
        }
        // A vendor named after its group heading (e.g. "Exchange Admin" under the
        // "Exchange Admin" heading) does not repeat the name, as on the source.
        const heading = groupHeading(block);
        vendors.forEach((v) => {
          const name = v.querySelector('.vendor-name');
          if (name && heading && name.textContent.trim() === heading) name.classList.add('vendor-name-hidden');
        });
        li.replaceChildren(...vendors);
        li.classList.remove('loading');
      })
      .catch((e) => fail(e.message));
  });
  Promise.allSettled(settled).then(() => {
    block.dataset.vendorsLoaded = 'true';
    block.dispatchEvent(new CustomEvent('vendor-list:loaded', { bubbles: true }));
  });
}
