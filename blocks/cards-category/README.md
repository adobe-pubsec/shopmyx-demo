# cards-category

Custom **cards** block. Purpose: Shop-by-category grid: circular icon with uppercase label, each linking to a listing.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one row per card, 2 cells (Icon image | Linked label).

## Supported variations

- Default (home, deals): 2-up grid, 6-up from 640px.
- `tiles` (category pages, "Shop By Category"): centered flex rows, 2 / 4 (768px) / 6 (1024px) per row, last row centered, 16px/500 uppercase labels.
- `guides` (category pages, guides row): centered flex rows, 2 / 3 (768px) / 6 (1024px) per row, image max-width 204px.

- `see-more` (authored, e.g. `Cards Category (see-more)`): shows the first 6 cards and a "See More" / "Show Less" button (centered on the panel's bottom rule) for the rest. The importer sets it when the source panel hides tiles behind "See More" (e.g. Electronics > Computers).

The block JS adds `tiles` when every image is a Scene7 product photo (`<sku>_<color>:<preset>`), and `guides` when every image is a `-tile01` asset or the block has exactly 2 cards. Authors can also set either one explicitly, e.g. `Cards Category (guides)`.

## Universal Editor fields

N/A (Document Authoring project)
