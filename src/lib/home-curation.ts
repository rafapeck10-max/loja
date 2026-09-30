import type { Produto } from "@/lib/products.functions";
import { categoryMatches } from "@/lib/constants";
import { featuredProducts } from "@/lib/featured-products";

const UNAVAILABLE = /indispon[ií]vel|esgotad[oa]|sem estoque|n[aã]o temos dispon[ií]vel/i;
const SHELF_SIZE = 4;

export function isHomepageProduct(product: Produto): boolean {
  return (
    product.preco_novo > 0 &&
    /^https?:\/\//i.test(product.imagem_url) &&
    !UNAVAILABLE.test(product.descricao + " " + (product.cores ?? []).join(" "))
  );
}

export function weeklyHomepageProducts(products: Produto[]): Produto[] {
  const available = products.filter(isHomepageProduct);
  const selected = available
    .filter((product) => product.vitrine_semana_ordem != null)
    .sort(
      (a, b) =>
        (a.vitrine_semana_ordem ?? Number.MAX_SAFE_INTEGER) -
        (b.vitrine_semana_ordem ?? Number.MAX_SAFE_INTEGER),
    )
    .slice(0, SHELF_SIZE);

  if (selected.length || products.some((product) => product.curadoriaDisponivel)) return selected;
  return featuredProducts(available).slice(0, SHELF_SIZE);
}

export function newHomepageProducts(products: Produto[], today = new Date()): Produto[] {
  const dayStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const cutoff = dayStart - 30 * 24 * 60 * 60 * 1000;

  return products
    .filter((product) => {
      if (!isHomepageProduct(product) || product.vitrine_novidade === "ocultar") return false;
      if (product.vitrine_novidade === "incluir") return true;
      const createdAt = Date.parse(product.created_at);
      return Number.isFinite(createdAt) && createdAt >= cutoff;
    })
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, SHELF_SIZE);
}

export function roomHomepageProducts(products: Produto[]): Produto[] {
  return products
    .filter(
      (product) =>
        isHomepageProduct(product) &&
        product.vitrine_sala !== "ocultar" &&
        (product.vitrine_sala === "incluir" || categoryMatches(product.categoria, "sala-de-estar")),
    )
    .slice(0, SHELF_SIZE);
}

function stableScore(seed: string, id: string): number {
  let hash = 2166136261;
  for (const character of [seed, id].join(":")) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  }
  return hash >>> 0;
}

export function discoverHomepageProducts(
  products: Produto[],
  excludedIds: Set<string>,
  today = new Date(),
): Produto[] {
  const seed = today.toISOString();
  return products
    .filter(
      (product) =>
        isHomepageProduct(product) && product.vitrine_descoberta && !excludedIds.has(product.id),
    )
    .map((product) => ({ product, score: stableScore(seed, product.id) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, SHELF_SIZE)
    .map(({ product }) => product);
}
