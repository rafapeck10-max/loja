import { publicPriceVariations } from "./public-price-variations";
import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import { CATEGORIES, categoryMatches, getCategory } from "@/lib/constants";
import { rehydrateHomepageSections } from "@/lib/homepage-selection";
import { selectHomepageRoomImages, type HomepageRoomImage } from "@/lib/homepage-room-categories";
import { BLACK_FRIDAY_PUBLIC_ENABLED, selectBlackFridayHomeProducts } from "./black-friday";
import { isMissingCurationSchema, readWithOptionalProductColumns } from "./product-schema.ts";

export type ProductStockStatus = "nao_verificado" | "disponivel" | "esgotado" | "revisar";

export function normalizeStockStatus(value: unknown): ProductStockStatus {
  if (value === "disponivel" || value === "esgotado" || value === "revisar") return value;
  return "nao_verificado";
}

export interface Produto {
  id: string;
  nome: string;
  slug: string;
  preco_antigo: number;
  preco_novo: number;
  imagem_url: string;
  categoria: string;
  ordem?: number;
  descricao: string;
  imagens: string[];
  sku: string | null;
  fornecedor: string | null;
  medidas: string | null;
  cores: string[] | null;
  status_estoque?: ProductStockStatus;
  materiais?: string[] | null;
  caracteristicas?: string[] | null;
  width_cm?: number | null;
  height_cm?: number | null;
  depth_closed_cm?: number | null;
  depth_open_cm?: number | null;
  compre_junto_ids: string[];
  parcelas_sem_juros: number;
  variacoes_preco: ProductPriceVariation[];
  created_at: string;
  vitrine_semana_ordem: number | null;
  vitrine_novidade: "automatico" | "incluir" | "ocultar";
  vitrine_sala: "automatico" | "incluir" | "ocultar";
  vitrine_descoberta: boolean;
  curadoriaDisponivel: boolean;
}

export interface ProductPriceVariation {
  name: string;
  sku: string;
  supplier_price: number | null;
  sale_price: number | null;
}

const PRODUCT_SELECT_BASE =
  "id, nome, slug, preco_antigo, preco_atual, categoria, url_imagem, ordem, descricao, imagens, sku, medidas, cores, status_estoque, parcelas_sem_juros, variacoes_preco, created_at";
const PRODUCT_SELECT_WITH_BUNDLES = PRODUCT_SELECT_BASE + ", compre_junto_ids";
const PRODUCT_SELECT_CURATION =
  PRODUCT_SELECT_BASE +
  ", vitrine_semana_ordem, vitrine_novidade, vitrine_sala, vitrine_descoberta";
const PRODUCT_SELECT =
  PRODUCT_SELECT_WITH_BUNDLES +
  ", vitrine_semana_ordem, vitrine_novidade, vitrine_sala, vitrine_descoberta";
const HOMEPAGE_CANDIDATE_SELECT_BASE =
  "id, nome, slug, preco_antigo, preco_atual, categoria, url_imagem, ordem, descricao, sku, medidas, cores, status_estoque, created_at";
const HOMEPAGE_CANDIDATE_SELECT =
  HOMEPAGE_CANDIDATE_SELECT_BASE +
  ", vitrine_semana_ordem, vitrine_novidade, vitrine_sala, vitrine_descoberta";

type BasicPublicProductRow = Pick<
  Database["public"]["Tables"]["produtos"]["Row"],
  | "id"
  | "nome"
  | "slug"
  | "preco_antigo"
  | "preco_atual"
  | "categoria"
  | "url_imagem"
  | "ordem"
  | "descricao"
  | "imagens"
  | "sku"
  | "medidas"
  | "cores"
  | "status_estoque"
  | "compre_junto_ids"
  | "parcelas_sem_juros"
  | "variacoes_preco"
  | "created_at"
>;
type PublicProductRow = BasicPublicProductRow &
  Pick<
    Database["public"]["Tables"]["produtos"]["Row"],
    "vitrine_semana_ordem" | "vitrine_novidade" | "vitrine_sala" | "vitrine_descoberta"
  >;
