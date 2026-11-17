import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CATALOG_BATCH_SIZE,
  catalogPageForVisibleCount,
  catalogVisibleCountForPage,
} from "../src/lib/catalog-page-state.ts";
import {
  catalogUrlSearch,
  normalizeCatalogReturnSearch,
  parseCatalogReturnSearch,
  parseCatalogUrlState,
  serializeCatalogReturnSearch,
} from "../src/lib/catalog-url-state.ts";

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

test("catalog URL search emits clean numbers without quoted strings", () => {
  const serialized = catalogUrlSearch(
    parseCatalogUrlState({ minPrice: "1000", maxPrice: 2500, widthMaxCm: "180" }),
    2,
  );
  assert.equal(serialized.minPrice, 1000);
  assert.equal(serialized.maxPrice, 2500);
  assert.equal(serialized.widthMaxCm, 180);
  assert.equal(serialized.page, 2);

  const parsed = parseCatalogUrlState({ minPrice: serialized.minPrice });
  assert.equal(parsed.minPrice, "1000");
});

test("catalog return search preserves q, ofertas, all, page and active filters", () => {
  const encoded = serializeCatalogReturnSearch(
    parseCatalogUrlState({ minPrice: "1000", color: "Cinza" }),
    3,
    { q: "sofa retratil" },
  );
  const restored = parseCatalogReturnSearch(normalizeCatalogReturnSearch(encoded));
  assert.equal(restored.q, "sofa retratil");
  assert.equal(restored.page, 3);
  assert.equal(restored.minPrice, "1000");
  assert.equal(restored.color, "Cinza");

  const offersNormalized = normalizeCatalogReturnSearch("ofertas=true&page=2");
  assert.equal(offersNormalized, "ofertas=true&page=2");
  assert.equal(normalizeCatalogReturnSearch("x".repeat(701)), undefined);
});
