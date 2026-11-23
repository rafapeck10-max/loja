import test from "node:test";
import assert from "node:assert/strict";
import {
  BLACK_FRIDAY_COPY,
  BLACK_FRIDAY_PUBLIC_ENABLED,
  blackFridayDiscountPercent,
  selectBlackFridayHomeProducts,
  selectBlackFridayTabProducts,
} from "../src/lib/black-friday.ts";
import { buildSitemap } from "../src/lib/sitemap.ts";
import { isSafeBannerDestination } from "../src/lib/banner-drafts.ts";
import { safeMobiLink } from "../src/lib/operational-config.ts";
import { DEFAULT_HOMEPAGE_BANNERS, resolvePublicBannerHref } from "../src/lib/homepage-banners.ts";

function makeProduct(overrides = {}) {
  return {
    id: "prod-1",
    nome: "Sofá Retrátil Teste",
    slug: "sofa-retratil-teste",
    preco_antigo: 0,
    preco_novo: 1500,
    imagem_url: "https://example.com/foto.jpg",
    categoria: "Sofás",
    ordem: 1,
    descricao: "",
    imagens: [],
    sku: null,
    fornecedor: null,
    medidas: null,
    cores: [],
    status_estoque: "disponivel",
    compre_junto_ids: [],
    parcelas_sem_juros: 0,
    variacoes_preco: [],
    created_at: "2026-11-01T12:00:00Z",
    vitrine_semana_ordem: null,
    vitrine_novidade: "automatico",
    vitrine_sala: "automatico",
    vitrine_descoberta: true,
    curadoriaDisponivel: true,
    ...overrides,
  };
}

test("blackFridayDiscountPercent hides legacy fabricated +15% markup and returns real discount", () => {
  // Fabricated +15% markup: 1000 * 1.15 = 1150 -> must be hidden
  assert.equal(blackFridayDiscountPercent(1150, 1000), null);
  assert.equal(blackFridayDiscountPercent(2298.85, 1999), null);
  // Real price reduction -> shows rounded %
  assert.equal(blackFridayDiscountPercent(2500, 1999), 20);
  assert.equal(blackFridayDiscountPercent(1000, 999), null);
});

test("selectBlackFridayHomeProducts prioritizes real discounts across diverse categories", () => {
  const catalog = [
    makeProduct({
      id: "sofa-sem-desconto",
      categoria: "Sofás",
      preco_antigo: 1150,
      preco_novo: 1000,
      ordem: 1,
    }),
    makeProduct({
      id: "sofa-desconto-10",
      categoria: "Sofás",
      preco_antigo: 2000,
      preco_novo: 1800,
      ordem: 2,
    }),
    makeProduct({
      id: "sofa-desconto-25",
      categoria: "Sofás",
      preco_antigo: 2000,
      preco_novo: 1500,
      ordem: 3,
    }),
    makeProduct({
      id: "poltrona-desconto-15",
      categoria: "Poltronas",
      preco_antigo: 1000,
      preco_novo: 850,
      ordem: 4,
    }),
    makeProduct({
      id: "roupeiro-desconto-18",
      categoria: "Roupeiros",
      preco_antigo: 1000,
      preco_novo: 820,
      ordem: 5,
    }),
    makeProduct({
      id: "esgotado-desconto-50",
      categoria: "Cadeiras",
      preco_antigo: 1000,
      preco_novo: 500,
      status_estoque: "esgotado",
      ordem: 0,
    }),
  ];

  const picked = selectBlackFridayHomeProducts(catalog, 4);
  assert.equal(picked.length, 4);
  assert.ok(!picked.some((item) => item.id === "esgotado-desconto-50"));
  // Top 3 distinct-category real deals picked first (25% sofa, 18% roupeiro, 15% poltrona), then 10% sofa
  assert.deepEqual(
    picked.map((item) => item.id),
    ["sofa-desconto-25", "roupeiro-desconto-18", "poltrona-desconto-15", "sofa-desconto-10"],
  );
});

test("selectBlackFridayTabProducts orders real deals first and filters by environment", () => {
  const catalog = [
    makeProduct({ id: "sofa-regular", categoria: "Sofás", preco_antigo: 1150, preco_novo: 1000 }),
    makeProduct({ id: "sofa-real", categoria: "Sofás", preco_antigo: 2000, preco_novo: 1400 }),
    makeProduct({ id: "cozinha-real", categoria: "Cozinha", preco_antigo: 1200, preco_novo: 900 }),
  ];

  const offersTab = selectBlackFridayTabProducts(catalog, "ofertas");
  assert.equal(offersTab.realDealCount, 2);
  assert.deepEqual(
    offersTab.items.map((item) => item.id),
    ["sofa-real", "cozinha-real"],
  );

  const sofasTab = selectBlackFridayTabProducts(catalog, "sofas");
  assert.equal(sofasTab.realDealCount, 1);
  assert.deepEqual(
    sofasTab.items.map((item) => item.id),
    ["sofa-real", "sofa-regular"],
  );
});

test("Black Friday public copy complies with Mobi store policies and sitemap includes /black-friday", () => {
  const copyBlob = JSON.stringify(BLACK_FRIDAY_COPY);
  assert.doesNotMatch(copyBlob, /sem[ \t]+juros/i);
  assert.match(copyBlob, /Belford Roxo/);
  assert.match(copyBlob, /sem loja física|100% online/i);

  const xml = buildSitemap([{ slug: "sofa-roma", categoria: "Sofás" }]);
  if (BLACK_FRIDAY_PUBLIC_ENABLED) {
    assert.match(xml, /https:\/\/www\.mobimb\.com\.br\/black-friday</);
  }
});

test("Black Friday hero banner destination routes safely to /black-friday without altering other banners", () => {
  assert.equal(isSafeBannerDestination("/black-friday"), true);
  assert.equal(safeMobiLink("/black-friday"), true);
  assert.equal(DEFAULT_HOMEPAGE_BANNERS[0].cta_href, "/black-friday");
  assert.equal(
    resolvePublicBannerHref({
      image_url: DEFAULT_HOMEPAGE_BANNERS[0].image_url,
      title: "Black Friday Mobi — confira os modelos",
      cta_href: "/categoria/sofas",
    }),
    "/black-friday",
  );
  assert.equal(
    resolvePublicBannerHref({
      image_url: DEFAULT_HOMEPAGE_BANNERS[1].image_url,
      title: DEFAULT_HOMEPAGE_BANNERS[1].title,
      cta_href: DEFAULT_HOMEPAGE_BANNERS[1].cta_href,
    }),
    DEFAULT_HOMEPAGE_BANNERS[1].cta_href,
  );
});
