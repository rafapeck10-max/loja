import { createServerFn } from "@tanstack/react-start";
import { createHash, timingSafeEqual } from "node:crypto";
import type { Database } from "@/integrations/supabase/types";

export interface ProdutoInput {
  id: string;
  nome: string;
  slug?: string;
  preco_novo: number;
  imagem_url: string;
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

    const dbRow: Database["public"]["Tables"]["produtos"]["Insert"] = {
      nome: row.nome,
      slug: row.slug,
      preco_antigo: row.preco_antigo,
      preco_atual: row.preco_novo,
      url_imagem: row.imagem_url,
      categoria: row.categoria,
      ordem: row.ordem,
      fornecedor: row.fornecedor,
      sku: row.referencia,
      preco_atacado: row.preco_fornecedor,
      url_fornecedor: row.link_fornecedor,
      fonte_preco: row.fonte_preco,
      vendas_ultimos_30_dias: row.vendas_ultimos_30_dias,
      descricao: row.descricao,
      medidas: row.medidas,
      cores: row.cores,
    };

    if (row.id) {
      dbRow.id = row.id;
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("produtos")
      .upsert(dbRow, { onConflict: "id" })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    if (!inserted) throw new Error("Erro ao salvar produto no banco.");
    return { ok: true as const, id: inserted.id };
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
