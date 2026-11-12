/* eslint-disable */
/* global WebImporter */

import storeInfoParser from './parsers/store-info.js';
import cardsPromoWideParser from './parsers/cards-promo-wide.js';
import vendorListParser from './parsers/vendor-list.js';
import cleanupTransformer from './transformers/shopmyexchange-cleanup.js';
import dmImagesTransformer from './transformers/shopmyexchange-dm-images.js';
import sectionsTransformer from './transformers/shopmyexchange-sections.js';

const PAGE_TEMPLATE = {
  "name": "store",
  "urls": [
    "https://www.shopmyexchange.com/store-locator/ft-hood-main-exchange"
  ],
  "representativeUrl": "https://www.shopmyexchange.com/store-locator/ft-hood-main-exchange",
  "description": "Store locator page for one installation: store header (name, address, hours, phones, photo), Express Online promo, vendor directory (categories > subcategories > vendors, each vendor a fragment placed with vendor-list), letter from the manager",
  "urlPattern": "/store-locator/*",
  "blocks": [
    {
      "name": "store-info",
      "instances": [
        ".aafes-store-details > .grid:has(> .aafes-title-box > h1)"
      ]
    },
    {
      "name": "cards-promo-wide",
      "instances": [
        ".aafes-store-details div.hidden-sm-down > div.flex.flex-wrap:has(a img)"
      ]
    },
    {
      "name": "vendor-list",
      "instances": [
        ".aafes-store-details .store-content"
      ]
    }
  ],
  "sections": [
    {
      "id": "store-header",
      "name": "Store header",
      "selector": [
        ".aafes-store-details > .grid:has(> .aafes-title-box > h1)"
      ],
      "style": null,
      "blocks": [
        "store-info"
      ],
      "defaultContent": []
    },
    {
      "id": "store-promo",
      "name": "Express Online promo",
      "selector": [
        ".aafes-store-details div.hidden-sm-down:has(a img)"
      ],
      "style": "store-promo",
      "blocks": [
        "cards-promo-wide"
      ],
      "defaultContent": []
    },
    {
      "id": "store-directory",
      "name": "Vendor directory",
      "selector": [
        ".aafes-store-details .store-content"
      ],
      "style": "store-directory",
      "blocks": [
        "vendor-list"
      ],
      "defaultContent": []
    },
    {
      "id": "store-letter",
      "name": "Letter from the Manager",
      "selector": [
        ".aafes-store-details .store-content + div"
      ],
      "style": "store-letter",
      "blocks": [],
      "defaultContent": [
        ".aafes-store-details .store-content + div"
      ]
    }
  ]
};

const parsers = {
  'store-info': storeInfoParser,
  'cards-promo-wide': cardsPromoWideParser,
  'vendor-list': vendorListParser,
};
// Late transformers change the DOM (section <hr> markers, shared fragments), so their beforeTransform
// runs after block discovery.
const sectionTransformers = [sectionsTransformer];
const fragmentTransformers = [];
const lateTransformers = [...sectionTransformers, ...fragmentTransformers];
const transformers = [cleanupTransformer, dmImagesTransformer, ...lateTransformers];
const earlyTransformers = transformers.filter((fn) => !lateTransformers.includes(fn));
// Catalog selectors (pageInstances, pageCleanup) count the <script> and <hr> elements the importer
// removes before transform, so a catalog template finds its targets in preprocess.
const CATALOG = Boolean(PAGE_TEMPLATE.pageCleanup || PAGE_TEMPLATE.blocks.some((b) => b.pageInstances));

