// breakpoint at which the full two-row desktop header is shown
const isDesktop = window.matchMedia('(width >= 900px)');

/**
 * Fetches the nav fragment. Metadata-independent dual fetch:
 * /content/nav.plain.html (local preview) first, then /nav.plain.html (DA/EDS).
 * @returns {Promise<{html: string, base: string}|null>}
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  return { html: await resp.text(), base: resp.url };
}

/**
 * Parses the fragment and resolves relative image URLs against the fragment URL,
 * so `images/foo.png` works wherever the header is rendered.
 */
function parseNav({ html, base }) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), base).href;
    img.loading = 'lazy';
    img.decoding = 'async';
  });
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

/** wraps bare text nodes of a link in spans so labels can be styled apart from icons */
function wrapLabels(a) {
  [...a.childNodes].forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE && n.textContent.trim()) n.replaceWith(el('span', {}, n.textContent.trim()));
  });
}

/** Role detection for nav sections — generic, based on content shape and order only. */
function classifySections(sections) {
  const roles = {};
  sections.forEach((section) => {
    const hasP = section.querySelector(':scope > p');
    const lists = section.querySelectorAll(':scope > ul').length;
    if (!roles.megamenu && section.querySelector(':scope > ul > li > ul')) roles.megamenu = section;
    else if (!roles.secondary && lists >= 2) roles.secondary = section;
    else if (hasP && lists === 1 && !roles.tools) roles.tools = section;
    else if (hasP && lists === 1 && roles.tools) roles.compact = section;
    else if (!roles.brand && section.querySelector('a img')) roles.brand = section;
  });
  return roles;
}

function buildBrand(section) {
  const brand = el('div', { class: 'nav-brand' });
  const link = section && section.querySelector('a');
  if (link) {
    const imgs = link.querySelectorAll('img');
    if (imgs[0]) imgs[0].classList.add('nav-logo-full');
    if (imgs[1]) imgs[1].classList.add('nav-logo-compact');
    imgs.forEach((img) => { img.loading = 'eager'; });
    brand.append(link);
  }
  return brand;
}

/** Search form: placeholder text and submit icon come from the fragment paragraphs. */
function buildSearch(section, compactSection) {
  const p = section && section.querySelector(':scope > p');
  if (!p) return null;
  const icon = p.querySelector('img');
  const full = p.textContent.trim();
  const compactP = compactSection && compactSection.querySelector(':scope > p');
  const compact = compactP ? compactP.textContent.trim() : full;
  const input = el('input', {
    type: 'search', name: 'query', placeholder: full, 'aria-label': full, autocomplete: 'off',
  });
  const setPlaceholder = () => { input.placeholder = isDesktop.matches ? full : compact; };
  setPlaceholder();
  isDesktop.addEventListener('change', setPlaceholder);
  const submit = el('button', { type: 'submit', class: 'nav-search-submit', 'aria-label': (icon && icon.alt) || 'Search' });
  if (icon) {
    icon.alt = '';
    submit.append(icon);
  }
  return el('form', {
    class: 'nav-search', action: '/browse', method: 'get', role: 'search',
  }, input, submit);
}

function buildTools(section, compactHrefs, secondary) {
  const ul = section && section.querySelector(':scope > ul');
  if (!ul) return null;
  ul.className = 'nav-tools';
  ul.querySelectorAll(':scope > li').forEach((li) => {
    const a = li.querySelector('a');
    if (!a) return;
    const img = a.querySelector('img');
    if (img && !a.textContent.trim()) {
      a.setAttribute('aria-label', img.alt || '');
      img.alt = '';
    }
    wrapLabels(a);
    // links that are also listed in the mobile drawer are not repeated in the compact bar
    if (compactHrefs.has(a.getAttribute('href'))) li.classList.add('nav-tool-in-drawer');
  });
  // icon links from the secondary row are surfaced as icons in the compact bar
  if (secondary) {
    secondary.querySelectorAll(':scope > ul > li > a').forEach((a) => {
      if (!a.querySelector('img')) return;
      const clone = a.cloneNode(true);
      clone.setAttribute('aria-label', a.textContent.trim());
      clone.querySelectorAll('img').forEach((i) => { i.alt = ''; });
      wrapLabels(clone);
      const li = el('li', { class: 'nav-tool-compact' }, clone);
      ul.insertBefore(li, ul.lastElementChild);
    });
  }
  return ul;
}

