import test from "node:test";
import assert from "node:assert/strict";
import { readStoredCart } from "../src/lib/cart-storage.ts";
const quote = {
  id: "roma",
  name: "Sofá Roma",
  img: "/sofa.jpg",
  price: 1999,
  cardPrice: 2275,
  installmentCount: 10,
  quantity: 2,
  color: "Marrom",
};
test("stored quotes survive recovery without being priced again", () => {
  const result = readStoredCart(JSON.stringify([quote]));
  assert.deepEqual(result, { items: [quote], recovered: false });
});
test("corrupt and non-array storage cannot crash the storefront", () => {
  for (const raw of ["{", "null", "{}", "1"])
    assert.deepEqual(readStoredCart(raw), { items: [], recovered: true });
  assert.deepEqual(readStoredCart(null), { items: [], recovered: false });
});
test("valid quotes are retained while malformed quantities and totals are rejected", () => {
  const invalid = [
    { ...quote, quantity: -1 },
    { ...quote, quantity: 1.5 },
    { ...quote, price: "1999" },
    { ...quote, cardPrice: -1 },
    { ...quote, installmentCount: 0 },
    { ...quote, price: 1e20 },
  ];
  assert.deepEqual(readStoredCart(JSON.stringify([quote, ...invalid])), {
    items: [quote],
    recovered: true,
  });
});
