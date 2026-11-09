import assert from "node:assert/strict";
import { test } from "node:test";
import {
  initialPageDraft,
  movePageSection,
  validatePageDraft,
  chooseWeeklyProduct,
  restorePageDraft,
  toStorefrontProducts,
  sectionProducts,
} from "../src/lib/pages-shelves.ts";
const product = (id, extra = {}) => ({
  id,
  nome: `Móvel ${id}`,
  slug: id,
  categoria: "Sofás",
  preco_atual: 500,
  preco_atacado: 300,
  url_imagem: "https://example.com/foto.jpg",
  descricao: "",
  cores: [],
  vitrine_semana_ordem: null,
  vitrine_novidade: "automatico",
  vitrine_sala: "automatico",
  vitrine_descoberta: true,
  created_at: "2026-11-09T12:00:00Z",
  ...extra,
});
const data = [
  product("a", { vitrine_semana_ordem: 2 }),
  product("b", { vitrine_semana_ordem: 1 }),
  product("c"),
  product("d"),
  product("e"),
  product("bad", { preco_atual: 0 }),
];
test("initial draft preserves storefront section order and current weekly selection", () => {
  const d = initialPageDraft(data);
  assert.deepEqual(
    d.sections.map((s) => s.id),
    ["intro", "discovery", "weekly", "inspiration", "new", "room", "catalog"],
  );
  assert.deepEqual(d.curation.weeklyIds, ["b", "a"]);
});
test("section moves do not move pinned intro/catalog or mutate source", () => {
  const d = initialPageDraft(data);
  const moved = movePageSection(d, "weekly", -1);
  assert.deepEqual(
    moved.sections.slice(0, 3).map((s) => s.id),
    ["intro", "weekly", "discovery"],
  );
  assert.equal(d.sections[1].id, "discovery");
  assert.deepEqual(movePageSection(d, "intro", 1), d);
  assert.deepEqual(movePageSection(d, "discovery", -1), d);
});
test("weekly selection rejects duplicates, ineligible products and overflow", () => {
  const d = initialPageDraft(data);
  assert.throws(() => chooseWeeklyProduct(d, data, "a"), /já/);
  assert.throws(() => chooseWeeklyProduct(d, data, "bad"), /vitrine/);
  const full = chooseWeeklyProduct(chooseWeeklyProduct(d, data, "c"), data, "d");
  assert.throws(() => chooseWeeklyProduct(full, data, "e"), /quatro/);
  assert.deepEqual(d.curation.weeklyIds, ["b", "a"]);
});
test("local restore rejects stale source version and malformed section configurations", () => {
  const d = initialPageDraft(data);
  assert.equal(restorePageDraft(JSON.stringify(d), data).page, "home");
  assert.throws(() => restorePageDraft(JSON.stringify(d), [...data, product("new")]), /mudou/);
  assert.throws(() => restorePageDraft("{broken", data));
  assert.ok(validatePageDraft({ ...d, sections: [...d.sections, d.sections[1]] }, data).length);
});
test("preview uses existing homepage eligibility, ordering and per-section limits", () => {
  const d = initialPageDraft(data);
  const p = toStorefrontProducts(data, d.curation);
  assert.deepEqual(
    sectionProducts("weekly", p, new Date("2026-11-09T12:00:00Z")).map((p) => p.id),
    ["b", "a"],
  );
  assert.ok(sectionProducts("new", p, new Date("2026-11-09T12:00:00Z")).length <= 4);
  assert.ok(
    !sectionProducts("new", p, new Date("2026-11-09T12:00:00Z")).some((p) => p.id === "bad"),
  );
});
test("one invalid section is rejected before saving; titles are plain bounded strings", () => {
  const d = initialPageDraft(data);
  const bad = {
    ...d,
    sections: d.sections.map((s) => (s.id === "weekly" ? { ...s, title: "", type: "html" } : s)),
  };
  assert.ok(validatePageDraft(bad, data).length > 0);
  assert.deepEqual(validatePageDraft(d, data), []);
});

test("source conflicts cover category, availability and creation date used by automatic shelves", () => {
  const draft = initialPageDraft(data);
  for (const changes of [
    { categoria: "Quartos" },
    { descricao: "esgotado" },
    { cores: ["sem estoque"] },
    { created_at: "2026-01-01T12:00:00Z" },
  ]) {
    const changed = data.map((p) => (p.id === "c" ? { ...p, ...changes } : p));
    assert.throws(() => restorePageDraft(JSON.stringify(draft), changed), /mudou/);
  }
});

test("malformed legacy variation JSON cannot break the preview or turn an unknown price into zero", () => {
  const input = [product("legacy", { variacoes_preco: { unexpected: "object" } })];
  const output = toStorefrontProducts(input, initialPageDraft(input).curation);
  assert.deepEqual(output[0].variacoes_preco, []);
  assert.equal(output[0].preco_novo, 500);
});
