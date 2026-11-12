# Store Locator Page Migration Plan (Ft Hood Main Exchange)

Migrate https://www.shopmyexchange.com/store-locator/ft-hood-main-exchange to `/store-locator/ft-hood-main-exchange`. Vendors are **fragments**, one per vendor, each holding a **key-value `vendor` block** (like a metadata block). Authors place them by hand under the category and subcategory headings they write on the page. All decisions are confirmed and the plan is ready to run; execution requires Execute mode.

## Decisions (confirmed)

| # | Decision |
|---|---|
| 1 | **Approach F:** hand-placed vendor fragments, each with a key-value `vendor` block. |
| 2 | **One fragment per vendor entry** (vendor at a location, e.g. "Starbucks – Clear Creek Food Court"). |
| 3 | **Hours are free text** for flexibility: the Hours cell keeps whatever the author writes (one line per range), and the importer copies the source text as is. |
| 4 | **No index**, so no site-configuration change. |
| 5 | **Scope: Ft Hood only** for now. |
| 6 | **A vendor in several categories is the same fragment placed in each place.** |
| 7 | **Logo on each vendor fragment** (the Logo key). |

## What's on the page (from a live look)

- **Store header:** name ("Ft Hood Main Exchange"), main store "Clear Creek Exchange", address, store hours ("Mon-Sat 0900-2000, Sun 0900-1800") and phone numbers (main store and HR office).
- **Directory, in four categories:** Food Court, Stores, Restaurants and Services.
  - Each category holds **subcategories**, e.g. "Clear Creek Food Court, Bldg. 4250" or "Fort Hood Shopping Center Services & Retail, Bldg. 4250".
  - Each subcategory lists **vendors**: a 73×73 Scene7 **logo** (empty alt), name, phone link, hours and sometimes a **DoorDash badge** (linked to `https://www.doordash.com/`).
  - About 86 phone links, ~25 distinct logos, 14 DoorDash badges. Restaurants appears to repeat Food Court groups; those become the same fragments placed again.
- **Express Online promo:** a 240×441 image linked to `/cp/static-pages/express`.
- **Letter from the Manager:** name, title and paragraphs.
- **Skipped:** the global header and footer (already migrated), ads and trackers.

## Content model

### Vendor fragment
- **Path:** `/store-locator/ft-hood-main-exchange/vendors/<vendor>-<subcategory>`, e.g. `…/vendors/starbucks-clear-creek-food-court`.
- **Content:** one key-value `vendor` block, plus metadata `Robots: noindex` (fragments only appear inside store pages).

