import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

mock.module(new URL('../blocks/fragment/fragment.js', import.meta.url).href, {
  namedExports: { loadFragment: async () => null },
});

const { parseOnTime, readSchedule, selectFragment } = await import('../blocks/scheduled-fragment/scheduled-fragment.js');

test('date inserter values use local time, including midnight for date-only values', () => {
  assert.equal(parseOnTime('2026-11-25'), new Date(2026, 10, 25).getTime());
  assert.equal(parseOnTime('2026-11-25T09:30'), new Date(2026, 10, 25, 9, 30).getTime());
  assert.equal(parseOnTime('2024-02-29'), new Date(2024, 1, 29).getTime());
  assert.equal(new Date(parseOnTime('0001-01-01')).getFullYear(), 1);
});

test('malformed dates and calendar rollovers are not eligible', () => {
  [
    '', 'tomorrow', '2026-02-29', '2026-04-31', '2026-13-01', '2026-00-01',
    '0000-01-01', '2026-11-00', '2026-11-25T24:00', '2026-11-25T09:60',
    '2026-11-25T09:30Z', '2026-11-25T09:30:00', '11/25/2026',
  ].forEach((value) => assert(Number.isNaN(parseOnTime(value)), value));
});

test('nonexistent daylight-saving times are rejected', {
  skip: process.env.TZ !== 'America/New_York',
}, () => {
  assert(Number.isNaN(parseOnTime('2026-03-08T02:30')));
  assert(Number.isFinite(parseOnTime('2026-11-01T01:30')));
});

test('only the most recent due entry wins regardless of row order', () => {
  const schedule = [
    { path: '/future', onTime: 300 },
    { path: '/first', onTime: 100 },
    { path: '/second', onTime: 200 },
  ];
  assert.equal(selectFragment(schedule, 99), null);
  assert.equal(selectFragment(schedule, 100), schedule[1]);
  assert.equal(selectFragment(schedule, 199), schedule[1]);
  assert.equal(selectFragment(schedule, 200), schedule[2]);
  assert.equal(selectFragment(schedule, 300), schedule[0]);
  assert.equal(selectFragment(schedule, 999), schedule[0]);
  assert.equal(selectFragment([], 999), null);
});

test('the last authored row wins equal on times', () => {
  const schedule = [{ path: '/first', onTime: 100 }, { path: '/last', onTime: 100 }];
  assert.equal(selectFragment(schedule, 100), schedule[1]);
});

test('schedule parsing normalizes same-origin links and ignores incomplete rows', () => {
  global.window = { location: new URL('https://www.example.com/test') };
  const cell = (textContent, href) => ({
    textContent,
    querySelector: () => (href === undefined ? null : { getAttribute: () => href }),
  });
  const row = (...children) => ({ children });
  const date = () => cell('2026-11-25T09:30');
  const block = {
    children: [
      row(cell(' /fragments/plain '), date()),
      row(cell('Link', 'https://www.example.com/fragments/linked.html?test=1#heading'), date()),
      row(cell('/fragments/source.plain.html'), date()),
      row(cell('/fragments/no-href', null), date()),
      row(cell('https://elsewhere.example.com/fragment'), date()),
      row(cell('data:text/plain,not-a-fragment'), date()),
      row(cell('relative/path'), date()),
      row(cell(''), date()),
      row(cell('/fragments/missing-date')),
      row(cell('/fragments/invalid-date'), cell('not a date')),
      row(),
    ],
  };
  assert.deepEqual(readSchedule(block).map((entry) => entry.path), [
    '/fragments/plain', '/fragments/linked', '/fragments/source', '/fragments/no-href',
  ]);
  delete global.window;
});
