import { createStudioRepositoryTransport } from "../../src/lib/admin-studio-repository";
import { emptyWorkspace, reviseWorkspace } from "../../src/lib/admin-studio";
import { initialPageDraft } from "../../src/lib/pages-shelves";
import { pageProducts } from "./data";
import { DEFAULT_HOMEPAGE_BANNERS } from "../../src/lib/homepage-banners";
import type { ProdutoInput } from "../../src/lib/admin.functions";
// Only resolved by the isolated preview Vite configuration. No remote requests.
let products = structuredClone(pageProducts);
export const checkAdminPassword = async () => true;
export const listAdminProdutos = async () => structuredClone(products);
export const listPendingScrapedProducts = async () => [];
export const getAdminStudioStorageMode = async () => ({
  remote: new URLSearchParams(window.location.search).get("scenario") === "stale",
  homePublicationEnabled: false,
});
export const listAdminHomepageBanners = async () => ({
  banners: DEFAULT_HOMEPAGE_BANNERS,
  available: true,
});
export const upsertProduto = async ({ data }: { data: { produto: ProdutoInput } }) => {
  const p = data.produto;
  if (
    !p.nome.trim() ||
    !/^https?:\/\//i.test(p.imagem_url) ||
    !Number.isFinite(p.preco_novo) ||
    p.preco_novo < 0
  )
    throw new Error("Confira nome, categoria, imagem e preço de venda antes de salvar.");
  const id = p.id || crypto.randomUUID();
  const existing = products.find((item) => item.id === id);
  const next = {
    ...existing,
    id,
    nome: p.nome,
    slug: p.slug || id,
    preco_atual: p.preco_novo,
    preco_antigo: p.preco_antigo ?? null,
    url_imagem: p.imagem_url,
    imagens: p.imagens ?? [],
    categoria: p.categoria,
    ordem: p.ordem ?? 0,
    fornecedor: p.fornecedor,
    sku: p.referencia,
    preco_atacado: p.preco_fornecedor ?? null,
    descricao: p.descricao,
    medidas: p.medidas,
    cores: p.cores,
    compre_junto_ids: p.compre_junto_ids ?? [],
    variacoes_preco: p.variacoes_preco ?? [],
  };
  products = [...products.filter((item) => item.id !== id), next] as typeof products;
  return { id };
};
export const deleteProduto = async ({ data }: { data: { id: string } }) => {
  products = products.filter((p) => p.id !== data.id);
};
export const completeScrapedProductImport = async () => {
  throw new Error("Importação remota desligada nesta prévia.");
};
export const importScrapedProducts = completeScrapedProductImport;
let staleSnapshot = {
  serverVersion: 1,
  workspace: reviseWorkspace(
    emptyWorkspace(),
    0,
    "pages",
    { ...initialPageDraft(products), baseVersion: "outdated-test-base" },
    new Date().toISOString(),
  ),
};
const isolatedRemote = createStudioRepositoryTransport(
  {
    async read() {
      return structuredClone(staleSnapshot);
    },
    async compareAndSwap(expected, next) {
      if (expected !== staleSnapshot.serverVersion) return false;
      staleSnapshot = structuredClone(next);
      return true;
    },
  },
  { sourceValues: { pages: initialPageDraft(products) }, products },
);
export const readAdminStudioWorkspace = async () => JSON.stringify(await isolatedRemote.read());
export const changeAdminStudioWorkspace = async ({
  data,
}: {
  data: { command: Parameters<typeof isolatedRemote.change>[0] };
}) => JSON.stringify(await isolatedRemote.change(data.command));
export const adminLocalHome = async () => {
  throw new Error("Aplicação pública desligada nesta prévia.");
};
export const createStoreOrder = async () => {
  throw new Error("Registro de pedidos disponível somente na loja real.");
};
export const listAdminOrders = async () => [];
export const updateAdminOrderStatus = async () => ({ ok: true as const });
export const bulkUpdateProductStock = async () => ({ updated: 0 });
export const syncScrapedStockToProducts = async () => ({ disponivelCount: 0, esgotadoCount: 0 });
