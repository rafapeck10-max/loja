import test from "node:test";
import assert from "node:assert/strict";
import {
  isMissingProductColumn,
  isMissingCurationSchema,
  readWithOptionalProductColumns,
} from "../src/lib/product-schema.ts";
import {
  normalizeProductBundleIds,
  isEligibleBundleProduct,
  productBundleWrite,
  prepareProductBundleWrite,
} from "../src/lib/product-bundles.ts";
import { validateProductDrafts } from "../src/lib/operational-config.ts";

const missing = (column, code = "42703") => ({
  code,
  message: `column produtos.${column} does not exist`,
});
const main = {
  id: "a",
  nome: "Sofá",
  categoria: "Sofás",
  preco_atual: 500,
  preco_atacado: 300,
  url_imagem: "https://example.com/sofa.jpg",
};
const extra = { ...main, id: "b", nome: "Poltrona", preco_atual: 200, preco_atacado: 100 };
const draft = (product = main) => ({ changes: { a: { basePrice: 500, product } } });

test("missing-column detection handles PostgrestError objects, schema cache and Error instances", () => {
  assert.equal(isMissingProductColumn(missing("compre_junto_ids"), "compre_junto_ids"), true);
  assert.equal(
    isMissingProductColumn(
      {
        code: "PGRST204",
        message: "Could not find the 'compre_junto_ids' column of 'produtos' in the schema cache",
      },
      "compre_junto_ids",
    ),
    true,
  );
  assert.equal(
    isMissingProductColumn(
      new Error("column produtos.compre_junto_ids does not exist"),
      "compre_junto_ids",
    ),
    true,
  );
  assert.equal(
    isMissingProductColumn(missing("other_compre_junto_ids"), "compre_junto_ids"),
    false,
  );
  assert.equal(
    isMissingProductColumn(
      {
        code: "23502",
        message: "null value in column compre_junto_ids violates not-null constraint",
      },
      "compre_junto_ids",
    ),
    false,
  );
  assert.equal(isMissingCurationSchema(missing("compre_junto_ids")), false);
  assert.equal(isMissingCurationSchema(missing("vitrine_novidade")), true);
});

test("a catalog without bundle schema keeps curation enabled on retry", async () => {
  const calls = [];
  const result = await readWithOptionalProductColumns(async (columns) => {
    calls.push(columns);
    if (columns.withBundles) throw missing("compre_junto_ids");
    return ["product"];
  });
  assert.deepEqual(calls, [
    { withCuration: true, withBundles: true },
    { withCuration: true, withBundles: false },
  ]);
  assert.deepEqual(result, { value: ["product"], withCuration: true, withBundles: false });
});

test("independent missing schemas retry at most once per feature", async () => {
  const calls = [];
  const result = await readWithOptionalProductColumns(async (columns) => {
    calls.push(columns);
    if (columns.withCuration) throw missing("vitrine_semana_ordem");
    if (columns.withBundles) throw missing("compre_junto_ids", "PGRST204");
    return [];
  });
  assert.equal(calls.length, 3);
  assert.deepEqual(result, { value: [], withCuration: false, withBundles: false });
});

test("direct product lookup handles plain database errors and preserves null results", async () => {
  const result = await readWithOptionalProductColumns(
    async ({ withBundles }) => {
      if (withBundles) throw missing("compre_junto_ids");
      return null;
    },
    { withCuration: false, withBundles: true },
  );
  assert.equal(result.value, null);
  assert.equal(result.withBundles, false);
});

test("permission or missing required columns fail without hiding the error", async () => {
  for (const error of [{ code: "42501", message: "permission denied" }, missing("preco_atual")]) {
    let calls = 0;
    await assert.rejects(
      readWithOptionalProductColumns(async () => {
        calls++;
        throw error;
      }),
      (value) => value === error,
    );
    assert.equal(calls, 1);
  }
});

test("legacy writes omit the optional field only for empty or omitted selections", () => {
  assert.deepEqual(productBundleWrite([], false), {});
  assert.deepEqual(productBundleWrite(undefined, true), {});
  assert.deepEqual(productBundleWrite(["b"], true), { compre_junto_ids: ["b"] });
  assert.throws(() => productBundleWrite(["b"], false), /Nenhuma alteração foi salva/);
});

