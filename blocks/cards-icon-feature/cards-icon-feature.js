import { createOptimizedPicture } from '../../scripts/aem.js';

const TITLE_TAG = 'H4';

/**
 * Icon feature item: icon, title (heading or first strong/plain line) and one or more
 * linked lines. Cells are merged and classified by content, so authors can put the icon
 * in its own cell or in the text cell.
 */
function decorateCard(li) {
  const icon = document.createElement('div');
  icon.className = 'cards-icon-feature-card-image';
  const body = document.createElement('div');
  body.className = 'cards-icon-feature-card-body';

  [...li.children].forEach((cell) => {
    [...cell.children].forEach((child) => {
      const pic = child.matches('picture') ? child : child.querySelector('picture');
      if (pic && !child.textContent.trim() && !icon.children.length) {
        // keep a linked icon linked
        const picLink = pic.closest('a');
        icon.append(picLink && child.contains(picLink) ? picLink : pic);
      } else if (child.textContent.trim() || child.querySelector('picture, img')) {
        body.append(child);
      }
    });
    // stray text nodes directly in the cell
    const loose = [...cell.childNodes]
      .filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
    if (loose.length) {
      const p = document.createElement('p');
      p.textContent = loose.map((n) => n.textContent.trim()).join(' ');
      body.append(p);
    }
  });

  let title = body.querySelector('h1, h2, h3, h4, h5, h6')
    || (body.firstElementChild && !body.firstElementChild.querySelector('a') ? body.firstElementChild : null);
  if (title && /^H[1-6]$/.test(title.tagName) && title.tagName !== TITLE_TAG) {
    // card titles nest under the section's h3 heading: render as h4, keep id/attributes
    const heading = document.createElement(TITLE_TAG);
    [...title.attributes].forEach(({ name, value }) => heading.setAttribute(name, value));
    heading.append(...title.childNodes);
    title.replaceWith(heading);
    title = heading;
  }
  if (title) title.classList.add('cards-icon-feature-card-title');

  li.replaceChildren();
  if (icon.children.length) li.append(icon);
  if (body.children.length) li.append(body);
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('picture, img')) return;
    const li = document.createElement('li');
    li.className = 'cards-icon-feature-card';
    while (row.firstElementChild) li.append(row.firstElementChild);
    decorateCard(li);
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '300' }]));
  });

  block.replaceChildren(ul);
}
