import assert from 'node:assert/strict';
import { test } from 'node:test';
import { daysRemaining } from '../blocks/countdown-timer/countdown-timer.js';

const DAY = 86400000;

test('remaining days round up until the exact boundary', () => {
  assert.equal(daysRemaining(30 * DAY, 0), 30);
  assert.equal(daysRemaining(30 * DAY, DAY - 1), 30);
  assert.equal(daysRemaining(30 * DAY, DAY), 29);
  assert.equal(daysRemaining(DAY + 1, 0), 2);
  assert.equal(daysRemaining(DAY, 0), 1);
  assert.equal(daysRemaining(1, 0), 1);
});

test('expired countdowns stop at zero', () => {
  assert.equal(daysRemaining(100, 100), 0);
  assert.equal(daysRemaining(100, 101), 0);
  assert.equal(daysRemaining(100, 100 + DAY), 0);
});

test('a daylight-saving day is counted by elapsed time', () => {
  const start = new Date('2026-03-08T00:00:00-05:00').getTime();
  const end = new Date('2026-03-09T00:00:00-04:00').getTime();
  assert.equal(daysRemaining(end, start), 1);
  assert.equal(daysRemaining(end + DAY, start), 2);
});
