import type { EditorProduct } from "../../src/lib/homepage-curation";
import pageSample from "./page-products.json";
export const pageProducts: EditorProduct[] = pageSample.map((p, index) => ({
  id: `page-demo-${p.id}`,
  nome: p.name,
  slug: `page-demo-${p.id}`,
  categoria: p.category,
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
}));
