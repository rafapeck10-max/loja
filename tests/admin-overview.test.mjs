import assert from "node:assert/strict";
import { test } from "node:test";
import { summarizeOverview } from "../src/lib/admin-overview.ts";
import { overviewImpact } from "../src/lib/admin-overview.ts";

test("attention explains the consequence without claiming physical stock or confirmed image loading", () => {
  assert.equal(
    overviewImpact(product("a", { preco_atual: 0 })),
    "Sem preço de venda válido, o produto não atende aos critérios de exibição do catálogo.",
  );
  assert.equal(
    overviewImpact(product("a", { url_imagem: "" })),
    "Sem endereço de imagem válido, o cadastro precisa de revisão antes da exibição.",
  );
  assert.equal(
    overviewImpact(product("a", { preco_atacado: 0 })),
    "Sem custo do fornecedor, a equipe não consegue comparar o preço de compra com o preço no site.",
  );
});

const product = (id, changes = {}) => ({
  id,
  nome: `Móvel ${id}`,
  preco_atual: 500,
  preco_atacado: 300,
  url_imagem: "https://example.com/movel.jpg",
  ...changes,
});
const success = (data) => ({ status: "success", data, updatedAt: 1794222000000 });

test("catalog totals follow existing admin eligibility and identify actionable problems", () => {
  const result = summarizeOverview(
    success([
      product("a"),
      product("b", { preco_atual: 0 }),
      product("c", { url_imagem: "" }),
      product("d", { preco_atacado: null }),
      product("e", { preco_atual: null, url_imagem: null }),
    ]),
    success([{ id: "import-1" }, { id: "import-2" }]),
  );
  assert.deepEqual(result.counts, {
    total: 5,
    published: 1,
    awaiting: 2,
    incomplete: 2,
    review: 2,
  });
  assert.equal(result.issues.length, 4);
  assert.deepEqual(result.issues.find((issue) => issue.product.id === "e").reasons, [
    "Preço de venda ausente ou inválido",
    "Imagem principal ausente ou inválida",
  ]);
  assert.deepEqual(result.issues.find((issue) => issue.product.id === "d").reasons, [
    "Custo do fornecedor ausente ou inválido",
  ]);
});

test("failed and pending queries never masquerade as an empty catalog or no pending imports", () => {
  for (const status of ["pending", "error"]) {
    const result = summarizeOverview({ status, data: [product("cached")] }, { status, data: [] });
    assert.deepEqual(result.counts, {
      total: null,
      published: null,
      awaiting: null,
      incomplete: null,
      review: null,
    });
    assert.deepEqual(result.issues, []);
  }
});

test("independent sources preserve usable results when only the import queue fails", () => {
  const result = summarizeOverview(success([product("a")]), { status: "error" });
  assert.equal(result.counts.total, 1);
  assert.equal(result.counts.published, 1);
  assert.equal(result.counts.review, null);
});

test("successful empty responses are real zeros, distinct from unavailable sources", () => {
  assert.deepEqual(summarizeOverview(success([]), success([])).counts, {
    total: 0,
    published: 0,
    awaiting: 0,
    incomplete: 0,
    review: 0,
  });
});

test("one product appears once even when it has multiple issues, without changing input", () => {
  const data = [product("a", { preco_atual: 0, preco_atacado: 0, url_imagem: "not-a-url" })];
  const before = JSON.stringify(data);
  const result = summarizeOverview(success(data), success([]));
  assert.equal(result.issues.length, 1);
  assert.equal(result.issues[0].reasons.length, 3);
  assert.equal(JSON.stringify(data), before);
});

test("a full bounded review response is marked as a lower bound, not an exact queue total", () => {
  const full = summarizeOverview(success([]), { ...success([{ id: "a" }, { id: "b" }]), limit: 2 });
  assert.equal(full.reviewLimitReached, true);
  assert.equal(full.counts.review, 2);
  const partial = summarizeOverview(success([]), { ...success([{ id: "a" }]), limit: 2 });
  assert.equal(partial.reviewLimitReached, false);
  assert.equal(
    summarizeOverview(success([]), { status: "error", data: [{ id: "a" }], limit: 1 })
      .reviewLimitReached,
    false,
  );
});
