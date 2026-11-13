import test from "node:test";
import assert from "node:assert/strict";
import * as p from "../src/lib/public-price-variations.ts";
test("public variants preserve selected sale prices while excluding supplier costs and extras", () => {
  assert.equal(typeof p.publicPriceVariations, "function");
  assert.deepEqual(
    p.publicPriceVariations([
      { name: "Cinza", sku: "C1", sale_price: 1200, supplier_price: 700, notes: "privado" },
      null,
      { name: "", sku: "bad" },
    ]),
    [{ name: "Cinza", sku: "C1", sale_price: 1200, supplier_price: null }],
  );
  assert.deepEqual(p.publicPriceVariations("invalid"), []);
});
