import { useLayoutEffect } from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { produtosQueryOptions } from "@/lib/products.functions";
import { StoreCatalog } from "@/components/StoreCatalog";

import { parsePage } from "@/components/CatalogPagination";
import { getCategory } from "@/lib/constants";

export const Route = createFileRoute("/categoria/$slug")({
  validateSearch: (search: Record<string, unknown>) => ({ page: parsePage(search.page) }),
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(produtosQueryOptions());
  },
  head: ({ params }) => {
    const cat = getCategory(params.slug);
    const title = cat ? `${cat.label} | Mobi` : "Categoria | Mobi";
    const desc = cat
      ? `Confira nossa coleção de ${cat.label}. Móveis premium, direto da fábrica com entrega na Baixada Fluminense.`
      : "Categoria de produtos Mobi.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: CategoriaPage,
  errorComponent: CategoriaError,
});

function CategoriaError({ reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-[1300px] flex-col items-center justify-center gap-4 px-[5%] py-20 text-center">
      <p className="text-text-light">Não foi possível carregar esta categoria agora.</p>
      <button
        onClick={() => {
          router.invalidate();
          reset();
        }}
        className="bg-deep-green px-6 py-3 text-xs font-bold uppercase tracking-wider text-sand transition-colors hover:bg-gold hover:text-deep-green"
      >
        Tentar novamente
      </button>
    </div>
  );
}

function CategoriaPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate({ from: "/categoria/$slug" });
  const { data: produtos } = useSuspenseQuery(produtosQueryOptions());
  const { page } = Route.useSearch();
  useLayoutEffect(() => {
    try {
      const saved = sessionStorage.getItem("mobi:catalog-return-position");
      if (!saved) return;
      sessionStorage.removeItem("mobi:catalog-return-position");
      const position = JSON.parse(saved) as {
        category?: unknown;
        page?: unknown;
        scrollY?: unknown;
      };
      if (
        position.category === slug &&
        position.page === page &&
        typeof position.scrollY === "number" &&
        Number.isFinite(position.scrollY)
      ) {
        window.requestAnimationFrame(() => window.scrollTo(0, position.scrollY as number));
      }
    } catch {
      sessionStorage.removeItem("mobi:catalog-return-position");
    }
  }, [page, slug]);
  return (
    <StoreCatalog
      key={slug}
      products={produtos}
      initialCategory={slug}
      requestedPage={page}
      onPageChange={(nextPage) => {
        void navigate({
          search: (previous) => ({ ...previous, page: nextPage }),
          replace: true,
          resetScroll: false,
        });
      }}
    />
  );
}
