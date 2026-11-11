import { createOptimizedPicture, toClassName } from '../../scripts/aem.js';

let instanceCount = 0;

/**
 * Splits a panel's authored content into product slides.
 * - A list: each <li> is one product.
 * - Otherwise: each picture starts a new product; following text/link lines join it.
 */
function buildSlides(content) {
  const slides = [];
  const list = content.querySelector(':scope > ul, :scope > ol');
  if (list) {
    [...list.children].forEach((li) => {
      const slide = document.createElement('li');
      while (li.firstChild) slide.append(li.firstChild);
      slides.push(slide);
    });
    return slides;
  }

  let current = null;
  [...content.children].forEach((child) => {
    const hasPic = child.matches('picture') || child.querySelector('picture');
    if (hasPic || !current) {
      current = document.createElement('li');
      slides.push(current);
    }
    current.append(child);
  });
  return slides.filter((s) => s.textContent.trim() || s.querySelector('picture, img'));
}

const PRICE = '\\$\\s?[\\d,.]+(?:\\s*-\\s*\\$\\s?[\\d,.]+)?';
const SALE_PRICE = new RegExp(`^(${PRICE})\\s+(${PRICE}\\s+Sale)$`, 'i');

/** Splits "$24.95 $19.96 Sale" into regular and sale price spans. */
function decoratePrice(el) {
  el.classList.add('tabs-product-recs-product-price');
  if (el.children.length) return;
  const text = el.textContent.trim();
  if (!/\d/.test(text)) {
    el.classList.add('tabs-product-recs-product-price-note');
    return;
  }
  const match = text.match(SALE_PRICE);
  if (!match) return;
  const [, regularText, saleText] = match;
  const regular = document.createElement('span');
  regular.textContent = regularText;
  const sale = document.createElement('span');
  sale.className = 'tabs-product-recs-product-sale';
  sale.textContent = saleText;
  el.replaceChildren(regular, sale);
}

function decorateSlide(slide) {
  slide.className = 'tabs-product-recs-product';
  const pic = slide.querySelector('picture');
  if (pic) {
    // Link the image to the product link when it isn't already linked
    const link = [...slide.querySelectorAll('a[href]')].find((a) => !a.contains(pic));
    if (!pic.closest('a') && link) {
      const anchor = link.cloneNode(false);
      anchor.setAttribute('tabindex', '-1');
      anchor.setAttribute('aria-hidden', 'true');
      pic.replaceWith(anchor);
      anchor.append(pic);
    }
    // Outermost element holding the image (p, link or picture) is the image box
    let box = pic;
    while (box.parentElement && box.parentElement !== slide) box = box.parentElement;
    box.classList.add('tabs-product-recs-product-image');
  }
  const name = slide.querySelector('a[href]:not([aria-hidden])');
  if (name) (name.closest('p, h2, h3, h4, h5, h6') || name).classList.add('tabs-product-recs-product-name');
  [...slide.querySelectorAll(':scope > p, :scope > div')].forEach((p) => {
    if (!p.classList.length && p.textContent.trim()) decoratePrice(p);
  });
}

function buildSlider(panelContent, panelId) {
  const slides = buildSlides(panelContent);
  const slider = document.createElement('div');
  slider.className = 'tabs-product-recs-slider';

  const track = document.createElement('ul');
  track.className = 'tabs-product-recs-track';
  track.id = `${panelId}-track`;
  slides.forEach((slide) => {
    decorateSlide(slide);
    track.append(slide);
  });

  if (!slides.length) {
    // Nothing that looks like products: keep authored content as-is.
    const fallback = document.createElement('div');
    fallback.className = 'tabs-product-recs-content';
    while (panelContent.firstChild) fallback.append(panelContent.firstChild);
    return fallback;
  }

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'tabs-product-recs-prev';
  prev.setAttribute('aria-label', 'Previous products');
  prev.setAttribute('aria-controls', track.id);

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'tabs-product-recs-next';
  next.setAttribute('aria-label', 'Next products');
  next.setAttribute('aria-controls', track.id);

  const dots = document.createElement('div');
  dots.className = 'tabs-product-recs-dots';

  const pageCount = () => {
    const first = track.firstElementChild;
    if (!first || !track.clientWidth) return 1;
    const slideWidth = first.getBoundingClientRect().width || track.clientWidth;
    const perPage = Math.max(1, Math.round(track.clientWidth / slideWidth));
    return Math.max(1, Math.ceil(slides.length / perPage));
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
        dot.className = 'tabs-product-recs-dot';
        dot.setAttribute('aria-label', `Show product page ${i + 1} of ${pages}`);
        dot.addEventListener('click', () => goTo(i));
        dots.append(dot);
      }
    }
    [...dots.children].forEach((dot, i) => {
      dot.setAttribute('aria-current', i === page);
    });
    slider.classList.toggle('tabs-product-recs-single-page', pages <= 1);
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
  slider.update = update;
  return slider;
}

export default function decorate(block) {
  instanceCount += 1;
  const prefix = `tabs-product-recs-${instanceCount}`;

  const tablist = document.createElement('div');
  tablist.className = 'tabs-product-recs-list';
  tablist.setAttribute('role', 'tablist');

  const rows = [...block.children].filter((row) => row.textContent.trim() || row.querySelector('picture, img'));
  const panels = [];
  const buttons = [];
  const used = new Set();

  rows.forEach((row, i) => {
    const [labelCell, ...contentCells] = [...row.children];
    if (!labelCell) return;
    let id = toClassName(labelCell.textContent) || `tab-${i + 1}`;
    while (used.has(id)) id = `${id}-${i + 1}`;
    used.add(id);
    const tabId = `${prefix}-tab-${id}`;
    const panelId = `${prefix}-panel-${id}`;

    const content = document.createElement('div');
    contentCells.forEach((cell) => { while (cell.firstChild) content.append(cell.firstChild); });

    const panel = document.createElement('div');
    panel.className = 'tabs-product-recs-panel';
    panel.id = panelId;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tabId);
    panel.setAttribute('aria-hidden', panels.length > 0);
    panel.append(buildSlider(content, panelId));

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tabs-product-recs-tab';
    button.id = tabId;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', panelId);
    button.setAttribute('aria-selected', buttons.length === 0);
    button.setAttribute('tabindex', buttons.length === 0 ? '0' : '-1');
    button.textContent = labelCell.textContent.trim();

    panels.push(panel);
    buttons.push(button);
    tablist.append(button);
  });

  const select = (index, focus = false) => {
    buttons.forEach((btn, i) => {
      const active = i === index;
      btn.setAttribute('aria-selected', active);
      btn.setAttribute('tabindex', active ? '0' : '-1');
      panels[i].setAttribute('aria-hidden', !active);
    });
    if (focus) buttons[index].focus();
    const slider = panels[index].querySelector('.tabs-product-recs-slider');
    if (slider && slider.update) slider.update();
  };

  buttons.forEach((btn, i) => {
    btn.addEventListener('click', () => select(i));
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') select((i + 1) % buttons.length, true);
      else if (e.key === 'ArrowLeft') select((i - 1 + buttons.length) % buttons.length, true);
      else if (e.key === 'Home') select(0, true);
      else if (e.key === 'End') select(buttons.length - 1, true);
      else return;
      e.preventDefault();
    });
  });

  block.replaceChildren();
  if (buttons.length > 1) block.append(tablist);
  panels.forEach((panel) => block.append(panel));

  block.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }]));
  });

  if (panels.length) select(0);
}
