import test from "node:test";
import assert from "node:assert/strict";
import { pixSavingPercent } from "../src/lib/pix-saving.ts";
import { cardQuote } from "../src/lib/payment.ts";

test("compares Pix with the card total, rather than markup over Pix", () => {
  assert.equal(pixSavingPercent(2000, 2300), 13);
  assert.equal(pixSavingPercent(700, 1000), 30);
});
test("current Black prices preserve the exact card quote and 10x amounts", () => {
  const before = cardQuote(2000);
  assert.equal(pixSavingPercent(2000, before.total), 12);
  assert.deepEqual(cardQuote(2000), before);
  assert.equal(before.total, 2276);
  assert.equal(before.approximateInstallment, 227.6);
  assert.equal(pixSavingPercent(1963, cardQuote(1963).total), 12);
});
test("does not display savings when a comparison is invalid or equal", () => {
  for (const [pix, total] of [
    [0, 100],
    [-1, 100],
    [100, 100],
    [100, 90],
    [NaN, 100],
    [100, Infinity],
  ])
    assert.equal(pixSavingPercent(pix, total), 0);
});
