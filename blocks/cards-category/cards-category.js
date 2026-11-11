import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Category card: icon image + text label; the label is the link text. Builds one
 * link wrapping icon and label so the whole item is a single click target.
 */
function decorateCard(li) {
  const pic = li.querySelector('picture');
  const links = [...li.querySelectorAll('a[href]')];
  const link = links.find((a) => a.textContent.trim()) || links[0] || null;

  const textCells = [...li.children].filter((cell) => !cell.querySelector('picture') || cell.textContent.trim());
  const labelText = link ? link.textContent.trim()
    : textCells.map((c) => c.textContent.trim()).filter(Boolean).join(' ');

  const target = link ? link.cloneNode(false) : document.createElement('div');
  target.classList.add('cards-category-link');

  const icon = document.createElement('span');
  icon.className = 'cards-category-card-image';
  if (pic) icon.append(pic);

  const label = document.createElement('span');
  label.className = 'cards-category-card-label';
  label.textContent = labelText;

  if (pic) target.append(icon);
  if (labelText) target.append(label);
  li.replaceChildren(target);
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('picture, img')) return;
    const li = document.createElement('li');
    li.className = 'cards-category-card';
    while (row.firstElementChild) li.append(row.firstElementChild);
    decorateCard(li);
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '300' }]));
  });

  // The visible label names the link; make the icon decorative so the name is not
  // read twice ("Electronics Electronics"). Icons without a label keep their alt.
  ul.querySelectorAll('.cards-category-link').forEach((link) => {
    const label = link.querySelector('.cards-category-card-label');
    if (!label) return;
    link.querySelectorAll('img').forEach((img) => { img.alt = ''; });
    // decorateButtons copies the text into title; it only repeats the label
    if (link.title && link.title.trim() === label.textContent.trim()) link.removeAttribute('title');
  });

  block.replaceChildren(ul);
}
