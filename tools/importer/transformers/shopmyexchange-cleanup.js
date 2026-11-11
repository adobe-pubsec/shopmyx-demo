/* eslint-disable */
/* global WebImporter */

/**
 * Cleanup transformer for www.shopmyexchange.com (template: home).
 * Removes non-authorable chrome, hidden / mobile-only duplicates, widgets,
 * tracking pixels, and leftover empty wrappers.
 * All selectors verified against migration-work/cleaned.html.
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
  if (hookName === 'beforeTransform') {
    // Global header (first child of div.flex.min-h-screen) and footer.
    // Do not use div:nth-child(1): once the header is removed, the main
    // content wrapper becomes the first child and would match.
    WebImporter.DOMUtils.remove(element, [
      'div.flex.min-h-screen > div.headercontainer',
      'section.relative.min-h-\\[760px\\]',
      'section.SME-footer',
    ]);

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
    ]);

    // Elements hidden at desktop width: hidden #mt_id_hero / #mt_id_milstar
    // copies, hidden mobile grids (lpcategory-container), w-0 h-0 tracking
    // pixels, and mobile-only duplicate images (block md:hidden).
    // #mt-tabbed-recs contains no such elements.
    Array.from(element.querySelectorAll('[class]'))
      .filter((el) => isHiddenOnDesktop(el))
      .forEach((el) => {
        if (el.isConnected !== false && el.parentNode) el.remove();
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