type HomepageCandidateRow = Pick<
  Database["public"]["Tables"]["produtos"]["Row"],
  | "id"
  | "nome"
  | "slug"
  | "preco_antigo"
  | "preco_atual"
  | "categoria"
  | "url_imagem"
  | "ordem"
  | "descricao"
  | "sku"
  | "medidas"
  | "cores"
  | "status_estoque"
  | "created_at"
> &
  Partial<
    Pick<
      Database["public"]["Tables"]["produtos"]["Row"],
      "vitrine_semana_ordem" | "vitrine_novidade" | "vitrine_sala" | "vitrine_descoberta"
    >
  >;

export interface HomepageProducts {
  products: Produto[];
  roomImages: HomepageRoomImage[];
  configuration?: import("./home-configuration").HomeConfiguration | null;
  revisionId?: number | null;
  publishedHomePage?: import("./pages-shelves").PublishedHomePage | null;
  sectionIds: {
    discovery: string[];
    weekly: string[];
    new: string[];
    room: string[];
  };
  blackFridayIds?: string[];
}

function mapProduto(
  row: BasicPublicProductRow &
    Partial<
      Pick<
        Database["public"]["Tables"]["produtos"]["Row"],
        "vitrine_semana_ordem" | "vitrine_novidade" | "vitrine_sala" | "vitrine_descoberta"
      >
    >,
  curadoriaDisponivel = false,
): Produto {
  return {
    id: row.id,
    nome: row.nome,
    slug: row.slug,
    preco_antigo: Number(row.preco_antigo),
    preco_novo: Number(row.preco_atual),
    imagem_url: row.url_imagem,
    categoria: row.categoria,
    ordem: row.ordem ?? 0,
    descricao: row.descricao ?? "",
    imagens: Array.isArray(row.imagens) ? row.imagens.filter(Boolean) : [],
    sku: row.sku ?? null,
    fornecedor: null, // Supplier stays in the admin; not sent by the storefront API.
    medidas: row.medidas ?? null,
    cores: Array.isArray(row.cores) ? row.cores.filter(Boolean) : null,
    status_estoque: normalizeStockStatus(row.status_estoque),
    compre_junto_ids: Array.isArray(row.compre_junto_ids)
      ? [
          ...new Set(row.compre_junto_ids.filter((id) => typeof id === "string" && id !== row.id)),
        ].slice(0, 3)
      : [],
    parcelas_sem_juros: Number(row.parcelas_sem_juros ?? 0),
    variacoes_preco: publicPriceVariations(row.variacoes_preco),
    created_at: row.created_at,
    vitrine_semana_ordem: row.vitrine_semana_ordem ?? null,
    vitrine_novidade: (row.vitrine_novidade ?? "automatico") as Produto["vitrine_novidade"],
    vitrine_sala: (row.vitrine_sala ?? "automatico") as Produto["vitrine_sala"],
    vitrine_descoberta: row.vitrine_descoberta ?? true,
    curadoriaDisponivel,
  };
}

function mapHomepageCandidate(row: HomepageCandidateRow, curadoriaDisponivel: boolean): Produto {
  return {
    id: row.id,
    nome: row.nome,
    slug: row.slug,
    preco_antigo: Number(row.preco_antigo),
    preco_novo: Number(row.preco_atual),
    imagem_url: row.url_imagem,
    categoria: row.categoria,
    ordem: row.ordem ?? 0,
    descricao: row.descricao ?? "",
    imagens: [],
    sku: row.sku ?? null,
    fornecedor: null,
    medidas: row.medidas ?? null,
    cores: Array.isArray(row.cores) ? row.cores.filter(Boolean) : null,
    status_estoque: normalizeStockStatus(row.status_estoque),
    compre_junto_ids: [],
    parcelas_sem_juros: 0,
    variacoes_preco: [],
    created_at: row.created_at,
    vitrine_semana_ordem: row.vitrine_semana_ordem ?? null,
    vitrine_novidade: (row.vitrine_novidade ?? "automatico") as Produto["vitrine_novidade"],
    vitrine_sala: (row.vitrine_sala ?? "automatico") as Produto["vitrine_sala"],
    vitrine_descoberta: row.vitrine_descoberta ?? true,
    curadoriaDisponivel,
  };
}

