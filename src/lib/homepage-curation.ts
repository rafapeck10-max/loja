import type { ProdutoAdmin, HomeCurationMode } from "./admin.functions";
export type EditorProduct = Pick<
  ProdutoAdmin,
  "id" | "nome" | "preco_atual" | "preco_atacado" | "url_imagem"
> &
  Partial<ProdutoAdmin> & {
    materiais?: string[] | null;
    caracteristicas?: string[] | null;
    width_cm?: number | null;
    height_cm?: number | null;
    depth_closed_cm?: number | null;
    depth_open_cm?: number | null;
  };
export interface ProductSettings {
  novidade: HomeCurationMode;
  sala: HomeCurationMode;
  descoberta: boolean;
}
export interface CurationDraft {
  weeklyIds: string[];
  settings: Record<string, ProductSettings>;
}
export const CURATION_DEFAULTS: ProductSettings = {
  novidade: "automatico",
  sala: "automatico",
  descoberta: true,
};
export const CURATION_MODES: HomeCurationMode[] = ["automatico", "incluir", "ocultar"];
export function isCurationProduct(product: EditorProduct) {
  return (
    Number(product.preco_atual) > 0 &&
    Number(product.preco_atacado) > 0 &&
    /^https?:\/\//i.test(product.url_imagem ?? "") &&
    !/indispon[ií]vel|esgotad[oa]|sem estoque|n[aã]o temos dispon[ií]vel/i.test(
      String(product.descricao ?? "") + " " + (product.cores ?? []).join(" "),
    )
  );
}
export function settingsFor(product: EditorProduct): ProductSettings {
  return {
    novidade: CURATION_MODES.includes(product.vitrine_novidade as HomeCurationMode)
      ? (product.vitrine_novidade as HomeCurationMode)
      : "automatico",
    sala: CURATION_MODES.includes(product.vitrine_sala as HomeCurationMode)
      ? (product.vitrine_sala as HomeCurationMode)
      : "automatico",
    descoberta: typeof product.vitrine_descoberta === "boolean" ? product.vitrine_descoberta : true,
  };
}
