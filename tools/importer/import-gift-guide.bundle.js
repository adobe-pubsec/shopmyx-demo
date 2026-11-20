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

  // tools/importer/import-gift-guide.js
  var import_gift_guide_exports = {};
  __export(import_gift_guide_exports, {
    default: () => import_gift_guide_default
  });

  // tools/importer/parsers/promo-banner.js
  var BANNERS = {
    "TB-gift-guide-2026-header01": {
      heading: "Merry Everything",
      level: "h1",
      subtitle: "bright picks for everyone on your list",
      art: { crop: "860,0,550,384", alt: "Gingerbread man and holiday gift box" },
      border: { crop: "0,384,1410,260", alt: "" }
    },
    "LP-gift-guide-2026-gift-cards01": {
      heading: "Add Holiday Cheer",
      level: "h2",
      subtitle: "with gift cards",
      cta: "Shop Gift Cards",
      art: { crop: "885,0,525,210", alt: "Xbox and Visa gift cards with a candy cane" }
    }
  };
  function assetName(src) {
    return decodeURIComponent((src || "").split("?")[0].split("/").pop() || "");
  }
  function cropped(src, crop) {
    return `${(src || "").split("?")[0]}?crop=${crop}`;
  }
  function el(document, tag, text) {
    const node = document.createElement(tag);
    node.textContent = text;
    return node;
  }
  function image(document, src, alt) {
    const img = document.createElement("img");
    img.setAttribute("src", src);
    img.setAttribute("alt", alt || "");
    return img;
  }
  function linkPara(document, href, text) {
    const p = document.createElement("p");
    const a = document.createElement("a");
    a.setAttribute("href", href);
    a.textContent = text;
    p.append(a);
    return p;
  }
  function destinationOf(root) {
    const a = [...root.querySelectorAll("a[href]")].find((link2) => !/^javascript:/i.test(link2.getAttribute("href")));
    return a ? a.getAttribute("href") : null;
  }
  function parse(element, { document }) {
    const img = element.querySelector("img");
    if (!img) return;
    const src = img.getAttribute("src");
    const href = destinationOf(element);
    const entry = BANNERS[assetName(src)];
    const text = [];
    let art;
    let border = null;
    if (entry) {
      text.push(el(document, entry.level || "h2", entry.heading));
      if (entry.subtitle) text.push(el(document, "p", entry.subtitle));
      if (href) text.push(linkPara(document, href, entry.cta || entry.heading));
      art = image(document, cropped(src, entry.art.crop), entry.art.alt);
      if (entry.border) border = image(document, cropped(src, entry.border.crop), entry.border.alt);
    } else {
      const alt = (img.getAttribute("alt") || "").replace(/\s+/g, " ").trim();
      const [heading, ...rest] = alt.split(/\s+-\s+/);
      if (heading) text.push(el(document, "h2", heading));
      if (rest.length) text.push(el(document, "p", rest.join(" - ")));
      if (href) text.push(linkPara(document, href, heading || href));
      art = image(document, src, alt);
    }
    const cells = [[art, text]];
    if (border) cells.push([border]);
    const block = WebImporter.Blocks.createBlock(document, { name: "promo-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-promo-tiles.js
  var MERGED_ATTR = "data-cards-promo-tiles-merged";
  function findMergePartner(element) {
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
  function destinationLink(document, href, image4) {
    const a = document.createElement("a");
    a.href = href;
    a.textContent = (image4.alt || "").trim() || href;
    return a;
  }
  function buildRow(tile, document) {
    const img = tile.querySelector("img");
    if (!img) return null;
    const link2 = img.closest("a");
    const image4 = document.createElement("img");
    image4.src = img.getAttribute("src");
    if (img.getAttribute("alt")) image4.alt = img.getAttribute("alt").replace(/\s+/g, " ").trim();
    const href = link2 && link2.getAttribute("href");
    if (href && !/^javascript:/i.test(href)) {
      return [image4, destinationLink(document, href, image4)];
    }
    return [image4, ""];
  }
  function parse2(element, { document, params }) {
    if (element.hasAttribute(MERGED_ATTR)) {
      element.remove();
      return;
    }
    const sources = [element];
    const partner = findMergePartner(element);
    if (partner) sources.push(partner);
    const cells = [];
    sources.forEach((src) => {
      collectTiles(src).forEach((tile) => {
        const row = buildRow(tile, document);
        if (row) cells.push(row);
      });
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-promo-tiles", cells });
    element.replaceWith(block);
    if (partner) {
      const wrapper = partner.parentElement;
      partner.setAttribute(MERGED_ATTR, "");
      partner.remove();
      if (wrapper && wrapper.id === "mt_id_hp7" && !wrapper.textContent.trim() && !wrapper.querySelector("img, a[href], table")) {
        wrapper.remove();
      }
    }
  }

  // tools/importer/parsers/cards-gift-tile.js
  var TILE_CROP = "0,0,420,445";
  var TILE_LABELS = {
    "LP-gift-guide-2026-tile-ultimate-gifts01": "Ultimate Gifts",
    "LP-gift-guide-2026-tile-for-her01": "For Her",
    "LP-gift-guide-2026-tile-for-him01": "For Him",
    "LP-gift-guide-2026-tile-stocking-stuffers01": "Stocking Stuffers",
    "LP-gift-guide-2026-tile-top-toys01": "Top Toys",
    "LP-gift-guide-2026-tile-gift-sets01": "Gift Sets",
    "LP-gift-guide-2026-tile-family-pjs01": "Family PJs",
    "LP-gift-guide-2026-tile-handbags01": "Handbags",
    "LP-gift-guide-2026-tile-electronics01": "Electronics",
    "LP-gift-guide-2026-tile-fan-shop01": "Fan Shop",
    "LP-gift-guide-2026-tile-fitness-buffs01": "Fitness Buffs",
    "LP-gift-guide-2026-tile-pet-lovers01": "Pet Lovers",
    "LP-gift-guide-2026-tile-gourmet-foods01": "Gourmet Foods",
    "LP-gift-guide-2026-tile-jewelry01": "Jewelry",
    "LP-gift-guide-2026-tile-home-cozy01": "Home & Cozy",
    "LP-gift-guide-2026-tile-for-the-traveler01": "For the Traveler"
  };
  function assetName2(src) {
    return decodeURIComponent((src || "").split("?")[0].split("/").pop() || "");
  }
  function parse3(element, { document }) {
    const cells = [];
    [...element.children].forEach((tile) => {
      const img = tile.querySelector("img");
      if (!img) return;
      const src = img.getAttribute("src");
      const name = assetName2(src);
      const known = Object.prototype.hasOwnProperty.call(TILE_LABELS, name);
      const alt = (img.getAttribute("alt") || "").replace(/\s+/g, " ").trim();
      const label = known ? TILE_LABELS[name] : alt;
      const image4 = document.createElement("img");
      image4.setAttribute("src", known ? `${src.split("?")[0]}?crop=${TILE_CROP}` : src);
      image4.setAttribute("alt", label || alt);
      const dest = [...tile.querySelectorAll("a[href]")].find((a) => !/^javascript:/i.test(a.getAttribute("href")));
      let text = label || "";
      if (dest) {
        text = document.createElement("a");
        text.setAttribute("href", dest.getAttribute("href"));
        text.textContent = label || dest.getAttribute("href");
      }
      cells.push([image4, text]);
    });
    if (!cells.length) return;
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-gift-tile", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-gift-feature.js
  var CELLS = {
    "LP-gift-guide-2026-gift-tabs-toys01": {
      type: "tile",
      label: "Shop Toy Book",
      art: { crop: "0,0,334,403", alt: "Toys for the holidays toy book cover" }
    },
    "LP-gift-guide-2026-gift-tabs-joyful-gifting01": {
      type: "tile",
      label: "Shop Gift Guide",
      art: { crop: "0,0,334,403", alt: "Joyful Gifting gift guide cover" }
    },
    "LP-gift-guide-2026-gift-tabs-find-the-perfect-gift01": {
      type: "feature",
      heading: "Find The Perfect Gift",
      subtitle: "for everyone who is naughty & nice",
      art: { crop: "262,282,218,170", alt: "Wrapped gift box" }
    }
  };
  function assetName3(src) {
    return decodeURIComponent((src || "").split("?")[0].split("/").pop() || "");
  }
  function para(document, child) {
    const p = document.createElement("p");
    p.append(child);
    return p;
  }
  function image2(document, src, alt) {
    const img = document.createElement("img");
    img.setAttribute("src", src);
    img.setAttribute("alt", alt || "");
    return img;
  }
  function link(document, href, text) {
    const a = document.createElement("a");
    a.setAttribute("href", href);
    a.textContent = text;
    return a;
  }
  function parse4(element, { document }) {
    const row = [];
    [...element.children].forEach((col) => {
      const img = col.querySelector("img");
      if (!img) return;
      const src = img.getAttribute("src");
      const base = src.split("?")[0];
      const dest = [...col.querySelectorAll("a[href]")].find((a) => !/^javascript:/i.test(a.getAttribute("href")));
      const href = dest ? dest.getAttribute("href") : null;
      const entry = CELLS[assetName3(src)];
      const cell = [];
      if (entry && entry.type === "feature") {
        const h2 = document.createElement("h2");
        h2.textContent = entry.heading;
        cell.push(h2);
        if (entry.subtitle) {
          const p = document.createElement("p");
          p.textContent = entry.subtitle;
          cell.push(p);
        }
        cell.push(para(document, image2(document, `${base}?crop=${entry.art.crop}`, entry.art.alt)));
        if (href) cell.push(para(document, link(document, href, entry.heading)));
      } else if (entry) {
        cell.push(para(document, image2(document, `${base}?crop=${entry.art.crop}`, entry.art.alt)));
        if (href) cell.push(para(document, link(document, href, entry.label)));
      } else {
        const alt = (img.getAttribute("alt") || "").replace(/\s+/g, " ").trim();
        cell.push(para(document, image2(document, src, alt)));
        if (href) cell.push(para(document, link(document, href, alt || href)));
      }
      row.push(cell);
    });
    if (!row.length) return;
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-gift-feature", cells: [row] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/shipping-deadlines.js
  var SHIPPING = {
    "LP-gift-guide-2026-shipping-delivery01": {
      heading: "Last day to order online for delivery before December 25:",
      linkText: "Holiday 2026 Shipping & Delivery",
      left: { crop: "0,72,160,285", alt: "Christmas stocking" },
      right: { crop: "1040,60,370,236", alt: "Exchange delivery truck" },
      deadlines: [
        ["OCONUS APO/FPO", "Dec 8", ""],
        ["CONUS", "Dec 16", "Regular Ground Shipments"],
        ["CONUS", "Dec 18", "Priority Shipments"],
        ["FedEx", "Dec 21", "2 Day"],
        ["FedEx", "Dec 23", "Overnight"]
      ],
      note: "Some exclusions apply"
    }
  };
  function assetName4(src) {
    return decodeURIComponent((src || "").split("?")[0].split("/").pop() || "");
  }
  function cropped2(src, crop) {
    return `${(src || "").split("?")[0]}?crop=${crop}`;
  }
  function image3(document, src, alt) {
    const img = document.createElement("img");
    img.setAttribute("src", src);
    img.setAttribute("alt", alt || "");
    return img;
  }
  function titleCell(document, heading, href, linkText) {
    const h2 = document.createElement("h2");
    h2.textContent = heading;
    const cell = [h2];
    if (href) {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.setAttribute("href", href);
      a.textContent = linkText || heading;
      p.append(a);
      cell.push(p);
    }
    return cell;
  }
  function parse5(element, { document }) {
    const img = element.querySelector("img");
    if (!img) return;
    const src = img.getAttribute("src");
    const link2 = [...element.querySelectorAll("a[href]")].find((a) => !/^javascript:/i.test(a.getAttribute("href")));
    const href = link2 ? link2.getAttribute("href") : null;
    const entry = SHIPPING[assetName4(src)];
    const cells = [];
    if (entry) {
      cells.push([titleCell(document, entry.heading, href, entry.linkText)]);
      cells.push([
        image3(document, cropped2(src, entry.left.crop), entry.left.alt),
        image3(document, cropped2(src, entry.right.crop), entry.right.alt)
      ]);
      entry.deadlines.forEach(([group, date, label]) => cells.push([group, date, label || ""]));
      if (entry.note) cells.push([entry.note]);
    } else {
      const alt = (img.getAttribute("alt") || "").replace(/\s+/g, " ").trim();
      cells.push([titleCell(document, alt, href, alt)]);
      cells.push([image3(document, src, alt)]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "shipping-deadlines", cells });
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
  function isHiddenOnDesktop(el2) {
    const cls = el2.getAttribute("class");
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
  function isEmptyElement(el2) {
    if (!el2) return false;
    if (el2.textContent.trim()) return false;
    return !el2.querySelector("img, picture, video, iframe, a[href], table, hr");
  }
  function transform(hookName, element, payload) {
    if (hookName === "preprocess") {
      const storeBanner = element.querySelector(".aafes-store-details .aafes-title-banner img");
      if (storeBanner && !storeBanner.getAttribute("src")) {
        const css = [...element.querySelectorAll(".aafes-store-details style")].map((st) => st.textContent).join(" ");
        const bg = css.match(/aafes-title-banner[^}]*background-image:\s*url\(([^)]+)\)/);
        if (bg) storeBanner.setAttribute("src", bg[1].replace(/['"]/g, "").trim());
      }
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
      if (element.querySelector(".aafes-store-details")) {
        WebImporter.DOMUtils.remove(element, [".aafes-store-details nav.aafes-breadcrumb"]);
        element.querySelectorAll(".aafes-store-details img[src]").forEach((img) => {
          const src = img.getAttribute("src");
          if (src !== src.trim()) img.setAttribute("src", src.trim());
        });
        element.querySelectorAll(".aafes-store-details .store-content + div > h3").forEach((h3) => {
          const h2 = h3.ownerDocument.createElement("h2");
          h2.textContent = h3.textContent.trim();
          h3.replaceWith(h2);
        });
      }
      const isCategoryPage = !!element.querySelector("main section#category.lp-standard-category");
      if (isCategoryPage) {
        element.querySelectorAll("#category .categorytile.hidden").forEach((tile) => {
          tile.classList.remove("hidden");
        });
        WebImporter.DOMUtils.remove(element, ["#category #toggle-button"]);
        WebImporter.DOMUtils.remove(element, [
          "div.gap-x-5.md\\:flex-row:has(> main) > :not(main)",
          // Hidden web/app duplicate "Electronic Guides" panel (the visible
          // #sizecharts without .hidden is kept for cards-category).
          "section#sizecharts.hidden",
          // Hidden appDisplay duplicate "You May Also Like" heading + empty
          // slider placeholder in the CMS area; the real one lives in
          // #recommendationContainer (section rc2).
          "main h2.hidden",
          "main div.hidden",
          // Subcategory listing paging ("1 2 3 … 88") sits outside <main>, below the
          // live product listing (which becomes the product-listing placeholder).
          "div.mx-auto > div.my-3.flex.justify-center",
          // Decorative divider (rule with a centered Exchange mini logo) between the
          // promo banner and the product listing; styling, not content.
          'div.col-span-12.border-b-1:has(> img[src*="mini-logo"])'
        ]);
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
        // Breadcrumb trail ("Exchange > Deals", "Exchange > Electronics > ...").
        // Not content: the site builds it from the page path (breadcrumb block).
        "nav.mb-5.flex",
        // Deals: app-only duplicate titles; the visible headings are the h2
        // inside div.clear-both.pt-10.
        "p#app-screen-title"
      ]);
      Array.from(element.querySelectorAll("[class]")).filter((el2) => isHiddenOnDesktop(el2)).forEach((el2) => {
        if (el2.isConnected !== false && el2.parentNode) el2.remove();
      });
      element.querySelectorAll('a[href^="javascript:"]').forEach((a) => {
        a.replaceWith(...Array.from(a.childNodes));
      });
    }
    if (hookName === "afterTransform") {
      element.querySelectorAll("#mt_id_hp10").forEach((el2) => {
        if (isEmptyElement(el2)) el2.remove();
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
      element.querySelectorAll("*").forEach((el2) => {
        Array.from(el2.attributes).forEach(({ name }) => {
          if (/^on/i.test(name) || /^data-(gtm|track|analytics|ga)/i.test(name)) {
            el2.removeAttribute(name);
          }
        });
      });
    }
  }

  // tools/importer/transformers/shopmyexchange-gift-guide.js
  var HEADINGS = {
    "LP-gift-guide-2026-gifts-under01": { text: "Gifts Under", level: "h2" }
  };
  function assetName5(src) {
    return decodeURIComponent((src || "").split("?")[0].split("/").pop() || "");
  }
  function transform2(hookName, element, payload) {
    if (hookName === "preprocess") {
      element.querySelectorAll("section.bg-holidaygiftguide .lpcategory-container > div").forEach((tile) => {
        const img = tile.querySelector(":scope > img");
        const a = tile.querySelector(":scope > a[href]");
        if (!img || !a || a.textContent.trim() || a.querySelector("img")) return;
        a.prepend(img);
      });
      return;
    }
    if (hookName === "afterTransform") {
      const document = element.ownerDocument;
      element.querySelectorAll("img").forEach((img) => {
        if (img.closest("table")) return;
        const entry = HEADINGS[assetName5(img.getAttribute("src"))];
        if (!entry) return;
        const heading = document.createElement(entry.level || "h2");
        heading.textContent = entry.text;
        const link2 = img.closest("a");
        (link2 && link2.textContent.trim() === "" ? link2 : img).replaceWith(heading);
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
    const others = Array.from(anchor.querySelectorAll("*")).filter((el2) => {
      if (el2 === img) return false;
      if (el2.contains(img)) return false;
      return !["SOURCE", "BR"].includes(el2.tagName);
    });
    const imgs = anchor.querySelectorAll("img");
    return others.length === 0 && imgs.length === 1;
  }
  function transform3(hookName, element, payload) {
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
      const link2 = document.createElement("a");
      link2.setAttribute("href", dmUrl);
      link2.textContent = altText;
      (picture || img).replaceWith(link2);
    });
  }

  // tools/importer/transformers/shopmyexchange-sections.js
  var MARKER = "data-excat-section-id";
  function findSectionElement(root, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (const sel of selectors) {
      if (!sel) continue;
      try {
        const el2 = root.querySelector(sel);
        if (el2) return el2;
      } catch (e) {
      }
    }
    return null;
  }
  function transform4(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (sections.length < 2) return;
    const document = element.ownerDocument;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const el2 = findSectionElement(element, section);
        if (!el2 || !el2.parentNode) continue;
        if (i === 0 && !section.style) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(MARKER, section.id);
        el2.parentNode.insertBefore(hr, el2);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
        const anchor = marker || findSectionElement(element, section);
        if (!anchor || !anchor.parentNode) continue;
        const meta = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        if (marker) {
          let next = marker.nextElementSibling;
          while (next && next.tagName !== "HR") next = next.nextElementSibling;
          if (next) next.parentNode.insertBefore(meta, next);
          else marker.parentNode.appendChild(meta);
          if (i === 0) marker.remove();
          else marker.removeAttribute(MARKER);
        } else {
          anchor.after(meta);
        }
      }
      element.querySelectorAll(`hr[${MARKER}]`).forEach((hr) => hr.removeAttribute(MARKER));
    }
  }

  // tools/importer/import-gift-guide.js
  var PAGE_TEMPLATE = {
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
          'div.banner-container:has(img[src*="gift-guide-2026-header01"])',
          'div.banner-container:has(img[src*="gift-guide-2026-gift-cards01"])'
        ]
      },
      {
        "name": "cards-promo-tiles",
        "instances": [
          'section.bg-holidaygiftguide div.lpcategory-container:has(img[src*="-dollar-bow"])'
        ]
      },
      {
        "name": "cards-gift-tile",
        "instances": [
          'section.bg-holidaygiftguide div.lpcategory-container:has(img[src*="gift-guide-2026-tile-"])'
        ]
      },
      {
        "name": "columns-gift-feature",
        "instances": [
          'section.bg-holidaygiftguide div.lpcategory-container:has(img[src*="gift-tabs-"])'
        ]
      },
      {
        "name": "shipping-deadlines",
        "instances": [
          'div.banner-container:has(img[src*="shipping-delivery01"])'
        ]
      }
    ],
    "urlPattern": "/cp/category-landing-pages/shared-promotions/*",
    "sections": [
      {
        "id": "S1",
        "name": "Hero",
        "selector": [
          'div.banner-container:has(img[src*="gift-guide-2026-header01"])'
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
          'div.banner-container.bg-holidaygiftguide:has(img[src*="gifts-under01"])'
        ],
        "style": "holiday-red",
        "blocks": [
          "cards-promo-tiles",
          "cards-gift-tile",
          "promo-banner",
          "columns-gift-feature"
        ],
        "defaultContent": [
          'div.banner-container.bg-holidaygiftguide:has(img[src*="gifts-under01"])'
        ]
      },
      {
        "id": "S3",
        "name": "Shipping deadlines",
        "selector": [
          'div.banner-container:has(img[src*="shipping-delivery01"])'
        ],
        "style": "holiday-red",
        "blocks": [
          "shipping-deadlines"
        ],
        "defaultContent": []
      }
    ]
  };
  var parsers = {
    "promo-banner": parse,
    "cards-promo-tiles": parse2,
    "cards-gift-tile": parse3,
    "columns-gift-feature": parse4,
    "shipping-deadlines": parse5
  };
  var sectionTransformers = [transform4];
  var fragmentTransformers = [];
  var lateTransformers = [...sectionTransformers, ...fragmentTransformers];
  var transformers = [transform, transform2, transform3, ...lateTransformers];
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
  var import_gift_guide_default = {
    preprocess: (payload) => {
      executeTransformers("preprocess", payload.document.body, payload, earlyTransformers);
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
      const meta = WebImporter.Blocks.getMetadata(document) || {};
      meta["Breadcrumb Title"] = "Holiday Gift Guide";
      main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
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
  return __toCommonJS(import_gift_guide_exports);
})();
