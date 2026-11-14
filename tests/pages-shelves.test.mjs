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
  normalizePageDraft,
  publishedHomePageFromDraft,
  chooseShelfProduct,
  removeShelfProduct,
  moveShelfProduct,
  setShelfMode,
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
    ["intro", "blackFriday", "discovery", "weekly", "inspiration", "new", "room", "catalog"],
  );
  assert.equal(d.sections.find((section) => section.id === "blackFriday").enabled, false);
  assert.equal(d.sections.find((section) => section.id === "discovery").enabled, false);
  assert.deepEqual(d.curation.weeklyIds, ["b", "a"]);
});
test("section moves do not move pinned intro/catalog or mutate source", () => {
  const d = initialPageDraft(data);
  const moved = movePageSection(d, "weekly", -1);
  assert.deepEqual(
    moved.sections.slice(0, 4).map((s) => s.id),
    ["intro", "blackFriday", "weekly", "discovery"],
  );
  assert.equal(d.sections[1].id, "blackFriday");
  assert.deepEqual(movePageSection(d, "intro", 1), d);
  assert.deepEqual(movePageSection(d, "blackFriday", -1), d);
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

test("legacy drafts retain weekly order and default new shelves to automatic without restoring discovery", () => {
  const current = initialPageDraft(data);
  const legacy = { ...current };
  delete legacy.shelves;
  const restored = normalizePageDraft(legacy, data);

  assert.deepEqual(restored.curation.weeklyIds, ["b", "a"]);
  assert.deepEqual(restored.shelves, {
    new: { mode: "automatico", productIds: [] },
    room: { mode: "automatico", productIds: [] },
  });
  assert.equal(restored.sections.find((section) => section.id === "discovery").enabled, false);
});

test("manual shelves preserve ID order and omit duplicate, missing, or ineligible products", () => {
  const draft = initialPageDraft(data);
  const storefront = toStorefrontProducts(data, draft.curation);
  const selection = { mode: "manual", productIds: ["d", "missing", "c", "d", "bad"] };

  assert.deepEqual(
    sectionProducts("new", storefront, new Date("2026-11-09T12:00:00Z"), selection).map(
      (p) => p.id,
    ),
    ["d", "c"],
  );
});

test("automatic shelves retain their current rules and empty weekly selection has no hard-coded fallback", () => {
  const draft = initialPageDraft(data);
  draft.curation.weeklyIds = [];
  const storefront = toStorefrontProducts(data, draft.curation);

  assert.deepEqual(sectionProducts("weekly", storefront, new Date("2026-11-09T12:00:00Z")), []);
  assert.deepEqual(
    sectionProducts("new", storefront, new Date("2026-11-09T12:00:00Z"), {
      mode: "automatico",
      productIds: ["missing"],
    }).map((p) => p.id),
    ["a", "b", "c", "d"],
  );
});

test("published home projection exposes only sections, shelf modes, and ordered eligible IDs", () => {
  const draft = initialPageDraft(data);
  draft.shelves.new = { mode: "manual", productIds: ["d", "c"] };
  const published = publishedHomePageFromDraft(draft, data, 7, "2026-11-14T12:00:00.000Z");
  const raw = JSON.stringify(published);

  assert.equal(published.version, 1);
  assert.equal(published.revisionId, 7);
  assert.deepEqual(published.shelves.weekly, { mode: "manual", productIds: ["b", "a"] });
  assert.deepEqual(published.shelves.new, { mode: "manual", productIds: ["d", "c"] });
  assert.ok(!published.sections.some((section) => section.id === "discovery"));
  for (const privateField of [
    "baseVersion",
    "preco_atacado",
    "fornecedor",
    "curation",
    "discovery",
  ])
    assert.ok(!raw.includes(privateField), privateField);
});

test("manual selection validation rejects duplicate, over-limit, and ineligible IDs", () => {
  const draft = initialPageDraft(data);
  draft.shelves.new = { mode: "manual", productIds: ["a", "a"] };
  assert.ok(validatePageDraft(draft, data).some((error) => /vitrine|produtos/i.test(error)));

  draft.shelves.new = { mode: "manual", productIds: ["a", "b", "c", "d", "e"] };
  assert.ok(validatePageDraft(draft, data).some((error) => /vitrine|quatro/i.test(error)));

  draft.shelves.new = { mode: "manual", productIds: ["bad"] };
  assert.ok(validatePageDraft(draft, data).some((error) => /condições válidas/i.test(error)));
});

test("manual shelf editor adds, swaps, removes, reorders, and preserves IDs across mode changes", () => {
  let draft = initialPageDraft(data);
  draft = chooseShelfProduct(draft, data, "new", "c");
  draft = chooseShelfProduct(draft, data, "new", "d");
  draft = chooseShelfProduct(draft, data, "new", "e", 0);
  assert.deepEqual(draft.shelves.new.productIds, ["e", "d"]);

  draft = moveShelfProduct(draft, "new", 1, -1);
  assert.deepEqual(draft.shelves.new.productIds, ["d", "e"]);
  draft = setShelfMode(draft, "new", "automatico");
  assert.deepEqual(draft.shelves.new.productIds, ["d", "e"]);
  draft = setShelfMode(draft, "new", "manual");
  draft = removeShelfProduct(draft, "new", "d");
  assert.deepEqual(draft.shelves.new.productIds, ["e"]);
});

test("manual shelf editor rejects duplicate, ineligible and over-limit additions", () => {
  let draft = initialPageDraft(data);
  draft = chooseShelfProduct(draft, data, "room", "c");
  assert.throws(() => chooseShelfProduct(draft, data, "room", "c"), /já/);
  assert.throws(() => chooseShelfProduct(draft, data, "room", "bad"), /vitrine/);
  draft = chooseShelfProduct(draft, data, "room", "d");
  draft = chooseShelfProduct(draft, data, "room", "e");
  draft = chooseShelfProduct(draft, data, "room", "a");
  assert.throws(() => chooseShelfProduct(draft, data, "room", "b"), /quatro/);
});
