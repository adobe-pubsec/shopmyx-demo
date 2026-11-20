# Countdown Timer

A red banner with white authored text. Each `{days}` placeholder becomes a
tilted calendar page displaying the remaining days.

| Countdown Timer |
| --- |
| Only {days} of holiday shopping left! |
| 2026-12-18T00:00 |

Use one cell per row: message first, end date second. Two cells in one row also
work. Empty cells are ignored. Paragraphs, headings, emphasis and links in the
message are preserved; the date is not displayed.

Dates accept `YYYY-MM-DD` (midnight) or `YYYY-MM-DDTHH:mm`, in the visitor's
local time, matching Scheduled Fragment. The number rounds remaining 24-hour
periods up: any positive fraction of a day displays at least 1. It updates when
the count changes and when the page becomes visible again. At or after the end
date it displays 0 and stops; the authored wording is unchanged.

Missing messages, missing `{days}`, and missing/invalid dates hide the block and
produce a console warning rather than displaying a misleading countdown.

Existing test content: <http://localhost:3000/>.

## Validation

```sh
node --experimental-default-type=module --experimental-test-module-mocks --test test/countdown-timer.test.mjs test/scheduled-fragment.test.mjs
npx eslint blocks/countdown-timer/countdown-timer.js blocks/scheduled-fragment/scheduled-fragment.js scripts/date.js
npx stylelint blocks/countdown-timer/countdown-timer.css
```