function buildSecondary(section) {
  const row = el('div', { class: 'nav-row nav-row-secondary' });
  if (!section) return row;
  section.querySelectorAll(':scope > ul').forEach((ul, i) => {
    ul.className = i === 0 ? 'nav-links nav-links-start' : 'nav-links nav-links-end';
    ul.querySelectorAll('a').forEach(wrapLabels);
    row.append(ul);
  });
  return row;
}

/** Mobile drawer links (mobile-only section of the fragment). */
function buildDrawerLinks(section) {
  const ul = section && section.querySelector(':scope > ul');
  if (!ul) return null;
  ul.className = 'nav-drawer-links';
  ul.querySelectorAll('a').forEach(wrapLabels);
  return ul;
}

/**
 * Megamenu: a trigger paragraph, a heading, a close icon and a list of categories.
 * Each category <li> holds its link, a <ul> of groups and an optional <ul> rail
 * (text links + promo images). Desktop: sidebar + hover panel. Mobile: drawer with
 * category sub-panels (chevron) and single-open group accordions.
 */
function buildMegamenu(section, nav, drawerLinks) {
  const triggerP = section.querySelector(':scope > p');
  const heading = section.querySelector(':scope > h2, :scope > h3');
  const closeImg = [...section.querySelectorAll(':scope > p')].map((p) => p.querySelector('img')).filter(Boolean)[1];
  const categories = section.querySelector(':scope > ul');
  const triggerLabel = triggerP ? triggerP.textContent.trim() : '';

  const trigger = el('button', {
    type: 'button', class: 'nav-shop-trigger nav-hamburger', 'aria-expanded': 'false', 'aria-controls': 'nav-flyout', 'aria-haspopup': 'true', 'aria-label': heading ? heading.textContent.trim() : triggerLabel,
  });
  if (triggerP) {
    const icon = triggerP.querySelector('img');
    if (icon) {
      icon.alt = '';
      trigger.append(icon);
    }
    trigger.append(el('span', {}, triggerLabel));
  }

  const flyout = el('div', { class: 'nav-flyout', id: 'nav-flyout', hidden: '' });
  const sidebar = el('div', { class: 'nav-flyout-sidebar' });
  const header = el('div', { class: 'nav-flyout-header' });
  if (heading) header.append(el('h2', {}, heading.textContent.trim()));
  const close = el('button', { type: 'button', class: 'nav-flyout-close', 'aria-label': (closeImg && closeImg.alt) || 'Close' });
  if (closeImg) {
    closeImg.alt = '';
    close.append(closeImg.cloneNode(true));
  }
  header.append(close);
  sidebar.append(header);
  const panels = el('div', { class: 'nav-flyout-panels' });
  const catList = el('ul', { class: 'nav-categories' });

  const showPanel = (item) => {
    catList.querySelectorAll('.nav-category').forEach((c) => c.classList.toggle('active', c === item));
    panels.querySelectorAll('.nav-panel').forEach((p) => { p.hidden = p.id !== item.dataset.panel; });
    flyout.classList.add('has-panel');
  };
  const closeSubPanel = () => {
    flyout.classList.remove('sub-open', 'has-panel');
    panels.querySelectorAll('.nav-panel').forEach((p) => { p.hidden = true; });
    catList.querySelectorAll('.nav-category.active').forEach((c) => c.classList.remove('active'));
  };

  [...(categories ? categories.children : [])].forEach((li, i) => {
    const link = li.querySelector(':scope > a');
    const lists = li.querySelectorAll(':scope > ul');
    const panelId = `nav-panel-${i}`;
    const label = link ? link.textContent.trim() : '';
    const item = el('li', { class: 'nav-category', 'data-panel': panelId });
    if (link) item.append(link);
    const open = el('button', {
      type: 'button', class: 'nav-category-open', 'aria-controls': panelId, 'aria-label': `Show ${label} categories`,
    });
    item.append(open);
    catList.append(item);

    const panel = el('div', { class: 'nav-panel', id: panelId, hidden: '' });
    const back = el('div', { class: 'nav-panel-header' });
    const backBtn = el('button', { type: 'button', class: 'nav-panel-back' }, el('span', {}, label));
    const panelClose = el('button', { type: 'button', class: 'nav-flyout-close', 'aria-label': close.getAttribute('aria-label') });
    if (closeImg) panelClose.append(closeImg.cloneNode(true));
    back.append(backBtn, panelClose);
    panel.append(back);
    backBtn.addEventListener('click', closeSubPanel);

    if (lists[0]) {
      lists[0].className = 'nav-panel-groups';
      lists[0].querySelectorAll(':scope > li').forEach((g) => {
        g.className = 'nav-panel-group';
        const sub = g.querySelector(':scope > ul');
        if (!sub) return;
        const last = sub.lastElementChild;
        if (last && last.querySelector('a') && /^see more$/i.test(last.textContent.trim())) last.className = 'nav-panel-more';
        const head = g.querySelector(':scope > a');
        const toggle = el('button', {
          type: 'button', class: 'nav-group-toggle', 'aria-expanded': 'false', 'aria-label': `Expand ${head ? head.textContent.trim() : ''}`,
        });
        if (head) head.after(toggle);
        toggle.addEventListener('click', () => {
          const expand = !g.classList.contains('expanded');
          lists[0].querySelectorAll('.nav-panel-group.expanded').forEach((o) => {
            o.classList.remove('expanded');
            o.querySelector('.nav-group-toggle').setAttribute('aria-expanded', 'false');
          });
          g.classList.toggle('expanded', expand);
          toggle.setAttribute('aria-expanded', expand ? 'true' : 'false');
        });
      });
      panel.append(lists[0]);
    }
    if (lists[1]) {
      lists[1].className = 'nav-panel-rail';
      const firstText = [...lists[1].children].find((r) => !r.querySelector('img'));
      if (firstText) firstText.className = 'nav-panel-rail-title';
      panel.append(lists[1]);
    }
    panels.append(panel);

    item.addEventListener('mouseenter', () => { if (isDesktop.matches) showPanel(item); });
    if (link) link.addEventListener('focus', () => { if (isDesktop.matches) showPanel(item); });
    open.addEventListener('click', () => {
      showPanel(item);
      if (!isDesktop.matches) {
        flyout.classList.add('sub-open');
        flyout.scrollTop = 0;
      }
    });
  });
  sidebar.append(catList);
  if (drawerLinks) sidebar.append(drawerLinks);
  flyout.append(sidebar, panels);
  const overlay = el('div', { class: 'nav-overlay', hidden: '' });

  const setOpen = (isOpen) => {
    trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    flyout.hidden = !isOpen;
    overlay.hidden = !isOpen;
    nav.classList.toggle('flyout-open', isOpen);
    document.body.classList.toggle('nav-drawer-open', isOpen && !isDesktop.matches);
    if (!isOpen) closeSubPanel();
  };
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(trigger.getAttribute('aria-expanded') !== 'true');
  });
  flyout.querySelectorAll('.nav-flyout-close').forEach((btn) => btn.addEventListener('click', () => { setOpen(false); trigger.focus(); }));
  overlay.addEventListener('click', () => setOpen(false));
  document.addEventListener('click', (e) => {
    if (trigger.getAttribute('aria-expanded') === 'true' && !flyout.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && trigger.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      trigger.focus();
    }
  });

  const wrap = el('div', { class: 'nav-shop' }, trigger, flyout, overlay);
  wrap.closeFlyout = () => setOpen(false);
  return wrap;
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  if (!fragment) return;
  const roles = classifySections(parseNav(fragment));
  const compactHrefs = new Set([...(roles.compact ? roles.compact.querySelectorAll('a') : [])].map((a) => a.getAttribute('href')));

  block.textContent = '';
  const nav = el('nav', { id: 'nav', 'aria-label': 'Main' });
  const main = el('div', { class: 'nav-row nav-row-main' });
  main.append(buildBrand(roles.brand));
  const drawerLinks = buildDrawerLinks(roles.compact);
  const shop = roles.megamenu ? buildMegamenu(roles.megamenu, nav, drawerLinks) : null;
  if (shop) main.append(shop);
  const search = buildSearch(roles.tools, roles.compact);
  if (search) main.append(search);
  const tools = buildTools(roles.tools, compactHrefs, roles.secondary);
  if (tools) main.append(tools);
  nav.append(main, buildSecondary(roles.secondary));

  // reset open menus when crossing the desktop/mobile breakpoint
  isDesktop.addEventListener('change', () => { if (shop) shop.closeFlyout(); });

  block.append(el('div', { class: 'nav-wrapper' }, nav));
}
