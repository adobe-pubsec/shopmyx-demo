/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-image-banner (www.shopmyexchange.com, template: home).
 * Source: #mt_id_hero.grid > .carousel > .carousel-slides > .carousel-slide > a > img
 * (desktop image; the mobile-only duplicate is removed by the cleanup transformer).
 * Output: row 1 = linked banner image; row 2 = optional text (only if the slide has text).
 */
export default function parse(element, { document, params }) {
  const slide = element.querySelector('.carousel-slide') || element;
  const imgs = Array.from(slide.querySelectorAll('img'))
    .filter((img) => !img.closest('.carousel-control'));
  // Prefer the desktop image when both responsive copies are still present.
  const img = imgs.find((i) => /md:block/.test(i.getAttribute('class') || '')) || imgs[0];

  const cells = [];
  if (img) {
    const image = document.createElement('img');
    image.src = img.getAttribute('src');
    if (img.getAttribute('alt')) image.alt = img.getAttribute('alt');
    const link = img.closest('a');
    if (link && link.getAttribute('href')) {
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.append(image);
      cells.push([a]);
    } else {
      cells.push([image]);
    }
  }

  // Optional text row: headings / paragraphs authored inside the slide (none on the home page).
  const textEls = Array.from(slide.querySelectorAll('h1, h2, h3, h4, h5, h6, p'))
    .filter((el) => el.textContent.trim());
  if (textEls.length) cells.push([textEls]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-image-banner', cells });
  element.replaceWith(block);
}
