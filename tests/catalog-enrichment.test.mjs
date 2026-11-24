import test from "node:test";
import assert from "node:assert/strict";
import {
  extractColorsFromDescription,
  extractMedidasFromDescription,
} from "../src/lib/catalog-enrichment.ts";
import { productMeasurements } from "../src/lib/product-measurements.ts";

test("extracts standard supplier inline Medidas and verifies with productMeasurements", () => {
  const sample =
    "Roupeiro Santiago 2P com 1 Espelho, Côr Branco-Branco, da Carioca, Medidas: Alt 2,00m Larg 1,31m Prof 0,45m - 2 Volumes";
  const result = extractMedidasFromDescription(sample);
  assert.equal(result.medidas, "Altura: 2,00 m · Largura: 1,31 m · Profundidade: 0,45 m");
  assert.equal(result.extractedCount, 3);
  assert.equal(productMeasurements(result.medidas).length, 3);
});

test("handles Carioca Porf typo, multiline specs, and closed/open sofa depth", () => {
  const porfSample =
    "Modulado 5 Portas, Côr Branco/Branco, Medidas: Alt 2,00m Larg 2,04m Porf 0,35m Peso 62,25Kg";
  const porfResult = extractMedidasFromDescription(porfSample);
  assert.equal(porfResult.medidas, "Altura: 2,00 m · Largura: 2,04 m · Profundidade: 0,35 m");

  const sofaSample = `MEDIDAS DO SOFÁ:\n\nAltura: 1.05 m\nLargura: 2.30 m\nProfundidade fechado: 0.90 m\nProfundidade aberto: 1.50 m`;
  const sofaResult = extractMedidasFromDescription(sofaSample);
  assert.equal(
    sofaResult.medidas,
    "Altura: 1,05 m · Largura: 2,30 m · Profundidade: 0,90 m fechada / 1,50 m aberta",
  );
  const parsed = productMeasurements(sofaResult.medidas);
  assert.equal(parsed.length, 4);
  assert.ok(parsed.some((m) => m.label === "Profundidade fechada" && m.value === "0,90 m"));
  assert.ok(parsed.some((m) => m.label === "Profundidade aberta" && m.value === "1,50 m"));
});

test("rejects impossible supplier dimensions as anomalies instead of returning garbage", () => {
  const outlierMeters = "MEDIDAS:\n\nAltura: 1.85m\nLargura: 1.83m\nProfundidade: 38,5m";
  const outlierResult = extractMedidasFromDescription(outlierMeters);
  assert.equal(outlierResult.medidas, null);
  assert.match(outlierResult.anomaly ?? "", /^out_of_bounds:Profundidade/);

  const tinyCm = "Altura: 28 cm\nLargura: 1.38 cm\nProfundidade: 1.88 m";
  const tinyResult = extractMedidasFromDescription(tinyCm);
  assert.equal(tinyResult.medidas, null);
  assert.match(tinyResult.anomaly ?? "", /^out_of_bounds:Largura/);
});

test("extracts clean color names from supplier Côr declarations", () => {
  assert.deepEqual(
    extractColorsFromDescription("Roupeiro Capelinha, Côr Cinamomo, da Imop, Medidas: Alt 2,16m"),
    ["Cinamomo"],
  );
  assert.deepEqual(
    extractColorsFromDescription("Estofado Gold 230, Tecido Veludo, Côr Bege 05, da Diviminas"),
    ["Bege"],
  );
  assert.deepEqual(extractColorsFromDescription("Mesa Flórida, Côr Canela/Of White, da Sala Vip"), [
    "Canela",
    "Off White",
  ]);
  assert.deepEqual(
    extractColorsFromDescription(
      "Produzida em madeira ecologicamente correta com corrediças telescópicas",
      "Cabeceira Solteiro 88 Veludão Vinho Fernandes",
      "Cabeceiras",
    ),
    ["Vinho"],
  );
  assert.deepEqual(extractColorsFromDescription("", "Kit Turqueza", "Kits de Cozinha"), []);
  assert.equal(
    extractMedidasFromDescription(
      "Painel Wall / Limit 180. Côr Branco / Nature Brasil. Medidas: Alt. 1,39m Larg. 1,80m Prof. 0,07m",
    ).medidas,
    "Altura: 1,39 m · Largura: 1,80 m · Profundidade: 0,07 m",
  );
});