| Vendor | |
|---|---|
| Name | Starbucks |
| Logo | *(image: Dynamic Media link from the asset selector, or a pasted Scene7 link)* |
| Phone | (254) 532-0055 |
| Hours | Mon-Fri 0700-1900<br>Sat 0800-1900<br>Sun 0800-1700 |
| Delivery | [DoorDash](https://www.doordash.com/) |

| Key | Required | Rendering |
|---|---|---|
| Name | Yes | Vendor name |
| Logo | No | 73×73 logo with empty alt (the name is shown next to it) |
| Phone | No | `tel:` link; several numbers allowed, one per line |
| Hours | No | **Free text**, shown line by line as authored |
| Delivery | No | A link to the partner (e.g. [DoorDash](https://www.doordash.com/)); the block shows that partner's badge from the project's icons (`/icons/delivery-doordash.png`, matched by the link's site) and links it to the URL |
| Note | No | Optional short text |

- **Flexible reading:** the block reads fields **by key**, in any order and case-insensitive; optional rows can be left out.
- **Preview-only warnings:** a missing Name, an unknown key, or a Delivery link with no matching badge is outlined, so mistakes are caught before publishing.

### Store page (`/store-locator/ft-hood-main-exchange`)
Authored top to bottom:
1. **Store header:** a key-value `store-info` block (Name, Location, Address, Phone, Hours as free text).
2. **Express Online promo:** a single [image | destination link] promo banner.
3. **Directory:** for each category, an **H2** ("Food Court"). Under it, for each subcategory:
   - an **H3** ("Clear Creek Food Court") and a paragraph with the building line ("Bldg. 4250");
   - a **`vendor-list` block** with one row per vendor, each row a link to a vendor fragment.

   The block fetches its fragments in parallel, renders them as a grid in row order, reserves space while loading, and shows a preview-only warning for fragments that fail to load. A vendor in two categories is listed in both blocks, pointing to the same fragment.
4. **Letter from the Manager:** normal page text.
5. **Breadcrumb:** automatic, "Exchange › Ft Hood Main Exchange" (Breadcrumb Title = store name).

**Why a `vendor-list` block instead of loose fragment links:** the site's fragment auto-loading drops each fragment's sections inline one by one, which nests sections and shifts the layout as each loads. The list block loads a subcategory's vendors together into one grid.

**Trade-offs we accept:**
- **About 90 small fetches per page:** they run in parallel and are cached at the edge, with space reserved while they load.
- **Manual placement:** authors place each vendor themselves; a preview warning flags fragments that fail to load.
- **No site-wide vendor data:** it can be added later by indexing the same key-value fields, without restructuring.

## Checklist

- [ ] Back up the current migration files (`migration-work/` → `migration-work/computers/`) and reuse the project setup.
- [ ] Classify the URL into a new `store` template in a temporary file, then merge it into `tools/importer/page-templates.json` (home, deals and category untouched).
- [ ] Analyze the page:
  - [ ] Header, categories, subcategories (heading + building line), vendors, Express promo, letter, chrome and ad removal.
  - [ ] Extract every vendor entry (name, logo asset, phone, hours text, delivery) and every place it appears.
  - [ ] Map vendors appearing under several categories to one fragment placed several times (key: vendor + subcategory + phone).
- [ ] Build the blocks:
  - [ ] `vendor` (key-value): read fields by key; render the logo, name, `tel:` phone link(s), hours as free-text lines, an optional delivery badge (icon matched by the link's site, linked to it) and an optional note; preview-only warnings for a missing Name, unknown keys or unmatched delivery links.
  - [ ] `vendor-list`: rows of fragment links → parallel fetch (via `fragment/fragment.js`), grid in row order, reserved space, preview-only warning for failed loads.
  - [ ] `store-info` (key-value): Name, Location, Address, Phone, Hours.
- [ ] Add the DoorDash badge to the project icons (`/icons/delivery-doordash.png`, copied from the source).
- [ ] Build the importer:
  - [ ] Store page: `store-info`, Express promo, H2 categories, H3 subcategories plus building line, a `vendor-list` per subcategory linking the right fragments, the letter, Breadcrumb Title.
  - [ ] One vendor fragment per entry (key-value `vendor` block, hours copied as source text, Robots noindex), written once even when placed several times.
  - [ ] Cleanup rules scoped to store pages (ads and trackers out; existing pages unaffected).
- [ ] Import the store page and all vendor fragments locally and check the preview:
  - [ ] Every category and subcategory in source order; each vendor with logo, phone link and hours.
  - [ ] Counts match the source (≈86 phone numbers, 14 DoorDash badges, ~25 distinct logos), with no layout jump while loading and no warnings.
- [ ] Measure load cost (number of fragment requests, time until the directory is complete) and report it.
- [ ] Regression-check home, deals, electronics and computers: identical layout fingerprint and links.
- [ ] Design pass: source styles for category and subcategory headings, building line, vendor grid, 73px logos, phone links and badge, at 1440 and 390px.
- [ ] EW library:
  - [ ] "Vendor" template (all keys prefilled).
  - [ ] "Vendor List" template.
  - [ ] Block options for the Delivery key (e.g. DoorDash).
- [ ] Summarize what changed and where (local only; no Document Authoring upload, publish or configuration change without an explicit request).
