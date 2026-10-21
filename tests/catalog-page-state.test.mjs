import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CATALOG_BATCH_SIZE,
  catalogPageForVisibleCount,
  catalogVisibleCountForPage,
} from "../src/lib/catalog-page-state.ts";

test("catalog page state restores the same loaded batch count", () => {
  assert.equal(catalogVisibleCountForPage(2), 48);
  assert.equal(catalogPageForVisibleCount(48), 2);
});

test("catalog page state advances only when the next batch is loaded", () => {
  assert.equal(catalogPageForVisibleCount(CATALOG_BATCH_SIZE), 1);
  assert.equal(catalogPageForVisibleCount(CATALOG_BATCH_SIZE * 2), 2);
  assert.equal(catalogPageForVisibleCount(CATALOG_BATCH_SIZE * 2 + 1), 3);
});

test("invalid page state falls back to the first batch", () => {
  assert.equal(catalogVisibleCountForPage(undefined), 24);
  assert.equal(catalogVisibleCountForPage(0), 24);
  assert.equal(catalogVisibleCountForPage(-1), 24);
  assert.equal(catalogVisibleCountForPage(1.5), 24);
  assert.equal(catalogPageForVisibleCount(0), 1);
  assert.equal(catalogPageForVisibleCount(Number.NaN), 1);
});
