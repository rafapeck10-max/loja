import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { demoCategoryFor } from "../scripts/pm01-preview/demo-category.ts";
import { categoryMatches, PRODUCT_CATEGORY_OPTIONS } from "../src/lib/constants.ts";

const sample = JSON.parse(
  readFileSync(new URL("../scripts/pm01-preview/page-products.json", import.meta.url), "utf8"),
);
const matching = (slug) =>
  sample
    .filter((product) => categoryMatches(demoCategoryFor(product), slug))
    .map((product) => product.id);

test("demonstrable kitchen and dining items participate in their real category filters", () => {
  assert.deepEqual(matching("cozinha"), [2]);
  assert.deepEqual(matching("cozinhas-completas"), [2]);
  assert.deepEqual(matching("mesas-de-jantar"), [3, 15]);
  assert.deepEqual(matching("salas-de-jantar"), [1, 3, 7, 15]);
});

test("bedroom, mattress and storage-base types are classified from explicit sample evidence", () => {
  assert.deepEqual(matching("dormitorios"), [4, 6, 8, 9, 10, 12, 13]);
  assert.deepEqual(matching("penteadeiras"), [4]);
  assert.deepEqual(matching("roupeiros"), [6, 8, 9, 10, 13]);
  assert.deepEqual(matching("modulados-quarto"), [12]);
  assert.deepEqual(matching("colchoes-e-bases"), [5, 14]);
});

test("normalization is limited to existing taxonomy labels and never mutates IDs, prices or photos", () => {
  const original = JSON.stringify(sample);
  for (const product of sample) {
    const category = demoCategoryFor(product);
    assert.ok(PRODUCT_CATEGORY_OPTIONS.includes(category), `${product.name}: ${category}`);
    const normalized = { ...product, category };
    assert.equal(normalized.id, product.id);
    assert.equal(normalized.price, product.price);
    assert.equal(normalized.installment, product.installment);
    assert.equal(normalized.img, product.img);
  }
  assert.equal(JSON.stringify(sample), original);
});

test("ambiguous descriptions preserve the source label instead of inventing a subtype", () => {
  assert.equal(
    demoCategoryFor({ name: "Móvel multiuso", detail: "2 portas", category: "Quartos" }),
    "Quartos",
  );
  assert.equal(
    demoCategoryFor({ name: "Mesa auxiliar", detail: "80 cm", category: "Decoração" }),
    "Decoração",
  );
  assert.equal(
    demoCategoryFor({ name: "Cozinha compacta", detail: "2 portas", category: "Cozinha" }),
    "Cozinha",
  );
  assert.equal(
    demoCategoryFor({ name: "Poltrona", detail: "Veludo", category: "Poltronas" }),
    "Poltronas",
  );
});
