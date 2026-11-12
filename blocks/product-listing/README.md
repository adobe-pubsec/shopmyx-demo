# product-listing

Custom **product-listing** block. Purpose: Placeholder for the live product listing of a store category.

> **Placeholder.** This block does not show products yet. It renders a single call-to-action link,
> "Shop all <last category level>", to the live listing on shopmyexchange.com
> (`https://www.shopmyexchange.com/browse?pageCategories=<encoded path>`). The full category path is
> set on the block as `data-category` so it can later be connected to the store's search system
> (see the comment in `product-listing.js`). It makes no fetch calls and holds no product data.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: 1 row, 2 cells: Category | <category path>.

| Product Listing |                         |
| --------------- | ----------------------- |
| Category        | Electronics > Computers |

- Separate category levels with ` > ` (the store's category path, e.g. `Electronics > Computers`).
- The link text uses the last level: `Shop all Computers`.
- The path alone in a single cell also works; empty rows and extra whitespace are ignored.
- With no path, the block renders nothing.

Look: a decorative divider (1px brand-blue rule with the Exchange mini logo, `/icons/exchange-mini-logo.png`) above a centered primary button (brand blue, white bold uppercase text), as on the source category listing pages.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
