# vendor-search

Custom **vendor-search** block ("Find it fast"). Purpose: a quick search above a store page's vendor directory that hides the vendors that don't match as the visitor types.

It searches **what is on the page** (no index): every `vendor-list` that follows it in its section, after their vendor fragments have loaded.

## Authoring (Document Authoring)

Key-value rows, both optional:

| Vendor Search |                                                    |
| ------------- | -------------------------------------------------- |
| Label         | Find it fast                                       |
| Placeholder   | Search vendors, e.g. Starbucks, barber, Bldg. 4250 |

Place it at the top of the directory section, above the first category (H2). The store importer adds it automatically.

## Behavior

- **Matches:** vendor name, location, note and phone (also digits only, e.g. `5320055`), plus the vendor's category (H2) and subcategory (H3 and its building lines). Hours are not searched.
- **Matching rules:** case, accents and apostrophes are ignored (`charleys` finds Charley's), and "&" equals "and". A query matches as a phrase (`h&r` → H&R Block) or word by word, every word required (`barber 33012`; single letters only as a phrase). Words match from their start (`starb`).
- **Results:** non-matching vendors are hidden, as are subcategory bands and category headings left empty. A live status reads "8 vendors match "barber"" or "No vendors match …".
- **Clearing:** the Clear button or Escape clears the search.
- **Shareable:** the query is kept in the address as `?q=…`; opening such a link pre-fills the search.
- **Late vendors:** vendors still loading are picked up when their list finishes (`vendor-list:loaded` event).
- **Accessibility:** `role="search"` form, labelled `type="search"` input, `aria-controls` pointing to the directory section, `aria-live` result count.

## Library

Sample: `content/library/blocks/vendor-search.plain.html` ("Vendor Search").

## Supported variations

No variations.
