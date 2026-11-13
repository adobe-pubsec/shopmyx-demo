import DA_SDK from 'https://da.live/nx/utils/sdk.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

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

/** Builds the page URL (on the code branch, as previewed) from the editor context. */
function pageUrl({ org, repo, path = '', ref = 'main' }) {
  if (!org || !repo) return null;
  const prefix = `/${org}/${repo}`;
  let pagePath = path.startsWith(prefix) ? path.slice(prefix.length) : path;
  pagePath = pagePath.replace(/\.html$/, '').replace(/\/index$/, '/');
  if (!pagePath.startsWith('/')) pagePath = `/${pagePath}`;
  const branch = !ref || ref === 'local' ? 'main' : ref;
  return `https://${branch}--${repo}--${org}.aem.page${pagePath}`;
}

function showMessage(stage, text) {
  stage.replaceChildren(el('p', { class: 'bp-message' }, text));
}

(async function init() {
  const { context } = await DA_SDK;
  const url = pageUrl(context);

  const stage = el('div', { class: 'bp-stage' });
  const size = el('span', { class: 'bp-size' });
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
  bar.append(...buttons, size, el('span', { class: 'bp-spacer' }), reload);
  document.body.append(bar, stage);

  if (!url) {
    showMessage(stage, 'Open a page in the editor to preview it.');
    return;
  }

  const frame = el('iframe', { title: 'Page preview', src: url });
  const device = el('div', { class: 'bp-device' }, frame);
  stage.append(device);

  let current = DEVICES[0];

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

  reload.addEventListener('click', () => {
    const u = new URL(url);
    u.searchParams.set('bp', Date.now());
    frame.src = u.href;
  });

  new ResizeObserver(layout).observe(stage);
  select(current);
}());
