import { categoryMatches } from "./constants.ts";

interface SearchProduct {
  nome: string;
  categoria: string;
  descricao?: string | null;
  medidas?: string | null;
  cores?: string[] | null;
}
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const families: Record<string, readonly string[]> = {
  sofa: ["sofas"],
  sofas: ["sofas"],
  estofado: ["sofas"],
  estofados: ["sofas"],
  roupeiro: ["roupeiros"],
  roupeiros: ["roupeiros"],
  cama: ["camas-casal", "camas-solteiro", "camas-com-bau", "beliches", "bicamas", "cama-box"],
  camas: ["camas-casal", "camas-solteiro", "camas-com-bau", "beliches", "bicamas", "cama-box"],
};
export function matchesCatalogSearch(product: SearchProduct, query: string): boolean {
  const terms = normalize(query)
    .replace(/\bguarda roupas?\b/g, "roupeiro")
    .split(" ")
    .filter(Boolean);
  const text = normalize(
    [product.nome, product.descricao, product.medidas, ...(product.cores ?? [])]
      .filter(Boolean)
      .join(" "),
  );
  return terms.every((term) =>
    families[term]
      ? families[term].some((slug) => categoryMatches(product.categoria, slug))
      : text.includes(term),
  );
}
