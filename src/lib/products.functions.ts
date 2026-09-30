import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import { categoryMatches, getCategory } from "@/lib/constants";

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
const PRODUCT_SELECT =
  PRODUCT_SELECT_BASE +
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
  | "parcelas_sem_juros"
  | "variacoes_preco"
  | "created_at"
>;
type PublicProductRow = BasicPublicProductRow &
  Pick<
    Database["public"]["Tables"]["produtos"]["Row"],
    "vitrine_semana_ordem" | "vitrine_novidade" | "vitrine_sala" | "vitrine_descoberta"
  >;

function parsePriceVariations(value: Json): ProductPriceVariation[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    const name = typeof entry.name === "string" ? entry.name : "";
    const sku = typeof entry.sku === "string" ? entry.sku : "";
    if (!name || !sku) return [];
    const supplierPrice = typeof entry.supplier_price === "number" ? entry.supplier_price : null;
    const salePrice = typeof entry.sale_price === "number" ? entry.sale_price : null;
    return [{ name, sku, supplier_price: supplierPrice, sale_price: salePrice }];
  });
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
    parcelas_sem_juros: Number(row.parcelas_sem_juros ?? 0),
    variacoes_preco: parsePriceVariations(row.variacoes_preco),
    created_at: row.created_at,
    vitrine_semana_ordem: row.vitrine_semana_ordem ?? null,
    vitrine_novidade: (row.vitrine_novidade ?? "automatico") as Produto["vitrine_novidade"],
    vitrine_sala: (row.vitrine_sala ?? "automatico") as Produto["vitrine_sala"],
    vitrine_descoberta: row.vitrine_descoberta ?? true,
    curadoriaDisponivel,
  };
}

async function readPublicRows(withCuration: boolean): Promise<BasicPublicProductRow[]> {
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
  const products: BasicPublicProductRow[] = [];
  const batchSize = 500;
  const selectColumns = withCuration ? PRODUCT_SELECT : PRODUCT_SELECT_BASE;
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
  let rows: BasicPublicProductRow[];
  let curadoriaDisponivel = true;
  try {
    rows = await readPublicRows(true);
  } catch (error) {
    const code = (error as { code?: string }).code;
    const message = error instanceof Error ? error.message : String(error);
    const missingCurationSchema =
      code === "42703" || code === "PGRST204" || /vitrine_semana_ordem/i.test(message);
    if (!missingCurationSchema) throw error;
    curadoriaDisponivel = false;
    rows = await readPublicRows(false);
  }
  return rows.map((row) => mapProduto(row, curadoriaDisponivel));
}
export const getProdutos = createServerFn({ method: "GET" }).handler(readPublicProducts);

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
    const query = supabase
      .from("produtos")
      .select(PRODUCT_SELECT_BASE)
      .gt("preco_atacado", 0)
      .gt("preco_atual", 0)
      .neq("url_imagem", "");

    if (isUUID) {
      query.eq("id", data.id);
    } else {
      query.eq("slug", data.id);
    }

    const { data: row, error } = await query.maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;

    return mapProduto(row);
  });

export const produtosQueryOptions = () =>
  queryOptions({
    queryKey: ["produtos"],
    queryFn: () => getProdutos(),
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
