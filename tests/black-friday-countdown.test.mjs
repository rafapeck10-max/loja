import assert from "node:assert/strict";
import { test } from "node:test";
import { BLACK_FRIDAY_END_MS, blackFridayTimeLeft } from "../src/lib/black-friday-countdown.ts";

test("ends at midnight after Black Friday in Brasília, regardless of viewer timezone", () => {
  assert.equal(BLACK_FRIDAY_END_MS, Date.parse("2026-11-28T03:00:00Z"));
  assert.deepEqual(blackFridayTimeLeft(Date.parse("2026-11-27T00:00:00-03:00")), {
    expired: false, days: 1, hours: 0, minutes: 0, seconds: 0,
  });
});

test("counts the last second and stays expired after the deadline", () => {
  assert.equal(blackFridayTimeLeft(BLACK_FRIDAY_END_MS - 1).seconds, 1);
  for (const offset of [0, 1, 86400000]) {
    assert.deepEqual(blackFridayTimeLeft(BLACK_FRIDAY_END_MS + offset), {
      expired: true, days: 0, hours: 0, minutes: 0, seconds: 0,
    });
  }
});
