/* eslint-disable */
/* global WebImporter */

/**
 * Dynamic Media / Scene7 image transformer for www.shopmyexchange.com.
 * Source images live on media.shopmyexchange.com/is/image/... (Scene7).
 *
 * Runs in afterTransform only (parsers need <img> nodes before then).
 * Rewrites DM <img> into anchors that survive the markdown round-trip:
 *  - Unlinked image: <a href="DM-URL">alt</a>
 *  - Linked image (sole meaningful child of <a>): keep navigation href,
 *    move DM URL to title, replace link content with alt text.
 *  - Mixed-content anchors are skipped with a warning.
 * Empty alt becomes the visible sentinel "Image without alt text"; the
 * scripts.js auto-block translates it back to alt="".
 */

const EMPTY_ALT_SENTINEL = 'Image without alt text';

function detectDynamicMediaUrl(urlStr) {
  if (!urlStr || !/^(https?:\/\/|\/\/)/i.test(urlStr)) return false;
  let u;
  try { u = new URL(urlStr, 'https://x/'); } catch (e) { return false; }
  if (u.pathname.startsWith('/is/image/')) return 'scene7';
  if (/^delivery-p\d+-e\d+\.adobeaemcloud\.com$/.test(u.hostname)
      && u.pathname.startsWith('/adobe/assets/urn:')) {
    return 'dm-openapi';
  }
  return false;
}

function normalizeUrl(src) {
  return src.startsWith('//') ? `https:${src}` : src;
}

function getImageSrc(img) {
  const candidates = [
    img.getAttribute('src'),
    img.getAttribute('data-src'),
    img.getAttribute('data-original-src'),
  ];
  return candidates.find((c) => c && detectDynamicMediaUrl(c)) || null;
}

// True when the image is the only meaningful content of the anchor:
// no other element besides wrappers (picture/source/span/div) and no text.
function isSoleMeaningfulChild(anchor, img) {
  if (anchor.textContent.trim()) return false;
  const others = Array.from(anchor.querySelectorAll('*')).filter((el) => {
    if (el === img) return false;
    if (el.contains(img)) return false; // wrapper of the image
    return !['SOURCE', 'BR'].includes(el.tagName);
  });
  const imgs = anchor.querySelectorAll('img');
  return others.length === 0 && imgs.length === 1;
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform') return;
  const document = element.ownerDocument;

  Array.from(element.querySelectorAll('img')).forEach((img) => {
    const rawSrc = getImageSrc(img);
    if (!rawSrc) return;
    const dmUrl = normalizeUrl(rawSrc);
    const altText = (img.getAttribute('alt') || '').trim() || EMPTY_ALT_SENTINEL;

    const anchor = img.closest('a');
    if (anchor && element.contains(anchor)) {
      if (!isSoleMeaningfulChild(anchor, img)) {
        // eslint-disable-next-line no-console
        console.warn(`[dm-images] Skipping DM image in mixed-content link: ${dmUrl}`);
        return;
      }
      anchor.setAttribute('title', dmUrl);
      anchor.textContent = altText;
      return;
    }

    const picture = img.parentElement && img.parentElement.tagName === 'PICTURE'
      ? img.parentElement
      : null;
    const link = document.createElement('a');
    link.setAttribute('href', dmUrl);
    link.textContent = altText;
    (picture || img).replaceWith(link);
  });
}
