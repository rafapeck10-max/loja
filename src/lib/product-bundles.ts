export const MAX_PRODUCT_BUNDLES = 3;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UNAVAILABLE = /indispon[ií]vel|esgotad[oa]|sem estoque|n[aã]o temos dispon[ií]vel/i;

export function normalizeProductBundleIds(
  value: unknown,
  { selfId, requireUuid = false }: { selfId?: string; requireUuid?: boolean } = {},
): string[] {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > MAX_PRODUCT_BUNDLES)
    throw new Error("Compre junto aceita até 3 produtos diferentes.");
  const ids = value.map((id) => (typeof id === "string" ? id.trim() : ""));
  if (ids.some((id) => !id || (requireUuid && !UUID.test(id))))
    throw new Error("Revise os IDs dos produtos do Compre junto.");
  if (new Set(ids).size !== ids.length)
    throw new Error("O Compre junto não aceita o mesmo complemento mais de uma vez.");
  if (selfId && ids.includes(selfId))
    throw new Error("O próprio produto não pode ser seu complemento.");
  return ids;
}

export interface BundleCandidate {
  preco_atual?: unknown;
  preco_atacado?: unknown;
  url_imagem?: string | null;
  descricao?: string | null;
  cores?: string[] | null;
}

/** Same cost/price requirements as the public query and availability rule used by curation. */
export function isEligibleBundleProduct(product: BundleCandidate): boolean {
  if (!product || typeof product !== "object" || Array.isArray(product)) return false;
  const price = Number(product.preco_atual);
  const cost = Number(product.preco_atacado);
  return (
    Number.isFinite(price) &&
    price > 0 &&
    Number.isFinite(cost) &&
    cost > 0 &&
    typeof product.url_imagem === "string" &&
    /^https:\/\//i.test(product.url_imagem.trim()) &&
    !UNAVAILABLE.test(
      `${typeof product.descricao === "string" ? product.descricao : ""} ${Array.isArray(product.cores) ? product.cores.join(" ") : ""}`,
    )
  );
}

/** Omit the new field for legacy schemas, but never silently discard an editorial selection. */
export function productBundleWrite(
  ids: string[] | undefined,
  schemaAvailable: boolean,
): { compre_junto_ids?: string[] } {
  if (ids === undefined) return {};
  if (schemaAvailable) return { compre_junto_ids: ids };
  if (ids.length)
    throw new Error(
      "O Compre junto ainda não está habilitado no banco. Nenhuma alteração foi salva. Aplique a migração revisada antes de salvar complementos.",
    );
  return {};
}
import { isMissingProductColumn } from "./product-schema.ts";

export async function prepareProductBundleWrite(
  ids: string[] | undefined,
  readSchemaError: () => Promise<unknown>,
): Promise<{ compre_junto_ids?: string[] }> {
  if (ids === undefined) return {};
  const error = await readSchemaError();
  if (error && !isMissingProductColumn(error, "compre_junto_ids")) {
    const message =
      typeof (error as { message?: unknown }).message === "string"
        ? (error as { message: string }).message
        : "Não foi possível conferir o cadastro de complementos.";
    throw new Error(message);
  }
  return productBundleWrite(ids, !error);
}
