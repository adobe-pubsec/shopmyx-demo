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

// Category-page looks, picked from the content (or set by the author as a block variant):
//  - tiles: every image is a Scene7 product photo rendition (`<sku>_<color>:<preset>`,
//    e.g. 5009807_1191:2000-full-web). Home/deals icons are plain asset names.
//  - guides: every image is a guide/size-chart tile asset (`...-tile01`), or the
//    instance holds exactly 2 cards, as the category pages' guides row does.
const PRODUCT_PHOTO = /\/is\/image\/[^?]*:[^?/]+/;
const GUIDE_TILE = /-tile\d*(?:\?|$)/;

function detectLook(block) {
  if (block.classList.contains('tiles') || block.classList.contains('guides')) return;
  const srcs = [...block.querySelectorAll('img')].map((img) => img.getAttribute('src') || '');
  if (!srcs.length) return;
  if (srcs.every((src) => PRODUCT_PHOTO.test(src))) {
    block.classList.add('tiles');
  } else if (srcs.every((src) => GUIDE_TILE.test(src)) || block.querySelectorAll('li').length === 2) {
    block.classList.add('guides');
  }
}

// Authored option `see-more` ("Cards Category (see-more)"): show the first row of
// SEE_MORE_VISIBLE cards and a "See More" / "Show Less" toggle for the rest, as the
// source category panels do (#category > #toggle-button).
const SEE_MORE_VISIBLE = 6;
let seeMoreId = 0;

function addSeeMore(block, ul) {
  if (!block.classList.contains('see-more')) return;
  const cards = [...ul.children];
  if (cards.length <= SEE_MORE_VISIBLE) return;
  cards.slice(SEE_MORE_VISIBLE).forEach((card) => card.classList.add('cards-category-more'));
  seeMoreId += 1;
  ul.id = ul.id || `cards-category-list-${seeMoreId}`;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'cards-category-toggle';
  button.setAttribute('aria-controls', ul.id);
  button.setAttribute('aria-expanded', 'false');
  button.textContent = 'See More';
  button.addEventListener('click', () => {
    const expanded = block.classList.toggle('expanded');
    button.setAttribute('aria-expanded', String(expanded));
    button.textContent = expanded ? 'Show Less' : 'See More';
  });
  block.append(button);
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
  detectLook(block);
  addSeeMore(block, ul);
}
