/*
 * Vendor: one vendor at a store location, authored as key-value rows (like the metadata
 * block) in its own fragment. Placed on store pages with the vendor-list block.
 *
 * | Vendor   |                                      |
 * | Name     | Starbucks                            |  required
 * | Logo     | (image or Dynamic Media link)        |
 * | Location | Bldg. 50006                          |  optional, building inside a group
 * | Phone    | (254) 532-0055                       |  one per line; dialable ones get tel:
 * | Hours    | Mon-Fri 0700-1900 / Sat 0800-1900    |  free text, shown line by line
 * | Delivery | [DoorDash](https://www.doordash.com/) |  badge from /icons, linked
 * | Note     | free text, links allowed             |
 */

const KEYS = ['name', 'logo', 'location', 'phone', 'hours', 'delivery', 'note'];

// Delivery partner badges, matched by the link's site.
const DELIVERY_BADGES = [
  { host: /(^|\.)doordash\.com$/i, icon: '/icons/delivery-doordash.png', label: 'DoorDash' },
];

const DIALABLE = /^\+?1?[\s.-]*\(?\d{3}\)?[\s.-]*\d{3}[\s.-]*\d{4}$/;

function isPreview() {
  const { hostname } = window.location;
  return hostname === 'localhost' || hostname.endsWith('.aem.page') || hostname.endsWith('.hlx.page');
}

function warn(el, message) {
  if (!isPreview()) return;
  el.classList.add('vendor-warning');
  const list = el.dataset.warning ? `${el.dataset.warning}; ` : '';
  el.dataset.warning = `${list}${message}`;
}

/** Reads the key-value rows: { key: valueCell }. Unknown keys are returned separately. */
function readFields(block) {
  const fields = {};
  const unknown = [];
  [...block.children].forEach((row) => {
    const [keyCell, valueCell] = row.children;
    if (!keyCell) return;
    const key = keyCell.textContent.trim().toLowerCase();
    if (!key) return;
    if (KEYS.includes(key)) fields[key] = valueCell || document.createElement('div');
    else unknown.push(keyCell.textContent.trim());
  });
  return { fields, unknown };
}

/** The cell's content split into lines (paragraphs and <br>-separated text), as nodes. */
function lines(cell) {
  const out = [];
  let current = [];
  const flush = () => {
    if (current.some((n) => n.textContent.trim() || n.nodeName === 'A')) out.push(current);
    current = [];
  };
  const walk = (parent) => {
    [...parent.childNodes].forEach((node) => {
      if (node.nodeName === 'BR') {
        flush();
      } else if (node.nodeName === 'P' || node.nodeName === 'DIV') {
        flush();
        walk(node);
        flush();
      } else {
        current.push(node);
      }
    });
  };
  walk(cell);
  flush();
  return out;
}

function lineElement(className, nodes) {
  const p = document.createElement('p');
  p.className = className;
  p.append(...nodes);
  return p;
}

function phoneLine(nodes) {
  const text = nodes.map((n) => n.textContent).join('').trim();
  const p = lineElement('vendor-phone', nodes);
  if (!p.querySelector('a[href^="tel:"]')) {
    // "(254) 532-0055" or "HR Office 254-532-9514": link the number, keep any label.
    const match = text.match(/(\+?1?[\s.-]*\(?\d{3}\)?[\s.-]*\d{3}[\s.-]*\d{4})\s*$/);
    if (match && DIALABLE.test(match[1].trim()) && !/^DSN\b/i.test(text)) {
      const label = text.slice(0, match.index).trim();
      const a = document.createElement('a');
      a.href = `tel:${match[1].replace(/[^\d+]/g, '')}`;
      a.textContent = match[1].trim();
      p.replaceChildren(...(label ? [document.createTextNode(`${label} `)] : []), a);
    }
  }
  return p;
}

function deliveryBadge(cell, block) {
  const link = cell.querySelector('a[href]');
  if (!link) return null;
  let host = '';
  try { host = new URL(link.href).hostname; } catch { /* not a URL */ }
  const badge = DELIVERY_BADGES.find((b) => b.host.test(host));
  const a = document.createElement('a');
  a.href = link.href;
  a.className = 'vendor-delivery';
  if (!badge) {
    a.textContent = link.textContent.trim() || host;
    warn(block, `no badge for delivery partner "${host}"`);
    return a;
  }
  const img = document.createElement('img');
  img.src = badge.icon;
  img.alt = `Order on ${link.textContent.trim() || badge.label}`;
  img.width = 121;
  img.height = 28;
  img.loading = 'lazy';
  a.append(img);
  return a;
}

export default function decorate(block) {
  const { fields, unknown } = readFields(block);
  const logo = document.createElement('div');
  logo.className = 'vendor-logo';
  const body = document.createElement('div');
  body.className = 'vendor-body';

  const pic = fields.logo && (fields.logo.querySelector('picture') || fields.logo.querySelector('img'));
  if (pic) {
    pic.querySelectorAll('img').forEach((img) => { img.alt = ''; }); // the name is shown next to it
    if (pic.tagName === 'IMG') pic.alt = '';
    logo.append(pic);
  }

  const name = fields.name && fields.name.textContent.trim();
  if (name) {
    const h = document.createElement('p');
    h.className = 'vendor-name';
    // keep authored line breaks in long names ("Durable Medical Equipment / (Barber D.M.E.)")
    lines(fields.name).forEach((l, i) => {
      if (i) h.append(document.createElement('br'));
      h.append(...l);
    });
    body.append(h);
  } else {
    warn(block, 'missing Name');
  }

  if (fields.location) lines(fields.location).forEach((l) => body.append(lineElement('vendor-location', l)));
  if (fields.phone) lines(fields.phone).forEach((l) => body.append(phoneLine(l)));
  if (fields.hours) {
    const hours = lines(fields.hours);
    if (hours.length) {
      const p = document.createElement('p');
      p.className = 'vendor-hours';
      hours.forEach((l, i) => {
        if (i) p.append(document.createElement('br'));
        p.append(...l);
      });
      body.append(p);
    }
  }
  if (fields.note) lines(fields.note).forEach((l) => body.append(lineElement('vendor-note', l)));
  if (fields.delivery) {
    const badge = deliveryBadge(fields.delivery, block);
    if (badge) {
      const p = document.createElement('p');
      p.className = 'vendor-delivery-line';
      p.append(badge);
      body.append(p);
    }
  }
  if (unknown.length) warn(block, `unknown ${unknown.length > 1 ? 'keys' : 'key'}: ${unknown.join(', ')}`);

  block.replaceChildren(...(pic ? [logo] : []), body);
  if (!pic) block.classList.add('vendor-no-logo');
}
