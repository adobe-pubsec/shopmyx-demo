/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-icon-feature (www.shopmyexchange.com, template: home).
 * Source: #mt_id_servingfamily + div.grid > div.text-center (3 items), each:
 *   a > img (icon), h2 > a (title), a.text-sm (linked lines separated by <br>).
 * The "SERVING THE MILITARY FAMILY" heading (#mt_id_servingfamily) stays as default content.
 * Output: one row per item: [linked icon image | h2 title (linked) + one <p> per linked line].
 */

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function copyLink(src, document, text) {
  const a = document.createElement('a');
  a.href = src.getAttribute('href');
  a.textContent = text;
  return a;
}

export default function parse(element, { document, params }) {
  let items = Array.from(element.children).filter((c) => c.querySelector('img') || c.querySelector('h1, h2, h3, h4, h5, h6'));
  if (!items.length) items = [element];

  const cells = [];
  items.forEach((item) => {
    // Icon cell: linked image.
    let iconCell = '';
    const img = item.querySelector('img');
    if (img && img.getAttribute('src')) {
      const image = document.createElement('img');
      image.src = img.getAttribute('src');
      if (img.getAttribute('alt')) image.alt = clean(img.getAttribute('alt'));
      const imgLink = img.closest('a');
      if (imgLink && imgLink.getAttribute('href')) {
        const a = document.createElement('a');
        a.href = imgLink.getAttribute('href');
        a.append(image);
        iconCell = a;
      } else {
        iconCell = image;
      }
    }

    // Text cell: title heading + linked lines.
    const content = [];
    const heading = item.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading && clean(heading.textContent)) {
      const h = document.createElement(heading.tagName.toLowerCase());
      const hLink = heading.querySelector('a[href]');
      const title = clean(heading.textContent);
      if (hLink && hLink.getAttribute('href')) h.append(copyLink(hLink, document, title));
      else h.textContent = title;
      content.push(h);
    }

    Array.from(item.querySelectorAll('a[href]'))
      .filter((a) => !a.querySelector('img') && !(heading && heading.contains(a)))
      .forEach((a) => {
        const text = clean(a.textContent);
        if (!text || !a.getAttribute('href')) return; // skip empty placeholder links
        const p = document.createElement('p');
        p.append(copyLink(a, document, text));
        content.push(p);
      });

    if (!iconCell && !content.length) return;
    cells.push([iconCell, content.length ? content : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-icon-feature', cells });
  element.replaceWith(block);
}
