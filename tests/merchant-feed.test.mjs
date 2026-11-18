import assert from "node:assert/strict";
import test from "node:test";
import { buildMerchantFeedTsv } from "../src/lib/merchant-feed.ts";
import { findPublicHelpPage, PUBLIC_HELP_PAGES } from "../src/lib/public-help-pages.ts";
import { productSeo } from "../src/lib/seo.ts";

const sampleBase = {
  id: "11111111-1111-4111-8111-111111111111",
  nome: "Sofá Roma 2,00 m – Veludo Marrom",
  slug: "sofa-roma-marrom",
  categoria: "Sofás",
  descricao: "Estrutura em madeira de eucalipto e espuma D33.\nFornecedor: Teste\nCusto: R$ 900",
  medidas: "Altura 95 cm; largura 2,00 m; profundidade 1,00 m",
  cores: ["Marrom"],
  url_imagem: "https://example.com/roma-1.jpg",
  imagens: ["https://example.com/roma-2.jpg", "https://example.com/roma-1.jpg"],
  sku: "9750",
  preco_atacado: 1000,
  preco_atual: 1999,
  variacoes_preco: [],
  status_estoque: "disponivel",
};

test("buildMerchantFeedTsv includes confirmed stocks, syncs prices, and skips unverified items", () => {
  const tsv = buildMerchantFeedTsv([
    sampleBase,
    {
      ...sampleBase,
      id: "22222222-2222-4222-8222-222222222222",
      slug: "sofa-esgotado",
      sku: "SEM ESPACO|DUP",
      status_estoque: "esgotado",
      variacoes_preco: [{ sale_price: 2150 }, { sale_price: 1850 }],
    },
    {
      ...sampleBase,
      id: "33333333-3333-4333-8333-333333333333",
      slug: "sofa-nao-verificado",
      status_estoque: "nao_verificado",
    },
  ]);

  const lines = tsv.split("\n");
  assert.equal(lines.length, 3);
  const headers = lines[0].split("\t");
  const idx = (col) => headers.indexOf(col);

  const row1 = lines[1].split("\t");
  assert.equal(row1[idx("id")], sampleBase.id);
  assert.equal(row1[idx("availability")], "in_stock");
  assert.equal(row1[idx("price")], "1999.00 BRL");
  assert.equal(row1[idx("condition")], "new");
  assert.equal(row1[idx("identifier_exists")], "yes");
  assert.equal(row1[idx("brand")], "Mobi");
  assert.equal(row1[idx("mpn")], "9750");
  assert.equal(row1[idx("additional_image_link")], "https://example.com/roma-2.jpg");
  assert.doesNotMatch(row1[idx("description")], /Fornecedor|Custo|900/);

  const encodedTsv = buildMerchantFeedTsv([
    {
      ...sampleBase,
      url_imagem: "https://example.com/Pasta Teste/Foto NOVO .jpg",
      imagens: ["https://example.com/Foto 2.jpg"],
    },
  ]);
  const encodedCols = encodedTsv.split("\n")[1].split("\t");
  assert.equal(
    encodedCols[idx("image_link")],
    "https://example.com/Pasta%20Teste/Foto%20NOVO%20.jpg",
  );
  assert.equal(encodedCols[idx("additional_image_link")], "https://example.com/Foto%202.jpg");

  const row2 = lines[2].split("\t");
  assert.equal(row2[idx("availability")], "out_of_stock");
  assert.equal(row2[idx("price")], "1850.00 BRL");
  assert.equal(row2[idx("identifier_exists")], "no");
  assert.equal(row2[idx("brand")], "");
  assert.equal(row2[idx("mpn")], "");
});

test("productSeo syncs Schema.org availability only for verified stock states", () => {
  const inStock = productSeo({
    ...sampleBase,
    preco_novo: 1999,
    imagem_url: sampleBase.url_imagem,
    status_estoque: "disponivel",
  });
  assert.equal(inStock.structured.offers.availability, "https://schema.org/InStock");

  const outOfStock = productSeo({
    ...sampleBase,
    preco_novo: 1999,
    imagem_url: sampleBase.url_imagem,
    status_estoque: "esgotado",
  });
  assert.equal(outOfStock.structured.offers.availability, "https://schema.org/OutOfStock");

  const unverified = productSeo({
    ...sampleBase,
    preco_novo: 1999,
    imagem_url: sampleBase.url_imagem,
    status_estoque: "nao_verificado",
  });
  assert.equal(unverified.structured.offers.availability, undefined);
});

test("public policy help pages cover exchanges/warranty and canonical delivery routes", () => {
  assert.ok(PUBLIC_HELP_PAGES.length >= 5);
  assert.equal(findPublicHelpPage("trocas-e-garantia")?.slug, "trocas-e-garantia");
  const deliveryPage = findPublicHelpPage("entrega");
  assert.equal(deliveryPage?.slug, "entrega-e-montagem");
  assert.match(deliveryPage?.body ?? "", /frete grátis/i);
  assert.match(deliveryPage?.body ?? "", /não realizamos entregas em Belford Roxo/i);
  assert.equal(findPublicHelpPage("nao-existe"), undefined);
});
