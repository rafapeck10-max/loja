import type { ProdutoAdmin, ProdutoScrapImport } from "./admin.functions";
import { adminCategoryKey } from "./admin-categories.ts";

export type ProductStatus = "published" | "awaiting" | "incomplete";
export const UNCATEGORIZED_CATEGORY_KEY = "__uncategorized__";

export interface CategoryCountOption {
  key: string;
  label: string;
  count: number;
}

export type PricingStatusFilter = "awaiting" | "published" | "below-cost" | "missing-cost" | "all";
export type PricingSortOption =
  "cost-asc" | "cost-desc" | "price-asc" | "price-desc" | "margin-asc" | "margin-desc" | "name-asc";

export type ProductQuickFilter =
  "all" | "missing-photo" | "missing-measures" | "out-of-stock" | "black-friday" | "below-cost";

export type ProductSortOption =
  "default" | "cost-asc" | "cost-desc" | "price-asc" | "price-desc" | "margin-asc" | "name-asc";

export type ScrapedSortOption = "newest" | "cost-asc" | "cost-desc" | "name-asc";

export function normalizeAdminSearch(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

export function productStatus(
  product: Pick<ProdutoAdmin, "preco_atual" | "preco_atacado" | "url_imagem">,
): ProductStatus {
  // Missing supplier cost must not hide an item that still needs a sale price.
  if (!(Number(product.preco_atual) > 0)) return "awaiting";
  if (Number(product.preco_atacado) > 0 && /^https?:\/\//i.test(product.url_imagem ?? ""))
    return "published";
  return "incomplete";
}

export function parsePriceFilter(value: string): number | null {
  if (!value.trim()) return null;
  const normalized = value
    .trim()
    .replace(/R\$\s*/gi, "")
    .replace(/\s/g, "");
  const canonical = normalized.includes(",")
    ? normalized.replace(/\./g, "").replace(",", ".")
    : /^\d{1,3}(\.\d{3})+$/.test(normalized)
      ? normalized.replace(/\./g, "")
      : normalized;
  if (!/^\d+(\.\d+)?$/.test(canonical)) return NaN;
  const number = Number(canonical);
  return Number.isFinite(number) && number >= 0 ? number : NaN;
}

export function parseQuickPriceInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = parsePriceFilter(trimmed);
  if (parsed == null || Number.isNaN(parsed)) return NaN;
  return Math.round(parsed * 100) / 100;
}

export function matchesPriceFilter(
  value: number | null,
  minimum: string,
  maximum: string,
): boolean {
  const min = parsePriceFilter(minimum);
  const max = parsePriceFilter(maximum);
  if (Number.isNaN(min) || Number.isNaN(max) || (min != null && max != null && min > max))
    return false;
  if (min == null && max == null) return true;
  // Unknown cost is not the same as a zero cost.
  if (value == null || !Number.isFinite(Number(value))) return false;
  return (min == null || Number(value) >= min) && (max == null || Number(value) <= max);
}

export function buildCategoryCounts(
  items: readonly { categoria?: string | null; category?: string | null }[],
): CategoryCountOption[] {
  const groups = new Map<string, CategoryCountOption>();
  let uncategorizedCount = 0;

  for (const item of items) {
    const raw = (item.categoria ?? item.category ?? "").trim();
    if (!raw) {
      uncategorizedCount += 1;
      continue;
    }
    const key = adminCategoryKey(raw);
    const label = key === "sofas" ? "Sofás" : key === "banquetas" ? "Banquetas" : raw;
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      groups.set(key, { key, label, count: 1 });
    }
  }

  const sorted = [...groups.values()].sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  if (uncategorizedCount > 0) {
    sorted.push({
      key: UNCATEGORIZED_CATEGORY_KEY,
      label: "Sem categoria",
      count: uncategorizedCount,
    });
  }
  return sorted;
}

function productMarginValue(
  cost: number | null | undefined,
  price: number | null | undefined,
): number | null {
  const c = Number(cost ?? 0);
  const p = Number(price ?? 0);
  return c > 0 && p > 0 ? p - c : null;
}

function comparePositiveMetric(
  aValue: number | null | undefined,
  bValue: number | null | undefined,
  direction: "asc" | "desc",
): number {
  const a = Number(aValue ?? 0);
  const b = Number(bValue ?? 0);
  const aValid = Number.isFinite(a) && a > 0;
  const bValid = Number.isFinite(b) && b > 0;
  if (!aValid && !bValid) return 0;
  if (!aValid) return 1;
  if (!bValid) return -1;
  return direction === "asc" ? a - b : b - a;
}

