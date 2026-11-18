import assert from "node:assert/strict";
import test from "node:test";
import {
  categoryDescription,
  categoryUrl,
  collectionSeo,
  jsonLd,
  productSeo,
} from "../src/lib/seo.ts";
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
  sku: "ROMA",
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

test("SKU estruturado aceita apenas identificador único válido", () => {
  const valid = productSeo({ ...product, sku: "ABC-123" });
  assert.equal(valid.structured.sku, "ABC-123");
  for (const sku of [
    null,
    "",
    "   ",
    "NT 4040",
    "TROP\t00452",
    "MESA1\nCADEIRA2",
    "ABC\u00a0DEF",
    "ABC\u2003DEF",
    "MESA1|CADEIRA2",
    "ABC\ud800",
    "ABC\ufdd0",
  ]) {
    const input = { ...product, sku };
    const result = productSeo(input);
    assert.equal(Object.hasOwn(result.structured, "sku"), false, JSON.stringify(sku));
    assert.equal(input.sku, sku);
    assert.equal(result.structured.offers.price, 1999);
    assert.equal(result.structured.name, product.nome);
  }
});

test("productSeo includes Brand, NewCondition, MerchantReturnPolicy, and structured dimensions", () => {
  const seo = productSeo({
    ...product,
    descricao: "Sofá retrátil com madeira eucalipto e espuma D33.",
  });
  assert.equal(seo.structured.brand.name, "Mobi");
  assert.equal(seo.structured.offers.itemCondition, "https://schema.org/NewCondition");
  assert.equal(seo.structured.offers.hasMerchantReturnPolicy.applicableCountry, "BR");
  assert.equal(seo.structured.offers.hasMerchantReturnPolicy.merchantReturnDays, 7);
  assert.equal(seo.structured.width.value, 200);
  assert.equal(seo.structured.width.unitCode, "CMT");
  assert.equal(seo.structured.height.value, 95);
  assert.ok(seo.description.length <= 160);
});

test("collectionSeo emits CollectionPage with bounded ItemList", () => {
  const list = collectionSeo({
    label: "Sofás",
    description: "Sofás para sua sala",
    url: "https://www.mobimb.com.br/categoria/sofas",
    products: Array.from({ length: 30 }, (_, index) => ({
      nome: `Sofá ${index}`,
      slug: `sofa-${index}`,
      imagem_url: `https://example.com/${index}.jpg`,
    })),
  });
  assert.equal(list["@type"], "CollectionPage");
  assert.equal(list.mainEntity.numberOfItems, 30);
  assert.equal(list.mainEntity.itemListElement.length, 24);
  assert.equal(list.mainEntity.itemListElement[0].url, "https://www.mobimb.com.br/produto/sofa-0");
});

test("sitemap emits Google Image entries for HTTPS images and core public routes", () => {
  const xml = buildSitemap([
    { slug: "sofa-roma", categoria: "Sofás", url_imagem: "https://example.com/roma NOVO .jpg" },
  ]);
  assert.match(xml, /xmlns:image="http:\/\/www\.google\.com\/schemas\/sitemap-image\/1\.1"/);
  assert.match(xml, /<image:loc>https:\/\/example\.com\/roma%20NOVO%20\.jpg<\/image:loc>/);
  assert.match(xml, /https:\/\/www\.mobimb\.com\.br\/moveis-pagamento-na-entrega</);
  assert.match(xml, /https:\/\/www\.mobimb\.com\.br\/ajuda</);
});
