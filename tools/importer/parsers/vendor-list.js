/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the store vendor directory (www.shopmyexchange.com, template: store).
 * Source: .aafes-store-details .store-content
 *   h2 (category: Food Court, Stores, Restaurants, Services)
 *   .aafes-title-box > div > h3 (subcategory) + p / div > p (building and info lines)
 *   div.flex.flex-wrap > div > .shop-tile (vendor tiles):
 *     .brand img (logo) + .text-[14px]: name lines (+ "Bldg." lines), tel link, DSN line,
 *     hours div, DoorDash link, notes/links
 * Output, in source order, replacing the directory:
 *   H2 per category; H3 + p per subcategory; a vendor-list block per tile group with one
 *   row per vendor: a link to the vendor's fragment.
 * Each vendor becomes ONE fragment (params.fragments) at
 *   <store path>/vendors/<name>-<group>, holding a key-value vendor block
 *   (Name, Logo, Location, Phone, Hours, Delivery, Note) and metadata Robots: noindex.
 *   A vendor listed in several places (same name, group and phone) reuses its fragment.
 */
const DAY = /\b(mon|tue|wed|thu|fri|sat|sun|daily|24 hours|open 24)/i;

const slug = (s) => s.toLowerCase()
  .normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/&/g, ' and ').replace(/['’]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

/** Splits an element's direct text nodes / <br> (before the first child element) into lines. */
function leadingLines(el) {
  const out = [];
  let current = '';
  for (const n of el.childNodes) {
    if (n.nodeType === 1 && n.nodeName !== 'BR') break;
    if (n.nodeName === 'BR') { out.push(current); current = ''; } else current += n.textContent;
  }
  out.push(current);
  return out.map(clean).filter(Boolean);
}

function brLines(el) {
  const out = [];
  let current = '';
  el.childNodes.forEach((n) => {
    if (n.nodeName === 'BR') { out.push(current); current = ''; } else current += n.textContent;
  });
  out.push(current);
  return out.map(clean).filter(Boolean);
}

function cellWithLines(document, lines) {
  const div = document.createElement('div');
  lines.forEach((l, i) => {
    if (i) div.append(document.createElement('br'));
    if (typeof l === 'string') div.append(document.createTextNode(l));
    else div.append(l);
  });
  return div;
}

function copyLink(document, a, text) {
  const link = document.createElement('a');
  link.href = a.getAttribute('href');
  link.textContent = clean(text || a.textContent);
  return link;
}

/** Reads one .shop-tile into vendor fields. */
function readTile(document, tile, groupName) {
  const v = { name: [], location: [], phone: [], hours: [], note: [], delivery: null, logo: null };
  const img = tile.querySelector('.brand img, .img-cont img');
  if (img && clean(img.getAttribute('src'))) v.logo = clean(img.getAttribute('src'));
  const text = tile.querySelector('.text-\\[14px\\]') || tile;

  leadingLines(text).forEach((line) => {
    if (/^bldg\b/i.test(line)) v.location.push(line);
    else if (v.location.length) v.location.push(line); // address continues after the building
    else v.name.push(line);
  });

  [...text.children].forEach((child) => {
    if (child.nodeName === 'BR') return;
    const tel = child.querySelector('a[href^="tel:"]');
    const links = [...child.querySelectorAll('a[href]')].filter((a) => !a.getAttribute('href').startsWith('tel:'));
    const t = clean(child.textContent);
    if (tel) {
      if (clean(tel.textContent)) v.phone.push(clean(tel.textContent));
      return;
    }
    if (/^dsn\b/i.test(t)) { v.phone.push(t); return; }
    const delivery = links.find((a) => /doordash\.com/i.test(a.getAttribute('href')));
    if (delivery) { v.delivery = copyLink(document, delivery, 'DoorDash'); return; }
    if (links.length) {
      // e.g. "↪ View Store Details", "pods.com/militaryexchange": keep the line, link included
      const prefix = clean([...child.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' '));
      const line = document.createElement('span');
      if (prefix) line.append(document.createTextNode(`${prefix} `));
      line.append(copyLink(document, links[0]));
      v.note.push(line);
      return;
    }
    if (!t) return;
    if (DAY.test(t)) v.hours.push(...brLines(child));
    else v.note.push(...brLines(child));
  });

  if (!v.name.length) v.name.push(groupName); // e.g. the "Exchange Admin" tile has no name of its own
  return v;
}

function vendorBlock(document, v) {
  const cells = [['Name', cellWithLines(document, v.name)]];
  if (v.logo) {
    const img = document.createElement('img');
    img.src = v.logo;
    cells.push(['Logo', img]);
  }
  if (v.location.length) cells.push(['Location', cellWithLines(document, v.location)]);
  if (v.phone.length) cells.push(['Phone', cellWithLines(document, v.phone)]);
  if (v.hours.length) cells.push(['Hours', cellWithLines(document, v.hours)]);
  if (v.delivery) cells.push(['Delivery', v.delivery]);
  if (v.note.length) cells.push(['Note', cellWithLines(document, v.note)]);
  return WebImporter.Blocks.createBlock(document, { name: 'vendor', cells });
}

export default function parse(element, { document, url, params = {} }) {
  const source = params.originalURL || url || (document.location && document.location.href);
  const storePath = new URL(source, 'https://www.shopmyexchange.com/').pathname.replace(/\/$/, '');
  params.fragments = params.fragments || [];
  const fragmentsByKey = new Map();
  const usedPaths = new Set();
  const out = [];
  let category = '';
  let subcategory = '';

  const fragmentFor = (v) => {
    const name = v.name.join(' ');
    const group = subcategory || category;
    const key = [name, group, v.phone.join('|')].join('::').toLowerCase();
    if (fragmentsByKey.has(key)) return fragmentsByKey.get(key);
    const nameSlug = slug(name);
    const groupSlug = slug(group);
    const leaf = !groupSlug || groupSlug === nameSlug ? nameSlug : `${nameSlug}-${groupSlug}`;
    const base = `${storePath}/vendors/${leaf}`;
    let path = base;
    for (let i = 2; usedPaths.has(path); i += 1) path = `${base}-${i}`;
    usedPaths.add(path);
    const frag = document.createElement('div');
    frag.append(vendorBlock(document, v));
    frag.append(WebImporter.Blocks.getMetadataBlock(document, { Robots: 'noindex' }));
    params.fragments.push({ element: frag, path });
    const entry = { path, name };
    fragmentsByKey.set(key, entry);
    return entry;
  };

  const visit = (el) => {
    [...el.children].forEach((c) => {
      if (/^H2$/.test(c.tagName)) {
        category = clean(c.textContent);
        subcategory = '';
        const h2 = document.createElement('h2');
        h2.textContent = category;
        out.push(h2);
        return;
      }
      if (c.classList.contains('aafes-title-box')) {
        const h3src = c.querySelector('h3');
        subcategory = h3src ? clean(h3src.textContent) : '';
        if (h3src) {
          const h3 = document.createElement('h3');
          h3.textContent = subcategory;
          out.push(h3);
        }
        // info lines under the heading: "Bldg. 4250", "Food> Snacks> Drinks", "Promo Code: EXCH"
        [...c.querySelectorAll('p')].forEach((p) => {
          const lines = brLines(p);
          if (!lines.length) return;
          const np = document.createElement('p');
          lines.forEach((l, i) => {
            if (i) np.append(document.createElement('br'));
            np.append(document.createTextNode(l));
          });
          out.push(np);
        });
        return;
      }
      const tiles = [...c.querySelectorAll(':scope > div > .shop-tile, :scope > .shop-tile')];
      if (c.classList.contains('flex-wrap') && tiles.length) {
        const rows = tiles.map((tile) => {
          const entry = fragmentFor(readTile(document, tile, subcategory || category));
          const a = document.createElement('a');
          a.href = entry.path;
          a.textContent = entry.name;
          return [a];
        });
        out.push(WebImporter.Blocks.createBlock(document, { name: 'vendor-list', cells: rows }));
        return;
      }
      if (c.children.length) visit(c);
    });
  };
  visit(element);

  // "Find it fast" quick search above the directory (not on the source page; added
  // for every store page so a re-import keeps it).
  if (out.length) {
    out.unshift(WebImporter.Blocks.createBlock(document, {
      name: 'vendor-search',
      cells: [
        ['Label', 'Find it fast'],
        ['Placeholder', 'Search vendors, e.g. Starbucks, barber, Bldg. 4250'],
      ],
    }));
  }

  element.replaceWith(...out);
}
