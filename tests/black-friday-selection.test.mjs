import test from "node:test";
import assert from "node:assert/strict";
import { isBlackFridayProduct } from "../src/lib/black-friday.ts";

const product = { preco_antigo: 1200, preco_novo: 1000, variacoes_preco: [] };
test("Black selection follows the current offer and disappears when its reference is removed", () => {
  assert.equal(isBlackFridayProduct(product), true);
  assert.equal(isBlackFridayProduct({ ...product, preco_antigo: 0 }), false);
  assert.equal(isBlackFridayProduct({ ...product, preco_antigo: 1000 }), false);
});
test("invalid prices and generated 15% references cannot create a Black badge", () => {
  for (const price of [0, -1, NaN, Infinity])
    assert.equal(isBlackFridayProduct({ ...product, preco_novo: price }), false);
  assert.equal(isBlackFridayProduct({ ...product, preco_antigo: 1150 }), false);
});
test("selection uses the same first valid variant price displayed on the card", () => {
  assert.equal(
    isBlackFridayProduct({
      ...product,
      variacoes_preco: [{ sale_price: null }, { sale_price: 1400 }],
    }),
    false,
  );
  assert.equal(isBlackFridayProduct({ ...product, variacoes_preco: [{ sale_price: 900 }] }), true);
});
test("checking membership does not change catalog prices or variants", () => {
  const before = structuredClone(product);
  isBlackFridayProduct(product);
  assert.deepEqual(product, before);
});
