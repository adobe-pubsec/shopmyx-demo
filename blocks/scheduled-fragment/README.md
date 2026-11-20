# Scheduled Fragment

Show one fragment from a queue using each visitor's local date and time.

| Scheduled Fragment | |
| --- | --- |
| /fragments/evergreen | 2026-01-01 |
| /fragments/holiday | 2026-11-25T09:00 |
| /fragments/evergreen | 2026-12-26T00:00 |

Each content row contains a fragment path (plain text or a link) in the first
cell and its on time in the second. There is no column-label row. Add or remove
rows as needed; chronological order is not required.

## Dates And Selection

- Use the [Date Inserter](https://github.com/jfoxx/aem-apps/tree/date-inserter/tools/plugins/date-inserter)
  to insert `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM` into the second cell.
- Times use the visitor's browser timezone and clock, not the author's timezone
  or a shared site timezone. Date-only values start at local midnight.
- The greatest on time less than or equal to now is the only selected row.
  If several rows share that time, the last authored row wins.
- Before the first on time, nothing is displayed. The final fragment remains
  selected until another row becomes due.
- The block switches automatically when another row becomes due, including
  after a background tab resumes. It fetches only the selected fragment.
- Blank/incomplete rows, invalid dates, impossible local times (such as a
  daylight-saving gap), and off-site fragment URLs are ignored.
- A missing or failed selected fragment leaves the block empty, rather than
  displaying an older scheduled fragment.

Root-relative paths and same-origin absolute URLs are supported. A trailing
`.html`, query string, or hash is removed before using the existing fragment
loader. Fragments retain their normal blocks, images, and section metadata.

## Publishing

Publish the containing page and all scheduled fragments before their on times.
Scheduling does not publish content, invalidate caches, or restrict access to
future fragments: their URLs and the source schedule remain public. This is
client-side display scheduling, not a release-security boundary.

## Validation

Run the dependency-free unit tests with Node 22 or later:

```sh
TZ=America/New_York node --experimental-test-module-mocks --test test/scheduled-fragment.test.mjs
TZ=Asia/Tokyo node --experimental-test-module-mocks --test test/scheduled-fragment.test.mjs
```

With a local static server at the repository root, open
`/tools/scheduled-fragment/index.html` for a preview using the real EDS fragment
loader. The fixture selects Seasonal picks between 2025 and 2030.

The local fixture is `tools/scheduled-fragment/schedule.plain.html`. Validation
covers unsorted rows, exact boundaries, ties, date-only values, malformed rows,
local timezones, empty queues, loading failures, automatic switching, and stale
requests. Fragment rendering should preserve the selected content on mobile,
tablet, and desktop.

## Block Inspector

`tools/scheduled-fragment/library.html` contains the authoring template and a
nested Fields table with **Fragment** and **On Time** labels. The template is
saved in the DA Blocks library as `library/blocks/scheduled-fragment.html` and
registered in `library/library.json`. Its `editor` sheet sets
`block: scheduled-fragment` and `property: multi`, so the single schema row
applies to every queued item. These library updates have not been published.
