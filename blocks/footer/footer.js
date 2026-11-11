// breakpoint at which link groups are always open (no accordion)
const isDesktop = window.matchMedia('(width >= 900px)');

/**
 * Fetches the footer fragment. Metadata-independent dual fetch:
 * /content/footer.plain.html (local preview) first, then /footer.plain.html (DA/EDS).
 * @returns {Promise<{html: string, base: string}|null>}
 */
async function fetchFooter() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  return { html: await resp.text(), base: resp.url };
}

function parseFooter({ html, base }) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), base).href;
    img.loading = 'lazy';
    img.decoding = 'async';
  });
  doc.querySelectorAll('a[target="_blank"]').forEach((a) => a.setAttribute('rel', 'noopener noreferrer'));
  return [...doc.body.children].filter((el) => el.tagName === 'DIV');
}

const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else node.setAttribute(k, v);
  });
  children.flat().filter(Boolean).forEach((c) => node.append(c));
  return node;
};

/** Role detection — generic, based on content shape only. */
function classify(sections) {
  const roles = {};
  sections.forEach((s) => {
    if (!roles.links && s.querySelectorAll(':scope > h3').length >= 2 && s.querySelector(':scope > ul')) roles.links = s;
    else if (!roles.signup && s.querySelector(':scope > h2')) roles.signup = s;
    else if (!roles.promo && s.querySelector(':scope > h3 > a')) roles.promo = s;
    else if (!roles.legal && s.querySelector(':scope > ul')) roles.legal = s;
  });
  return roles;
}

/**
 * Newsletter band: icon, heading, text, field placeholder (paragraph without link)
 * and a submit link whose href becomes the form action.
 */
function buildSignup(section) {
  const band = el('div', { class: 'footer-signup' });
  const ps = [...section.querySelectorAll(':scope > p')];
  const iconP = ps.find((p) => p.querySelector('img') && !p.textContent.trim());
  const submitA = section.querySelector(':scope > p > a');
  const textPs = ps.filter((p) => p !== iconP && !p.querySelector('a'));
  const intro = el('div', { class: 'footer-signup-intro' });
  if (iconP) intro.append(el('span', { class: 'footer-signup-icon' }, iconP.querySelector('img')));
  const copy = el('div', { class: 'footer-signup-copy' });
  const h2 = section.querySelector(':scope > h2');
  if (h2) copy.append(el('p', { class: 'footer-signup-title' }, h2.textContent.trim()));
  if (textPs[0]) copy.append(el('p', { class: 'footer-signup-text' }, textPs[0].textContent.trim()));
  intro.append(copy);
  band.append(intro);

  if (submitA) {
    const placeholder = textPs[1] ? textPs[1].textContent.trim() : '';
    const id = 'footer-signup-email';
    const form = el('form', {
      class: 'footer-signup-form', action: submitA.getAttribute('href'), method: 'get', novalidate: '',
    });
    const label = el('label', { for: id, class: 'footer-sr-only' }, placeholder);
    const input = el('input', {
      id, type: 'email', name: 'email', placeholder, autocomplete: 'email', required: '',
    });
    const button = el('button', { type: 'submit' }, submitA.textContent.trim());
    const error = el('p', { class: 'footer-signup-error', 'aria-live': 'polite' });
    form.addEventListener('submit', (e) => {
      if (!input.checkValidity()) {
        e.preventDefault();
        error.textContent = input.validationMessage;
        input.setAttribute('aria-invalid', 'true');
      }
    });
    input.addEventListener('input', () => {
      error.textContent = '';
      input.removeAttribute('aria-invalid');
    });
    form.append(label, input, button, error);
    band.append(form);
  }
  return band;
}

/** Promo box: the heading link becomes the whole clickable card; the icon frames the heading. */
function buildPromo(section) {
  const link = section.querySelector(':scope > h3 > a');
  if (!link) return null;
  const ps = [...section.querySelectorAll(':scope > p')];
  const icon = ps.map((p) => p.querySelector('img')).find(Boolean);
  const texts = ps.filter((p) => p.textContent.trim());
  const card = el('a', { class: 'footer-promo', href: link.getAttribute('href') });
  if (texts[0]) card.append(el('span', { class: 'footer-promo-eyebrow' }, texts[0].textContent.trim()));
  const mid = el('span', { class: 'footer-promo-title' });
  if (icon) mid.append(icon.cloneNode(true));
  mid.append(el('span', {}, link.textContent.trim()));
  if (icon) mid.append(icon.cloneNode(true));
  card.append(mid);
  if (texts[1]) card.append(el('span', { class: 'footer-promo-caption' }, texts[1].textContent.trim()));
  return card;
}

