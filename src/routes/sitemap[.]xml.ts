import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { buildSitemap, collectSitemapProducts } from "@/lib/sitemap";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const supabase = createClient<Database>(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_PUBLISHABLE_KEY!,
            { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
          );
          // Apply the same eligibility rules used by the public storefront.
          const products = await collectSitemapProducts(async (offset, end) => {
            const { data, error } = await supabase
              .from("produtos")
              .select("id,slug,categoria,url_imagem")
              .gt("preco_atacado", 0)
              .gt("preco_atual", 0)
              .neq("url_imagem", "")
              .order("id", { ascending: true })
              .range(offset, end);
            if (error) throw new Error(error.message);
            return data ?? [];
          });
          const visibleProducts = products.filter((product) => product.url_imagem?.trim());
          return new Response(buildSitemap(visibleProducts), {
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "public, max-age=3600",
            },
          });
        } catch (error) {
          console.error(
            "Sitemap could not be generated",
            error instanceof Error ? error.message : "Unknown error",
          );
          // A retryable error avoids presenting an incomplete sitemap as a successful update.
          return new Response("Sitemap temporariamente indisponível.", {
            status: 503,
            headers: { "Cache-Control": "no-store", "Retry-After": "300" },
          });
        }
      },
    },
  },
});
