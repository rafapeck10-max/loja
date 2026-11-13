import { publicPriceVariations } from "./public-price-variations";
import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import { categoryMatches, getCategory } from "@/lib/constants";
import { rehydrateHomepageSections } from "@/lib/homepage-selection";
import { selectHomepageRoomImages, type HomepageRoomImage } from "@/lib/homepage-room-categories";
import { isMissingCurationSchema, readWithOptionalProductColumns } from "./product-schema.ts";

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
  "id, nome, slug, preco_antigo, preco_atual, categoria, url_imagem, ordem, descricao, imagens, sku, medidas, cores, parcelas_sem_juros, variacoes_preco, created_at";
const PRODUCT_SELECT_WITH_BUNDLES = PRODUCT_SELECT_BASE + ", compre_junto_ids";
const PRODUCT_SELECT_CURATION =
  PRODUCT_SELECT_BASE +
  ", vitrine_semana_ordem, vitrine_novidade, vitrine_sala, vitrine_descoberta";
const PRODUCT_SELECT =
  PRODUCT_SELECT_WITH_BUNDLES +
  ", vitrine_semana_ordem, vitrine_novidade, vitrine_sala, vitrine_descoberta";
const HOMEPAGE_CANDIDATE_SELECT_BASE =
  "id, nome, slug, preco_antigo, preco_atual, categoria, url_imagem, ordem, descricao, sku, medidas, cores, created_at";
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
  sectionIds: {
    discovery: string[];
    weekly: string[];
    new: string[];
    room: string[];
  };
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
    return ((data ?? []) as unknown as HomepageCandidateRow[]).filter((row) =>
      row.url_imagem?.trim(),
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
  const { applyHomeCuration, blackFridayProductIdsToLoad, homeProductSelections } =
    await import("./home-configuration");
  const local = await readLocalHomeConfiguration();
  const candidates = candidateRows.map((row) => mapHomepageCandidate(row, curadoriaDisponivel));
  const roomImages = selectHomepageRoomImages(candidates);
  const now = new Date();
  const selections = homeProductSelections(candidates, local?.config, now);
  const blackFridayIds = local?.config.sections.some(
    (section) => section.id === "blackFriday" && section.enabled,
  )
    ? blackFridayProductIdsToLoad(local.config, now)
    : [];
  const selectedIds = [
    ...new Set([...rehydrateHomepageSections(selections, []).productIds, ...blackFridayIds]),
  ];
  const detailedRows = await readHomepageProductRows(selectedIds, curadoriaDisponivel);
  const detailedProducts = applyHomeCuration(
    detailedRows.map((row) => mapProduto(row, curadoriaDisponivel)),
    local?.config.curation,
  );
  const hydrated = rehydrateHomepageSections(selections, detailedProducts);

  return {
    products: hydrated.products,
    roomImages,
    sectionIds: hydrated.sectionIds,
    configuration: local?.config ?? null,
    revisionId: local?.revisionId ?? null,
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
  const products: BasicPublicProductRow[] = [];
  const batchSize = 500;
  const selectColumns = withCuration
    ? withBundles
      ? PRODUCT_SELECT
      : PRODUCT_SELECT_CURATION
    : withBundles
      ? PRODUCT_SELECT_WITH_BUNDLES
      : PRODUCT_SELECT_BASE;
  for (let offset = 0; ; offset += batchSize) {
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

    const batch = (data ?? []) as unknown as BasicPublicProductRow[];
    products.push(...batch.filter((row) => row.url_imagem?.trim()));
    if ((data?.length ?? 0) < batchSize) break;
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
