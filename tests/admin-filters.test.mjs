import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ADMIN_NAV_GROUPS,
  getAdminNavGroup,
  getAdminViewLabel,
} from "../src/lib/admin-navigation.ts";
import {
  buildCategoryCounts,
  filterAndSortAdminProducts,
  filterAndSortPricingProducts,
  filterAndSortScrapedProducts,
  parseQuickPriceInput,
  UNCATEGORIZED_CATEGORY_KEY,
} from "../src/lib/admin-filters.ts";

test("reorganized admin navigation preserves all 14 views with clean daily shortcuts", () => {
  const expectedViews = [
    "overview",
    "fornecedores",
    "produtos",
    "revisao",
    "pedidos",
    "vitrine",
    "banners",
    "content",
    "shopping",
    "navigation",
    "service",
    "campaigns",
    "history",
    "evolution",
  ];
  const allViews = ADMIN_NAV_GROUPS.flatMap((group) => group.views.map((view) => view.id));
  assert.deepEqual([...new Set(allViews)].sort(), [...expectedViews].sort());

  const operacaoViews = ADMIN_NAV_GROUPS.filter((group) => group.section === "operacao").flatMap(
    (group) => group.views.map((view) => view.id),
  );
  assert.deepEqual(operacaoViews, ["overview", "fornecedores", "produtos", "revisao", "pedidos"]);

  for (const viewId of expectedViews) {
    assert.ok(getAdminNavGroup(viewId));
    assert.ok(getAdminViewLabel(viewId).length > 0);
  }
});

test("parseQuickPriceInput accepts Brazilian and decimal formats and rejects invalid input", () => {
  assert.equal(parseQuickPriceInput(""), null);
  assert.equal(parseQuickPriceInput("   "), null);
  assert.equal(parseQuickPriceInput("1299"), 1299);
  assert.equal(parseQuickPriceInput("1.299,90"), 1299.9);
  assert.equal(parseQuickPriceInput("R$ 890,50"), 890.5);
  assert.equal(parseQuickPriceInput("1299.50"), 1299.5);
  assert.equal(parseQuickPriceInput("1.299"), 1299);
  assert.ok(Number.isNaN(parseQuickPriceInput("-10")));
  assert.ok(Number.isNaN(parseQuickPriceInput("abc")));
});

test("buildCategoryCounts merges alias categories and counts uncategorized items", () => {
  const counts = buildCategoryCounts([
    { categoria: "Sofá" },
    { categoria: "Sofás" },
    { categoria: "Guarda-roupas" },
    { categoria: "  " },
    { categoria: null },
  ]);
  assert.deepEqual(counts, [
    { key: "guarda-roupas", label: "Guarda-roupas", count: 1 },
    { key: "sofas", label: "Sofás", count: 2 },
    { key: UNCATEGORIZED_CATEGORY_KEY, label: "Sem categoria", count: 2 },
  ]);
});

test("filterAndSortPricingProducts filters by category, query, cost range, and sorts cleanly", () => {
  const items = [
    {
      id: "1",
      nome: "Sofá Retrátil 2,30m",
      sku: "SR-10",
      categoria: "Sofá",
      fornecedor: "SR Móveis",
      preco_atacado: 1100,
      preco_atual: 0,
    },
    {
      id: "2",
      nome: "Guarda-roupa 6 Portas",
      sku: "GR-20",
      categoria: "Guarda-roupas",
      fornecedor: "SR Móveis",
      preco_atacado: 650,
      preco_atual: 0,
    },
    {
      id: "3",
      nome: "Mesa Lateral sem Custo",
      sku: "ML-30",
      categoria: "Mesas",
      fornecedor: "SR Móveis",
      preco_atacado: null,
      preco_atual: 0,
    },
    {
      id: "4",
      nome: "Cômoda Abaixo do Custo",
      sku: "CM-40",
      categoria: "Cômodas",
      fornecedor: "SR Móveis",
      preco_atacado: 400,
      preco_atual: 350,
    },
  ];

  const sofas = filterAndSortPricingProducts(items, {
    query: "",
    categoryKey: "sofas",
    status: "awaiting",
    minCost: "",
    maxCost: "",
    sort: "cost-asc",
  });
  assert.deepEqual(
    sofas.map((p) => p.id),
    ["1"],
  );

  const byLowestCost = filterAndSortPricingProducts(items, {
    query: "",
    categoryKey: "all",
    status: "awaiting",
    minCost: "",
    maxCost: "",
    sort: "cost-asc",
  });
  assert.deepEqual(
    byLowestCost.map((p) => p.id),
    ["2", "1", "3"],
  );

  const inRange = filterAndSortPricingProducts(items, {
    query: "guarda",
    categoryKey: "all",
    status: "awaiting",
    minCost: "500",
    maxCost: "800",
    sort: "cost-asc",
  });
  assert.deepEqual(
    inRange.map((p) => p.id),
    ["2"],
  );

  const belowCost = filterAndSortPricingProducts(items, {
    query: "",
    categoryKey: "all",
    status: "below-cost",
    minCost: "",
    maxCost: "",
    sort: "name-asc",
  });
  assert.deepEqual(
    belowCost.map((p) => p.id),
    ["4"],
  );
});