function executeTransformers(hookName, element, payload, list = transformers) {
  const enhancedPayload = { ...payload, template: payload.params?.targets?.template || PAGE_TEMPLATE };
  list.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template, url) {
  const pageBlocks = [];
  const pageKey = (u) => {
    try { const { origin, pathname } = new URL(u); return `${origin}${pathname.replace(/\/$/, '')}`; }
    catch { return u; }
  };
  const key = pageKey(url);
  const claim = (blockDef, selector) => {
    let matches = [];
    try { matches = document.querySelectorAll(selector); } catch { return; }
    matches.forEach((element) => {
      if (pageBlocks.some((b) => b.element === element || b.element.contains(element) || element.contains(b.element))) return;
      pageBlocks.push({ name: blockDef.name, selector, element });
    });
  };
  template.blocks.forEach((blockDef) => {
    const entry = Object.entries(blockDef.pageInstances || {}).find(([u]) => pageKey(u) === key);
    (entry ? entry[1] : []).forEach((selector) => claim(blockDef, selector));
  });
  template.blocks.forEach((blockDef) => (blockDef.instances || []).forEach((selector) => claim(blockDef, selector)));
  return pageBlocks;
}

// Runs the early transformers, then marks each block and section target with an attribute: the
// importer re-creates the body before transform, so only attributes survive, not element references.
function markPageTargets(payload) {
  const { document, params } = payload;
  executeTransformers('beforeTransform', document.body, payload, earlyTransformers);
  const blocks = findBlocksOnPage(document, PAGE_TEMPLATE, params.originalURL).map(({ name, selector, element }, i) => {
    element.setAttribute('data-excat-block', String(i));
    return { name, selector };
  });
  const sections = (PAGE_TEMPLATE.sections || []).map((section, i) => {
    const target = (section.selector || []).map((s) => { try { return document.querySelector(s); } catch { return null; } }).find(Boolean);
    if (!target) return section;
    target.setAttribute('data-excat-section', String(i));
    return { ...section, selector: [`[data-excat-section="${i}"]`] };
  });
  params.targets = { blocks, template: { ...PAGE_TEMPLATE, sections } };
}

// Store locator pages are the index of their installation folder, next to its vendors:
// /store-locator/<installation> -> /store-locator/<installation>/index
// (vendor fragments live in /store-locator/<installation>/vendors/).
function documentPath(originalURL) {
  const rawPath = new URL(originalURL).pathname.replace(/\/$/, '').replace(/\.html?$/, '');
  return rawPath === '' ? '/index' : `${rawPath}/index`;
}

export default {
  preprocess: (payload) => {
    // The importer drops <style> elements before transform; the cleanup transformer's
    // `preprocess` hook keeps the store photo that is set as a CSS background.
    executeTransformers('preprocess', payload.document.body, payload, earlyTransformers);
    if (CATALOG) markPageTargets(payload);
  },
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    params.fragments = [];
    const storeName = (document.querySelector('.aafes-store-details h1') || {}).textContent;

    if (!params.targets) markPageTargets(payload);
    const pageBlocks = params.targets.blocks
      .map((block, i) => ({ ...block, element: document.querySelector(`[data-excat-block="${i}"]`) }))
      .filter((block) => block.element);
    executeTransformers('beforeTransform', main, { ...payload, pageBlocks }, lateTransformers);

    pageBlocks.forEach((block) => {
      if (!main.contains(block.element)) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers('afterTransform', main, payload);

    main.appendChild(document.createElement('hr'));
    // Page metadata, plus the breadcrumb label: the store name (e.g. "Ft Hood Main Exchange").
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    if (storeName && storeName.trim()) meta['Breadcrumb Title'] = storeName.trim();
    if (Object.keys(meta).length) main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // A fragment's nodes left `main` before afterTransform: finalize it the same way, without the
    // page-only section breaks and metadata.
    params.fragments.forEach(({ element }) => {
      executeTransformers('afterTransform', element, payload, earlyTransformers);
      WebImporter.rules.transformBackgroundImages(element, document);
      WebImporter.rules.adjustImageUrls(element, url, params.originalURL);
    });

    const path = WebImporter.FileUtils.sanitizePath(documentPath(params.originalURL));

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }, ...params.fragments];
  },
};
