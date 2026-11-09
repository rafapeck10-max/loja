import type { ProdutoAdmin } from "./admin.functions";
import { productStatus } from "./admin-filters.ts";

export const ADMIN_REVIEW_QUERY_LIMIT = 500;

export function overviewImpact(product: OverviewProduct): string {
  if (!(Number(product.preco_atual) > 0))
    return "Sem preço de venda válido, o produto não atende aos critérios de exibição do catálogo.";
  if (!/^https?:\/\//i.test(product.url_imagem ?? ""))
    return "Sem endereço de imagem válido, o cadastro precisa de revisão antes da exibição.";
  return "O custo pendente impede a elegibilidade pelas regras atuais do catálogo.";
}

export type OverviewProduct = Pick<
  ProdutoAdmin,
  "id" | "nome" | "preco_atual" | "preco_atacado" | "url_imagem"
>;

export interface OverviewSource<T> {
  status: "pending" | "success" | "error";
  data?: readonly T[];
  updatedAt?: number;
  limit?: number;
}

export function summarizeOverview(
  catalog: OverviewSource<OverviewProduct>,
  review: OverviewSource<{ id: string }>,
) {
  const counts: Record<
    "total" | "published" | "awaiting" | "incomplete" | "review",
    number | null
  > = {
    total: null,
    published: null,
    awaiting: null,
    incomplete: null,
    review: null,
  };
  const issues: Array<{ product: OverviewProduct; reasons: string[] }> = [];
  // Do not turn failed requests (including failed refreshes with cached data) into zeros.
  if (catalog.status === "success" && catalog.data) {
    counts.total = catalog.data.length;
    counts.published = counts.awaiting = counts.incomplete = 0;
    for (const product of catalog.data) {
      const status = productStatus(product);
      counts[status] = (counts[status] ?? 0) + 1;
      const reasons: string[] = [];
      if (!(Number(product.preco_atual) > 0)) reasons.push("Preço de venda ausente ou inválido");
      if (!/^https?:\/\//i.test(product.url_imagem ?? ""))
        reasons.push("Imagem principal ausente ou inválida");
      if (!(Number(product.preco_atacado) > 0))
        reasons.push("Custo do fornecedor ausente ou inválido");
      if (reasons.length) issues.push({ product, reasons });
    }
  }
  if (review.status === "success" && review.data) counts.review = review.data.length;
  const reviewLimitReached =
    review.status === "success" &&
    review.data !== undefined &&
    review.limit !== undefined &&
    review.data.length >= review.limit;
  return { counts, issues, reviewLimitReached };
}
