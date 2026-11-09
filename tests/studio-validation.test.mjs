import test from "node:test";
import assert from "node:assert/strict";
import { validateStudioResource, shouldLoadWorkspace } from "../src/lib/studio-validation.ts";
import { initialPageDraft } from "../src/lib/pages-shelves.ts";
test("source recovery never reopens storage over edits in an already loaded context", () => {
  assert.equal(shouldLoadWorkspace(null, "demo", false), false);
  assert.equal(shouldLoadWorkspace(null, "demo", true), true);
  assert.equal(shouldLoadWorkspace("demo", "demo", false), false);
  assert.equal(shouldLoadWorkspace("demo", "demo", true), false);
});
test("review and restore reject stale page source even when product eligibility remains valid", () => {
  const p = {
    id: "a",
    nome: "Poltrona",
    preco_atual: 500,
    preco_atacado: 300,
    categoria: "Poltronas",
    url_imagem: "https://example.com/a.jpg",
  };
  const page = initialPageDraft([p]);
  assert.deepEqual(validateStudioResource("pages", page, [p], {}), []);
  assert.match(
    validateStudioResource("pages", page, [{ ...p, preco_atual: 600 }], {}).join(" "),
    /catálogo mudou/i,
  );
});
test("banners cannot lose a reference used by a campaign", () => {
  const errors = validateStudioResource("banners", { banners: [] }, [], {
    campaigns: { version: 1, campaigns: [{ bannerIds: ["hero-1"] }] },
  });
  assert.ok(errors.some((e) => /campanha/i.test(e)));
});
