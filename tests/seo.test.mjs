import assert from "node:assert/strict";
import test from "node:test";
import { categoryDescription, categoryUrl, jsonLd, productSeo } from "../src/lib/seo.ts";
import { CATEGORIES, SUBCATEGORIES } from "../src/lib/constants.ts";
import { buildSitemap, collectSitemapProducts } from "../src/lib/sitemap.ts";

const product = {
  nome: "Sofá Roma 2 m – Veludo Marrom",
  slug: "sofa-roma",
  categoria: "Sofás",
  descricao: "Estrutura em madeira.\nFornecedor: Distribuidor\nCusto: R$ 100",
  medidas: "Largura 2 m; altura 95 cm",
  cores: ["Marrom"],
  imagem_url: "https://example.com/sofa.jpg",
  imagens: [],
  sku: "ROMA|INTERNAL",
  preco_novo: 1999,
  variacoes_preco: [],
};

test("product snippets use product facts and remove supplier lines", () => {
  const seo = productSeo(product);
  assert.match(seo.description, /Largura 2 m/);
  assert.match(seo.description, /Marrom/);
  assert.doesNotMatch(seo.description, /Fornecedor|Distribuidor|Custo|R\$ 100/);
  assert.equal(seo.url, "https://www.mobimb.com.br/produto/sofa-roma");
  assert.equal(seo.structured.offers.price, 1999);
  assert.equal(seo.structured.sku, "ROMA");
  assert.equal(seo.structured.availability, undefined);
});

test("structured offers reflect the selectable variant prices", () => {
  const seo = productSeo({
    ...product,
    variacoes_preco: [{ sale_price: 2400 }, { sale_price: 2100 }, { sale_price: null }],
  });
  assert.equal(seo.structured.offers.lowPrice, 2100);
  assert.equal(seo.structured.offers.highPrice, 2400);
  assert.equal(seo.structured.offers.offerCount, 2);
  assert.equal(
    productSeo({ ...product, variacoes_preco: [{ sale_price: 2400 }] }).structured.offers.price,
    2400,
  );
});

test("a source description does not repeat the product name in the search snippet", () => {
  const seo = productSeo({ ...product, descricao: `${product.nome}. Estrutura em madeira.` });
  assert.equal(seo.description.split(product.nome).length, 2);
  assert.match(seo.description, /Estrutura em madeira/);
});

test("JSON-LD text cannot close a script tag", () => {
  const input = { name: '</script><script>alert("x")</script>' };
  const script = jsonLd(input);
  assert.doesNotMatch(script.children, /<\/script/i);
  assert.deepEqual(JSON.parse(script.children), input);
});

test("category canonicals keep pagination and descriptions identify the category", () => {
  assert.equal(categoryUrl("sofas", 1), "https://www.mobimb.com.br/categoria/sofas");
  assert.equal(categoryUrl("sofas", 2), "https://www.mobimb.com.br/categoria/sofas?page=2");
  assert.notEqual(categoryDescription("sofas"), categoryDescription("cozinha"));
  assert.match(categoryDescription("sofas"), /retráteis/);
});

test("sitemap reads beyond 1,000 products and includes populated categories with absolute URLs", async () => {
  const rows = Array.from({ length: 1503 }, (_, i) => ({ slug: `sofa-${i}`, categoria: "Sofás" }));
  const offsets = [];
  const products = await collectSitemapProducts(async (from, to) => {
    offsets.push(from);
    return rows.slice(from, to + 1);
  });
  assert.equal(products.length, 1503);
  assert.deepEqual(offsets, [0, 500, 1000, 1500]);
  const xml = buildSitemap([...products, products[0]]);
  assert.match(xml, /https:\/\/www.mobimb.com.br\/produto\/sofa-1502/);
  assert.match(xml, /https:\/\/www.mobimb.com.br\/categoria\/sofas</);
  assert.doesNotMatch(xml, /<loc>\//);
  assert.doesNotMatch(xml, /\/categoria\/cozinha</);
  assert.equal((xml.match(/\/produto\/sofa-0</g) ?? []).length, 1);
});

test("sitemap propagates a failed page instead of publishing a truncated catalog", async () => {
  await assert.rejects(
    collectSitemapProducts(async (offset) => {
      if (offset > 0) throw new Error("database unavailable");
      return Array.from({ length: 500 }, (_, i) => ({ slug: `sofa-${i}`, categoria: "Sofás" }));
    }),
    /database unavailable/,
  );
});

test("every catalog category has its own descriptive copy", () => {
  const descriptions = [...CATEGORIES, ...SUBCATEGORIES].map((category) =>
    categoryDescription(category.slug),
  );
  assert.ok(descriptions.every((description) => !description.startsWith("Catálogo de móveis")));
  assert.equal(new Set(descriptions).size, descriptions.length);
});
