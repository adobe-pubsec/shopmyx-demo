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

  // tools/importer/import-store.js
  var import_store_exports = {};
  __export(import_store_exports, {
    default: () => import_store_default
  });

  // tools/importer/parsers/store-info.js
  function textLines(el) {
    const out = [];
    let current = "";
    el.childNodes.forEach((n) => {
      if (n.nodeName === "BR") {
        out.push(current);
        current = "";
      } else current += n.textContent;
    });
    out.push(current);
    return out.map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  }
  function linesCell(document, lines) {
    const div = document.createElement("div");
    lines.forEach((l, i) => {
      if (i) div.append(document.createElement("br"));
      div.append(document.createTextNode(l));
    });
    return div;
  }
  function parse(element, { document }) {
    const box = element.querySelector(".aafes-title-box");
    if (!box) return;
    const cells = [];
    const h1 = box.querySelector("h1");
    if (h1) cells.push(["Name", h1.textContent.trim()]);
    const banner = element.querySelector('.aafes-title-banner img[src]:not([src=""])');
    if (banner) {
      const img = document.createElement("img");
      img.src = banner.getAttribute("src");
      img.alt = h1 ? h1.textContent.trim() : "";
      cells.push(["Image", img]);
    }
    let label = null;
    [...box.querySelectorAll(":scope > p")].forEach((p) => {
      if (p.classList.contains("aafes-text-title")) {
        label = p.textContent.replace(/:\s*$/, "").trim();
        return;
      }
      const lines = textLines(p);
      if (!lines.length) return;
      cells.push([label || "Address", linesCell(document, lines)]);
      label = null;
    });
    element.replaceWith(WebImporter.Blocks.createBlock(document, { name: "store-info", cells }));
  }

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
  function parse2(element, { document, params }) {
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

  // tools/importer/parsers/vendor-list.js
  var DAY = /\b(mon|tue|wed|thu|fri|sat|sun|daily|24 hours|open 24)/i;
  var slug = (s) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/&/g, " and ").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  var clean = (s) => (s || "").replace(/\s+/g, " ").trim();
  function leadingLines(el) {
    const out = [];
    let current = "";
    for (const n of el.childNodes) {
      if (n.nodeType === 1 && n.nodeName !== "BR") break;
      if (n.nodeName === "BR") {
        out.push(current);
        current = "";
      } else current += n.textContent;
    }
    out.push(current);
    return out.map(clean).filter(Boolean);
  }
  function brLines(el) {
    const out = [];
    let current = "";
    el.childNodes.forEach((n) => {
      if (n.nodeName === "BR") {
        out.push(current);
        current = "";
      } else current += n.textContent;
    });
    out.push(current);
    return out.map(clean).filter(Boolean);
  }
  function cellWithLines(document, lines) {
    const div = document.createElement("div");
    lines.forEach((l, i) => {
      if (i) div.append(document.createElement("br"));
      if (typeof l === "string") div.append(document.createTextNode(l));
      else div.append(l);
    });
    return div;
  }
  function copyLink(document, a, text) {
    const link = document.createElement("a");
    link.href = a.getAttribute("href");
    link.textContent = clean(text || a.textContent);
    return link;
  }
  function readTile(document, tile, groupName) {
    const v = { name: [], location: [], phone: [], hours: [], note: [], delivery: null, logo: null };
    const img = tile.querySelector(".brand img, .img-cont img");
    if (img && clean(img.getAttribute("src"))) v.logo = clean(img.getAttribute("src"));
    const text = tile.querySelector(".text-\\[14px\\]") || tile;
    leadingLines(text).forEach((line) => {
      if (/^bldg\b/i.test(line)) v.location.push(line);
      else if (v.location.length) v.location.push(line);
      else v.name.push(line);
    });
    [...text.children].forEach((child) => {
      if (child.nodeName === "BR") return;
      const tel = child.querySelector('a[href^="tel:"]');
      const links = [...child.querySelectorAll("a[href]")].filter((a) => !a.getAttribute("href").startsWith("tel:"));
      const t = clean(child.textContent);
      if (tel) {
        if (clean(tel.textContent)) v.phone.push(clean(tel.textContent));
        return;
      }
      if (/^dsn\b/i.test(t)) {
        v.phone.push(t);
        return;
      }
      const delivery = links.find((a) => /doordash\.com/i.test(a.getAttribute("href")));
      if (delivery) {
        v.delivery = copyLink(document, delivery, "DoorDash");
        return;
      }
      if (links.length) {
        const prefix = clean([...child.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(" "));
        const line = document.createElement("span");
        if (prefix) line.append(document.createTextNode(`${prefix} `));
        line.append(copyLink(document, links[0]));
        v.note.push(line);
        return;
      }
      if (!t) return;
      if (DAY.test(t)) v.hours.push(...brLines(child));
      else v.note.push(...brLines(child));
    });
    if (!v.name.length) v.name.push(groupName);
    return v;
  }
  function vendorBlock(document, v) {
    const cells = [["Name", cellWithLines(document, v.name)]];
    if (v.logo) {
      const img = document.createElement("img");
      img.src = v.logo;
      cells.push(["Logo", img]);
    }
    if (v.location.length) cells.push(["Location", cellWithLines(document, v.location)]);
    if (v.phone.length) cells.push(["Phone", cellWithLines(document, v.phone)]);
    if (v.hours.length) cells.push(["Hours", cellWithLines(document, v.hours)]);
    if (v.delivery) cells.push(["Delivery", v.delivery]);
    if (v.note.length) cells.push(["Note", cellWithLines(document, v.note)]);
    return WebImporter.Blocks.createBlock(document, { name: "vendor", cells });
  }
  function parse3(element, { document, url, params = {} }) {
    const source = params.originalURL || url || document.location && document.location.href;
    const storePath = new URL(source, "https://www.shopmyexchange.com/").pathname.replace(/\/$/, "");
    params.fragments = params.fragments || [];
    const fragmentsByKey = /* @__PURE__ */ new Map();
    const usedPaths = /* @__PURE__ */ new Set();
    const out = [];
    let category = "";
    let subcategory = "";
    const fragmentFor = (v) => {
      const name = v.name.join(" ");
      const group = subcategory || category;
      const key = [name, group, v.phone.join("|")].join("::").toLowerCase();
      if (fragmentsByKey.has(key)) return fragmentsByKey.get(key);
      const nameSlug = slug(name);
      const groupSlug = slug(group);
      const leaf = !groupSlug || groupSlug === nameSlug ? nameSlug : `${nameSlug}-${groupSlug}`;
      const base = `${storePath}/vendors/${leaf}`;
      let path = base;
      for (let i = 2; usedPaths.has(path); i += 1) path = `${base}-${i}`;
      usedPaths.add(path);
      const frag = document.createElement("div");
      frag.append(vendorBlock(document, v));
      frag.append(WebImporter.Blocks.getMetadataBlock(document, { Robots: "noindex" }));
      params.fragments.push({ element: frag, path });
      const entry = { path, name };
      fragmentsByKey.set(key, entry);
      return entry;
    };
    const visit = (el) => {
      [...el.children].forEach((c) => {
        if (/^H2$/.test(c.tagName)) {
          category = clean(c.textContent);
          subcategory = "";
          const h2 = document.createElement("h2");
          h2.textContent = category;
          out.push(h2);
          return;
        }
        if (c.classList.contains("aafes-title-box")) {
          const h3src = c.querySelector("h3");
          subcategory = h3src ? clean(h3src.textContent) : "";
          if (h3src) {
            const h3 = document.createElement("h3");
            h3.textContent = subcategory;
            out.push(h3);
          }
          [...c.querySelectorAll("p")].forEach((p) => {
            const lines = brLines(p);
            if (!lines.length) return;
            const np = document.createElement("p");
            lines.forEach((l, i) => {
              if (i) np.append(document.createElement("br"));
              np.append(document.createTextNode(l));
            });
            out.push(np);
          });
          return;
        }
        const tiles = [...c.querySelectorAll(":scope > div > .shop-tile, :scope > .shop-tile")];
        if (c.classList.contains("flex-wrap") && tiles.length) {
          const rows = tiles.map((tile) => {
            const entry = fragmentFor(readTile(document, tile, subcategory || category));
            const a = document.createElement("a");
            a.href = entry.path;
            a.textContent = entry.name;
            return [a];
          });
          out.push(WebImporter.Blocks.createBlock(document, { name: "vendor-list", cells: rows }));
          return;
        }
        if (c.children.length) visit(c);
      });
    };
    visit(element);
    if (out.length) {
      out.unshift(WebImporter.Blocks.createBlock(document, {
        name: "vendor-search",
        cells: [
          ["Label", "Find it fast"],
          ["Placeholder", "Search vendors, e.g. Starbucks, barber, Bldg. 4250"]
        ]
      }));
    }
    element.replaceWith(...out);
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

  // tools/importer/transformers/shopmyexchange-sections.js
  var MARKER = "data-excat-section-id";
  function findSectionElement(root, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (const sel of selectors) {
      if (!sel) continue;
      try {
        const el = root.querySelector(sel);
        if (el) return el;
      } catch (e) {
      }
    }
    return null;
  }
  function transform3(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (sections.length < 2) return;
    const document = element.ownerDocument;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const el = findSectionElement(element, section);
        if (!el || !el.parentNode) continue;
        if (i === 0 && !section.style) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(MARKER, section.id);
        el.parentNode.insertBefore(hr, el);
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

  // tools/importer/import-store.js
  var PAGE_TEMPLATE = {
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
  var parsers = {
    "store-info": parse,
    "cards-promo-wide": parse2,
    "vendor-list": parse3
  };
  var sectionTransformers = [transform3];
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
  function documentPath(originalURL) {
    const rawPath = new URL(originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
    return rawPath === "" ? "/index" : `${rawPath}/index`;
  }
  var import_store_default = {
    preprocess: (payload) => {
      executeTransformers("preprocess", payload.document.body, payload, earlyTransformers);
      if (CATALOG) markPageTargets(payload);
    },
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      params.fragments = [];
      const storeName = (document.querySelector(".aafes-store-details h1") || {}).textContent;
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
      if (storeName && storeName.trim()) meta["Breadcrumb Title"] = storeName.trim();
      if (Object.keys(meta).length) main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      params.fragments.forEach(({ element }) => {
        executeTransformers("afterTransform", element, payload, earlyTransformers);
        WebImporter.rules.transformBackgroundImages(element, document);
        WebImporter.rules.adjustImageUrls(element, url, params.originalURL);
      });
      const path = WebImporter.FileUtils.sanitizePath(documentPath(params.originalURL));
      return [{
        element: main,
        path,
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }, ...params.fragments];
    }
  };
  return __toCommonJS(import_store_exports);
})();
