import { createOptimizedPicture } from '../../scripts/aem.js';

let instanceCount = 0;

const PRICE = '\\$\\s?[\\d,.]+(?:\\s*-\\s*\\$\\s?[\\d,.]+)?';
const SALE_PRICE = new RegExp(`^(${PRICE})\\s+(${PRICE}\\s+Sale)$`, 'i');

/** Splits "$24.95 $19.96 Sale" into regular and sale price spans. */
function decoratePrice(el) {
  el.classList.add('cards-product-slider-price');
  if (el.children.length) return;
  const text = el.textContent.trim();
  if (!/\d/.test(text)) {
    // e.g. "Log in for Exchange pricing"
    el.classList.add('cards-product-slider-price-note');
    return;
  }
  const match = text.match(SALE_PRICE);
  if (!match) return;
  const [, regularText, saleText] = match;
  const regular = document.createElement('span');
  regular.textContent = regularText;
  const sale = document.createElement('span');
  sale.className = 'cards-product-slider-sale';
  sale.textContent = saleText;
  el.replaceChildren(regular, sale);
}

/**
 * Turns one authored row (image | name link + price lines) into a product card.
 * Cell contents are flattened into the card so a missing or merged cell still works.
 */
function buildCard(row) {
  const card = document.createElement('li');
  card.className = 'cards-product-slider-card';
  [...row.children].forEach((cell) => {
    if (cell.children.length) {
      while (cell.firstChild) card.append(cell.firstChild);
    } else if (cell.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = cell.textContent.trim();
      card.append(p);
    }
  });
  // Drop whitespace-only text nodes left from the cells
  [...card.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) node.remove();
  });

  const pic = card.querySelector('picture');
  if (pic) {
    // Link the image to the product link when it isn't already linked
    const link = [...card.querySelectorAll('a[href]')].find((a) => !a.contains(pic));
    if (!pic.closest('a') && link) {
      const anchor = link.cloneNode(false);
      anchor.removeAttribute('title');
      anchor.setAttribute('tabindex', '-1');
      anchor.setAttribute('aria-hidden', 'true');
      pic.replaceWith(anchor);
      anchor.append(pic);
    }
    // Outermost element holding the image (p, link or picture) is the image box
    let box = pic;
    while (box.parentElement && box.parentElement !== card) box = box.parentElement;
    box.classList.add('cards-product-slider-image');
  }

  const name = card.querySelector('a[href]:not([aria-hidden])');
  if (name) {
    const nameBox = name.closest('p, h2, h3, h4, h5, h6');
    (nameBox && nameBox.parentElement === card ? nameBox : name).classList.add('cards-product-slider-name');
  }

  [...card.querySelectorAll(':scope > p, :scope > div')].forEach((p) => {
    if (!p.classList.length && p.textContent.trim()) decoratePrice(p);
  });
  return card;
}

export default function decorate(block) {
  instanceCount += 1;
  const trackId = `cards-product-slider-${instanceCount}-track`;

  const products = [...block.children]
    .filter((row) => row.textContent.trim() || row.querySelector('picture, img'))
    .map(buildCard);

  const track = document.createElement('ul');
  track.className = 'cards-product-slider-track';
  track.id = trackId;
  track.append(...products);

  track.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }]));
  });

  if (!products.length) {
    block.replaceChildren(track);
    return;
  }

  const slider = document.createElement('div');
  slider.className = 'cards-product-slider-slider';

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'cards-product-slider-prev';
  prev.setAttribute('aria-label', 'Previous products');
  prev.setAttribute('aria-controls', trackId);

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'cards-product-slider-next';
  next.setAttribute('aria-label', 'Next products');
  next.setAttribute('aria-controls', trackId);

  const dots = document.createElement('div');
  dots.className = 'cards-product-slider-dots';

  const pageCount = () => {
    const first = track.firstElementChild;
    if (!first || !track.clientWidth) return 1;
    const cardWidth = first.getBoundingClientRect().width || track.clientWidth;
    const perPage = Math.max(1, Math.round(track.clientWidth / cardWidth));
    return Math.max(1, Math.ceil(products.length / perPage));
  };

  const currentPage = () => {
    const max = track.scrollWidth - track.clientWidth;
    if (max <= 0) return 0;
    return Math.round((track.scrollLeft / max) * (pageCount() - 1));
  };

  const goTo = (page) => {
    const pages = pageCount();
    const target = Math.min(Math.max(page, 0), pages - 1);
    const max = track.scrollWidth - track.clientWidth;
    track.scrollTo({ left: pages > 1 ? (max * target) / (pages - 1) : 0, behavior: 'smooth' });
  };

  const update = () => {
    const pages = pageCount();
    const page = currentPage();
    if (dots.children.length !== pages) {
      dots.replaceChildren();
      for (let i = 0; i < pages; i += 1) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'cards-product-slider-dot';
        dot.setAttribute('aria-label', `Show product page ${i + 1} of ${pages}`);
        dot.addEventListener('click', () => goTo(i));
        dots.append(dot);
      }
    }
    [...dots.children].forEach((dot, i) => {
      dot.setAttribute('aria-current', i === page);
    });
    slider.classList.toggle('cards-product-slider-single-page', pages <= 1);
  };

  // Arrows wrap around (first <-> last page), like the source slider
  prev.addEventListener('click', () => {
    const pages = pageCount();
    goTo((currentPage() - 1 + pages) % pages);
  });
  next.addEventListener('click', () => goTo((currentPage() + 1) % pageCount()));

  let ticking = false;
  track.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      ticking = false;
      update();
    });
  }, { passive: true });

  if (window.ResizeObserver) new ResizeObserver(update).observe(track);

  slider.append(prev, track, next, dots);
  block.replaceChildren(slider);
  update();
}
