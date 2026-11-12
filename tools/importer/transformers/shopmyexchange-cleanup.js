/* eslint-disable */
/* global WebImporter */

/**
 * Cleanup transformer for www.shopmyexchange.com (templates: home, deals,
 * category). Category-only rules are gated on section#category inside <main>.
 * Removes non-authorable chrome, hidden / mobile-only duplicates, widgets,
 * tracking pixels, and leftover empty wrappers.
 * Selectors verified against migration-work/home/cleaned.html (home) and
 * migration-work/cleaned.html (deals). Deals-only selectors match nothing on
 * the homepage snapshot, so homepage output is unchanged.
 */

const BREAKPOINT_ORDER = ['', 'sm', 'md', 'lg', 'xl'];
const DISPLAY_VALUES = new Set([
  'hidden', 'block', 'flex', 'grid', 'inline', 'inline-block', 'inline-flex',
  'inline-grid', 'table', 'contents',
]);

/**
 * Resolve the Tailwind display value at desktop (xl) width from class tokens.
 * Returns true when the element is hidden on desktop. This keeps responsive
 * desktop images such as "hidden sm:block md:block lg:block" (tax-free banner)
 * while removing plain ".hidden" copies and mobile-only "md:hidden" duplicates.
 */
function isHiddenOnDesktop(el) {
  const cls = el.getAttribute('class');
  if (!cls) return false;
  const resolved = {};
  cls.split(/\s+/).forEach((token) => {
    if (!token) return;
    let bp = '';
    let value = token;
    const idx = token.indexOf(':');
    if (idx > -1) {
      bp = token.slice(0, idx);
      value = token.slice(idx + 1);
    }
    value = value.replace(/^!/, '');
    if (!BREAKPOINT_ORDER.includes(bp) || !DISPLAY_VALUES.has(value)) return;
    resolved[bp] = value;
  });
  let display = null;
  BREAKPOINT_ORDER.forEach((bp) => {
    if (resolved[bp]) display = resolved[bp];
  });
  return display === 'hidden';
}

function isEmptyElement(el) {
  if (!el) return false;
  if (el.textContent.trim()) return false;
  return !el.querySelector('img, picture, video, iframe, a[href], table, hr');
}

