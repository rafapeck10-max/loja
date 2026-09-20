import type { Produto } from "@/lib/products.functions";

// Curadoria da vitrine: modelos diferentes, seis ambientes e fotos conferidas.
// Preços e dados continuam vindo do catálogo. Não altera a ordem no admin.
export const FEATURED_PRODUCT_SLUGS = [
  "sr-poltrona-jamile-veludo-suede-azul-marinho",
  "sr-aparador-adega-new-odin-off-white-freijo-ej-moveis",
  "tropical-cozinha-cristal-valdemoveis-964-7",
  "tropical-mesa-magic-vieiro-298-mesa-jantar-13",
  "penteadeira-camarim-aurea-sr",
  "tropical-colchao-essential-pocket-queen-inovaflex-1143",
  "sr-roupeiro-itapema-ii-3p9g-branco",
  "sr-cristaleira-premium-2-portas-vidro-temperado-naturale-off-white-mavaular",
] as const;

export function featuredProducts(products: Produto[]): Produto[] {
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  return FEATURED_PRODUCT_SLUGS.flatMap((slug) => {
    const product = bySlug.get(slug);
    if (!product || product.preco_novo <= 0 || !/^https?:\/\//i.test(product.imagem_url)) return [];
    // Não promove itens com indisponibilidade explícita no cadastro atual.
    const availability = [product.descricao, ...(product.cores ?? [])].join(" ");
    if (/indispon[ií]vel|esgotad[oa]|sem estoque|n[aã]o temos dispon[ií]vel/i.test(availability))
      return [];
    return [product];
  });
}
