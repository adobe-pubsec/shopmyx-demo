/* eslint-disable */
/* global WebImporter */

import cardsPromoWideParser from './parsers/cards-promo-wide.js';
import cardsCategoryParser from './parsers/cards-category.js';
import cardsProductSliderParser from './parsers/cards-product-slider.js';
import cleanupTransformer from './transformers/shopmyexchange-cleanup.js';
import dmImagesTransformer from './transformers/shopmyexchange-dm-images.js';

const PAGE_TEMPLATE = {
  "name": "deals",
  "urls": [
    "https://www.shopmyexchange.com/deals"
  ],
  "representativeUrl": "https://www.shopmyexchange.com/deals",
  "description": "Deals landing page: title banner, promo banners, deal tile grids, product sliders, Military Star banner, sale categories",
  "blocks": [
    {
      "name": "cards-promo-wide",
      "instances": [
        "div.banner-container.md\\:w-1\\/2",
        "#mt_id_milstar:not(.hidden) > div.banner-tile"
      ]
    },
    {
      "name": "cards-category",
      "instances": [
        "div.cat-container:not(#mt-deals)",
        "#mt-deals",
        "#mt_id_shopbycategory > div.mx-4.mb-5"
      ]
    },
    {
      "name": "cards-product-slider",
      "instances": [
        "div[id^=\"mt-slider-\"]"
      ]
    }
  ],
  "urlPattern": "/deals",
  "sections": [
    {
      "id": "main",
      "name": "Deals main content",
      "selector": [
        "div:has(> div.banner-container.pointer-events-none)",
        "div:has(> #mt-deals)"
      ],
      "style": null,
      "blocks": [
        "cards-promo-wide",
        "cards-category",
        "cards-product-slider"
      ],
      "defaultContent": [
        "div.banner-container.pointer-events-none",
        "div.clear-both.pt-10",
        "div[id^=\"mt-slider-\"] h3",
        "#mt_id_milstar:not(.hidden)",
        "#mt_id_shopbycategory > h3"
      ]
    }
  ]
};

const parsers = {
  'cards-promo-wide': cardsPromoWideParser,
  'cards-category': cardsCategoryParser,
  'cards-product-slider': cardsProductSliderParser,
};
// Late transformers change the DOM (section <hr> markers, shared fragments), so their beforeTransform
// runs after block discovery. This template has one unstyled section, so there is no sections transformer.
const sectionTransformers = [];
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

export default {
  preprocess: (payload) => {
    if (CATALOG) markPageTargets(payload);
  },
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    params.fragments = [];

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
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // A fragment's nodes left `main` before afterTransform: finalize it the same way, without the
    // page-only section breaks and metadata.
    params.fragments.forEach(({ element }) => {
      executeTransformers('afterTransform', element, payload, earlyTransformers);
      WebImporter.rules.transformBackgroundImages(element, document);
      WebImporter.rules.adjustImageUrls(element, url, params.originalURL);
    });

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }, ...params.fragments];
  },
};
