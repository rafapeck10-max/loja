import type { ProdutoAdmin } from "./admin.functions";

export type ProductStatus = "published" | "awaiting" | "incomplete";

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
  const number = Number(
    normalized.includes(",") ? normalized.replace(/\./g, "").replace(",", ".") : normalized,
  );
  return Number.isFinite(number) && number >= 0 ? number : NaN;
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
