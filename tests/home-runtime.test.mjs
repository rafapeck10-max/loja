import test from "node:test";
import assert from "node:assert/strict";
import { discoverHomepageProducts, weeklyHomepageProducts } from "../src/lib/home-curation.ts";
import { visibleHomeBanners } from "../src/lib/home-banner-state.ts";
import * as config from "../src/lib/home-configuration.ts";
const products = Array.from({ length: 40 }, (_, i) => ({
  id: String(i),
  preco_novo: 100,
  imagem_url: "https://example.com/a.jpg",
  descricao: "",
  cores: [],
  vitrine_descoberta: true,
}));
test("discovery remains stable within the same Brasilia day instead of changing on each request", () => {
  const ids = (date) =>
    discoverHomepageProducts(products, new Set(), new Date(date)).map((p) => p.id);
  assert.deepEqual(ids("2026-11-09T03:01:00Z"), ids("2026-11-10T02:59:00Z"));
  assert.notDeepEqual(ids("2026-11-10T02:59:00Z"), ids("2026-11-10T03:01:00Z"));
});
test("banner scheduling uses Brasilia and excludes inactive/expired pieces", () => {
  const b = (id, starts_at = "", ends_at = "", active = true) => ({
    id,
    position: 1,
    starts_at,
    ends_at,
    active,
  });
  assert.deepEqual(
    visibleHomeBanners(
      [
        b("ok", "2026-11-09T09:00", "2026-11-09T10:00"),
        b("future", "2026-11-09T10:00"),
        b("expired", "", "2026-11-09T09:00"),
        b("off", "", "", false),
      ],
      new Date("2026-11-09T12:30:00Z"),
    ).map((b) => b.id),
    ["ok"],
  );
});
test("weekly shelf never falls back to hard-coded featured slugs", () => {
  const staticSlugProduct = {
    id: "jamile",
    slug: "sr-poltrona-jamile-veludo-suede-azul-marinho",
    preco_novo: 399,
    imagem_url: "https://example.com/jamile.jpg",
    descricao: "",
    cores: [],
    vitrine_semana_ordem: null,
  };
  assert.deepEqual(weeklyHomepageProducts([staticSlugProduct]), []);
});
test("revision preview and applied home resolve the same current-day selection and saved curation", () => {
  assert.equal(typeof config.homeProductSelections, "function");
  const current = products.map((p, i) => ({
    ...p,
    vitrine_semana_ordem: null,
    vitrine_novidade: "ocultar",
    vitrine_sala: "ocultar",
    categoria: "sofas",
    created_at: "2020-01-01",
  }));
  const curation = {
    weeklyIds: ["2", "1"],
    settings: Object.fromEntries(
      current.map((p) => [p.id, { novidade: "ocultar", sala: "ocultar", descoberta: true }]),
    ),
  };
  const saved = {
    curation,
    sectionIds: { weekly: ["old"], discovery: ["yesterday"], new: [], room: [] },
  };
  const today = new Date("2026-11-10T10:00:00Z");
  const preview = config.homeProductSelections(current, saved, today);
  const runtime = config.homeProductSelections(current, saved, today);
  assert.deepEqual(preview, runtime);
  assert.deepEqual(
    preview.weekly.map((p) => p.id),
    ["2", "1"],
  );
  assert.ok(!preview.discovery.some((p) => ["1", "2", "yesterday"].includes(p.id)));
});

test("manual shelf IDs flow through the same home selection resolver in saved previews", () => {
  const current = products
    .slice(0, 6)
    .map((p) => ({ ...p, categoria: "Sofás", created_at: "2020-01-01" }));
  const saved = {
    shelves: {
      new: { mode: "manual", productIds: ["5", "2"] },
      room: { mode: "automatico", productIds: [] },
    },
  };
  assert.deepEqual(
    config.homeProductSelections(current, saved).new.map((p) => p.id),
    ["5", "2"],
  );
});
