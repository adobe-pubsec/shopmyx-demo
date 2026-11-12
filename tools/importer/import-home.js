/* eslint-disable */
/* global WebImporter */

import columnsPromoStripParser from './parsers/columns-promo-strip.js';
import heroImageBannerParser from './parsers/hero-image-banner.js';
import cardsPromoWideParser from './parsers/cards-promo-wide.js';
import cardsPromoTilesParser from './parsers/cards-promo-tiles.js';
import cardsPromoBentoParser from './parsers/cards-promo-bento.js';
import tabsProductRecsParser from './parsers/tabs-product-recs.js';
import cardsLogoCircleParser from './parsers/cards-logo-circle.js';
import cardsCategoryParser from './parsers/cards-category.js';
import cardsIconFeatureParser from './parsers/cards-icon-feature.js';
import cleanupTransformer from './transformers/shopmyexchange-cleanup.js';
import dmImagesTransformer from './transformers/shopmyexchange-dm-images.js';

const PAGE_TEMPLATE = {
  "name": "home",
  "urls": [
    "https://www.shopmyexchange.com/"
  ],
  "representativeUrl": "https://www.shopmyexchange.com/",
  "description": "Shop My Exchange homepage: promo banners, tile grids, product recommendation tabs, category icons and feature cards",
  "blocks": [
    {
      "name": "columns-promo-strip",
      "instances": [
        "#mt_id_taxfree"
      ]
    },
    {
      "name": "hero-image-banner",
      "instances": [
        "#mt_id_hero.grid"
      ]
    },
    {
      "name": "cards-promo-wide",
      "instances": [
        "#mt_id_hp2",
        "#mt_id_hp9 + div.grid",
        "#mt_id_hp10 + div.grid",
        "#mt_id_milstar:not(.hidden) > div.banner-tile"
      ]
    },
    {
      "name": "cards-promo-tiles",
      "instances": [
        "#mt_id_hp3",
        "#mt_id_hp6 > div.grid",
        "#mt_id_hp7 > div.grid",
        "#mt_id_hp8"
      ]
    },
    {
      "name": "cards-promo-bento",
      "instances": [
        "#mt_id_hp4 > div.grid",
        "#mt_id_hp5 > div.grid"
      ]
    },
    {
      "name": "tabs-product-recs",
      "instances": [
        "#mt-tabbed-recs"
      ]
    },
    {
      "name": "cards-logo-circle",
      "instances": [
        "#mt_id_moreways + div.grid"
      ]
    },
    {
      "name": "cards-category",
      "instances": [
        "#mt_id_shopbycategory > div.mx-4.mb-5"
      ]
    },
    {
      "name": "cards-icon-feature",
      "instances": [
        "#mt_id_servingfamily + div.grid"
      ]
    }
  ],
  "urlPattern": "/",
  "sections": [
    {
      "id": "main",
      "name": "Homepage main content",
      "selector": [
        "div:has(> #mt_id_taxfree)",
        "body > div.default > div.light.bg-white.transition.duration-300.ease-out > div > div.flex.min-h-screen.flex-col.items-stretch.justify-start > div.slug_gridWrapper__Pd_ps.w-full.grow > div > div.block.md\\:block.lg\\:\\!block > div.w-full.block.md\\:block.lg\\:\\!block:nth-of-type(3)"
      ],
      "style": null,
      "blocks": [
        "columns-promo-strip",
        "hero-image-banner",
        "cards-promo-wide",
        "cards-promo-tiles",
        "cards-promo-bento",
        "tabs-product-recs",
        "cards-logo-circle",
        "cards-category",
        "cards-icon-feature"
      ],
      "defaultContent": [
        "#mt_id_hp4 > div.mt-1",
        "#mt_id_hp6 > div.mt-1",
        "#mt_id_milstar:not(.hidden)",
        "#mt-tabbed-recs-title",
        "#mt_id_moreways",
        "#mt_id_shopbycategory > h3",
        "#mt_id_hp9",
        "#mt_id_servingfamily"
      ]
    }
  ]
};

const parsers = {
  'columns-promo-strip': columnsPromoStripParser,
  'hero-image-banner': heroImageBannerParser,
  'cards-promo-wide': cardsPromoWideParser,
  'cards-promo-tiles': cardsPromoTilesParser,
  'cards-promo-bento': cardsPromoBentoParser,
  'tabs-product-recs': tabsProductRecsParser,
  'cards-logo-circle': cardsLogoCircleParser,
  'cards-category': cardsCategoryParser,
  'cards-icon-feature': cardsIconFeatureParser,
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
