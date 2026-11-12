/* eslint-disable */
/* global WebImporter */

import cardsCategoryParser from './parsers/cards-category.js';
import cardsLogoCircleParser from './parsers/cards-logo-circle.js';
import cardsPromoWideParser from './parsers/cards-promo-wide.js';
import cardsProductSliderParser from './parsers/cards-product-slider.js';
import productListingParser from './parsers/product-listing.js';
import cleanupTransformer from './transformers/shopmyexchange-cleanup.js';
import dmImagesTransformer from './transformers/shopmyexchange-dm-images.js';
import sectionsTransformer from './transformers/shopmyexchange-sections.js';

const PAGE_TEMPLATE = {
  "name": "category",
  "urls": [
    "https://www.shopmyexchange.com/browse?pageCategories=Electronics",
    "https://www.shopmyexchange.com/browse?pageCategories=Electronics%20%3E%20Computers"
  ],
  "representativeUrl": "https://www.shopmyexchange.com/browse?pageCategories=Electronics",
  "description": "Category landing pages (browse?pageCategories=...): breadcrumb, category tiles, featured brands, guides, promo banners, live product listing placeholder, recommendations",
  "blocks": [
    {
      "name": "cards-category",
      "instances": [
        "#category > div.lpcategory-container",
        "#sizecharts:not(.hidden) > div.guide-container"
      ]
    },
    {
      "name": "cards-logo-circle",
      "instances": [
        "#brands > div.lpcategory-container"
      ]
    },
    {
      "name": "cards-promo-wide",
      "instances": [
        "div.banner-container.md\\:w-1\\/2",
        "div.banner-container.body-banner"
      ]
    },
    {
      "name": "product-listing",
      "instances": [
        "main > div.w-full:has(#product-list-container)"
      ]
    },
    {
      "name": "cards-product-slider",
      "instances": [
        "div[id^=\"mt-slider-\"]"
      ]
    }
  ],
  "urlPattern": "/browse",
  "sections": [
    {
      "id": "rc1",
      "name": "Category landing main content",
      "selector": [
        "main:has(#category)"
      ],
      "style": null,
      "blocks": [
        "cards-category",
        "cards-logo-circle",
        "cards-promo-wide",
        "product-listing"
      ],
      "defaultContent": [
        "#category > h3",
        "#brands > h3",
        "#sizecharts:not(.hidden) > h3"
      ]
    },
    {
      "id": "rc2",
      "name": "You May Also Like recommendations",
      "selector": [
        "#recommendationContainer"
      ],
      "style": null,
      "blocks": [
        "cards-product-slider"
      ],
      "defaultContent": [
        "#recommendationContainer h2"
      ]
    }
  ]
};

const parsers = {
  'cards-category': cardsCategoryParser,
  'cards-logo-circle': cardsLogoCircleParser,
  'cards-promo-wide': cardsPromoWideParser,
  'cards-product-slider': cardsProductSliderParser,
  'product-listing': productListingParser,
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

// Store category levels from pageCategories ("Electronics > Computers" -> ["Electronics", "Computers"]).
function categoryLevels(originalURL) {
  try {
    const raw = new URL(originalURL).searchParams.get('pageCategories') || '';
    return raw.split('>').map((level) => level.replace(/\s+/g, ' ').trim()).filter(Boolean);
  } catch (e) {
    return [];
  }
}

// Category landing pages live at /browse?pageCategories=<Path>, where levels are
// separated by ">"; each level becomes a folder under /categories/
// (e.g. "Electronics" -> /categories/electronics,
//  "Electronics > Computers" -> /categories/electronics/computers).
function documentPath(originalURL) {
  const source = new URL(originalURL);
  const category = source.searchParams.get('pageCategories');
  if (category) {
    const slugs = category.split('>')
      .map((level) => level.toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''))
      .filter(Boolean);
    return `/categories/${slugs.join('/')}`;
  }
  const rawPath = source.pathname.replace(/\/$/, '').replace(/\.html?$/, '');
  return rawPath === '' ? '/index' : rawPath;
}

export default {
  preprocess: (payload) => {
    // The importer drops text-less links between preprocess and transform; the cleanup
    // transformer's `preprocess` hook keeps the category tiles' overlay links.
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
    // Page metadata, plus the breadcrumb label: the store's name for this category
    // level (e.g. "Computers"). The site builds the breadcrumb from the page path and
    // reads each level's label from this field.
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    const level = categoryLevels(params.originalURL).pop();
    if (level) meta['Breadcrumb Title'] = level;
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
