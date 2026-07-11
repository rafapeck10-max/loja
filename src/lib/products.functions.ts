import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export interface Produto {
  id: string;
  nome: string;
  slug: string;
  preco_antigo: number;
  preco_novo: number;
  imagem_url: string;
  categoria: string;
  ordem?: number;
}

export const getProdutos = createServerFn({ method: "GET" }).handler(
  async (): Promise<Produto[]> => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await supabase
      .from("produtos")
      .select("id, nome, slug, preco_antigo, preco_atual, categoria, url_imagem, ordem")
      .order("ordem", { ascending: true });
    if (error) throw new Error(error.message);

    return (data ?? []).map((row) => ({
      id: row.id,
      nome: row.nome,
      slug: row.slug,
      preco_antigo: Number(row.preco_antigo),
      preco_novo: Number(row.preco_atual),
      imagem_url: row.url_imagem,
      categoria: row.categoria,
      ordem: row.ordem ?? 0,
    }));
  },
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
    const query = supabase
      .from("produtos")
      .select("id, nome, slug, preco_antigo, preco_atual, categoria, url_imagem, ordem");

    if (isUUID) {
      query.eq("id", data.id);
    } else {
      query.eq("slug", data.id);
    }

    const { data: row, error } = await query.maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;

    return {
      id: row.id,
      nome: row.nome,
      slug: row.slug,
      preco_antigo: Number(row.preco_antigo),
      preco_novo: Number(row.preco_atual),
      imagem_url: row.url_imagem,
      categoria: row.categoria,
      ordem: row.ordem ?? 0,
    };
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
