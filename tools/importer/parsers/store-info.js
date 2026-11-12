/* eslint-disable */
/* global WebImporter */

/**
 * Parser for store-info (www.shopmyexchange.com, template: store).
 * Source: .aafes-store-details > .grid
 *   .aafes-title-box > h1, p (address lines), then label/value pairs
 *   (p.aafes-text-title "Store Hours:" + p, "Phone:" + p)
 *   .aafes-title-banner > img (store photo; its src is set by the cleanup transformer
 *   from the source's CSS background before the <style> is removed)
 * Output: key-value rows: Name | Image | Address | <label> | <value> ...
 */
function textLines(el) {
  const out = [];
  let current = '';
  el.childNodes.forEach((n) => {
    if (n.nodeName === 'BR') { out.push(current); current = ''; } else current += n.textContent;
  });
  out.push(current);
  return out.map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

function linesCell(document, lines) {
  const div = document.createElement('div');
  lines.forEach((l, i) => {
    if (i) div.append(document.createElement('br'));
    div.append(document.createTextNode(l));
  });
  return div;
}

export default function parse(element, { document }) {
  const box = element.querySelector('.aafes-title-box');
  if (!box) return;
  const cells = [];
  const h1 = box.querySelector('h1');
  if (h1) cells.push(['Name', h1.textContent.trim()]);

  const banner = element.querySelector('.aafes-title-banner img[src]:not([src=""])');
  if (banner) {
    const img = document.createElement('img');
    img.src = banner.getAttribute('src');
    img.alt = h1 ? h1.textContent.trim() : '';
    cells.push(['Image', img]);
  }

  let label = null;
  [...box.querySelectorAll(':scope > p')].forEach((p) => {
    if (p.classList.contains('aafes-text-title')) {
      label = p.textContent.replace(/:\s*$/, '').trim();
      return;
    }
    const lines = textLines(p);
    if (!lines.length) return;
    cells.push([label || 'Address', linesCell(document, lines)]);
    label = null;
  });

  element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'store-info', cells }));
}