test("filterAndSortAdminProducts applies quick filters and sorting correctly", () => {
  const base = {
    slug: "item",
    sku: "SKU",
    fornecedor: "Tropical Móveis",
    categoria: "Sofás",
    preco_atacado: 300,
    preco_atual: 590,
    url_imagem: "https://example.com/a.jpg",
    ordem: 0,
    fonte_preco: null,
    url_fornecedor: null,
    descricao: null,
    medidas: "Largura: 2,00 m",
    cores: [],
    status_estoque: "disponivel",
    vitrine_black_friday: false,
  };
  const products = [
    { ...base, id: "a", nome: "Sem foto", url_imagem: "" },
    { ...base, id: "b", nome: "Sem medidas", medidas: "" },
    { ...base, id: "c", nome: "Esgotado", status_estoque: "esgotado" },
    { ...base, id: "d", nome: "Oferta Black", vitrine_black_friday: true, preco_atacado: 900 },
  ];

  const baseFilter = {
    query: "",
    supplierFilter: "all",
    missingSupplierKey: "__missing__",
    categoryKey: "all",
    statusFilter: "all",
    priceField: "site",
    minPrice: "",
    maxPrice: "",
    sort: "default",
  };

  assert.deepEqual(
    filterAndSortAdminProducts(products, { ...baseFilter, quickFilter: "missing-photo" }).map(
      (p) => p.id,
    ),
    ["a"],
  );
  assert.deepEqual(
    filterAndSortAdminProducts(products, { ...baseFilter, quickFilter: "missing-measures" }).map(
      (p) => p.id,
    ),
    ["b"],
  );
  assert.deepEqual(
    filterAndSortAdminProducts(products, { ...baseFilter, quickFilter: "out-of-stock" }).map(
      (p) => p.id,
    ),
    ["c"],
  );
  assert.deepEqual(
    filterAndSortAdminProducts(products, {
      ...baseFilter,
      quickFilter: "black-friday",
      sort: "cost-desc",
    }).map((p) => p.id),
    ["d"],
  );
});

test("filterAndSortScrapedProducts filters pending imports by category, cost, and order", () => {
  const scraped = [
    {
      id: "s1",
      name: "Painel TV 180",
      supplier: "Tropical Móveis",
      category: "Painéis",
      supplier_price: 250,
      sku: "TROP-1",
      reference: null,
      description: null,
    },
    {
      id: "s2",
      name: "Rack Sala 160",
      supplier: "Tropical Móveis",
      category: "Racks",
      supplier_price: 180,
      sku: "TROP-2",
      reference: null,
      description: null,
    },
  ];

  const filtered = filterAndSortScrapedProducts(scraped, {
    query: "",
    supplier: "Tropical Móveis",
    categoryKey: "all",
    minCost: "150",
    maxCost: "300",
    sort: "cost-asc",
  });
  assert.deepEqual(
    filtered.map((item) => item.id),
    ["s2", "s1"],
  );
});
