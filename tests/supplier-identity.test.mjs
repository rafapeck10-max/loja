import test from "node:test";
import assert from "node:assert/strict";
import { resolveSupplierName } from "../src/lib/supplier-identities.ts";

const suppliers = [
  { id: "supplier-1", name: "Madeira Forte", active: true },
  { id: "supplier-2", name: "Móveis Áurea", active: true },
  { id: "supplier-3", name: "Inativo", active: false },
];

test("a única active exact name match resolves to its stable ID and canonical name", () => {
  assert.deepEqual(resolveSupplierName("Madeira Forte", suppliers), {
    status: "matched",
    supplierId: "supplier-1",
    canonicalName: "Madeira Forte",
  });
});

test("blank, unknown, case-different, accent-different and inactive names remain unlinked", () => {
  for (const sourceName of [
    null,
    undefined,
    "",
    "   ",
    "Outro fornecedor",
    "madeira forte",
    "Moveis Aurea",
    "Inativo",
  ]) {
    const result = resolveSupplierName(sourceName, suppliers);
    assert.equal(result.status, "missing", `source name ${JSON.stringify(sourceName)}`);
    assert.equal(result.sourceName, sourceName ?? "");
  }
});

test("duplicate exact names are ambiguous even when one duplicate is inactive", () => {
  assert.deepEqual(
    resolveSupplierName("Madeira Forte", [
      ...suppliers,
      { id: "supplier-4", name: "Madeira Forte", active: false },
    ]),
    { status: "ambiguous", sourceName: "Madeira Forte" },
  );
});

test("empty or malformed supplier identities cannot produce a match", () => {
  assert.equal(
    resolveSupplierName("Madeira Forte", [{ id: "", name: "Madeira Forte", active: true }]).status,
    "missing",
  );
  assert.equal(
    resolveSupplierName("Madeira Forte", [{ id: "supplier-1", name: "Madeira Forte", active: 1 }])
      .status,
    "missing",
  );
});
