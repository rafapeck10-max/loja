import type { Produto } from "./products.functions";
import { productDisplayPrice } from "./product-display-price.ts";
import { hasRealReferencePrice } from "./price-reference.ts";

/** Shared selection for the Black Friday page, catalog badges and product detail.
 * Explicit catalog participation wins; null keeps the existing automatic offers.
 * Never activates local campaign simulations or modifies prices.
 */
export function isBlackFridayProduct(product: Produto): boolean {
  const price = productDisplayPrice(product);
  if (!Number.isFinite(price) || price <= 0) return false;
  return product.vitrine_black_friday ?? hasRealReferencePrice(product.preco_antigo, price);
}
