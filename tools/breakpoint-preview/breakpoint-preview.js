import DA_SDK from 'https://da.live/nx/utils/sdk.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const RENDER_DELAY = 250;
const READY_TIMEOUT = 10000;

const DEVICES = [
  {
    id: 'desktop',
    label: 'Desktop',
    width: 1280,
    shapes: [['rect', { x: 3, y: 4, width: 18, height: 12, rx: 2 }], ['path', { d: 'M8 20h8M12 16v4' }]],
  },
  {
    id: 'tablet',
    label: 'Tablet',
    width: 768,
    shapes: [['rect', { x: 4, y: 3, width: 16, height: 18, rx: 2 }], ['path', { d: 'M11 18h2' }]],
  },
  {
    id: 'mobile',
    label: 'Mobile',
    width: 375,
    shapes: [['rect', { x: 7, y: 2, width: 10, height: 20, rx: 2 }], ['path', { d: 'M11 19h2' }]],
  },
];

const RELOAD_SHAPES = [['path', { d: 'M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6' }]];

/**
 * Runs inside the framed page (same origin), once. It exposes a function that
 * re-decorates the page's <main> with the site's own code, so blocks render as
 * they would after a preview, without needing one.
 */
const INSTALL = `
import { decorateMain } from '/scripts/scripts.js';
import { loadSections } from '/scripts/aem.js';
window.__bpRender = async () => {
  const main = document.querySelector('main');
  decorateMain(main);
  document.body.classList.add('appear');
  await loadSections(main);
};
window.dispatchEvent(new Event('bp-ready'));
`;

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  node.append(...children);
  return node;
}

function icon(shapes) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  shapes.forEach(([tag, attrs]) => {
    const shape = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => shape.setAttribute(k, v));
    svg.append(shape);
  });
  return svg;
}

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

/** Builds the page URL (on the code branch) from the editor context. */
function pageUrl({ org, repo, path = '', ref = 'main' }) {
  if (!org || !repo) return null;
  const prefix = `/${org}/${repo}`;
  let pagePath = path.startsWith(prefix) ? path.slice(prefix.length) : path;
  pagePath = pagePath.replace(/\.html$/, '').replace(/\/index$/, '/');
  if (!pagePath.startsWith('/')) pagePath = `/${pagePath}`;
  const branch = !ref || ref === 'local' ? 'main' : ref;
  // DA serves plugins from the project's preview.da.live origin: frame the page there so it is same-origin
  const host = window.location.hostname.endsWith('.da.live') ? window.location.origin : `https://${branch}--${repo}--${org}.aem.page`;
  return `${host}${pagePath}`;
}

function showMessage(stage, text) {
  stage.replaceChildren(el('p', { class: 'bp-message' }, text));
}

/** The page's own document, if it is ready to be re-rendered. */
function readyDoc(frame) {
  try {
    const doc = frame.contentDocument;
    if (doc && doc.querySelector('main') && doc.body.classList.contains('appear')) return doc;
  } catch (e) {
    // not same-origin yet
  }
  return null;
}

async function whenReady(frame) {
  const start = Date.now();
  while (Date.now() - start < READY_TIMEOUT) {
    const doc = readyDoc(frame);
    if (doc) return doc;
    // eslint-disable-next-line no-await-in-loop
    await wait(100);
  }
  return null;
}

/** Installs the render hook in the framed page. */
async function install(frame, doc) {
  const win = frame.contentWindow;
  if (win.__bpRender) return true;
  const ready = new Promise((resolve) => {
    win.addEventListener('bp-ready', () => resolve(true), { once: true });
    setTimeout(() => resolve(false), READY_TIMEOUT);
  });
  const script = doc.createElement('script');
  script.type = 'module';
  const withNonce = doc.querySelector('script[nonce]');
  if (withNonce) script.nonce = withNonce.nonce;
  script.textContent = INSTALL;
  doc.head.append(script);
  return ready;
}

/** Swaps the framed page's <main> for the editor's current content and decorates it. */
async function render(frame, html) {
  const doc = readyDoc(frame);
  if (!doc || !frame.contentWindow.__bpRender) return false;
  const win = frame.contentWindow;
  const parsed = new win.DOMParser().parseFromString(html, 'text/html');
  const source = parsed.querySelector('main');
  const fresh = doc.createElement('main');
  if (source) [...source.childNodes].forEach((n) => fresh.append(doc.importNode(n, true)));
  else [...parsed.body.childNodes].forEach((n) => fresh.append(doc.importNode(n, true)));
  const { scrollY } = win;
  doc.querySelector('main').replaceWith(fresh);
  await win.__bpRender();
  win.scrollTo(0, scrollY);
  return true;
}

