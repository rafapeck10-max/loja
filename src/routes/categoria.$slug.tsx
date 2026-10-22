import { useLayoutEffect } from "react";
import { createFileRoute, Link, notFound, useNavigate, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { produtosQueryOptions } from "@/lib/products.functions";
import { StoreCatalog } from "@/components/StoreCatalog";

import { parsePage } from "@/components/CatalogPagination";
import { categoryMatches, getCategory } from "@/lib/constants";
import { breadcrumbs, categoryDescription, categoryUrl, jsonLd, seoHead } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-metadata";
import { CATALOG_BATCH_SIZE } from "@/lib/catalog-page-state";

export const Route = createFileRoute("/categoria/$slug")({
  validateSearch: (search: Record<string, unknown>) => ({ page: parsePage(search.page) }),
  loader: ({ context, params }) => {
    if (!getCategory(params.slug)) throw notFound();
    return context.queryClient.ensureQueryData(produtosQueryOptions());
  },
  head: ({ params, match, loaderData }) => {
    const cat = getCategory(params.slug);
    const page = match.search.page;
    const title = `${cat?.label ?? "Categoria"} em Nova Iguaçu${page > 1 ? ` – Página ${page}` : ""} | Mobi`;
    const url = categoryUrl(params.slug, page);
    const head = seoHead(title, categoryDescription(params.slug), url);
    const count =
      loaderData?.filter((product) => categoryMatches(product.categoria, params.slug)).length ?? 0;
    const outOfRange = page > Math.max(1, Math.ceil(count / CATALOG_BATCH_SIZE));
    return {
      ...head,
      meta: [
        ...head.meta,
        ...(!cat || count === 0 || outOfRange
          ? [{ name: "robots", content: "noindex,follow" }]
          : []),
      ],
      scripts: [
        jsonLd(
          breadcrumbs([
            { name: "Início", url: `${SITE_URL}/` },
            { name: cat?.label ?? "Categoria", url },
          ]),
        ),
      ],
    };
  },
  component: CategoriaPage,
  errorComponent: CategoriaError,
});

function CategoriaError({ reset }: { error: unknown; reset: () => void }) {
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
    <>
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
      <section className="mobi-wrap py-8" aria-label={`Sobre ${getCategory(slug)?.label}`}>
        <h2 className="text-xl text-deep-green">Como escolher: {getCategory(slug)?.label}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-light">
          {categoryDescription(slug)}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-light">
          Veja os detalhes na página de cada produto. Para Nova Iguaçu e Baixada Fluminense,
          consulte condições e disponibilidade de entrega com a Mobi pelo WhatsApp.
        </p>
        <Link
          to="/moveis-nova-iguacu"
          className="mt-3 inline-flex min-h-11 items-center text-sm text-deep-green underline underline-offset-4"
        >
          Atendimento da Mobi para Nova Iguaçu
        </Link>
      </section>
    </>
  );
}
