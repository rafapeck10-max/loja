import type { EditorProduct } from "../../src/lib/homepage-curation";
import pageSample from "./page-products.json";
import reviewSnapshot from "./review-product.json";
import { demoCategoryFor } from "./demo-category";
const historicalProducts: EditorProduct[] = pageSample.map((p, index) => ({
  id: `page-demo-${p.id}`,
  nome: p.name,
  slug: `page-demo-${p.id}`,
  categoria: demoCategoryFor(p),
  preco_atual: index === 8 || index === 9 ? 0 : p.price,
  preco_atacado: index === 11 ? null : p.price / 2,
  url_imagem: index === 10 ? "" : p.img,
  descricao: p.detail,
  sku: `AMOSTRA-${p.id}`,
  created_at: "2026-09-27T12:00:00Z",
  vitrine_semana_ordem: index < 4 ? index + 1 : null,
  vitrine_novidade: index === 4 ? "incluir" : "automatico",
  vitrine_sala: "automatico",
  vitrine_descoberta: true,
  compre_junto_ids: index === 11 ? ["page-demo-0"] : [],
}));

// Only public product attributes come from the store. This cost exists solely
// to exercise the isolated administrative demo; it is not a supplier quote.
export const reviewProduct: EditorProduct = {
  ...reviewSnapshot.product,
  preco_atacado: reviewSnapshot.product.preco_atual / 2,
  vitrine_semana_ordem: null,
  vitrine_novidade: "ocultar",
  vitrine_sala: "ocultar",
  vitrine_descoberta: false,
};
export const pageProducts: EditorProduct[] = [...historicalProducts, reviewProduct];
