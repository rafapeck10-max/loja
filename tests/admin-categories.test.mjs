import test from "node:test";
import assert from "node:assert/strict";
import { adminCategoryKey, adminCategoryOptions } from "../src/lib/admin-categories.ts";
test("admin filters combine known duplicate labels without changing source categories", () => {
  const input = ["Sofá", "Sofás", "Banqueta", "Banquetas", "Mesas de jantar", "Mesas de Jantar"];
  const before = [...input];
  assert.deepEqual(adminCategoryOptions(input), ["Banquetas", "Mesas de jantar", "Sofás"]);
  assert.equal(adminCategoryKey(" Sofá "), adminCategoryKey("Sofás"));
  assert.deepEqual(input, before);
});
test("distinct furniture categories remain separate", () => {
  assert.notEqual(adminCategoryKey("Sofás"), adminCategoryKey("Sofás Cama"));
  assert.notEqual(adminCategoryKey("Conjuntos"), adminCategoryKey("Conjuntos de Mesa e Cadeiras"));
  assert.deepEqual(adminCategoryOptions(["", "  ", "Bases", "Baús"]), ["Bases", "Baús"]);
});
