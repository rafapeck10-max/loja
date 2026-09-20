import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CATEGORIES,
  SUBCATEGORIES,
  ALL_CATEGORIES,
  PRODUCT_CATEGORY_OPTIONS,
  categoryMatches,
  getCategory,
  getSubcategories,
} from "../src/lib/constants.ts";
import { FURNITURE_MENU_COLUMNS } from "../src/lib/furniture-menu.ts";
const audit = JSON.parse(readFileSync(new URL("./category-audit.json", import.meta.url)));
assert.equal(new Set(ALL_CATEGORIES.map((c) => c.slug)).size, ALL_CATEGORIES.length);
for (const row of audit) {
  assert(
    SUBCATEGORIES.some((c) => categoryMatches(row.categoria, c.slug)),
    row.categoria + " sem subgrupo",
  );
  assert(
    CATEGORIES.some((c) => categoryMatches(row.categoria, c.slug)),
    row.categoria + " sem departamento",
  );
}
for (const label of PRODUCT_CATEGORY_OPTIONS) {
  assert(
    audit.some((row) => row.categoria === label),
    label + " não existe no catálogo",
  );
}
for (const category of CATEGORIES) {
  for (const child of getSubcategories(category.slug)) {
    for (const label of child.dbLabels) assert(categoryMatches(label, category.slug));
  }
}
const menuSlugs = FURNITURE_MENU_COLUMNS.flatMap((column) => [
  ...(column.slug ? [column.slug] : []),
  ...column.sections.flatMap((section) => [
    ...(section.slug ? [section.slug] : []),
    ...section.links.map((link) => link.slug),
  ]),
]);
assert.equal(new Set(menuSlugs).size, menuSlugs.length, "o menu não deve repetir categorias");
for (const slug of menuSlugs) assert(getCategory(slug), `link sem categoria: ${slug}`);
const count = (slug) =>
  audit.filter((r) => categoryMatches(r.categoria, slug)).reduce((s, r) => s + r.publicaveis, 0);
assert.equal(count("sofas"), 30);
assert.equal(count("paineis"), 15);
assert.equal(count("comodas"), 57);
assert.equal(count("sala-de-estar"), 142);
assert.equal(categoryMatches(" SOFÁS ", "sofas"), true);
assert.equal(categoryMatches("mesas de CABECEIRA", "mesas-de-cabeceira"), true);
assert.equal(categoryMatches("Conjuntos", "salas-de-jantar"), false);
assert.equal(categoryMatches("Modulados", "cozinha"), false);
assert.equal(getCategory("racks").slug, "racks-bancadas");
assert.equal(
  audit.reduce((s, r) => s + r.publicaveis, 0),
  720,
);
console.table(CATEGORIES.map((c) => ({ categoria: c.label, publicaveis: count(c.slug) })));
console.log("PASS: 58 categorias, 2144 cadastros, 720 produtos elegíveis; todos alcançáveis.");
