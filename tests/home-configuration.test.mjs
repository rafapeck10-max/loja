import test from "node:test";
import assert from "node:assert/strict";
import * as home from "../src/lib/home-configuration.ts";
import { initialPageDraft } from "../src/lib/pages-shelves.ts";
import { initialBannerData } from "../src/lib/banner-drafts.ts";
import { initialNavigation, initialService } from "../src/lib/operational-config.ts";
const products = [
  {
    id: "a",
    nome: "Sofá Mobi",
    slug: "sofa",
    preco_atual: 1000,
    preco_atacado: 400,
    url_imagem: "https://example.com/sofa.jpg",
    categoria: "sofas",
    descricao: "",
    created_at: "2026-11-01",
    vitrine_semana_ordem: 1,
  },
];
const source = () => ({
  pages: initialPageDraft(products),
  banners: initialBannerData(),
  navigation: initialNavigation(),
  service: initialService(),
  products: { changes: { secret: "custo" } },
  notes: "privado",
});
test("public curation omits identifiers of ineligible unpublished catalog rows", () => {
  const catalog = [
    ...products,
    {
      ...products[0],
      id: "private-incomplete",
      preco_atual: 0,
      preco_atacado: 0,
      vitrine_semana_ordem: null,
    },
  ];
  const d = { ...source(), pages: initialPageDraft(catalog) };
  const result = home.homeConfigurationFromDraft(d, catalog);
  assert.ok(!Object.hasOwn(result.curation.settings, "private-incomplete"));
});
test("home DTO excludes private catalog fingerprints, drafts and administrative extras", () => {
  assert.equal(typeof home.homeConfigurationFromDraft, "function");
  const input = source();
  input.banners.banners[0].secret = "interno";
  const config = home.homeConfigurationFromDraft(input, products, new Date("2026-11-09T12:00:00Z"));
  assert.equal(config.schemaVersion, 1);
  assert.deepEqual(config.sectionIds.weekly, ["a"]);
  const raw = JSON.stringify(config);
  for (const key of [
    "preco_atacado",
    "baseVersion",
    "privado",
    "interno",
    "custo",
    "supplier_price",
  ])
    assert.ok(!raw.includes(key), key);
});
test("changed catalog and invalid destination cannot become a home configuration", () => {
  assert.equal(typeof home.homeConfigurationFromDraft, "function");
  const d = source();
  d.pages.baseVersion = "old";
  assert.throws(() => home.homeConfigurationFromDraft(d, products), /catálogo/i);
  const b = source();
  b.banners.banners[0].cta_href = "https://evil.example";
  assert.throws(() => home.homeConfigurationFromDraft(b, products), /banner|destino/i);
});
test("draft, review, local application and restore keep public state isolated and append history", () => {
  assert.equal(typeof home.newHomeDocument, "function");
  let doc = home.newHomeDocument();
  const config = home.homeConfigurationFromDraft(source(), products);
  doc = home.changeHomeDocument(
    doc,
    { action: "save", expected: 0, config, sourceVersion: "catalog-a" },
    "2026-11-09T12:00:00Z",
  );
  assert.equal(home.publicHomeConfiguration(doc), null);
  assert.throws(
    () =>
      home.changeHomeDocument(doc, {
        action: "apply",
        expected: 1,
        id: 1,
        sourceVersion: "catalog-a",
      }),
    /revis/i,
  );
  doc = home.changeHomeDocument(doc, {
    action: "review",
    expected: 1,
    id: 1,
    sourceVersion: "catalog-a",
  });
  assert.equal(home.publicHomeConfiguration(doc), null);
  assert.throws(
    () =>
      home.changeHomeDocument(doc, {
        action: "apply",
        expected: 2,
        id: 1,
        sourceVersion: "catalog-b",
      }),
    /catálogo/i,
  );
  doc = home.changeHomeDocument(doc, {
    action: "apply",
    expected: 2,
    id: 1,
    sourceVersion: "catalog-a",
  });
  assert.deepEqual(home.publicHomeConfiguration(doc).config, config);
  const first = JSON.stringify(doc.revisions[0]);
  doc = home.changeHomeDocument(doc, {
    action: "restore",
    expected: 3,
    id: 1,
    sourceVersion: "catalog-a",
  });
  assert.equal(doc.revisions.length, 2);
  assert.equal(doc.revisions[1].restoredFrom, 1);
  assert.equal(JSON.stringify(doc.revisions[0]), first);
  assert.equal(doc.revisions[1].status, "draft");
});
test("stale state or stale publication base rejects the entire operation", () => {
  assert.equal(typeof home.newHomeDocument, "function");
  let d = home.newHomeDocument();
  const config = home.homeConfigurationFromDraft(source(), products);
  d = home.changeHomeDocument(d, { action: "save", expected: 0, config, sourceVersion: "a" });
  assert.throws(
    () => home.changeHomeDocument(d, { action: "save", expected: 0, config, sourceVersion: "a" }),
    /conflito/i,
  );
  d = home.changeHomeDocument(d, { action: "save", expected: 1, config, sourceVersion: "a" });
  d = home.changeHomeDocument(d, { action: "review", expected: 2, id: 1, sourceVersion: "a" });
  d = home.changeHomeDocument(d, { action: "review", expected: 3, id: 2, sourceVersion: "a" });
  d = home.changeHomeDocument(d, { action: "apply", expected: 4, id: 1, sourceVersion: "a" });
  assert.throws(
    () => home.changeHomeDocument(d, { action: "apply", expected: 5, id: 2, sourceVersion: "a" }),
    /conflito/i,
  );
});