async function readHomepageCandidates(withCuration: boolean): Promise<HomepageCandidateRow[]> {
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
  const batchSize = 1000;
  const selectColumns = withCuration ? HOMEPAGE_CANDIDATE_SELECT : HOMEPAGE_CANDIDATE_SELECT_BASE;
  const fetchPage = async (offset: number) => {
    const { data, error } = await supabase
      .from("produtos")
      .select(selectColumns)
      .gt("preco_atacado", 0)
      .gt("preco_atual", 0)
      .neq("url_imagem", "")
      .order("ordem", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + batchSize - 1);
    if (error) throw Object.assign(new Error(error.message), { code: error.code });
    return ((data ?? []) as unknown as HomepageCandidateRow[]).filter(
      (row) => row.url_imagem?.trim() && row.status_estoque !== "esgotado",
    );
  };

  const [firstPage, secondPage] = await Promise.all([fetchPage(0), fetchPage(batchSize)]);
  const candidates = [...firstPage, ...secondPage];
  let offset = batchSize * 2;
  let lastPage = secondPage;
  while (lastPage.length === batchSize) {
    lastPage = await fetchPage(offset);
    candidates.push(...lastPage);
    offset += batchSize;
  }
  return candidates;
}

async function readHomepageProductRows(
  ids: string[],
  withCuration: boolean,
): Promise<BasicPublicProductRow[]> {
  if (!ids.length) return [];
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await supabase
    .from("produtos")
    .select(withCuration ? PRODUCT_SELECT_CURATION : PRODUCT_SELECT_BASE)
    .in("id", ids)
    .gt("preco_atacado", 0)
    .gt("preco_atual", 0)
    .neq("url_imagem", "");
  if (error) throw Object.assign(new Error(error.message), { code: error.code });
  return (data ?? []) as unknown as BasicPublicProductRow[];
}

async function readPublicHomepageProducts(): Promise<HomepageProducts> {
  let candidateRows: HomepageCandidateRow[];
  let curadoriaDisponivel = true;
  try {
    candidateRows = await readHomepageCandidates(true);
  } catch (error) {
    if (!isMissingCurationSchema(error)) throw error;
    curadoriaDisponivel = false;
    candidateRows = await readHomepageCandidates(false);
  }

  const { readLocalHomeConfiguration } = await import("./home-local-store.server");
  const { readPublishedHomePage } = await import("./home-publication.server");
  const {
    applyHomeCuration,
    blackFridayProductIdsToLoad,
    homeProductSelections,
    publishedHomeProductSelections,
  } = await import("./home-configuration");
  const [local, publishedHomePage] = await Promise.all([
    readLocalHomeConfiguration(),
    readPublishedHomePage(),
  ]);
  const candidates = candidateRows.map((row) => mapHomepageCandidate(row, curadoriaDisponivel));
  const roomImages = selectHomepageRoomImages(candidates);
  const now = new Date();
  const selections = publishedHomePage
    ? publishedHomeProductSelections(candidates, publishedHomePage, now)
    : homeProductSelections(candidates, local?.config, now);
  const blackFridayCampaignIds = local?.config.sections.some(
    (section) => section.id === "blackFriday" && section.enabled,
  )
    ? blackFridayProductIdsToLoad(local.config, now)
    : [];
  const seasonalIds =
    BLACK_FRIDAY_PUBLIC_ENABLED && !blackFridayCampaignIds.length
      ? selectBlackFridayHomeProducts(candidates, 4).map((product) => product.id)
      : [];
  const blackFridayIds = blackFridayCampaignIds.length ? blackFridayCampaignIds : seasonalIds;
  const selectedIds = [
    ...new Set([...rehydrateHomepageSections(selections, []).productIds, ...blackFridayIds]),
  ];
  const detailedRows = await readHomepageProductRows(selectedIds, curadoriaDisponivel);
  const currentProducts = detailedRows.map((row) => mapProduto(row, curadoriaDisponivel));
  const detailedProducts = publishedHomePage
    ? currentProducts
    : applyHomeCuration(currentProducts, local?.config.curation);
  const hydrated = rehydrateHomepageSections(selections, detailedProducts);
  const hydratedIds = new Set(hydrated.products.map((product) => product.id));
  const extraBlackFridayProducts = blackFridayIds
    .map((id) => detailedProducts.find((product) => product.id === id))
    .filter((product): product is Produto => Boolean(product && !hydratedIds.has(product.id)));

  return {
    products: [...hydrated.products, ...extraBlackFridayProducts],
    roomImages,
    sectionIds: hydrated.sectionIds,
    blackFridayIds,
    configuration: local?.config ?? null,
    revisionId: local?.revisionId ?? null,
    publishedHomePage,
  };
}

