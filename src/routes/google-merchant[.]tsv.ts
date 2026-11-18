import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { buildMerchantFeedTsv, type MerchantFeedProduct } from "@/lib/merchant-feed";

const FEED_BATCH_SIZE = 500;

export const Route = createFileRoute("/google-merchant.tsv")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const supabase = createClient<Database>(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_PUBLISHABLE_KEY!,
            { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
          );
          const products: MerchantFeedProduct[] = [];
          for (let offset = 0; ; offset += FEED_BATCH_SIZE) {
            const { data, error } = await supabase
              .from("produtos")
              .select(
                "id, nome, slug, categoria, descricao, medidas, cores, url_imagem, imagens, sku, preco_atacado, preco_atual, variacoes_preco, status_estoque",
              )
              .gt("preco_atacado", 0)
              .gt("preco_atual", 0)
              .neq("url_imagem", "")
              .in("status_estoque", ["disponivel", "esgotado"])
              .order("id", { ascending: true })
              .range(offset, offset + FEED_BATCH_SIZE - 1);
            if (error) throw new Error(error.message);
            const batch = (data ?? []) as unknown as MerchantFeedProduct[];
            products.push(...batch);
            if (batch.length < FEED_BATCH_SIZE) break;
          }
          return new Response(buildMerchantFeedTsv(products), {
            headers: {
              "Content-Type": "text/tab-separated-values; charset=utf-8",
              "Cache-Control": "public, max-age=900",
            },
          });
        } catch (error) {
          console.error(
            "Merchant feed could not be generated",
            error instanceof Error ? error.message : "Unknown error",
          );
          return new Response("Feed do Google Merchant temporariamente indisponível.", {
            status: 503,
            headers: { "Cache-Control": "no-store", "Retry-After": "300" },
          });
        }
      },
    },
  },
});
