import { createServerFn } from "@tanstack/react-start";
import { createHash, timingSafeEqual } from "node:crypto";
import type { Database, Json } from "@/integrations/supabase/types";
import {
  DEFAULT_HOMEPAGE_BANNERS,
  type HomepageBanner,
  type HomepageBannerInput,
} from "@/lib/homepage-banners";

export interface ProdutoInput {
  id: string;
  nome: string;
  slug?: string;
  preco_novo: number;
  imagem_url: string;
  imagens?: string[];
  variacoes_preco?: PriceVariation[];
  categoria?: string;
  ordem?: number;
  fornecedor?: string;
  referencia?: string;
  preco_fornecedor?: number | null;
  link_fornecedor?: string;
  fonte_preco?: string;
  vendas_ultimos_30_dias?: number;
  descricao?: string;
  medidas?: string;
  cores?: string[];
  deduplicateExisting?: boolean;
}

function checkPassword(input: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD não configurado.");
  const a = createHash("sha256")
    .update(String(input ?? ""), "utf8")
    .digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("Senha administrativa incorreta.");
  }
}

export type ProdutoAdmin = Database["public"]["Tables"]["produtos"]["Row"];
export type ProdutoScrapImport = Database["public"]["Tables"]["scraped_products"]["Row"];

export interface ProdutoScrapImportInput {
  supplier: string;
  name: string;
  category?: string | null;
  price?: number | null;
  price_variations?: Array<{
    name: string;
    sku: string;
    supplier_price: number;
  }>;
  currency?: string | null;
  sku?: string | null;
  references?: string | null;
  colors?: string | null;
  availability?: string[];
  measurements?: string | null;
  description?: string | null;
  image_urls?: string[];
  product_url?: string | null;
  scraped_at?: string | null;
}

export interface PriceVariation {
  name: string;
  sku: string;
  supplier_price: number | null;
  sale_price: number | null;
}

export type HomeCurationMode = "automatico" | "incluir" | "ocultar";

export interface HomeProductCurationInput {
  id: string;
  novidade: HomeCurationMode;
  sala: HomeCurationMode;
  descoberta: boolean;
}

const ADMIN_PRODUCTS_PAGE_SIZE = 500;

export const listAdminProdutos = createServerFn({ method: "POST" })
  .inputValidator((input: { password: string }) => ({ password: String(input?.password ?? "") }))
  .handler(async ({ data }): Promise<ProdutoAdmin[]> => {
    checkPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const {
      data: firstPage,
      error: firstPageError,
      count,
    } = await supabaseAdmin
      .from("produtos")
      .select("*", { count: "exact" })
      .order("ordem", { ascending: true })
      .order("id", { ascending: true })
      .range(0, ADMIN_PRODUCTS_PAGE_SIZE - 1);

    if (firstPageError) throw new Error(firstPageError.message);
    if (count == null) throw new Error("Não foi possível confirmar o total de produtos.");

    const rows: ProdutoAdmin[] = firstPage ?? [];
    while (rows.length < count) {
      const from = rows.length;
      const { data: nextPage, error: nextPageError } = await supabaseAdmin
        .from("produtos")
        .select("*")
        .order("ordem", { ascending: true })
        .order("id", { ascending: true })
        .range(from, from + ADMIN_PRODUCTS_PAGE_SIZE - 1);

      if (nextPageError) throw new Error(nextPageError.message);
      if (!nextPage?.length) {
        throw new Error(`O catálogo retornou ${rows.length} de ${count} produtos.`);
      }
      rows.push(...nextPage);
    }

    if (rows.length !== count) {
      throw new Error(`O catálogo retornou ${rows.length} de ${count} produtos.`);
    }

    return rows;
  });

export const homepageCurationStatus = createServerFn({ method: "POST" })
  .validator((input: { password: string }) => ({
    password: String(input?.password ?? ""),
  }))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("produtos").select("vitrine_semana_ordem").limit(0);
    if (!error) return { available: true as const };
    if (
      error.code === "42703" ||
      error.code === "PGRST204" ||
      /vitrine_semana_ordem/i.test(error.message)
    ) {
      return { available: false as const };
    }
    throw new Error(error.message);
  });

