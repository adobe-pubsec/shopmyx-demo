# breadcrumb

Site-wide **breadcrumb**, built from the page path. Authors don't add it to pages.

## How it works

- `scripts/scripts.js` adds the block automatically at the top of every page except the homepage.
- Levels: the homepage ("Exchange"), then every ancestor path that has a page (paths without a page, such as `/categories`, are skipped), then the current page (not linked, `aria-current="page"`).
- Labels: each page's `Breadcrumb Title` metadata; without it, the page's Title; without either, the path segment (`deals` -> "Deals").
- Ancestor labels are read from those pages, after the page has rendered; the block reserves its line so nothing below moves.

## Authoring (Document Authoring)

Nothing to add to the page. Optional page metadata:

| Metadata         |                                         |
| ---------------- | --------------------------------------- |
| Breadcrumb Title | Computers                               |
| Breadcrumbs      | off (hides the breadcrumb on this page) |

The importer fills `Breadcrumb Title` on category pages with the store's category name.

## Supported variations

No variations.
