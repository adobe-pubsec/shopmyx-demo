# vendor-list

Custom **vendor-list** block. Purpose: places vendor documents (fragments with a `vendor` block) on a store-locator page, in row order, as a grid (1 per row on mobile, 2 from 640px, 3 from 1024px).

## Authoring (Document Authoring)

One row per vendor: a link to the vendor document.

| Vendor List |
| ----------- |
| [Starbucks](/store-locator/ft-hood-main-exchange/vendors/starbucks-clear-creek-food-court) |
| [Subway](/store-locator/ft-hood-main-exchange/vendors/subway-clear-creek-food-court) |

- Put it under the category (H2) or subcategory (H3 + building line) it belongs to.
- The same vendor can be listed in several vendor lists (e.g. under two categories); it is edited once, in its own document.
- Each vendor is loaded in parallel (one request per vendor document, shared when listed twice); space is reserved while loading.
- On preview, a link that does not load a vendor shows a red notice; on the live site the item is left out.
- When all its vendors have loaded (or failed), the block fires a bubbling `vendor-list:loaded` event and sets `data-vendors-loaded` (used by `vendor-search`).

## Library

Sample: `content/library/blocks/vendor-list.plain.html` ("Vendor List").

## Supported variations

No variations.
