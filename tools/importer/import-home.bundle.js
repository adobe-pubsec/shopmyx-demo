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

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/columns-promo-strip.js
  function parse(element, { document, params }) {
    const grid = element.querySelector(":scope > div.grid") || element;
    let items = Array.from(grid.children).filter((child) => child.querySelector("img"));
    if (!items.length) items = Array.from(element.querySelectorAll("a")).filter((a) => a.querySelector("img"));
    const row = items.map((item) => {
      const link = item.matches("a") ? item : item.querySelector("a");
      const img = item.querySelector("img");
      if (link && img && link.contains(img)) {
        const a = document.createElement("a");
        a.href = link.getAttribute("href");
        const image = document.createElement("img");
        image.src = img.getAttribute("src");
        if (img.getAttribute("alt")) image.alt = img.getAttribute("alt");
        a.append(image);
        return a;
      }
      return img || "";
    });
    const cells = row.length ? [row] : [];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-promo-strip", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-image-banner.js
  function parse2(element, { document, params }) {
    const slide = element.querySelector(".carousel-slide") || element;
    const imgs = Array.from(slide.querySelectorAll("img")).filter((img2) => !img2.closest(".carousel-control"));
    const img = imgs.find((i) => /md:block/.test(i.getAttribute("class") || "")) || imgs[0];
    const cells = [];
    if (img) {
      const image = document.createElement("img");
      image.src = img.getAttribute("src");
      if (img.getAttribute("alt")) image.alt = img.getAttribute("alt");
      const link = img.closest("a");
      if (link && link.getAttribute("href")) {
        const a = document.createElement("a");
        a.href = link.getAttribute("href");
        a.append(image);
        cells.push([a]);
      } else {
        cells.push([image]);
      }
    }
    const textEls = Array.from(slide.querySelectorAll("h1, h2, h3, h4, h5, h6, p")).filter((el) => el.textContent.trim());
    if (textEls.length) cells.push([textEls]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-image-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-promo-wide.js
  var MERGED_ATTR = "data-cards-promo-wide-merged";
  function findMergePartner(element) {
    const prev = element.previousElementSibling;
    if (!prev || prev.id !== "mt_id_hp9") return null;
    const doc = element.ownerDocument;
    const partner = doc.querySelector("#mt_id_hp10 + div.grid");
    return partner && partner !== element ? partner : null;
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
  function buildRow(card, document) {
    const img = card.querySelector("img");
    if (!img) return null;
    const link = img.closest("a");
    const image = document.createElement("img");
    image.src = img.getAttribute("src");
    if (img.getAttribute("alt")) image.alt = img.getAttribute("alt").replace(/\s+/g, " ").trim();
    if (link && link.getAttribute("href")) {
      const a = document.createElement("a");
      a.href = link.getAttribute("href");
      a.append(image);
      return [a, ""];
    }
    return [image, ""];
  }
  function parse3(element, { document, params }) {
    if (element.hasAttribute(MERGED_ATTR)) {
      element.remove();
      return;
    }
    const sources = [element];
    const partner = findMergePartner(element);
    if (partner) sources.push(partner);
    const cells = [];
    sources.forEach((src) => {
      collectCards(src).forEach((card) => {
        const row = buildRow(card, document);
        if (row) cells.push(row);
      });
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-promo-wide", cells });
    element.replaceWith(block);
    if (partner) {
      partner.setAttribute(MERGED_ATTR, "");
      partner.remove();
    }
  }

  // tools/importer/parsers/cards-promo-tiles.js
  var MERGED_ATTR2 = "data-cards-promo-tiles-merged";
  function findMergePartner2(element) {
    const parent = element.parentElement;
    if (!parent || parent.id !== "mt_id_hp6") return null;
    const partner = element.ownerDocument.querySelector("#mt_id_hp7 > div.grid");
    return partner && partner !== element ? partner : null;
  }
  function isTrackingPixel(node) {
    if (node.closest(".hidden, .w-0")) return true;
    const img = node.querySelector("img");
    const src = img && img.getAttribute("src") || "";
    return /long-transparent/i.test(src);
  }
  function collectTiles(root) {
    const grid = root.querySelector("div.grid.gap-4") || root.querySelector("div.grid div.grid") || root;
    let tiles = Array.from(grid.children).filter((c) => c.querySelector("a img") && !isTrackingPixel(c));
    if (!tiles.length) {
      tiles = Array.from(root.querySelectorAll("a.coverlinkTile, a")).filter((a) => a.querySelector("img") && !isTrackingPixel(a));
    }
    return tiles;
  }
  function buildRow2(tile, document) {
    const img = tile.querySelector("img");
    if (!img) return null;
    const link = img.closest("a");
    const image = document.createElement("img");
    image.src = img.getAttribute("src");
    if (img.getAttribute("alt")) image.alt = img.getAttribute("alt").replace(/\s+/g, " ").trim();
    const href = link && link.getAttribute("href");
    if (href && !/^javascript:/i.test(href)) {
      const a = document.createElement("a");
      a.href = href;
      a.append(image);
      return [a, ""];
    }
    return [image, ""];
  }
  function parse4(element, { document, params }) {
    if (element.hasAttribute(MERGED_ATTR2)) {
      element.remove();
      return;
    }
    const sources = [element];
    const partner = findMergePartner2(element);
    if (partner) sources.push(partner);
    const cells = [];
    sources.forEach((src) => {
      collectTiles(src).forEach((tile) => {
        const row = buildRow2(tile, document);
        if (row) cells.push(row);
      });
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-promo-tiles", cells });
    element.replaceWith(block);
    if (partner) {
      const wrapper = partner.parentElement;
      partner.setAttribute(MERGED_ATTR2, "");
      partner.remove();
      if (wrapper && wrapper.id === "mt_id_hp7" && !wrapper.textContent.trim() && !wrapper.querySelector("img, a[href], table")) {
        wrapper.remove();
      }
    }
  }

  // tools/importer/parsers/cards-promo-bento.js
  var MERGED_ATTR3 = "data-cards-promo-bento-merged";
  var BREAKPOINTS = ["", "sm", "md", "lg", "xl", "2xl"];
  function orderOf(el) {
    const resolved = {};
    (el.getAttribute("class") || "").split(/\s+/).forEach((token) => {
      if (!token) return;
      const idx = token.indexOf(":");
      const bp = idx > -1 ? token.slice(0, idx) : "";
      const value = idx > -1 ? token.slice(idx + 1) : token;
      if (!BREAKPOINTS.includes(bp)) return;
      let order2 = null;
      if (value === "order-first") order2 = -9999;
      else if (value === "order-last") order2 = 9999;
      else if (value === "order-none") order2 = 0;
      else {
        const m = value.match(/^order-(\d+)$/);
        if (m) order2 = parseInt(m[1], 10);
      }
      if (order2 !== null) resolved[bp] = order2;
    });
    let order = 0;
    BREAKPOINTS.forEach((bp) => {
      if (resolved[bp] !== void 0) order = resolved[bp];
    });
    return order;
  }
  function sortByOrder(nodes) {
    return nodes.map((node, index) => ({ node, index, order: orderOf(node) })).sort((a, b) => a.order - b.order || a.index - b.index).map((entry) => entry.node);
  }
  function collectTiles2(grid) {
    const tiles = [];
    sortByOrder(Array.from(grid.children)).forEach((child) => {
      if (!child.querySelector("a img")) return;
      const nested = child.matches("div.grid") ? child : null;
      if (nested) {
        sortByOrder(Array.from(nested.children)).filter((c) => c.querySelector("a img")).forEach((c) => tiles.push(c));
      } else {
        tiles.push(child);
      }
    });
    if (!tiles.length) {
      Array.from(grid.querySelectorAll("a")).filter((a) => a.querySelector("img")).forEach((a) => tiles.push(a));
    }
    return tiles;
  }
  function findMergePartner3(element) {
    const parent = element.parentElement;
    if (!parent || parent.id !== "mt_id_hp4") return null;
    const partner = element.ownerDocument.querySelector("#mt_id_hp5 > div.grid");
    return partner && partner !== element ? partner : null;
  }
  function buildRow3(tile, document) {
    const img = tile.querySelector("img");
    if (!img) return null;
    const link = img.closest("a");
    const image = document.createElement("img");
    image.src = img.getAttribute("src");
    if (img.getAttribute("alt")) image.alt = img.getAttribute("alt").replace(/\s+/g, " ").trim();
    const href = link && link.getAttribute("href");
    if (href && !/^javascript:/i.test(href)) {
      const a = document.createElement("a");
      a.href = href;
      a.append(image);
      return [a, ""];
    }
    return [image, ""];
  }
  function parse5(element, { document, params }) {
    if (element.hasAttribute(MERGED_ATTR3)) {
      element.remove();
      return;
    }
    const sources = [element];
    const partner = findMergePartner3(element);
    if (partner) sources.push(partner);
    const cells = [];
    sources.forEach((src) => {
      collectTiles2(src).forEach((tile) => {
        const row = buildRow3(tile, document);
        if (row) cells.push(row);
      });
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-promo-bento", cells });
    element.replaceWith(block);
    if (partner) {
      const wrapper = partner.parentElement;
      partner.setAttribute(MERGED_ATTR3, "");
      partner.remove();
      if (wrapper && wrapper.id === "mt_id_hp5" && !wrapper.textContent.trim() && !wrapper.querySelector("img, a[href], table")) {
        wrapper.remove();
      }
    }
  }

  // tools/importer/parsers/tabs-product-recs.js
  function clean(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }
  function findPanel(element, tab, index, panels) {
    const controls = tab.getAttribute("aria-controls");
    if (controls) {
      const byAria = panels.find((p) => p.id === controls);
      if (byAria) return byAria;
    }
    const key = (tab.id || "").replace(/^mt-recs-tab-/, "");
    if (key) {
      const byId = panels.find((p) => p.id === `mt-recs-panel-${key}`);
      if (byId) return byId;
    }
    return panels[index] || null;
  }
  function buildProduct(item, document) {
    const link = item.querySelector("a.mt-aafes-product-link") || item.querySelector("a[href]");
    const img = item.querySelector(".mt-image img") || item.querySelector("img");
    const nameEl = item.querySelector(".aafes-item-name");
    const name = clean(nameEl ? nameEl.textContent : img && img.getAttribute("alt") || link && link.textContent);
    if (!img && !name) return null;
    const li = document.createElement("li");
    if (img && img.getAttribute("src")) {
      const p = document.createElement("p");
      const image = document.createElement("img");
      image.src = img.getAttribute("src");
      const alt = clean(img.getAttribute("alt")) || name;
      if (alt) image.alt = alt;
      p.append(image);
      li.append(p);
    }
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
      li.append(p);
    }
    const priceInfo = item.querySelector(".custom-price-info");
    if (priceInfo) {
      const leaves = Array.from(priceInfo.querySelectorAll("span, p")).filter((el) => !el.querySelector("span, p")).map((el) => clean(el.textContent)).filter(Boolean);
      const priceText = leaves.length ? leaves.join(" ") : clean(priceInfo.textContent);
      if (priceText) {
        const p = document.createElement("p");
        p.textContent = priceText;
        li.append(p);
      }
    }
    return li;
  }
  function parse6(element, { document, params }) {
    const tabs = Array.from(element.querySelectorAll("button.mt-aafes-recs__tab"));
    const panels = Array.from(element.querySelectorAll("div.mt-aafes-recs__panel"));
    const cells = [];
    const tabSources = tabs.length ? tabs : panels.map(() => null);
    tabSources.forEach((tab, index) => {
      const panel = tab ? findPanel(element, tab, index, panels) : panels[index];
      const label = clean(tab ? tab.textContent : "") || `Tab ${index + 1}`;
      if (!panel) return;
      let items = Array.from(panel.querySelectorAll(".mt-merch-item"));
      if (!items.length) {
        items = Array.from(panel.querySelectorAll("li")).filter((li) => li.querySelector("a[href]") && li.querySelector("img"));
      }
      const seen = /* @__PURE__ */ new Set();
      items = items.filter((item) => {
        var _a, _b;
        const href = (_b = (_a = item.querySelector("a.mt-aafes-product-link, a[href]") || {}).getAttribute) == null ? void 0 : _b.call(_a, "href");
        if (!href) return true;
        if (seen.has(href)) return false;
        seen.add(href);
        return true;
      });
      const ul = document.createElement("ul");
      items.forEach((item) => {
        const li = buildProduct(item, document);
        if (li) ul.append(li);
      });
      cells.push([label, ul.children.length ? ul : ""]);
    });
    const title = element.querySelector("#mt-tabbed-recs-title, h2.mt-aafes-recs__title");
    if (title && clean(title.textContent)) {
      const h2 = document.createElement("h2");
      h2.textContent = clean(title.textContent);
      element.before(h2);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "tabs-product-recs", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-logo-circle.js
  function parse7(element, { document, params }) {
    let tiles = Array.from(element.querySelectorAll(":scope > div.banner-tile"));
    if (!tiles.length) tiles = Array.from(element.children).filter((c) => c.querySelector("a img"));
    if (!tiles.length) tiles = Array.from(element.querySelectorAll("a")).filter((a) => a.querySelector("img"));
    const cells = [];
    tiles.forEach((tile) => {
      const img = tile.querySelector("img");
      if (!img) return;
      const image = document.createElement("img");
      image.src = img.getAttribute("src");
      if (img.getAttribute("alt")) image.alt = img.getAttribute("alt").replace(/\s+/g, " ").trim();
      const link = img.closest("a");
      const href = link && link.getAttribute("href");
      if (href && !/^javascript:/i.test(href)) {
        const a = document.createElement("a");
        a.href = href;
        a.append(image);
        cells.push([a, ""]);
      } else {
        cells.push([image, ""]);
      }
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-logo-circle", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-category.js
  function parse8(element, { document, params }) {
    const grid = element.querySelector(":scope > div.grid") || element.querySelector("div.grid") || element;
    let items = Array.from(grid.children).filter((c) => c.querySelector("a[href]"));
    if (!items.length) items = Array.from(element.querySelectorAll("a[href]")).filter((a) => a.querySelector("img"));
    const cells = [];
    items.forEach((item) => {
      const link = item.matches("a") ? item : item.querySelector("a[href]");
      const img = item.querySelector("img");
      const labelEl = item.querySelector("span");
      const label = ((labelEl ? labelEl.textContent : link && link.textContent) || "").replace(/\s+/g, " ").trim();
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

  // tools/importer/parsers/cards-icon-feature.js
  function clean2(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }
  function copyLink(src, document, text) {
    const a = document.createElement("a");
    a.href = src.getAttribute("href");
    a.textContent = text;
    return a;
  }
  function parse9(element, { document, params }) {
    let items = Array.from(element.children).filter((c) => c.querySelector("img") || c.querySelector("h1, h2, h3, h4, h5, h6"));
    if (!items.length) items = [element];
    const cells = [];
    items.forEach((item) => {
      let iconCell = "";
      const img = item.querySelector("img");
      if (img && img.getAttribute("src")) {
        const image = document.createElement("img");
        image.src = img.getAttribute("src");
        if (img.getAttribute("alt")) image.alt = clean2(img.getAttribute("alt"));
        const imgLink = img.closest("a");
        if (imgLink && imgLink.getAttribute("href")) {
          const a = document.createElement("a");
          a.href = imgLink.getAttribute("href");
          a.append(image);
          iconCell = a;
        } else {
          iconCell = image;
        }
      }
      const content = [];
      const heading = item.querySelector("h1, h2, h3, h4, h5, h6");
      if (heading && clean2(heading.textContent)) {
        const h = document.createElement(heading.tagName.toLowerCase());
        const hLink = heading.querySelector("a[href]");
        const title = clean2(heading.textContent);
        if (hLink && hLink.getAttribute("href")) h.append(copyLink(hLink, document, title));
        else h.textContent = title;
        content.push(h);
      }
      Array.from(item.querySelectorAll("a[href]")).filter((a) => !a.querySelector("img") && !(heading && heading.contains(a))).forEach((a) => {
        const text = clean2(a.textContent);
        if (!text || !a.getAttribute("href")) return;
        const p = document.createElement("p");
        p.append(copyLink(a, document, text));
        content.push(p);
      });
      if (!iconCell && !content.length) return;
      cells.push([iconCell, content.length ? content : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-icon-feature", cells });
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
    if (hookName === "beforeTransform") {
      WebImporter.DOMUtils.remove(element, [
        "div.flex.min-h-screen > div.headercontainer",
        "section.relative.min-h-\\[760px\\]",
        "section.SME-footer"
      ]);
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
        'img[src*="bat.bing.com"]'
      ]);
      Array.from(element.querySelectorAll("[class]")).filter((el) => isHiddenOnDesktop(el)).forEach((el) => {
        if (el.isConnected !== false && el.parentNode) el.remove();
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
        anchor.setAttribute("title", dmUrl);
        anchor.textContent = altText;
        return;
      }
      const picture = img.parentElement && img.parentElement.tagName === "PICTURE" ? img.parentElement : null;
      const link = document.createElement("a");
      link.setAttribute("href", dmUrl);
      link.textContent = altText;
      (picture || img).replaceWith(link);
    });
  }

  // tools/importer/import-home.js
  var PAGE_TEMPLATE = {
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
          "#mt_id_hp10 + div.grid"
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
  var parsers = {
    "columns-promo-strip": parse,
    "hero-image-banner": parse2,
    "cards-promo-wide": parse3,
    "cards-promo-tiles": parse4,
    "cards-promo-bento": parse5,
    "tabs-product-recs": parse6,
    "cards-logo-circle": parse7,
    "cards-category": parse8,
    "cards-icon-feature": parse9
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
  var import_home_default = {
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
  return __toCommonJS(import_home_exports);
})();
