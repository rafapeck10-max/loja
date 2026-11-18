import type { Produto } from "./products.functions";
import { productDisplayPrice } from "./product-display-price.ts";
import { hasRealReferencePrice } from "./price-reference.ts";

/** Shared selection for the Black Friday page, catalog badges and product detail.
 * Uses existing catalog offers; never activates local campaign simulations.
 */
export function isBlackFridayProduct(product: Produto): boolean {
  const price = productDisplayPrice(product);
  return Number.isFinite(price) && price > 0 && hasRealReferencePrice(product.preco_antigo, price);
}