async function readPublicRows(
  withCuration: boolean,
  withBundles = true,
): Promise<BasicPublicProductRow[]> {
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
  const batchSize = 500;
  const selectColumns = withCuration
    ? withBundles
      ? PRODUCT_SELECT
      : PRODUCT_SELECT_CURATION
    : withBundles
      ? PRODUCT_SELECT_WITH_BUNDLES
      : PRODUCT_SELECT_BASE;
  const fetchRange = async (offset: number, withCount = false) => {
    const { data, error, count } = await supabase
      .from("produtos")
      .select(selectColumns, withCount ? { count: "exact" } : undefined)
      .gt("preco_atacado", 0)
      .gt("preco_atual", 0)
      .neq("url_imagem", "")
      .order("ordem", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + batchSize - 1);
    if (error) throw Object.assign(new Error(error.message), { code: error.code });
    const rows = ((data ?? []) as unknown as BasicPublicProductRow[]).filter((row) =>
      row.url_imagem?.trim(),
    );
    return { rows, rawLength: data?.length ?? 0, count };
  };

  const first = await fetchRange(0, true);
  if (first.rawLength < batchSize) return first.rows;

  if (typeof first.count === "number" && first.count > batchSize) {
    const offsets: number[] = [];
    for (let offset = batchSize; offset < first.count; offset += batchSize) {
      offsets.push(offset);
    }
    const rest = await Promise.all(offsets.map((offset) => fetchRange(offset)));
    return [...first.rows, ...rest.flatMap((page) => page.rows)];
  }

  const products = [...first.rows];
  for (let offset = batchSize; ; offset += batchSize) {
    const next = await fetchRange(offset);
    products.push(...next.rows);
    if (next.rawLength < batchSize) break;
  }
  return products;
}

async function readPublicProducts(): Promise<Produto[]> {
  const result = await readWithOptionalProductColumns(({ withCuration, withBundles }) =>
    readPublicRows(withCuration, withBundles),
  );
  return result.value.map((row) => mapProduto(row, result.withCuration));
}
export const getProdutos = createServerFn({ method: "GET" }).handler(readPublicProducts);
export const getHomepageProducts = createServerFn({ method: "GET" }).handler(
  readPublicHomepageProducts,
);
export const getProduto = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => {
    if (typeof input?.id !== "string" || !input.id) throw new Error("id inválido");
    return { id: input.id };
  })
  .handler(async ({ data }): Promise<Produto | null> => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id);
    const readRow = async (withBundles: boolean) => {
      const query = supabase
        .from("produtos")
        .select(withBundles ? PRODUCT_SELECT_WITH_BUNDLES : PRODUCT_SELECT_BASE)
        .gt("preco_atacado", 0)
        .gt("preco_atual", 0)
        .neq("url_imagem", "");

      if (isUUID) query.eq("id", data.id);
      else query.eq("slug", data.id);
      const { data: row, error } = await query.maybeSingle();
      if (error) throw error;
      return row as unknown as BasicPublicProductRow | null;
    };

    const { value: row } = await readWithOptionalProductColumns(
      ({ withBundles }) => readRow(withBundles),
      { withCuration: false, withBundles: true },
    );
    if (!row) return null;

    return mapProduto(row);
  });

export const produtosQueryOptions = () =>
  queryOptions({
    queryKey: ["produtos"],
    queryFn: () => getProdutos(),
  });

