import test from "node:test";
import assert from "node:assert/strict";
import { emptyWorkspace, reviseWorkspace } from "../src/lib/admin-studio.ts";
import {
  overlayPreviewProducts,
  readPreviewProductDrafts,
} from "../scripts/pm01-preview/product-drafts.ts";

const source = [
  {
    id: "p1",
    nome: "Móvel",
    preco_atual: 1000,
    preco_atacado: 500,
    url_imagem: "https://example.com/a.jpg",
    categoria: "Sofás",
    cores: [],
    imagens: [],
    variacoes_preco: [],
  },
  {
    id: "p2",
    nome: "Complemento",
    preco_atual: 200,
    preco_atacado: 100,
    url_imagem: "https://example.com/b.jpg",
    categoria: "Poltronas",
    cores: [],
    imagens: [],
    variacoes_preco: [],
  },
];
const draft = {
  changes: {
    p1: {
      basePrice: 1000,
      product: {
        ...source[0],
        descricao: "Texto revisado",
        medidas: "Largura 200 cm",
        cores: ["Azul"],
        imagens: ["https://example.com/second.jpg"],
        compre_junto_ids: ["p2"],
      },
    },
  },
};
const raw = (data) =>
  JSON.stringify(reviseWorkspace(emptyWorkspace(), 0, "products", data, "2026-11-11T12:00:00Z"));

test("PM04 saved draft reaches all public preview attributes without mutating the source", () => {
  const parsed = readPreviewProductDrafts(raw(draft), source);
  const products = overlayPreviewProducts(source, parsed);
  assert.deepEqual(products[0], draft.changes.p1.product);
  assert.equal(products[1], source[1]);
  assert.equal(source[0].descricao, undefined);
  assert.equal(products[0].preco_atual, source[0].preco_atual);
});
test("empty workspace preserves the catalog", () => {
  assert.deepEqual(overlayPreviewProducts(source, readPreviewProductDrafts(null, source)), source);
});
test("corrupt storage and invalid arrays fail before the page renderer", () => {
  assert.throws(() => readPreviewProductDrafts('{"schema":1}', source), /inválido/);
  const corrupt = structuredClone(draft);
  corrupt.changes.p1.product.imagens = "not-an-array";
  assert.throws(() => readPreviewProductDrafts(raw(corrupt), source));
});
test("stale catalog base is rejected without replacing a saved draft", () => {
  assert.throws(
    () => readPreviewProductDrafts(raw(draft), [{ ...source[0], preco_atual: 1100 }, source[1]]),
    /preço-base/,
  );
});