(async function init() {
  const sdk = await DA_SDK;
  const { context, actions } = sdk;
  let msgs = 0;
  let dbg = '';
  const url = pageUrl(context);

  const stage = el('div', { class: 'bp-stage' });
  const size = el('span', { class: 'bp-size' });
  const status = el('span', { class: 'bp-status' });
  const bar = el('div', { class: 'bp-bar', role: 'toolbar', 'aria-label': 'Preview size' });
  const buttons = DEVICES.map((device) => {
    const button = el('button', {
      type: 'button',
      title: device.label,
      'aria-label': device.label,
      'aria-pressed': 'false',
    });
    button.append(icon(device.shapes));
    button.addEventListener('click', () => select(device)); // eslint-disable-line no-use-before-define
    return button;
  });
  const reload = el('button', { type: 'button', title: 'Reload preview', 'aria-label': 'Reload preview' });
  reload.append(icon(RELOAD_SHAPES));
  bar.append(...buttons, size, el('span', { class: 'bp-spacer' }), status, reload);
  document.body.append(bar, stage);

  if (!url) {
    showMessage(stage, 'Open a page in the editor to preview it.');
    return;
  }

  const frame = el('iframe', { title: 'Page preview' });
  const device = el('div', { class: 'bp-device' }, frame);
  stage.append(device);

  let current = DEVICES[0];
  let liveHtml = null;
  let rendering = false;
  let queued = false;
  let timer;

  const setStatus = (text, mode) => {
    status.textContent = text;
    status.dataset.mode = mode;
  };

  /** Renders the latest editor content; coalesces edits made while a render runs. */
  async function flush() {
    if (liveHtml === null) return;
    if (rendering) {
      queued = true;
      return;
    }
    rendering = true;
    try {
      const ok = await render(frame, liveHtml);
      if (!ok) dbg = `render=false doc=${!!readyDoc(frame)} hook=${!!frame.contentWindow.__bpRender}`;
      if (ok) setStatus('Live', 'live');
    } catch (e) {
      setStatus('Last preview', 'stale');
      // eslint-disable-next-line no-console
      dbg = String(e && e.stack ? e.stack.slice(0, 200) : e);
      console.warn('Breakpoint preview: live render failed', e);
    }
    rendering = false;
    if (queued) {
      queued = false;
      flush();
    }
  }

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(flush, RENDER_DELAY);
  };

  async function load() {
    setStatus('Loading…', 'stale');
    // a page that was never previewed has no published copy: borrow the site's home page as the shell
    let src = url;
    try {
      const head = await fetch(url, { method: 'HEAD' });
      if (!head.ok) src = `${new URL(url).origin}/`;
    } catch (e) {
      src = url;
    }
    frame.addEventListener('load', async () => {
      const doc = await whenReady(frame);
      if (!doc) {
        try {
          const d = frame.contentDocument;
          dbg = `origin=${window.origin} src=${frame.src.slice(0, 90)} `;
          dbg += `timeout doc=${!!d} main=${!!(d && d.querySelector('main'))} appear=${!!(d && d.body.classList.contains('appear'))} url=${d && d.location.href} sb=${window.frameElement ? window.frameElement.getAttribute('sandbox') : 'top'}`;
        } catch (err) {
          dbg = `access: ${err.message} origin=${window.origin}`;
        }
      }
      if (!doc || !(await install(frame, doc))) {
        if (doc) dbg = 'install failed';
        setStatus('Last preview', 'stale');
        return;
      }
      setStatus(liveHtml === null ? 'Last preview' : 'Live', liveHtml === null ? 'stale' : 'live');
      flush();
    }, { once: true });
    frame.src = src;
  }

  /** Sizes the frame to the device width and scales it down when the dialog is narrower. */
  function layout() {
    const available = stage.clientWidth - 32;
    const scale = Math.min(1, available / current.width);
    const height = (stage.clientHeight - 32) / scale;
    device.style.width = `${current.width}px`;
    device.style.height = `${height}px`;
    device.style.transform = scale < 1 ? `scale(${scale})` : '';
    // the transform does not change layout size, so reserve the scaled box
    device.style.marginRight = scale < 1 ? `${-(current.width * (1 - scale))}px` : '';
    device.style.marginBottom = scale < 1 ? `${-(height * (1 - scale))}px` : '';
    size.textContent = `${current.width}px${scale < 1 ? ` · ${Math.round(scale * 100)}%` : ''}`;
  }

  function select(next) {
    current = next;
    buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(DEVICES[i] === next)));
    layout();
  }

  reload.addEventListener('click', load);

  try {
    actions.subscribeLiveDocument(({ html }) => {
      msgs += 1;
      liveHtml = html;
      schedule();
    });
  } catch (e) {
    setStatus('Last preview', 'stale');
  }

  setInterval(() => { size.title = `msgs=${msgs} ${dbg}`; }, 500);
  new ResizeObserver(layout).observe(stage);
  select(current);
  load();
}());
