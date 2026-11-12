import { getMetadata } from '../../scripts/aem.js';

// Label of the homepage level (the source breadcrumb starts with "Exchange").
const ROOT_LABEL = 'Exchange';

/**
 * The local preview serves imported pages under /content/<path>; everywhere else
 * pages live at /<path>.
 */
function splitBase(pathname) {
  const match = pathname.match(/^\/content(?=\/)/);
  const base = match ? match[0] : '';
  const path = pathname.slice(base.length).replace(/\.html$/, '').replace(/\/(index)?$/, '');
  return { base, path };
}

/** "tvs-and-home-theaters" -> "Tvs And Home Theaters" (used when a page has no breadcrumb title). */
function labelFromSlug(slug) {
  return decodeURIComponent(slug)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * Looks up an ancestor page. Returns its label, or null when there is no page at
 * that path (e.g. /categories), so the level is left out.
 */
async function fetchAncestor(href, slug) {
  try {
    const resp = await fetch(href);
    if (!resp.ok || !(resp.headers.get('content-type') || '').includes('text/html')) return null;
    const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
    const meta = doc.querySelector('meta[name="breadcrumb-title"]');
    return (meta && meta.content.trim()) || labelFromSlug(slug);
  } catch {
    return null;
  }
}

function item(label, href) {
  const li = document.createElement('li');
  if (href) {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    li.append(a);
  } else {
    li.textContent = label;
    li.setAttribute('aria-current', 'page');
  }
  return li;
}

/**
 * Breadcrumb built from the page path: homepage, then every ancestor path that has a
 * page, then the current page (not linked). Labels come from each page's
 * `Breadcrumb Title` metadata, else from the path segment. Added to every page except
 * the homepage by scripts.js; `Breadcrumbs: off` in the page metadata turns it off.
 */
async function fill(ol, base, segments) {
  const ancestors = segments.slice(0, -1).map((slug, i) => ({
    slug,
    href: `${base}/${segments.slice(0, i + 1).join('/')}`,
  }));
  const current = getMetadata('breadcrumb-title') || labelFromSlug(segments[segments.length - 1]);
  const labels = await Promise.all(ancestors.map(({ href, slug }) => fetchAncestor(href, slug)));
  const items = [item(ROOT_LABEL, base ? `${base}/index` : '/')];
  ancestors.forEach(({ href }, i) => {
    if (labels[i]) items.push(item(labels[i], href));
  });
  items.push(item(current));
  ol.replaceChildren(...items);
}

export default function decorate(block) {
  block.replaceChildren();
  const { base, path } = splitBase(window.location.pathname);
  const segments = path.split('/').filter(Boolean);
  if (!segments.length) return;

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');
  const ol = document.createElement('ol');
  nav.append(ol);
  block.append(nav);

  // Not awaited: the page section shows right away. The block reserves its line
  // height (CSS), so filling it in later moves nothing below it.
  fill(ol, base, segments);
}