export default function transform(hookName, element, payload) {
  // Runs from the category import script's `preprocess`, before the Helix importer
  // drops text-less links. Category tiles (#category, #brands, #sizecharts) link
  // through an empty overlay <a> that sits next to the image; move the image into
  // that link so the destination survives. Only import-category.js calls this hook,
  // and it is gated on the category panel, so home and deals are unaffected.
  if (hookName === 'preprocess') {
    if (!element.querySelector('main section#category.lp-standard-category')) return;
    element.querySelectorAll(
      '#category .lpcategory-container > div, #brands .lpcategory-container > div, #sizecharts .guide-container > div',
    ).forEach((tile) => {
      const img = tile.querySelector(':scope > img');
      const a = tile.querySelector(':scope > a[href]');
      if (!img || !a || a.textContent.trim() || a.querySelector('img')) return;
      a.prepend(img);
    });
    return;
  }

  if (hookName === 'beforeTransform') {
    // Global header (first child of div.flex.min-h-screen) and footer.
    // Do not use div:nth-child(1): once the header is removed, the main
    // content wrapper becomes the first child and would match.
    WebImporter.DOMUtils.remove(element, [
      'div.flex.min-h-screen > div.headercontainer',
      'section.relative.min-h-\\[760px\\]',
      'section.SME-footer',
    ]);

    // Category landing (/browse?pageCategories=...): only these pages carry the
    // CMS "Shop By Category" panel section#category.lp-standard-category inside
    // <main>. Home and deals snapshots contain none of the selectors below.
    const isCategoryPage = !!element.querySelector('main section#category.lp-standard-category');
    if (isCategoryPage) {
      // "Shop By Category" shows 6 tiles and hides the rest behind a "See More"
      // toggle; all tiles are content, so un-hide them (before the hidden-element
      // cleanup below) and drop the toggle button. The tile container is flagged
      // (data-see-more) so the cards-category parser writes the `see-more` option.
      element.querySelectorAll('#category').forEach((panel) => {
        const container = panel.querySelector('.lpcategory-container');
        if (container && panel.querySelector('#toggle-button') && panel.querySelector('.categorytile.hidden')) {
          container.setAttribute('data-see-more', '');
        }
      });
      element.querySelectorAll('#category .categorytile.hidden').forEach((tile) => {
        tile.classList.remove('hidden');
      });
      WebImporter.DOMUtils.remove(element, ['#category #toggle-button']);

      // Left category navigation (side menu) renders as a sibling of <main>
      // inside the content flex row; it is site chrome, not page content. Only
      // the row that directly holds <main>: the product listing inside <main>
      // has its own flex row (filters + #product-list-container).
      WebImporter.DOMUtils.remove(element, [
        'div.gap-x-5.md\\:flex-row:has(> main) > :not(main)',
        // Hidden web/app duplicate "Electronic Guides" panel (the visible
        // #sizecharts without .hidden is kept for cards-category).
        'section#sizecharts.hidden',
        // Hidden appDisplay duplicate "You May Also Like" heading + empty
        // slider placeholder in the CMS area; the real one lives in
        // #recommendationContainer (section rc2).
        'main h2.hidden',
        'main div.hidden',
        // Subcategory listing paging ("1 2 3 … 88") sits outside <main>, below the
        // live product listing (which becomes the product-listing placeholder).
        'div.mx-auto > div.my-3.flex.justify-center',
        // Decorative divider (rule with a centered Exchange mini logo) between the
        // promo banner and the product listing; styling, not content.
        'div.col-span-12.border-b-1:has(> img[src*="mini-logo"])',
      ]);
      // The breadcrumb (nav.mb-5.flex) is not content: the site builds it from the
      // page path (breadcrumb block). It is removed with the deals one below.
    }

    // Important Notice bar, chat widget, ads/tracking iframes, scripts, styles.
    WebImporter.DOMUtils.remove(element, [
      'div.hidden.pointer-events-none.bg-amber-300',
      'div.App',
      'iframe',
      'script',
      'style',
      'noscript',
      'link',
      // Screen-reader-only "CMS Content" section label (not authorable copy).
      'h1.sr-only',
      // Third-party tracking pixels injected at runtime.
      'img[src*="sp.analytics.yahoo.com"]',
      'img[src*="facebook.com/tr"]',
      'img[src*="doubleclick.net"]',
      'img[src*="bat.bing.com"]',
      // Breadcrumb trail ("Exchange > Deals", "Exchange > Electronics > ...").
      // Not content: the site builds it from the page path (breadcrumb block).
      'nav.mb-5.flex',
      // Deals: app-only duplicate titles; the visible headings are the h2
      // inside div.clear-both.pt-10.
      'p#app-screen-title',
    ]);

    // Elements hidden at desktop width: hidden #mt_id_hero / #mt_id_milstar
    // copies, hidden mobile grids (lpcategory-container), w-0 h-0 tracking
    // pixels, and mobile-only duplicate images (block md:hidden).
    // On deals this also drops the hidden "Trending"/"Most Popular" h2 copies
    // and their empty wrappers. #mt-tabbed-recs contains no such elements.
    Array.from(element.querySelectorAll('[class]'))
      .filter((el) => isHiddenOnDesktop(el))
      .forEach((el) => {
        if (el.isConnected !== false && el.parentNode) el.remove();
      });

    // Unlinked image banners (deals title banner
    // div.banner-container.pointer-events-none) wrap the image in
    // <a href="javascript:void(0)">. Unwrap so the image stays default
    // content instead of becoming a dead link. On the homepage the only
    // javascript: anchors sit inside hidden elements already removed above.
    element.querySelectorAll('a[href^="javascript:"]').forEach((a) => {
      a.replaceWith(...Array.from(a.childNodes));
    });
  }

  if (hookName === 'afterTransform') {
    // #mt_id_hp10 is an empty heading wrapper; removed only after parsing
    // because "#mt_id_hp10 + div.grid" selects a cards-promo-wide instance.
    element.querySelectorAll('#mt_id_hp10').forEach((el) => {
      if (isEmptyElement(el)) el.remove();
    });

    // Leftover non-authorable controls (if any parser left them behind).
    WebImporter.DOMUtils.remove(element, [
      'button.aafes-block-arrow',
      'iframe',
      'script',
      'style',
      'noscript',
      'link',
    ]);

    // Empty trailing paragraphs left behind by removed pixels/widgets.
    element.querySelectorAll('p').forEach((p) => {
      if (isEmptyElement(p) && !p.closest('table')) p.remove();
    });

    // Strip tracking / inline-handler attributes. Comments are left intact.
    element.querySelectorAll('*').forEach((el) => {
      Array.from(el.attributes).forEach(({ name }) => {
        if (/^on/i.test(name) || /^data-(gtm|track|analytics|ga)/i.test(name)) {
          el.removeAttribute(name);
        }
      });
    });
  }
}