export const homepageProductsQueryOptions = () =>
  queryOptions({
    queryKey: ["produtos", "homepage"],
    queryFn: () => getHomepageProducts(),
    staleTime: 30_000,
  });

export const produtoQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["produtos", id],
    queryFn: () => getProduto({ data: { id } }),
  });

export const getProdutosByCategoria = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => {
    if (typeof input?.slug !== "string" || !input.slug) throw new Error("slug inválido");
    return { slug: input.slug };
  })
  .handler(async ({ data }): Promise<Produto[]> => {
    const cat = getCategory(data.slug);
    if (!cat) return [];

    return (await readPublicProducts()).filter((product) =>
      categoryMatches(product.categoria, cat.slug),
    );
  });

export const categoriaProdutosQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["produtos", "categoria", slug],
    queryFn: () => getProdutosByCategoria({ data: { slug } }),
  });

export const getRelatedProdutos = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string; categoria: string; preco: number }) => {
    const id = typeof input?.id === "string" ? input.id.trim() : "";
    const categoria = typeof input?.categoria === "string" ? input.categoria.trim() : "";
    const preco = Number(input?.preco);
    if (!id || !categoria || !Number.isFinite(preco) || preco <= 0) {
      throw new Error("Parâmetros inválidos para produtos relacionados");
    }
    return { id, categoria, preco };
  })
  .handler(async ({ data }): Promise<Produto[]> => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );

    const sortRelated = (items: Produto[]) =>
      [...items].sort((a, b) => {
        const diffA = Math.abs(a.preco_novo - data.preco);
        const diffB = Math.abs(b.preco_novo - data.preco);
        if (diffA !== diffB) return diffA - diffB;
        const orderDiff = (a.ordem ?? 0) - (b.ordem ?? 0);
        if (orderDiff !== 0) return orderDiff;
        return a.id.localeCompare(b.id, "pt-BR");
      });

    const { data: exactRows, error } = await supabase
      .from("produtos")
      .select(PRODUCT_SELECT_BASE)
      .eq("categoria", data.categoria)
      .neq("id", data.id)
      .neq("status_estoque", "esgotado")
      .gt("preco_atacado", 0)
      .gt("preco_atual", 0)
      .neq("url_imagem", "")
      .order("ordem", { ascending: true })
      .limit(24);
    if (error) throw new Error(error.message);

    const exactMatches = sortRelated(
      ((exactRows ?? []) as unknown as BasicPublicProductRow[])
        .filter((row) => Boolean(row.url_imagem?.trim()))
        .map((row) => mapProduto(row)),
    ).slice(0, 4);

    if (exactMatches.length >= 4) return exactMatches;

    const parentRoom = CATEGORIES.find((room) => categoryMatches(data.categoria, room.slug));
    if (!parentRoom) return exactMatches;

    const { data: fallbackRows, error: fallbackError } = await supabase
      .from("produtos")
      .select(PRODUCT_SELECT_BASE)
      .neq("id", data.id)
      .neq("status_estoque", "esgotado")
      .gt("preco_atacado", 0)
      .gt("preco_atual", 0)
      .neq("url_imagem", "")
      .order("ordem", { ascending: true })
      .limit(80);
    if (fallbackError) throw new Error(fallbackError.message);

    const seenIds = new Set(exactMatches.map((item) => item.id));
    const roomMatches = sortRelated(
      ((fallbackRows ?? []) as unknown as BasicPublicProductRow[])
        .filter(
          (row) =>
            Boolean(row.url_imagem?.trim()) &&
            !seenIds.has(row.id) &&
            categoryMatches(row.categoria, parentRoom.slug),
        )
        .map((row) => mapProduto(row)),
    );

    return [...exactMatches, ...roomMatches].slice(0, 4);
  });

export const relatedProdutosQueryOptions = (id: string, categoria: string, preco: number) =>
  queryOptions({
    queryKey: ["produtos", "related", id, categoria, preco],
    queryFn: () => getRelatedProdutos({ data: { id, categoria, preco } }),
    staleTime: 60_000,
  });
