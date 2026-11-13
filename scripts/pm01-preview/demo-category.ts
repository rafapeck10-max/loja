export interface DemoCategorySource {
  name: string;
  detail: string;
  category: string;
}

export function demoCategoryFor(product: DemoCategorySource): string {
  const name = normalizeCategory(product.name);
  const detail = normalizeCategory(product.detail);
  const source = normalizeCategory(product.category);
  const canonical = (slug: string) => getCategory(slug)?.dbLabels[0] ?? product.category;
  // This adapter is deliberately limited to this historical demonstration.
  // Broad source labels remain unchanged when the supplied text does not prove a subtype.
  if (/^cozinha\b/.test(name) && /\bcozinha completa\b/.test(`${name} ${detail}`))
    return canonical("cozinhas-completas");
  if (/^roupeiro\b/.test(name)) return canonical("roupeiros");
  if (/^penteadeira\b/.test(name) || (/^camarim\b/.test(name) && /\bpenteadeira\b/.test(detail)))
    return canonical("penteadeiras");
  if (/^modulado\b/.test(name) && source === "quartos") return canonical("modulados-quarto");
  if (/^mesa\b/.test(name) && (source === "sala de jantar" || /\bmesa de jantar\b/.test(detail)))
    return canonical("mesas-de-jantar");
  if (/^aparador\b/.test(name)) return canonical("aparadores");
  if (/^cristaleira\b/.test(name)) return canonical("cristaleiras");
  if (/^colchao\b/.test(name)) {
    if (/\bqueen\b/.test(detail))
      return (
        getCategory("colchoes")?.dbLabels.find(
          (label) => normalizeCategory(label) === "colchoes queen",
        ) ?? canonical("colchoes")
      );
    return canonical("colchoes");
  }
  if (/^base bau\b/.test(name))
    return (
      getCategory("bases")?.dbLabels.find((label) => normalizeCategory(label) === "baus") ??
      canonical("bases")
    );
  return product.category;
}
import { getCategory, normalizeCategory } from "../../src/lib/constants.ts";