export const saveHomepageCuration = createServerFn({ method: "POST" })
  .validator(
    (input: { password: string; weeklyIds: string[]; settings: HomeProductCurationInput[] }) => {
      const weeklyIds = Array.isArray(input?.weeklyIds) ? input.weeklyIds.map(String) : [];
      const settings = Array.isArray(input?.settings)
        ? input.settings.map((item) => ({
            id: String(item?.id ?? ""),
            novidade: item?.novidade,
            sala: item?.sala,
            descoberta: item?.descoberta,
          }))
        : [];
      const allowed = new Set<HomeCurationMode>(["automatico", "incluir", "ocultar"]);
      if (weeklyIds.length > 4 || weeklyIds.some((id) => !id || id.length > 160)) {
        throw new Error("Escolha até quatro produtos válidos para a semana.");
      }
      if (settings.length > 5000) {
        throw new Error("Atualize a lista do catálogo antes de salvar a vitrine.");
      }
      if (
        settings.some(
          (item) =>
            !item.id ||
            item.id.length > 160 ||
            !allowed.has(item.novidade as HomeCurationMode) ||
            !allowed.has(item.sala as HomeCurationMode) ||
            typeof item.descoberta !== "boolean",
        )
      ) {
        throw new Error("Revise as opções de exibição dos produtos.");
      }
      if (
        new Set(weeklyIds).size !== weeklyIds.length ||
        new Set(settings.map((item) => item.id)).size !== settings.length
      ) {
        throw new Error("Há produtos repetidos na seleção da vitrine.");
      }
      return {
        password: String(input?.password ?? ""),
        weeklyIds,
        settings: settings as HomeProductCurationInput[],
      };
    },
  )
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.weeklyIds.length) {
      const { data: selectedProducts, error: productsError } = await supabaseAdmin
        .from("produtos")
        .select("id, preco_atual, preco_atacado, url_imagem, descricao, cores")
        .in("id", data.weeklyIds);
      if (productsError) throw new Error(productsError.message);
      if (selectedProducts?.length !== data.weeklyIds.length) {
        throw new Error("Atualize o catálogo: um produto escolhido não está mais disponível.");
      }
      const unavailable = /indispon[ií]vel|esgotad[oa]|sem estoque|n[aã]o temos dispon[ií]vel/i;
      const invalid = selectedProducts.some(
        (product) =>
          Number(product.preco_atual ?? 0) <= 0 ||
          Number(product.preco_atacado ?? 0) <= 0 ||
          !/^https?:\/\//i.test(product.url_imagem ?? "") ||
          unavailable.test(String(product.descricao ?? "") + " " + (product.cores ?? []).join(" ")),
      );
      if (invalid) throw new Error("Escolha somente produtos publicados e disponíveis.");
    }

    const { error } = await supabaseAdmin.rpc("save_homepage_curation", {
      p_weekly_ids: data.weeklyIds,
      p_home_settings: data.settings as unknown as Json,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

function isMissingHomepageBannersTable(error: { code?: string; message: string }) {
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (error.message.toLowerCase().includes("homepage_banners") &&
      /schema cache|does not exist|could not find|relation/i.test(error.message))
  );
}

export const listAdminHomepageBanners = createServerFn({ method: "POST" })
  .validator((input: { password: string }) => ({
    password: String(input?.password ?? ""),
  }))
  .handler(async ({ data }): Promise<{ available: boolean; banners: HomepageBanner[] }> => {
    checkPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("homepage_banners")
      .select("*")
      .order("position", { ascending: true });

    if (error) {
      if (isMissingHomepageBannersTable(error)) {
        return { available: false, banners: DEFAULT_HOMEPAGE_BANNERS };
      }
      throw new Error(error.message);
    }

    const byPosition = new Map((rows ?? []).map((banner) => [banner.position, banner]));
    return {
      available: true,
      banners: DEFAULT_HOMEPAGE_BANNERS.map(
        (fallback) => byPosition.get(fallback.position) ?? fallback,
      ),
    };
  });

export const saveHomepageBanners = createServerFn({ method: "POST" })
  .validator((input: { password: string; banners: HomepageBannerInput[] }) => {
    const source = Array.isArray(input?.banners) ? input.banners : [];
    if (source.length !== 3) throw new Error("Mantenha os três espaços de banner do carrossel.");
    const banners = source.map((banner, index) => ({
      position: index + 1,
      image_url: String(banner?.image_url ?? "").trim(),
      eyebrow: String(banner?.eyebrow ?? "").trim(),
      title: String(banner?.title ?? "").trim(),
      subtitle: String(banner?.subtitle ?? "").trim(),
      cta_label: String(banner?.cta_label ?? "").trim(),
      cta_href: String(banner?.cta_href ?? "").trim(),
      active: banner?.active === true,
    }));

    if (
      banners.some(
        (banner) =>
          !/^https:\/\//i.test(banner.image_url) ||
          !banner.title ||
          banner.title.length > 120 ||
          banner.eyebrow.length > 60 ||
          banner.subtitle.length > 220 ||
          banner.cta_label.length > 50 ||
          banner.cta_href.length > 300 ||
          !(
            (banner.cta_href.startsWith("/") && !banner.cta_href.startsWith("//")) ||
            /^https:\/\//i.test(banner.cta_href)
          ),
      )
    ) {
      throw new Error("Confira as imagens, os títulos e os links dos banners.");
    }
    if (!banners.some((banner) => banner.active)) {
      throw new Error("Deixe pelo menos um banner ativo.");
    }

    return { password: String(input?.password ?? ""), banners };
  })
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("homepage_banners").upsert(
      data.banners.map((banner) => ({ ...banner, updated_at: new Date().toISOString() })),
      { onConflict: "position" },
    );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const listPendingScrapedProducts = createServerFn({ method: "POST" })
  .inputValidator((input: { password: string }) => ({ password: String(input?.password ?? "") }))
  .handler(async ({ data }): Promise<ProdutoScrapImport[]> => {
    checkPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("scraped_products")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const importScrapedProducts = createServerFn({ method: "POST" })
  .inputValidator((input: { password: string; records: ProdutoScrapImportInput[] }) => ({
    password: String(input?.password ?? ""),
    records: Array.isArray(input?.records) ? input.records : [],
  }))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    if (!data.records.length) throw new Error("O arquivo não contém produtos para importar.");
    if (data.records.length > 500) throw new Error("Importe no máximo 500 produtos por arquivo.");

    const rows: Database["public"]["Tables"]["scraped_products"]["Insert"][] = data.records.map(
      (record) => {
        const name = String(record.name ?? "").trim();
        const supplier = String(record.supplier ?? "").trim();
        if (!name || !supplier) throw new Error("Todos os produtos precisam de nome e fornecedor.");
        const price = record.price == null ? null : Number(record.price);
        if (price != null && (!Number.isFinite(price) || price < 0)) {
          throw new Error(`Preço de fornecedor inválido em ${name}.`);
        }
        const imageUrls = Array.isArray(record.image_urls)
          ? record.image_urls
              .map((value) => String(value).trim())
              .filter((value) => /^https?:\/\//i.test(value))
          : [];
        return {
          supplier: supplier.slice(0, 120),
          name: name.slice(0, 200),
          category: String(record.category ?? "").trim() || null,
          supplier_price: price,
          price_variations: Array.isArray(record.price_variations)
            ? record.price_variations
                .map((variation) => ({
                  name: String(variation.name ?? "").trim(),
                  sku: String(variation.sku ?? "").trim(),
                  supplier_price: Number(variation.supplier_price),
                  sale_price: null,
                }))
                .filter(
                  (variation) =>
                    variation.name &&
                    variation.sku &&
                    Number.isFinite(variation.supplier_price) &&
                    variation.supplier_price >= 0,
                )
            : [],
          currency: record.currency === "BRL" ? "BRL" : null,
          sku: String(record.sku ?? "").trim() || null,
          reference: String(record.references ?? "").trim() || null,
          colors: String(record.colors ?? "").trim() || null,
          availability: Array.isArray(record.availability) ? record.availability.map(String) : [],
          measurements: String(record.measurements ?? "").trim() || null,
          description: String(record.description ?? "").trim() || null,
          image_urls: imageUrls,
          source_url: String(record.product_url ?? "").trim() || null,
          scraped_at: record.scraped_at ?? null,
        };
      },
    );

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: inserted, error } = await supabaseAdmin
      .from("scraped_products")
      .upsert(rows, { onConflict: "supplier,name" })
      .select("id");
    if (error) throw new Error(error.message);
    return { received: rows.length, processed: inserted?.length ?? 0 };
  });

export const completeScrapedProductImport = createServerFn({ method: "POST" })
  .inputValidator((input: { password: string; importId: string; productId: string }) => ({
    password: String(input?.password ?? ""),
    importId: String(input?.importId ?? ""),
    productId: String(input?.productId ?? ""),
  }))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    if (!data.importId || !data.productId) throw new Error("Importação inválida.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("scraped_products")
      .update({ status: "imported", product_id: data.productId })
      .eq("id", data.importId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function normalize(input: ProdutoInput) {
  const nome = String(input.nome ?? "").trim();
  if (!nome) throw new Error("Nome é obrigatório.");
  const imagem = String(input.imagem_url ?? "").trim();
  if (!/^https?:\/\//i.test(imagem)) throw new Error("Imagem deve ser uma URL http(s).");
  const precoNovo = Number(input.preco_novo);
  if (!isFinite(precoNovo) || precoNovo < 0) throw new Error("Preço novo inválido.");
  const precoFornecedor = input.preco_fornecedor == null ? null : Number(input.preco_fornecedor);
  if (precoFornecedor != null && (!isFinite(precoFornecedor) || precoFornecedor < 0)) {
    throw new Error("Preço do fornecedor inválido.");
  }
  const variacoesPreco: PriceVariation[] = Array.isArray(input.variacoes_preco)
    ? input.variacoes_preco.map((variation) => {
        const supplierPrice =
          variation.supplier_price == null ? null : Number(variation.supplier_price);
        const salePrice = variation.sale_price == null ? null : Number(variation.sale_price);
        if (
          !variation.name.trim() ||
          !variation.sku.trim() ||
          (supplierPrice != null && (!Number.isFinite(supplierPrice) || supplierPrice < 0)) ||
          (salePrice != null && (!Number.isFinite(salePrice) || salePrice < 0))
        ) {
          throw new Error("Revise nome e preços de cada opção do produto.");
        }
        return {
          name: variation.name.trim(),
          sku: variation.sku.trim(),
          supplier_price: supplierPrice,
          sale_price: salePrice,
        };
      })
    : [];
  const precoAntigo = Math.round(precoNovo * 1.15 * 100) / 100;

  const idRaw = String(input.id ?? "").trim();
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idRaw);
  const id = isUUID ? idRaw : undefined;

  const slug = String(input.slug ?? "").trim() || slugify(nome);
  if (!slug) throw new Error("Slug inválido.");

  const categoria = String(input.categoria ?? "Geral").trim();
  const linkFornecedor = String(input.link_fornecedor ?? "").trim();
  if (linkFornecedor && !/^https?:\/\//i.test(linkFornecedor)) {
    throw new Error("Link do fornecedor deve ser uma URL http(s).");
  }

  return {
    id,
    nome: nome.slice(0, 200),
    slug,
    preco_antigo: precoAntigo,
    preco_novo: precoNovo,
    imagem_url: imagem.slice(0, 500),
    imagens: Array.isArray(input.imagens)
      ? input.imagens
          .map((value) => String(value).trim())
          .filter((value) => /^https?:\/\//i.test(value))
      : [],
    variacoes_preco: variacoesPreco,
    ordem: Number.isFinite(Number(input.ordem)) ? Number(input.ordem) : 0,
    categoria,
    fornecedor:
      String(input.fornecedor ?? "")
        .trim()
        .slice(0, 120) || null,
    referencia:
      String(input.referencia ?? "")
        .trim()
        .slice(0, 120) || null,
    preco_fornecedor: precoFornecedor,
    link_fornecedor: linkFornecedor.slice(0, 1000) || null,
    fonte_preco:
      String(input.fonte_preco ?? linkFornecedor)
        .trim()
        .slice(0, 1000) || null,
    vendas_ultimos_30_dias: Math.max(0, Number(input.vendas_ultimos_30_dias ?? 0) || 0),
    descricao: String(input.descricao ?? "").trim(),
    medidas: String(input.medidas ?? "").trim() || null,
    cores: Array.isArray(input.cores)
      ? input.cores
          .map(String)
          .map((cor) => cor.trim())
          .filter(Boolean)
      : [],
  };
}

export const checkAdminPassword = createServerFn({ method: "POST" })
  .inputValidator((input: { password: string }) => ({ password: String(input?.password ?? "") }))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    return { ok: true as const };
  });

export const upsertProduto = createServerFn({ method: "POST" })
  .inputValidator((input: { password: string; produto: ProdutoInput }) => ({
    password: String(input?.password ?? ""),
    produto: input.produto,
  }))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const row = normalize(data.produto);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let existing: ProdutoAdmin | null = null;
    if (data.produto.deduplicateExisting) {
      if (row.id) {
        const result = await supabaseAdmin
          .from("produtos")
          .select("*")
          .eq("id", row.id)
          .limit(1)
          .maybeSingle();
        if (result.error) throw new Error(result.error.message);
        existing = result.data;
      }
      if (!existing && row.fornecedor && row.referencia) {
        const result = await supabaseAdmin
          .from("produtos")
          .select("*")
          .eq("fornecedor", row.fornecedor)
          .eq("sku", row.referencia)
          .limit(1)
          .maybeSingle();
        if (result.error) throw new Error(result.error.message);
        existing = result.data;
      }
      if (!existing && row.referencia) {
        const result = await supabaseAdmin
          .from("produtos")
          .select("*")
          .eq("sku", row.referencia)
          .limit(1)
          .maybeSingle();
        if (result.error) throw new Error(result.error.message);
        if (
          result.data &&
          (!result.data.fornecedor || !row.fornecedor || result.data.fornecedor === row.fornecedor)
        ) {
          existing = result.data;
        }
      }
      if (!existing) {
        const result = await supabaseAdmin
          .from("produtos")
          .select("*")
          .eq("slug", row.slug)
          .limit(1)
          .maybeSingle();
        if (result.error) throw new Error(result.error.message);
        if (
          result.data &&
          (!result.data.fornecedor || !row.fornecedor || result.data.fornecedor === row.fornecedor)
        ) {
          existing = result.data;
        }
      }
    }

    const existingImages = existing?.imagens ?? [];
    const images = [...new Set([...existingImages, ...row.imagens])];
    const existingVariations = Array.isArray(existing?.variacoes_preco)
      ? (existing.variacoes_preco as unknown as PriceVariation[])
      : [];
    const oldVariationBySku = new Map(
      existingVariations.map((variation) => [variation.sku, variation]),
    );
    const mergedVariations = new Map(oldVariationBySku);
    for (const variation of row.variacoes_preco) {
      const oldVariation = oldVariationBySku.get(variation.sku);
      mergedVariations.set(variation.sku, {
        ...oldVariation,
        ...variation,
        sale_price: variation.sale_price ?? oldVariation?.sale_price ?? null,
      });
    }
    const variations = [...mergedVariations.values()];

    const dbRow: Database["public"]["Tables"]["produtos"]["Insert"] = {
      nome: existing?.nome ?? row.nome,
      slug: existing?.slug ?? row.slug,
      preco_antigo: existing?.preco_antigo ?? row.preco_antigo,
      preco_atual:
        existing?.preco_atual && existing.preco_atual > 0 ? existing.preco_atual : row.preco_novo,
      url_imagem: existing?.url_imagem || row.imagem_url,
      imagens: images,
      variacoes_preco: variations.map(({ name, sku, supplier_price, sale_price }) => ({
        name,
        sku,
        supplier_price,
        sale_price,
      })),
      categoria: existing?.categoria ?? row.categoria,
      ordem: existing?.ordem ?? row.ordem,
      fornecedor: existing?.fornecedor ?? row.fornecedor,
      sku: existing?.sku ?? row.referencia,
      preco_atacado: row.preco_fornecedor ?? existing?.preco_atacado ?? null,
      url_fornecedor: existing?.url_fornecedor ?? row.link_fornecedor,
      fonte_preco: existing?.fonte_preco ?? row.fonte_preco,
      vendas_ultimos_30_dias: existing?.vendas_ultimos_30_dias ?? row.vendas_ultimos_30_dias,
      descricao: existing?.descricao || row.descricao,
      medidas: existing?.medidas || row.medidas,
      cores: existing?.cores?.length ? existing.cores : row.cores,
    };

    if (existing?.id || row.id) {
      dbRow.id = existing?.id ?? row.id!;
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("produtos")
      .upsert(dbRow, { onConflict: "id" })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    if (!inserted) throw new Error("Erro ao salvar produto no banco.");
    return { ok: true as const, id: inserted.id, duplicate: Boolean(existing) };
  });

export const deleteProduto = createServerFn({ method: "POST" })
  .inputValidator((input: { password: string; id: string }) => ({
    password: String(input?.password ?? ""),
    id: String(input?.id ?? ""),
  }))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    if (!data.id) throw new Error("ID obrigatório.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("produtos").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
