/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-deals.js
  var import_deals_exports = {};
  __export(import_deals_exports, {
    default: () => import_deals_default
  });

  // tools/importer/parsers/cards-promo-wide.js
  var MERGED_ATTR = "data-cards-promo-wide-merged";
  var HALF_BANNER = "div.banner-container.md\\:w-1\\/2";
  function findMergePartners(element) {
    const prev = element.previousElementSibling;
    if (prev && prev.id === "mt_id_hp9") {
      const partner = element.ownerDocument.querySelector("#mt_id_hp10 + div.grid");
      return partner && partner !== element ? [partner] : [];
    }
    if (element.matches(HALF_BANNER)) {
      const partners = [];
      let next = element.nextElementSibling;
      while (next && next.matches(HALF_BANNER) && !next.hasAttribute(MERGED_ATTR)) {
        partners.push(next);
        next = next.nextElementSibling;
      }
      return partners;
    }
    return [];
  }
  function collectCards(root) {
    let grid = root;
    if (!Array.from(grid.children).some((c) => c.querySelector(":scope > a img, :scope > a > img"))) {
      grid = root.querySelector(":scope > div.grid") || root;
    }
    let cards = Array.from(grid.children).filter((c) => c.querySelector("a img"));
    if (!cards.length) {
      cards = Array.from(root.querySelectorAll("a")).filter((a) => a.querySelector("img"));
    }
    return cards;
  }
  function destinationLink(document, href, image) {
    const a = document.createElement("a");
    a.href = href;
    a.textContent = (image.alt || "").trim() || href;
    return a;
  }
  function buildRow(card, document) {
    const img = card.querySelector("img");
    if (!img) return null;
    const link = img.closest("a");
    const image = document.createElement("img");
    image.src = img.getAttribute("src");
    if (img.getAttribute("alt")) image.alt = img.getAttribute("alt").replace(/\s+/g, " ").trim();
    if (link && link.getAttribute("href")) {
      return [image, destinationLink(document, link.getAttribute("href"), image)];
    }
    return [image, ""];
  }
  function parse(element, { document, params }) {
    if (element.hasAttribute(MERGED_ATTR)) {
      element.remove();
      return;
    }
    const partners = findMergePartners(element);
    const sources = [element, ...partners];
    const cells = [];
    sources.forEach((src) => {
      collectCards(src).forEach((card) => {
        const row = buildRow(card, document);
        if (row) cells.push(row);
      });
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-promo-wide", cells });
    element.replaceWith(block);
    partners.forEach((partner) => {
      partner.setAttribute(MERGED_ATTR, "");
      partner.remove();
    });
  }

  // tools/importer/parsers/cards-category.js
  function paragraphLabel(item, clean2) {
    return [...item.querySelectorAll("p")].map((p) => {
      const copy = p.cloneNode(true);
      copy.querySelectorAll(".exchevron").forEach((s) => s.remove());
      return clean2(copy.textContent);
    }).find(Boolean) || "";
  }
  function parse2(element, { document, params }) {
    const grid = element.querySelector(":scope > div.grid") || element.querySelector("div.grid") || element;
    let items = Array.from(grid.children).filter((c) => c.querySelector("a[href]"));
    if (!items.length) items = Array.from(element.querySelectorAll("a[href]")).filter((a) => a.querySelector("img"));
    if (!items.length) items = Array.from(grid.children).filter((c) => c.querySelector("img"));
    const cells = [];
    items.forEach((item) => {
      const link = item.matches("a") ? item : item.querySelector("a[href]");
      const img = item.querySelector("img");
      const clean2 = (t) => (t || "").replace(/\s+/g, " ").trim();
      const labelEl = [...item.querySelectorAll("span")].find((s) => clean2(s.textContent));
      const label = paragraphLabel(item, clean2) || clean2(labelEl && labelEl.textContent) || clean2(link && link.textContent) || clean2(img && img.getAttribute("alt"));
      if (!img && !label) return;
      let imageCell = "";
      if (img && img.getAttribute("src")) {
        const image = document.createElement("img");
        image.src = img.getAttribute("src");
        const alt = (img.getAttribute("alt") || "").trim() || label;
        if (alt) image.alt = alt;
        imageCell = image;
      }
      let labelCell = label;
      if (link && link.getAttribute("href")) {
        const a = document.createElement("a");
        a.href = link.getAttribute("href");
        a.textContent = label || link.getAttribute("href");
        labelCell = a;
      }
      cells.push([imageCell, labelCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-category", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-product-slider.js
  function clean(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }
  function priceLine(item) {
    const priceInfo = item.querySelector(".custom-price-info");
    if (!priceInfo) return "";
    const leaves = Array.from(priceInfo.querySelectorAll("span, p")).filter((el) => !el.querySelector("span, p")).map((el) => clean(el.textContent)).filter(Boolean);
    return leaves.length ? leaves.join(" ") : clean(priceInfo.textContent);
  }
  function buildRow2(item, document) {
    const link = item.querySelector("a.mt-aafes-product-link") || item.querySelector("a[href]");
    const img = item.querySelector(".mt-image img") || item.querySelector("img");
    const nameEl = item.querySelector(".aafes-item-name");
    const name = clean(nameEl ? nameEl.textContent : img && img.getAttribute("alt") || link && link.textContent);
    if (!img && !name) return null;
    let imageCell = "";
    if (img && img.getAttribute("src")) {
      const image = document.createElement("img");
      image.src = img.getAttribute("src");
      const alt = clean(img.getAttribute("alt")) || name;
      if (alt) image.alt = alt;
      imageCell = image;
    }
    const content = [];
    if (name) {
      const p = document.createElement("p");
      if (link && link.getAttribute("href")) {
        const a = document.createElement("a");
        a.href = link.getAttribute("href");
        a.textContent = name;
        p.append(a);
      } else {
        p.textContent = name;
      }
      content.push(p);
    }
    const price = priceLine(item);
    if (price) {
      const p = document.createElement("p");
      p.textContent = price;
      content.push(p);
    }
    return [imageCell, content.length ? content : ""];
  }
  function parse3(element, { document, params }) {
    let items = Array.from(element.querySelectorAll(".mt-merch-item"));
    if (!items.length) {
      items = Array.from(element.querySelectorAll("li")).filter((li) => li.querySelector("a[href]") && li.querySelector("img"));
    }
    const seen = /* @__PURE__ */ new Set();
    items = items.filter((item) => {
      const a = item.querySelector("a.mt-aafes-product-link, a[href]");
      const href = a && a.getAttribute("href");
      if (!href) return true;
      if (seen.has(href)) return false;
      seen.add(href);
      return true;
    });
    const cells = [];
    items.forEach((item) => {
      const row = buildRow2(item, document);
      if (row) cells.push(row);
    });
    const title = element.querySelector("h3, h2");
    if (title && clean(title.textContent)) {
      const heading = document.createElement(title.tagName.toLowerCase());
      heading.textContent = clean(title.textContent);
      element.before(heading);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-product-slider", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/shopmyexchange-cleanup.js
  var BREAKPOINT_ORDER = ["", "sm", "md", "lg", "xl"];
  var DISPLAY_VALUES = /* @__PURE__ */ new Set([
    "hidden",
    "block",
    "flex",
    "grid",
    "inline",
    "inline-block",
    "inline-flex",
    "inline-grid",
    "table",
    "contents"
  ]);
  function isHiddenOnDesktop(el) {
    const cls = el.getAttribute("class");
    if (!cls) return false;
    const resolved = {};
    cls.split(/\s+/).forEach((token) => {
      if (!token) return;
      let bp = "";
      let value = token;
      const idx = token.indexOf(":");
      if (idx > -1) {
        bp = token.slice(0, idx);
        value = token.slice(idx + 1);
      }
      value = value.replace(/^!/, "");
      if (!BREAKPOINT_ORDER.includes(bp) || !DISPLAY_VALUES.has(value)) return;
      resolved[bp] = value;
    });
    let display = null;
    BREAKPOINT_ORDER.forEach((bp) => {
      if (resolved[bp]) display = resolved[bp];
    });
    return display === "hidden";
  }
  function isEmptyElement(el) {
    if (!el) return false;
    if (el.textContent.trim()) return false;
    return !el.querySelector("img, picture, video, iframe, a[href], table, hr");
  }
  function transform(hookName, element, payload) {
    if (hookName === "preprocess") {
      if (!element.querySelector("main section#category.lp-standard-category")) return;
      element.querySelectorAll(
        "#category .lpcategory-container > div, #brands .lpcategory-container > div, #sizecharts .guide-container > div"
      ).forEach((tile) => {
        const img = tile.querySelector(":scope > img");
        const a = tile.querySelector(":scope > a[href]");
        if (!img || !a || a.textContent.trim() || a.querySelector("img")) return;
        a.prepend(img);
      });
      return;
    }
    if (hookName === "beforeTransform") {
      WebImporter.DOMUtils.remove(element, [
        "div.flex.min-h-screen > div.headercontainer",
        "section.relative.min-h-\\[760px\\]",
        "section.SME-footer"
      ]);
      const isCategoryPage = !!element.querySelector("main section#category.lp-standard-category");
      if (isCategoryPage) {
        WebImporter.DOMUtils.remove(element, [
          "div.gap-x-5.md\\:flex-row > :not(main)",
          // Hidden web/app duplicate "Electronic Guides" panel (the visible
          // #sizecharts without .hidden is kept for cards-category).
          "section#sizecharts.hidden",
          // Hidden appDisplay duplicate "You May Also Like" heading + empty
          // slider placeholder in the CMS area; the real one lives in
          // #recommendationContainer (section rc2).
          "main h2.hidden",
          "main div.hidden"
        ]);
        element.querySelectorAll("main nav.mb-5.flex").forEach((nav) => {
          const doc = nav.ownerDocument;
          nav.querySelectorAll('img[src^="data:"], .sr-only').forEach((el) => el.remove());
          const p = doc.createElement("p");
          const items = Array.from(nav.querySelectorAll("li")).filter((li) => li.textContent.trim());
          items.forEach((li, i) => {
            if (i > 0) p.append(doc.createTextNode(" \xBB "));
            const a = li.querySelector("a[href]");
            if (a) {
              const link = doc.createElement("a");
              link.setAttribute("href", a.getAttribute("href"));
              link.textContent = a.textContent.trim();
              p.append(link);
            } else {
              p.append(doc.createTextNode(li.textContent.trim()));
            }
          });
          if (items.length) nav.replaceWith(p);
          else nav.remove();
        });
      }
      WebImporter.DOMUtils.remove(element, [
        "div.hidden.pointer-events-none.bg-amber-300",
        "div.App",
        "iframe",
        "script",
        "style",
        "noscript",
        "link",
        // Screen-reader-only "CMS Content" section label (not authorable copy).
        "h1.sr-only",
        // Third-party tracking pixels injected at runtime.
        'img[src*="sp.analytics.yahoo.com"]',
        'img[src*="facebook.com/tr"]',
        'img[src*="doubleclick.net"]',
        'img[src*="bat.bing.com"]',
        // Deals: breadcrumb trail ("Exchange > Deals"). On category pages the
        // breadcrumb was already converted to a paragraph above.
        "nav.mb-5.flex",
        // Deals: app-only duplicate titles; the visible headings are the h2
        // inside div.clear-both.pt-10.
        "p#app-screen-title"
      ]);
      Array.from(element.querySelectorAll("[class]")).filter((el) => isHiddenOnDesktop(el)).forEach((el) => {
        if (el.isConnected !== false && el.parentNode) el.remove();
      });
      element.querySelectorAll('a[href^="javascript:"]').forEach((a) => {
        a.replaceWith(...Array.from(a.childNodes));
      });
    }
    if (hookName === "afterTransform") {
      element.querySelectorAll("#mt_id_hp10").forEach((el) => {
        if (isEmptyElement(el)) el.remove();
      });
      WebImporter.DOMUtils.remove(element, [
        "button.aafes-block-arrow",
        "iframe",
        "script",
        "style",
        "noscript",
        "link"
      ]);
      element.querySelectorAll("p").forEach((p) => {
        if (isEmptyElement(p) && !p.closest("table")) p.remove();
      });
      element.querySelectorAll("*").forEach((el) => {
        Array.from(el.attributes).forEach(({ name }) => {
          if (/^on/i.test(name) || /^data-(gtm|track|analytics|ga)/i.test(name)) {
            el.removeAttribute(name);
          }
        });
      });
    }
  }

  // tools/importer/transformers/shopmyexchange-dm-images.js
  var EMPTY_ALT_SENTINEL = "Image without alt text";
  function detectDynamicMediaUrl(urlStr) {
    if (!urlStr || !/^(https?:\/\/|\/\/)/i.test(urlStr)) return false;
    let u;
    try {
      u = new URL(urlStr, "https://x/");
    } catch (e) {
      return false;
    }
    if (u.pathname.startsWith("/is/image/")) return "scene7";
    if (/^delivery-p\d+-e\d+\.adobeaemcloud\.com$/.test(u.hostname) && u.pathname.startsWith("/adobe/assets/urn:")) {
      return "dm-openapi";
    }
    return false;
  }
  function normalizeUrl(src) {
    return src.startsWith("//") ? `https:${src}` : src;
  }
  function getImageSrc(img) {
    const candidates = [
      img.getAttribute("src"),
      img.getAttribute("data-src"),
      img.getAttribute("data-original-src")
    ];
    return candidates.find((c) => c && detectDynamicMediaUrl(c)) || null;
  }
  function isSoleMeaningfulChild(anchor, img) {
    if (anchor.textContent.trim()) return false;
    const others = Array.from(anchor.querySelectorAll("*")).filter((el) => {
      if (el === img) return false;
      if (el.contains(img)) return false;
      return !["SOURCE", "BR"].includes(el.tagName);
    });
    const imgs = anchor.querySelectorAll("img");
    return others.length === 0 && imgs.length === 1;
  }
  function transform2(hookName, element, payload) {
    if (hookName !== "afterTransform") return;
    const document = element.ownerDocument;
    Array.from(element.querySelectorAll("img")).forEach((img) => {
      const rawSrc = getImageSrc(img);
      if (!rawSrc) return;
      const dmUrl = normalizeUrl(rawSrc);
      const altText = (img.getAttribute("alt") || "").trim() || EMPTY_ALT_SENTINEL;
      const anchor = img.closest("a");
      if (anchor && element.contains(anchor)) {
        if (!isSoleMeaningfulChild(anchor, img)) {
          console.warn(`[dm-images] Skipping DM image in mixed-content link: ${dmUrl}`);
          return;
        }
        const imageLink = document.createElement("a");
        imageLink.setAttribute("href", dmUrl);
        imageLink.textContent = altText;
        const destination = document.createElement("a");
        destination.setAttribute("href", anchor.getAttribute("href"));
        destination.textContent = altText === EMPTY_ALT_SENTINEL ? anchor.getAttribute("href") : altText;
        anchor.replaceWith(imageLink, document.createTextNode(" "), destination);
        return;
      }
      const picture = img.parentElement && img.parentElement.tagName === "PICTURE" ? img.parentElement : null;
      const link = document.createElement("a");
      link.setAttribute("href", dmUrl);
      link.textContent = altText;
      (picture || img).replaceWith(link);
    });
  }

  // tools/importer/import-deals.js
  var PAGE_TEMPLATE = {
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
          'div[id^="mt-slider-"]'
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
          'div[id^="mt-slider-"] h3',
          "#mt_id_milstar:not(.hidden)",
          "#mt_id_shopbycategory > h3"
        ]
      }
    ]
  };
  var parsers = {
    "cards-promo-wide": parse,
    "cards-category": parse2,
    "cards-product-slider": parse3
  };
  var sectionTransformers = [];
  var fragmentTransformers = [];
  var lateTransformers = [...sectionTransformers, ...fragmentTransformers];
  var transformers = [transform, transform2, ...lateTransformers];
  var earlyTransformers = transformers.filter((fn) => !lateTransformers.includes(fn));
  var CATALOG = Boolean(PAGE_TEMPLATE.pageCleanup || PAGE_TEMPLATE.blocks.some((b) => b.pageInstances));
  function executeTransformers(hookName, element, payload, list = transformers) {
    var _a, _b;
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: ((_b = (_a = payload.params) == null ? void 0 : _a.targets) == null ? void 0 : _b.template) || PAGE_TEMPLATE });
    list.forEach((fn) => {
      try {
        fn(hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template, url) {
    const pageBlocks = [];
    const pageKey = (u) => {
      try {
        const { origin, pathname } = new URL(u);
        return `${origin}${pathname.replace(/\/$/, "")}`;
      } catch (e) {
        return u;
      }
    };
    const key = pageKey(url);
    const claim = (blockDef, selector) => {
      let matches = [];
      try {
        matches = document.querySelectorAll(selector);
      } catch (e) {
        return;
      }
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
  function markPageTargets(payload) {
    const { document, params } = payload;
    executeTransformers("beforeTransform", document.body, payload, earlyTransformers);
    const blocks = findBlocksOnPage(document, PAGE_TEMPLATE, params.originalURL).map(({ name, selector, element }, i) => {
      element.setAttribute("data-excat-block", String(i));
      return { name, selector };
    });
    const sections = (PAGE_TEMPLATE.sections || []).map((section, i) => {
      const target = (section.selector || []).map((s) => {
        try {
          return document.querySelector(s);
        } catch (e) {
          return null;
        }
      }).find(Boolean);
      if (!target) return section;
      target.setAttribute("data-excat-section", String(i));
      return __spreadProps(__spreadValues({}, section), { selector: [`[data-excat-section="${i}"]`] });
    });
    params.targets = { blocks, template: __spreadProps(__spreadValues({}, PAGE_TEMPLATE), { sections }) };
  }
  var import_deals_default = {
    preprocess: (payload) => {
      if (CATALOG) markPageTargets(payload);
    },
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      params.fragments = [];
      if (!params.targets) markPageTargets(payload);
      const pageBlocks = params.targets.blocks.map((block, i) => __spreadProps(__spreadValues({}, block), { element: document.querySelector(`[data-excat-block="${i}"]`) })).filter((block) => block.element);
      executeTransformers("beforeTransform", main, __spreadProps(__spreadValues({}, payload), { pageBlocks }), lateTransformers);
      pageBlocks.forEach((block) => {
        if (!main.contains(block.element)) return;
        const parser = parsers[block.name];
        if (!parser) return;
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      main.appendChild(document.createElement("hr"));
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      params.fragments.forEach(({ element }) => {
        executeTransformers("afterTransform", element, payload, earlyTransformers);
        WebImporter.rules.transformBackgroundImages(element, document);
        WebImporter.rules.adjustImageUrls(element, url, params.originalURL);
      });
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }, ...params.fragments];
    }
  };
  return __toCommonJS(import_deals_exports);
})();
