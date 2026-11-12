/*
 * Store info: the header of a store-locator page, authored as key-value rows.
 *
 * | Store Info  |                                       |
 * | Name        | Ft Hood Main Exchange                 |  page heading (h1)
 * | Image       | (store photo)                         |  banner beside the details
 * | Address     | Clear Creek Exchange / Bldg. 4250 ... |  one line per row of the address
 * | Store Hours | Mon-Sat 0900-2000 / Sun 0900-1800     |  other keys: shown with the key as label
 * | Phone       | 254-532-7200 / HR Office 254-532-9514 |  dialable numbers get tel: links
 */

const DIALABLE_END = /(\+?1?[\s.-]*\(?\d{3}\)?[\s.-]*\d{3}[\s.-]*\d{4})\s*$/;

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

/** "HR Office 254-532-9514" -> "HR Office " + tel link; lines with links are kept as authored. */
function linkPhone(nodes) {
  const text = nodes.map((n) => n.textContent).join('').trim();
  const match = text.match(DIALABLE_END);
  if (nodes.some((n) => n.nodeName === 'A') || !match || /^DSN\b/i.test(text)) return nodes;
  const label = text.slice(0, match.index).trim();
  const a = document.createElement('a');
  a.href = `tel:${match[1].replace(/[^\d+]/g, '')}`;
  a.textContent = match[1].trim();
  return [...(label ? [document.createTextNode(`${label} `)] : []), a];
}

function paragraph(className, lineList, phone) {
  const p = document.createElement('p');
  p.className = className;
  lineList.forEach((l, i) => {
    if (i) p.append(document.createElement('br'));
    p.append(...(phone ? linkPhone(l) : l));
  });
  return p;
}

export default function decorate(block) {
  const details = document.createElement('div');
  details.className = 'store-info-details';
  const media = document.createElement('div');
  media.className = 'store-info-image';

  [...block.children].forEach((row) => {
    const [keyCell, valueCell] = row.children;
    if (!keyCell || !valueCell) return;
    const label = keyCell.textContent.trim();
    const key = label.toLowerCase();
    if (key === 'name') {
      const h1 = document.createElement('h1');
      h1.textContent = valueCell.textContent.trim();
      details.append(h1);
    } else if (key === 'image') {
      const pic = valueCell.querySelector('picture, img');
      if (pic) media.append(pic);
    } else if (key === 'address') {
      details.append(paragraph('store-info-address', lines(valueCell)));
    } else {
      const title = document.createElement('p');
      title.className = 'store-info-label';
      title.textContent = `${label}:`;
      details.append(title, paragraph(`store-info-value store-info-${key.replace(/[^a-z0-9]+/g, '-')}`, lines(valueCell), true));
    }
  });

  block.replaceChildren(details, ...(media.children.length ? [media] : []));
  const img = media.querySelector('img');
  if (img) {
    img.loading = 'eager';
    img.fetchPriority = 'high';
  }
}
