import assert from "node:assert/strict";
import test from "node:test";
import { productMeasurements } from "../src/lib/product-measurements.ts";

const values = (text) =>
  Object.fromEntries(productMeasurements(text).map(({ label, value }) => [label, value]));

test("preserves the real Roma open and closed depth values", () => {
  assert.deepEqual(
    values("Altura 95 cm; largura 2,00 m; profundidade fechado 1,00 m e aberto 1,55 m."),
    {
      Largura: "2,00 m",
      Altura: "95 cm",
      "Profundidade fechada": "1,00 m",
      "Profundidade aberta": "1,55 m",
    },
  );
});

test("a decimal point does not truncate depth", () => {
  assert.deepEqual(
    values("Largura: 2.00 m; profundidade fechada: 1.00 m; profundidade aberta: 1.55 m."),
    {
      Largura: "2,00 m",
      "Profundidade fechada": "1,00 m",
      "Profundidade aberta": "1,55 m",
    },
  );
});

test("reads qualifiers after values without swapping open and closed", () => {
  assert.deepEqual(values("Profundidade: 1.00 m (fechado) e 1.55 m (aberto)."), {
    "Profundidade fechada": "1,00 m",
    "Profundidade aberta": "1,55 m",
  });
});

test("does not infer dimensions from unlabeled numbers or a product name", () => {
  assert.deepEqual(productMeasurements("Sofá Gold 230 · 230 × 90 × 100 cm"), []);
  assert.deepEqual(productMeasurements(null), []);
});

test("keeps explicit comprimento as comprimento and stops at the next dimension label", () => {
  assert.deepEqual(values("Comprimento 120 cm, profundidade 80 cm, altura 75 cm"), {
    Comprimento: "120 cm",
    Altura: "75 cm",
    Profundidade: "80 cm",
  });
});

test("leaves conflicting labelled measurements in their original text", () => {
  assert.deepEqual(productMeasurements("Largura 2,00 m; Largura 1,80 m; altura 95 cm"), []);
  assert.deepEqual(values("Largura 2 m; largura 200 cm"), { Largura: "2 m" });
});
