import assert from "node:assert/strict";
import { test } from "node:test";
import {
  catalogSearchScore,
  getCatalogColors,
  getCatalogColorFilterValues,
  getCatalogDimensionLabel,
  getCatalogFeatures,
  getCatalogMaterials,
  matchesCatalogColors,
  matchesCatalogDimensions,
  matchesCatalogFeatures,
  matchesCatalogMaterials,
  matchesCatalogSearch,
} from "../src/lib/catalog-search.ts";

const sofa = {
  nome: "Estofado Living",
  categoria: "Sofás",
  descricao: "Revestimento: linho. Largura 2,10 m. Cor cinza claro.",
  medidas: null,
  cores: ["Cinza claro"],
  materiais: ["Linho"],
  width_cm: 210,
};

test("natural language search ignores connector words without hiding explicit fabric matches", () => {
  assert.equal(matchesCatalogSearch(sofa, "sofá em linho"), true);
  assert.equal(matchesCatalogSearch(sofa, "sofá de linho"), true);
});

test("search matches equivalent metric dimensions and ignores measurement labels", () => {
  assert.equal(matchesCatalogSearch(sofa, "sofá 210 cm"), true);
  assert.equal(matchesCatalogSearch(sofa, "sofá largura 2.10m"), true);
  assert.equal(matchesCatalogSearch(sofa, "sofá 2100 mm"), true);
  assert.equal(matchesCatalogDimensions(sofa, "210 cm"), true);
  assert.equal(matchesCatalogDimensions(sofa, "2,20 m"), false);
});

test("field words direct searches to explicit material, color, and size data", () => {
  assert.equal(matchesCatalogSearch(sofa, "tecido linho"), true);
  assert.equal(matchesCatalogSearch(sofa, "cor cinza"), true);
  assert.equal(matchesCatalogSearch(sofa, "medida 210 cm"), true);
});

test("search includes explicit product variation names", () => {
  const product = {
    ...sofa,
    descricao: "Sofá retrátil com chaise.",
    variacoes_preco: [{ name: "Revestimento linho bege", sale_price: 1000 }],
  };
  assert.equal(matchesCatalogSearch(product, "sofá em linho"), true);
  assert.equal(matchesCatalogSearch(product, "sofá bege"), true);
});

test("relevance ranks explicit title matches ahead of description-only matches", () => {
  const titleMatch = { ...sofa, nome: "Sofá de Linho 2,10 m", descricao: "Cor bege." };
  const descriptionMatch = { ...sofa, nome: "Estofado Living", descricao: "Sofá em linho 2,10 m." };
  assert.ok(
    catalogSearchScore(titleMatch, "sofá em linho") >
      catalogSearchScore(descriptionMatch, "sofá em linho"),
  );
});

test("filters use confirmed structured fields, not descriptions", () => {
  assert.deepEqual(getCatalogMaterials(sofa), ["Linho"]);
  assert.deepEqual(getCatalogColors(sofa), ["Cinza claro"]);
  assert.deepEqual(getCatalogColorFilterValues(sofa), ["Cinza claro", "Cinza"]);
  assert.deepEqual(
    getCatalogColors({
      nome: "Sofá retrátil",
      categoria: "Sofás",
      descricao: "Revestimento em linho.",
      medidas: null,
      cores: ["Gelo"],
    }),
    ["Gelo"],
  );
  assert.deepEqual(
    getCatalogFeatures({
      ...sofa,
      descricao: "Sofá retrátil e reclinável com baú.",
      caracteristicas: ["Retrátil", "Reclinável", "Com baú"],
    }),
    ["Retrátil", "Reclinável", "Com baú"],
  );
  const featureProduct = {
    ...sofa,
    descricao: "Sofá retrátil e reclinável com baú.",
    caracteristicas: ["Retrátil", "Reclinável", "Com baú"],
  };
  assert.equal(matchesCatalogMaterials(sofa, "Linho"), true);
  assert.equal(matchesCatalogColors(sofa, "Cinza"), true);
  assert.equal(matchesCatalogFeatures(featureProduct, "Com baú"), true);
  assert.equal(getCatalogDimensionLabel(sofa), "Largura: 210 cm");
  assert.equal(
    getCatalogDimensionLabel({ ...sofa, width_cm: null, descricao: "Sem dimensões informadas." }),
    "",
  );
});

test("unstructured marketing text does not become a confirmed filter attribute", () => {
  const product = {
    nome: "Sofá Linho Azul 2m",
    categoria: "Sofás",
    descricao: "Linho, azul, retrátil. Largura 200 cm.",
    cores: [],
    medidas: null,
  };
  assert.deepEqual(getCatalogMaterials(product), []);
  assert.deepEqual(getCatalogColors(product), []);
  assert.deepEqual(getCatalogFeatures(product), []);
  assert.equal(matchesCatalogDimensions(product, "200 cm"), false);
  assert.equal(matchesCatalogSearch(product, "tecido linho"), false);
});