test("schema preflight rejects a nonempty editorial selection before any write callback", async () => {
  const calls = [];
  await assert.rejects(async () => {
    const patch = await prepareProductBundleWrite(["b"], async () => {
      calls.push("schema");
      return missing("compre_junto_ids");
    });
    calls.push({ write: patch });
  }, /migração revisada/);
  assert.deepEqual(calls, ["schema"]);
  assert.deepEqual(
    await prepareProductBundleWrite([], async () => missing("compre_junto_ids")),
    {},
  );
  await assert.rejects(
    prepareProductBundleWrite([], async () => ({ code: "42501", message: "permission denied" })),
    /permission denied/,
  );
});

test("bundle IDs reject overflow, duplicates, self and invalid real UUIDs instead of truncating", () => {
  assert.throws(() => normalizeProductBundleIds(["b", "c", "d", "e"]), /até 3/);
  assert.throws(() => normalizeProductBundleIds(["b", " b "]), /mais de uma vez/);
  assert.throws(() => normalizeProductBundleIds(["a"], { selfId: "a" }), /próprio produto/);
  assert.throws(() => normalizeProductBundleIds([123]), /IDs/);
  assert.throws(() => normalizeProductBundleIds(["page-demo-0"], { requireUuid: true }), /IDs/);
  const id = "11111111-1111-1111-1111-111111111111";
  assert.deepEqual(normalizeProductBundleIds([` ${id} `], { requireUuid: true }), [id]);
  assert.deepEqual(normalizeProductBundleIds(["page-demo-0"]), ["page-demo-0"]);
});

test("bundle candidates require public cost, sale price, HTTPS photo and available status", () => {
  assert.equal(isEligibleBundleProduct(extra), true);
  for (const invalid of [
    { preco_atacado: null },
    { preco_atacado: 0 },
    { preco_atual: 0 },
    { preco_atual: Infinity },
    { url_imagem: "http://example.com/a.jpg" },
    { descricao: "Produto esgotado" },
    { cores: ["sem estoque"] },
  ])
    assert.equal(isEligibleBundleProduct({ ...extra, ...invalid }), false);
});

test("valid product drafts include real attributes and only eligible complementary products", () => {
  const p = {
    ...main,
    compre_junto_ids: ["b"],
    medidas: "Largura 200 cm",
    descricao: "Sofá retrátil",
    cores: ["Marrom"],
    imagens: ["https://example.com/side.jpg"],
    variacoes_preco: [{ name: "Marrom", sku: "M", supplier_price: 300, sale_price: 500 }],
  };
  assert.deepEqual(validateProductDrafts(draft(p), [main, extra]), []);
  assert.ok(validateProductDrafts(draft(p), [main, { ...extra, preco_atacado: null }]).length);
  assert.ok(
    validateProductDrafts(draft({ ...main, compre_junto_ids: ["missing"] }), [main]).length,
  );
});

test("corrupt arrays, text and variant objects yield validation messages without renderer TypeErrors", () => {
  for (const invalid of [
    { imagens: {} },
    { imagens: [null] },
    { cores: "Azul" },
    { cores: [{}] },
    { descricao: {} },
    { medidas: [] },
    { slug: {} },
    { variacoes_preco: {} },
    { variacoes_preco: [null] },
    { variacoes_preco: [{ name: 3, sku: "M" }] },
    { variacoes_preco: [{ name: "Marrom", sku: "M", sale_price: "500" }] },
  ]) {
    assert.doesNotThrow(() => validateProductDrafts(draft({ ...main, ...invalid }), [main]));
    assert.ok(
      validateProductDrafts(draft({ ...main, ...invalid }), [main]).length,
      JSON.stringify(invalid),
    );
  }
  assert.ok(validateProductDrafts({ changes: { a: null } }, [main]).length);
});

test("draft bundle validation uses a complementary product corrected in the same local revision", () => {
  const sourceExtra = { ...extra, preco_atacado: null };
  const data = draft({ ...main, compre_junto_ids: ["b"] });
  data.changes.b = { basePrice: 200, product: extra };
  assert.deepEqual(validateProductDrafts(data, [main, sourceExtra]), []);
});
