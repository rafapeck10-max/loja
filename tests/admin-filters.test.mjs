import assert from "node:assert/strict";
import { productStatus, matchesPriceFilter, parsePriceFilter } from "../src/lib/admin-filters.ts";

const product = {
  preco_atual: 600,
  preco_atacado: 400,
  url_imagem: "https://example.com/product.jpg",
};
assert.equal(productStatus(product), "published");
assert.equal(productStatus({ ...product, preco_atual: 0 }), "awaiting");
assert.equal(productStatus({ ...product, preco_atual: 0, preco_atacado: null }), "awaiting");
assert.equal(productStatus({ ...product, preco_atacado: null }), "incomplete");
assert.equal(productStatus({ ...product, url_imagem: "" }), "incomplete");
assert.equal(parsePriceFilter("1.500,50"), 1500.5);
assert.equal(parsePriceFilter("500,50"), 500.5);
assert.equal(parsePriceFilter("500.50"), 500.5);
assert.equal(matchesPriceFilter(500, "500", "500"), true);
assert.equal(matchesPriceFilter(499, "500", "1500"), false);
assert.equal(matchesPriceFilter(1501, "500", "1500"), false);
assert.equal(matchesPriceFilter(0, "", "500"), true);
assert.equal(matchesPriceFilter(null, "", "500"), false);
assert.equal(matchesPriceFilter(null, "", ""), true);
assert.equal(matchesPriceFilter(600, "900", "500"), false);
assert.equal(matchesPriceFilter(600, "abc", ""), false);
console.log(
  "PASS: publication states, unknown cost, price boundaries, decimals and invalid ranges.",
);
