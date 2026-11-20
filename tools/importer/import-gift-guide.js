/* eslint-disable */
/* global WebImporter */

// Holiday gift guide (shared-promotions landing pages). The source is built only from
// Scene7 images with the copy baked in; the parsers rebuild them as editable blocks
// (copy as text, cropped core art as the image).

import promoBannerParser from './parsers/promo-banner.js';
import cardsPromoTilesParser from './parsers/cards-promo-tiles.js';
import cardsGiftTileParser from './parsers/cards-gift-tile.js';
import columnsGiftFeatureParser from './parsers/columns-gift-feature.js';
import shippingDeadlinesParser from './parsers/shipping-deadlines.js';
import cleanupTransformer from './transformers/shopmyexchange-cleanup.js';
import giftGuideTransformer from './transformers/shopmyexchange-gift-guide.js';
import dmImagesTransformer from './transformers/shopmyexchange-dm-images.js';
import sectionsTransformer from './transformers/shopmyexchange-sections.js';

const PAGE_TEMPLATE = {
  "name": "gift-guide",
  "urls": [
    "https://www.shopmyexchange.com/cp/category-landing-pages/shared-promotions/holiday-gift-guide-26"
  ],
  "representativeUrl": "https://www.shopmyexchange.com/cp/category-landing-pages/shared-promotions/holiday-gift-guide-26",
  "description": "Holiday gift guide promo landing page (image-only source art converted to editable blocks)",
  "blocks": [
    {
      "name": "promo-banner",
      "instances": [
        "div.banner-container:has(img[src*=\"gift-guide-2026-header01\"])",
        "div.banner-container:has(img[src*=\"gift-guide-2026-gift-cards01\"])"
      ]
    },
    {
      "name": "cards-promo-tiles",
      "instances": [
        "section.bg-holidaygiftguide div.lpcategory-container:has(img[src*=\"-dollar-bow\"])"
      ]
    },
    {
      "name": "cards-gift-tile",
      "instances": [
        "section.bg-holidaygiftguide div.lpcategory-container:has(img[src*=\"gift-guide-2026-tile-\"])"
      ]
    },
    {
      "name": "columns-gift-feature",
      "instances": [
        "section.bg-holidaygiftguide div.lpcategory-container:has(img[src*=\"gift-tabs-\"])"
      ]
    },
    {
      "name": "shipping-deadlines",
      "instances": [
        "div.banner-container:has(img[src*=\"shipping-delivery01\"])"
      ]
    }
  ],
  "urlPattern": "/cp/category-landing-pages/shared-promotions/*",
  "sections": [
    {
      "id": "S1",
      "name": "Hero",
      "selector": [
        "div.banner-container:has(img[src*=\"gift-guide-2026-header01\"])"
      ],
      "style": null,
      "blocks": [
        "promo-banner"
      ],
      "defaultContent": []
    },
    {
      "id": "S2",
      "name": "Red gift band",
      "selector": [
        "div.banner-container.bg-holidaygiftguide:has(img[src*=\"gifts-under01\"])"
      ],
      "style": "holiday-red",
      "blocks": [
        "cards-promo-tiles",
        "cards-gift-tile",
        "promo-banner",
        "columns-gift-feature"
      ],
      "defaultContent": [
        "div.banner-container.bg-holidaygiftguide:has(img[src*=\"gifts-under01\"])"
      ]
    },
    {
      "id": "S3",
      "name": "Shipping deadlines",
      "selector": [
        "div.banner-container:has(img[src*=\"shipping-delivery01\"])"
      ],
      "style": "holiday-red",
      "blocks": [
        "shipping-deadlines"
      ],
      "defaultContent": []
    }
  ]
};

const parsers = {
  'promo-banner': promoBannerParser,
  'cards-promo-tiles': cardsPromoTilesParser,
  'cards-gift-tile': cardsGiftTileParser,
  'columns-gift-feature': columnsGiftFeatureParser,
  'shipping-deadlines': shippingDeadlinesParser,
};
// Late transformers change the DOM (section <hr> markers, shared fragments), so their beforeTransform
// runs after block discovery.
const sectionTransformers = [sectionsTransformer];
const fragmentTransformers = [];
const lateTransformers = [...sectionTransformers, ...fragmentTransformers];
// The gift-guide transformer turns heading images into headings in afterTransform, so it runs
// before the DM transformer rewrites images into links.
const transformers = [cleanupTransformer, giftGuideTransformer, dmImagesTransformer, ...lateTransformers];
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
    // The importer drops text-less links between preprocess and transform; the gift-guide
    // transformer's `preprocess` hook moves each tile image into its overlay link.
    executeTransformers('preprocess', payload.document.body, payload, earlyTransformers);
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
    // Page metadata, plus the breadcrumb label (the site builds the breadcrumb from the path).
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    meta['Breadcrumb Title'] = 'Holiday Gift Guide';
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
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