function compareNullableMetric(
  aValue: number | null,
  bValue: number | null,
  direction: "asc" | "desc",
): number {
  if (aValue == null && bValue == null) return 0;
  if (aValue == null) return 1;
  if (bValue == null) return -1;
  return direction === "asc" ? aValue - bValue : bValue - aValue;
}

function matchesCategoryFilter(
  rawCategory: string | null | undefined,
  categoryKey: string,
): boolean {
  if (categoryKey === "all") return true;
  const trimmed = (rawCategory ?? "").trim();
  if (categoryKey === UNCATEGORIZED_CATEGORY_KEY) return !trimmed;
  return adminCategoryKey(trimmed) === adminCategoryKey(categoryKey);
}

export type PricingFilterableProduct = Pick<
  ProdutoAdmin,
  "id" | "nome" | "preco_atacado" | "preco_atual"
> &
  Partial<
    Pick<ProdutoAdmin, "sku" | "categoria" | "fornecedor" | "descricao" | "medidas" | "cores">
  >;

export function filterAndSortPricingProducts<T extends PricingFilterableProduct>(
  products: readonly T[],
  filters: {
    query: string;
    categoryKey: string;
    status: PricingStatusFilter;
    minCost: string;
    maxCost: string;
    sort: PricingSortOption;
  },
): T[] {
  const query = normalizeAdminSearch(filters.query);
  return products
    .filter((product) => {
      if (query) {
        const haystack = normalizeAdminSearch(
          [
            product.nome,
            product.sku,
            product.categoria,
            product.fornecedor,
            product.descricao,
            product.medidas,
            ...(product.cores ?? []),
          ]
            .filter(Boolean)
            .join(" "),
        );
        if (!haystack.includes(query)) return false;
      }
      if (!matchesCategoryFilter(product.categoria, filters.categoryKey)) return false;

      const cost = Number(product.preco_atacado ?? 0);
      const price = Number(product.preco_atual ?? 0);
      if (filters.status === "awaiting" && price > 0) return false;
      if (filters.status === "published" && !(price > 0)) return false;
      if (filters.status === "below-cost" && !(cost > 0 && price > 0 && price < cost)) return false;
      if (filters.status === "missing-cost" && cost > 0) return false;

      if (!matchesPriceFilter(product.preco_atacado ?? null, filters.minCost, filters.maxCost)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (filters.sort) {
        case "cost-asc":
          cmp = comparePositiveMetric(a.preco_atacado, b.preco_atacado, "asc");
          break;
        case "cost-desc":
          cmp = comparePositiveMetric(a.preco_atacado, b.preco_atacado, "desc");
          break;
        case "price-asc":
          cmp = comparePositiveMetric(a.preco_atual, b.preco_atual, "asc");
          break;
        case "price-desc":
          cmp = comparePositiveMetric(a.preco_atual, b.preco_atual, "desc");
          break;
        case "margin-asc":
          cmp = compareNullableMetric(
            productMarginValue(a.preco_atacado, a.preco_atual),
            productMarginValue(b.preco_atacado, b.preco_atual),
            "asc",
          );
          break;
        case "margin-desc":
          cmp = compareNullableMetric(
            productMarginValue(a.preco_atacado, a.preco_atual),
            productMarginValue(b.preco_atacado, b.preco_atual),
            "desc",
          );
          break;
        case "name-asc":
          cmp = 0;
          break;
      }
      return cmp || a.nome.localeCompare(b.nome, "pt-BR");
    });
}

export type AdminCatalogProduct = Pick<
  ProdutoAdmin,
  | "id"
  | "nome"
  | "slug"
  | "sku"
  | "fornecedor"
  | "categoria"
  | "preco_atual"
  | "preco_atacado"
  | "url_imagem"
  | "ordem"
  | "fonte_preco"
  | "url_fornecedor"
  | "descricao"
  | "medidas"
  | "cores"
  | "status_estoque"
  | "vitrine_black_friday"
>;

export function filterAndSortAdminProducts<T extends AdminCatalogProduct>(
  products: readonly T[],
  filters: {
    query: string;
    supplierFilter: string;
    missingSupplierKey: string;
    categoryKey: string;
    statusFilter: "all" | ProductStatus;
    quickFilter: ProductQuickFilter;
    priceField: "site" | "supplier";
    minPrice: string;
    maxPrice: string;
    sort: ProductSortOption;
  },
): T[] {
  const query = normalizeAdminSearch(filters.query);
  return products
    .filter((product) => {
      if (query) {
        const searchableText = normalizeAdminSearch(
          [
            product.nome,
            product.slug,
            product.sku,
            product.fornecedor,
            product.categoria,
            product.fonte_preco,
            product.url_fornecedor,
            product.descricao,
            product.medidas,
            ...(product.cores ?? []),
          ]
            .filter(Boolean)
            .join(" "),
        );
        if (!searchableText.includes(query)) return false;
      }

      const supplier = product.fornecedor?.trim() ?? "";
      const matchesSupplier =
        filters.supplierFilter === "all" ||
        (filters.supplierFilter === filters.missingSupplierKey
          ? !supplier
          : filters.supplierFilter === `supplier:${supplier}`);
      if (!matchesSupplier) return false;

      if (!matchesCategoryFilter(product.categoria, filters.categoryKey)) return false;
      if (filters.statusFilter !== "all" && productStatus(product) !== filters.statusFilter) {
        return false;
      }

      const cost = Number(product.preco_atacado ?? 0);
      const price = Number(product.preco_atual ?? 0);
      if (
        filters.quickFilter === "missing-photo" &&
        /^https?:\/\//i.test(product.url_imagem ?? "")
      ) {
        return false;
      }
      if (filters.quickFilter === "missing-measures" && (product.medidas ?? "").trim()) {
        return false;
      }
      if (filters.quickFilter === "out-of-stock" && product.status_estoque !== "esgotado") {
        return false;
      }
      if (filters.quickFilter === "black-friday" && product.vitrine_black_friday !== true) {
        return false;
      }
      if (filters.quickFilter === "below-cost" && !(cost > 0 && price > 0 && price < cost)) {
        return false;
      }

      return matchesPriceFilter(
        filters.priceField === "site" ? product.preco_atual : product.preco_atacado,
        filters.minPrice,
        filters.maxPrice,
      );
    })
    .sort((a, b) => {
      if (filters.sort === "default") {
        const supplierA = a.fornecedor?.trim() ?? "";
        const supplierB = b.fornecedor?.trim() ?? "";
        if (!supplierA && supplierB) return 1;
        if (supplierA && !supplierB) return -1;
        return (
          supplierA.localeCompare(supplierB, "pt-BR") ||
          Number(a.ordem ?? 0) - Number(b.ordem ?? 0) ||
          a.nome.localeCompare(b.nome, "pt-BR")
        );
      }
      let cmp = 0;
      switch (filters.sort) {
        case "cost-asc":
          cmp = comparePositiveMetric(a.preco_atacado, b.preco_atacado, "asc");
          break;
        case "cost-desc":
          cmp = comparePositiveMetric(a.preco_atacado, b.preco_atacado, "desc");
          break;
        case "price-asc":
          cmp = comparePositiveMetric(a.preco_atual, b.preco_atual, "asc");
          break;
        case "price-desc":
          cmp = comparePositiveMetric(a.preco_atual, b.preco_atual, "desc");
          break;
        case "margin-asc":
          cmp = compareNullableMetric(
            productMarginValue(a.preco_atacado, a.preco_atual),
            productMarginValue(b.preco_atacado, b.preco_atual),
            "asc",
          );
          break;
        case "name-asc":
          cmp = 0;
          break;
      }
      return cmp || a.nome.localeCompare(b.nome, "pt-BR");
    });
}

export type ScrapedFilterableItem = Pick<
  ProdutoScrapImport,
  "id" | "name" | "supplier" | "category" | "supplier_price" | "sku" | "reference" | "description"
> &
  Partial<Pick<ProdutoScrapImport, "created_at">>;

export function filterAndSortScrapedProducts<T extends ScrapedFilterableItem>(
  items: readonly T[],
  filters: {
    query: string;
    supplier: string;
    categoryKey: string;
    minCost: string;
    maxCost: string;
    sort: ScrapedSortOption;
  },
): T[] {
  const query = normalizeAdminSearch(filters.query);
  const filtered = items.filter((item) => {
    if (query) {
      const haystack = normalizeAdminSearch(
        [item.name, item.sku, item.reference, item.category, item.supplier, item.description]
          .filter(Boolean)
          .join(" "),
      );
      if (!haystack.includes(query)) return false;
    }
    if (filters.supplier !== "all" && item.supplier.trim() !== filters.supplier) return false;
    if (!matchesCategoryFilter(item.category, filters.categoryKey)) return false;
    if (!matchesPriceFilter(item.supplier_price ?? null, filters.minCost, filters.maxCost)) {
      return false;
    }
    return true;
  });

  if (filters.sort === "newest") {
    return filtered;
  }

  return filtered.sort((a, b) => {
    let cmp = 0;
    if (filters.sort === "cost-asc") {
      cmp = comparePositiveMetric(a.supplier_price, b.supplier_price, "asc");
    } else if (filters.sort === "cost-desc") {
      cmp = comparePositiveMetric(a.supplier_price, b.supplier_price, "desc");
    }
    return cmp || a.name.localeCompare(b.name, "pt-BR");
  });
}
