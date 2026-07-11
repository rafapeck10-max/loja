import { createServerFn } from "@tanstack/react-start";
import { createHash, timingSafeEqual } from "node:crypto";
import type { Database } from "@/integrations/supabase/types";

export interface ProdutoInput {
  id: string;
  nome: string;
  slug?: string;
  preco_antigo: number;
  preco_novo: number;
  imagem_url: string;
  categoria?: string;
  ordem?: number;
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
  const precoAntigo = Number(input.preco_antigo);
  const precoNovo = Number(input.preco_novo);
  if (!isFinite(precoAntigo) || precoAntigo < 0) throw new Error("Preço antigo inválido.");
  if (!isFinite(precoNovo) || precoNovo < 0) throw new Error("Preço novo inválido.");

  const idRaw = String(input.id ?? "").trim();
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idRaw);
  const id = isUUID ? idRaw : undefined;

  const slug = String(input.slug ?? "").trim() || slugify(nome);
  if (!slug) throw new Error("Slug inválido.");

  const categoria = String(input.categoria ?? "Geral").trim();

  return {
    id,
    nome: nome.slice(0, 200),
    slug,
    preco_antigo: precoAntigo,
    preco_novo: precoNovo,
    imagem_url: imagem.slice(0, 500),
    ordem: Number.isFinite(Number(input.ordem)) ? Number(input.ordem) : 0,
    categoria,
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
