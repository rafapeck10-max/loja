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

test("supports three-decimal metric dimensions without slicing trailing digits", () => {
  assert.deepEqual(values("Largura: 1,697 m; altura: 0,865 m; profundidade: 2,050 m"), {
    Largura: "1,697 m",
    Altura: "0,865 m",
    Profundidade: "2,050 m",
  });
});

test("supports abbreviated measurement labels including missing space before value", () => {
  assert.deepEqual(values("Alt 1,24m | Larg 1,40m | Prof 0,14m"), {
    Largura: "1,40 m",
    Altura: "1,24 m",
    Profundidade: "0,14 m",
  });
  assert.deepEqual(values("Alt 0,04m Larg1,00m Prof 1,50m"), {
    Largura: "1,00 m",
    Altura: "0,04 m",
    Profundidade: "1,50 m",
  });
  assert.deepEqual(values("Comp. 1,20m; Alt.: 0,75m; Prof.: 0,80m"), {
    Comprimento: "1,20 m",
    Altura: "0,75 m",
    Profundidade: "0,80 m",
  });
});

test("does not confuse board thickness later in sentence with depth or drop open/closed prof", () => {
  assert.deepEqual(values("Medidas: Alt 2,16m Larg 1,65m Prof 0,42m, Estrutura 100% MDP 15mm"), {
    Largura: "1,65 m",
    Altura: "2,16 m",
    Profundidade: "0,42 m",
  });
  assert.deepEqual(
    values(
      "Alt 1,12m Larg: 2 Módulos 0,90m + Braço 0,25m Prof Fechado 1,20m Prof Aberto 1,80m Peso 84Kg",
    ),
    {
      Altura: "1,12 m",
      "Profundidade fechada": "1,20 m",
      "Profundidade aberta": "1,80 m",
    },
  );
  assert.deepEqual(
    productMeasurements(
      "Mesa\nLarg: 0,90m\nAlt: 0,78m\nProf: 0,90m\n\nCadeira\nLarg: 36,6cm\nAlt: 88,5cm\nProf: 43,5cm",
    ),
    [],
  );
});