/** Link groups: each h3 + following ul becomes a column group (accordion on mobile). */
function buildLinks(section) {
  const grid = el('div', { class: 'footer-links' });
  [...section.querySelectorAll(':scope > h3')].forEach((h3, i) => {
    const list = h3.nextElementSibling && h3.nextElementSibling.tagName === 'UL' ? h3.nextElementSibling : el('ul');
    const listId = `footer-group-${i}`;
    list.id = listId;
    const toggle = el('button', {
      type: 'button', class: 'footer-group-toggle', 'aria-expanded': 'false', 'aria-controls': listId,
    }, h3.textContent.trim());
    const group = el('div', { class: 'footer-group' }, el('h3', {}, toggle), list);
    toggle.addEventListener('click', () => {
      if (isDesktop.matches) return;
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      group.classList.toggle('open', open);
    });
    grid.append(group);
  });
  return grid;
}

/**
 * Share icons and the trust badge open their target in a small popup window,
 * like the source's share widget and certificate overlay.
 */
function popupButton(a, label) {
  const btn = el('button', { type: 'button', 'aria-label': label, 'data-popup': a.getAttribute('href') });
  [...a.childNodes].forEach((n) => btn.append(n));
  btn.addEventListener('click', () => {
    const win = window.open(a.href, 'footer-popup', 'popup,width=640,height=560');
    if (win) win.opener = null;
  });
  return btn;
}

/** Legal strip: copyright, legal links, share icons, trust badge and back-to-top. */
function buildLegal(section) {
  const strip = el('div', { class: 'footer-legal' });
  const lists = [...section.querySelectorAll(':scope > ul')];
  const ps = [...section.querySelectorAll(':scope > p')];
  const copyright = ps.find((p) => !p.querySelector('a'));
  const start = el('div', { class: 'footer-legal-start' });
  if (copyright) {
    copyright.className = 'footer-copyright';
    start.append(copyright);
  }
  if (lists[0]) {
    lists[0].className = 'footer-legal-links';
    start.append(lists[0]);
  }
  const end = el('div', { class: 'footer-legal-end' });
  if (lists[1]) {
    lists[1].className = 'footer-social';
    lists[1].querySelectorAll('a').forEach((a) => {
      const img = a.querySelector('img');
      a.replaceWith(popupButton(a, img ? img.alt : a.textContent.trim()));
    });
    end.append(lists[1]);
  }
  let top = null;
  ps.filter((p) => p.querySelector('a')).forEach((p) => {
    const a = p.querySelector('a');
    if (a.getAttribute('href') === '#top') {
      top = a;
      return;
    }
    p.className = 'footer-badge';
    const img = a.querySelector('img');
    a.replaceWith(popupButton(a, img ? img.alt : a.textContent.trim()));
    end.append(p);
  });
  strip.append(start, end);
  if (top) {
    top.className = 'footer-back-to-top';
    [...top.childNodes].forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE && n.textContent.trim()) n.replaceWith(el('span', {}, n.textContent.trim()));
    });
    top.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    const toggleTop = () => top.classList.toggle('visible', window.scrollY > 300);
    window.addEventListener('scroll', toggleTop, { passive: true });
    toggleTop();
  }
  return { strip, top };
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooter();
  if (!fragment) return;
  const roles = classify(parseFooter(fragment));
  block.textContent = '';
  const footer = el('div', { class: 'footer-inner' });
  if (roles.signup || roles.promo) {
    const band = el('div', { class: 'footer-band' });
    if (roles.signup) band.append(buildSignup(roles.signup));
    const promo = roles.promo ? buildPromo(roles.promo) : null;
    if (promo) band.append(promo);
    footer.append(band);
  }
  if (roles.links) footer.append(buildLinks(roles.links));
  if (roles.legal) {
    const { strip, top } = buildLegal(roles.legal);
    footer.append(strip);
    if (top) footer.append(top);
  }
  // groups are always open on desktop
  isDesktop.addEventListener('change', () => {
    footer.querySelectorAll('.footer-group').forEach((g) => {
      g.classList.remove('open');
      g.querySelector('.footer-group-toggle').setAttribute('aria-expanded', 'false');
    });
  });
  block.append(footer);
}
