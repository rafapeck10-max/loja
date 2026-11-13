import type { ProductPriceVariation } from "./products.functions";
export function publicPriceVariations(value: unknown): ProductPriceVariation[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    const name = typeof entry.name === "string" ? entry.name : "";
    const sku = typeof entry.sku === "string" ? entry.sku : "";
    if (!name || !sku) return [];
    return [
      {
        name,
        sku,
        sale_price: typeof entry.sale_price === "number" ? entry.sale_price : null,
        supplier_price: null,
      },
    ];
  });
}
