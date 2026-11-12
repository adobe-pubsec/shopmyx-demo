# Vendor Quick Search ("Find It Fast") Plan

Add a search box just above the Ft Hood vendor directory that filters vendors as the user types, hiding those that don't match. Execution requires Execute mode.

## DOM filtering or an index?

**Recommendation: filter the DOM. An index isn't worth it for this feature.**

**Why the DOM is the right source here:**
- **It's already the data.** By the time a visitor types, all 98 vendors are rendered on the page by the `vendor-list` blocks, with name, location, phone, hours and note. Searching what's on screen is searching exactly what the visitor sees.
- **It's always in sync.** The page structure decides which vendors appear, under which category and subcategory, and how often (a vendor placed twice shows twice). An index is a second copy that can drift from that: it only updates on **publish**, wouldn't know where a fragment is placed, and would need a mapping back to page elements.
- **No extra cost.** There's no extra request, no site-configuration change and no index definition. Filtering ~100 items on each keystroke is instant.
- **It works locally and in preview,** with no index to mock.

**When an index would make sense (not now):**
- searching **across installations** (a store finder, or "which bases have a Starbucks?");
- a page too large to render every vendor up front (lazy loading or pagination);
- search results on a **different page** than the vendors.

If that comes up, an index over the same vendor fragments can be added later. The quick search block wouldn't need to change for this page.

**What the DOM approach has to handle:**
- **Vendors arrive asynchronously.** Fragments load in parallel after the page renders. The search reads vendors at query time and re-applies the current query whenever a vendor list finishes loading. `vendor-list` gets a small "loaded" event for this.
- **Hiding empty groups.** When no vendor in a subcategory matches, its heading band (H3 + building line) hides too. When a whole category is empty, its H2 hides as well.
- **Duplicates and order:** a vendor placed twice is matched and shown in both places; source order is kept.

## How the search behaves

- **Input:** one search field labelled "Find it fast" with a hint like "Search vendors, e.g. Starbucks, barber, Bldg. 4250". The label and hint are authored in the block, not hard-coded.
- **Matching:**
  - Case-insensitive, ignoring accents and apostrophe styles (`Charley's` = `Charley’s`), with "&" = "and".
  - Every word typed must match (`barber 33012` → barber shops in that building).
  - **Fields searched:** vendor name, location, note, phone digits, plus the vendor's **category and subcategory headings**. Typing "food court" or "Mini-Mall" therefore shows those whole groups.
  - **Hours are not searched,** so "Sun" doesn't match every vendor.
- **Results:**
  - Non-matching vendors are hidden (using `hidden`, so they're also removed from screen readers).
  - A live status reads "12 vendors match 'barber'" or "No vendors match 'xyz'", with a **Clear** button.
  - Clearing the field (or pressing Escape) shows everything again.
- **Speed:** input is debounced lightly (~100 ms); there's no layout jump beyond the hidden items.
- **Shareable (optional):** `?q=starbucks` in the address pre-fills the search, so a link can open the page filtered.
- **Accessibility:** a `role="search"` landmark, a labelled `type="search"` input, an `aria-controls` link to the directory, the live result count, and the usual keyboard behavior.

## Block design

- **Name:** `vendor-search`, shown to authors as "Vendor Search".
- **Content model** (key-value, like the other store blocks; all rows optional):

  | Vendor Search | |
  |---|---|
  | Label | Find it fast |
  | Placeholder | Search vendors, e.g. Starbucks, barber, Bldg. 4250 |

- **Placement:** the first item in the directory section (`store-directory`), just above "Food Court". It filters only the vendor lists that follow it in that section.
- **Look:** a full-width field in the directory column, matching the site's form and button styles (brand blue focus ring, 14–16px Lato). Sticky-on-scroll is optional (decision 3).
- **Code:**
  - `blocks/vendor-search/vendor-search.{js,css}`, with no cross-block imports.
  - A small addition to `vendor-list.js`: dispatch a `vendor-list:loaded` event when its vendors have rendered.

## Decisions

| # | Decision | Recommendation |
|---|---|---|
| 1 | Search source | **DOM filtering** (no index) |
| 2 | Searched fields | Name, location, note, phone, category and subcategory headings (not hours) |
| 3 | Sticky search box while scrolling the long directory | Not sticky (keep it simple); revisit after a look |
| 4 | Shareable `?q=` links | Yes, it's a small addition |
| 5 | How the block gets onto the page | Added by the **store importer** at the top of the directory, so a re-import keeps it. Otherwise it's a local edit to the page that a re-import would overwrite. |

## Checklist

- [ ] Confirm decisions 1–5 (or accept the recommendations).
- [ ] `vendor-list`: dispatch a `vendor-list:loaded` event (bubbling) once all its vendors have rendered or failed.
- [ ] Build `vendor-search`:
  - [ ] Read Label and Placeholder from the key-value rows (with defaults); render a search landmark with a labelled input, Clear button and live status.
  - [ ] Build the searchable text per vendor at query time: name, location, note, phone digits, plus the nearest preceding H3 and H2 in the section; normalize case, accents, apostrophes and "&".
  - [ ] Filter on input (debounced): hide non-matching vendor items, then hide subcategory bands and category headings left empty; update the live count and the "no matches" message.
  - [ ] Re-apply the current query on each `vendor-list:loaded` event; support Escape and Clear, and the optional `?q=` pre-fill.
  - [ ] CSS scoped to `.vendor-search`, matching the site's field and button styles, at 1440 and 390px.
- [ ] Importer: have the store directory parser put a `vendor-search` block at the top of the directory; re-import Ft Hood locally (the page stays at `/store-locator/ft-hood-main-exchange/index`).
- [ ] Test in the preview:
  - [ ] "starbucks" → 3 vendors; "barber" → the barber shops, with only their groups showing; "food court" → the Food Court groups; "bldg 4250" → matches by building.
  - [ ] Nonsense text → "No vendors match", with all headings hidden.
  - [ ] Clearing restores all 98 vendors and every heading.
  - [ ] Typing before the vendors finish loading still filters correctly once they arrive.
  - [ ] Keyboard and screen reader basics (label, live count), plus the `?q=` link.
- [ ] Regression-check the other pages (home, deals, electronics, computers): identical layout fingerprint and links.
- [ ] Add a "Vendor Search" sample to the EW library and a README for the block.
- [ ] Summarize what changed (local only; nothing uploaded or published).
