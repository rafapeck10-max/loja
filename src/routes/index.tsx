import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  homepageProductsQueryOptions,
  produtosQueryOptions,
  type HomepageProducts,
} from "@/lib/products.functions";
import type { ProductBadge } from "@/components/ProductCard";
import { HomepageContent } from "../components/HomepageContent";
import { useHomeConfiguration } from "../components/HomeConfigurationContext";
import { getHomepageBanners } from "../lib/homepage-banners.functions";
import { initialBannerData } from "../lib/banner-drafts";
import { parsePage } from "@/components/CatalogPagination";
import { StoreCatalog } from "@/components/StoreCatalog";
import { newHomepageProducts, weeklyHomepageProducts } from "@/lib/home-curation";
import { seoHead } from "@/lib/seo";
import { SITE_TITLE, SITE_DESCRIPTION, SITE_URL } from "@/lib/site-metadata";

export const Route = createFileRoute("/")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { q?: string; ofertas?: boolean; all?: boolean; page?: number } => ({
    page: search.page === undefined ? undefined : parsePage(search.page),
    q: typeof search.q === "string" && search.q ? search.q : undefined,
    ofertas: search.ofertas === true || search.ofertas === "true" ? true : undefined,
    all: search.all === true || search.all === "true" ? true : undefined,
  }),
  loaderDeps: ({ search }) => ({
    catalog: Boolean(search.all || search.ofertas || search.q || search.page),
    q: search.q,
    ofertas: search.ofertas,
    all: search.all,
    page: search.page,
  }),
  loader: ({ context, deps }) => {
    if (deps.catalog) return context.queryClient.ensureQueryData(produtosQueryOptions());
  },
  head: ({ match }) => {
    const { q, ofertas, all, page } = match.search;
    const catalog = Boolean(all || ofertas || q || page);
    const catalogPage = page ?? 1;
    const url = catalog
      ? `${SITE_URL}/?all=true${catalogPage > 1 ? `&page=${catalogPage}` : ""}`
      : `${SITE_URL}/`;
    const head = seoHead(
      catalog
        ? `Catálogo de móveis${catalogPage > 1 ? ` – Página ${catalogPage}` : ""} | Mobi`
        : SITE_TITLE,
      SITE_DESCRIPTION,
      url,
    );
    return {
      ...head,
      meta: [
        ...head.meta,
        ...(q || ofertas ? [{ name: "robots", content: "noindex,follow" }] : []),
      ],
    };
  },
  component: Index,
  errorComponent: IndexError,
  notFoundComponent: () => <IndexError error={new Error("Não encontrado")} reset={() => {}} />,
});

function IndexError({ reset }: { error: unknown; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-[1300px] flex-col items-center justify-center gap-4 px-[5%] py-20 text-center">
      <p className="text-text-light">Não foi possível carregar a vitrine agora.</p>
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

function Index() {
  const { q, ofertas, all, page } = Route.useSearch();
  const catalog = Boolean(all || ofertas || q || page);
  return catalog ? <CatalogIndex query={q} offers={ofertas} page={page} /> : <HomepageIndex />;
}

function CatalogIndex({
  query,
  offers,
  page,
}: {
  query?: string;
  offers?: boolean;
  page?: number;
}) {
  const navigate = useNavigate({ from: "/" });
  const [rotationDate, setRotationDate] = useState(() => new Date("2000-01-01T12:00:00.000Z"));
  const result = useQuery(produtosQueryOptions());
  const produtos = result.data;
  useEffect(() => {
    setRotationDate(new Date());
  }, []);

  if (!produtos && result.isError)
    return <IndexError error={result.error} reset={() => void result.refetch()} />;
  if (!produtos) return <CatalogLoadingState />;

  const weeklyProducts = weeklyHomepageProducts(produtos);
  const newProducts = newHomepageProducts(produtos, rotationDate);
  const badges: Record<string, ProductBadge> = {};
  newProducts.forEach((product) => {
    badges[product.id] = "new";
  });
  weeklyProducts.forEach((product) => {
    badges[product.id] = "week";
  });

  return (
    <StoreCatalog
      key={(query ?? "") + String(offers)}
      products={produtos}
      query={query}
      offers={offers}
      requestedPage={page}
      badges={badges}
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

function HomepageIndex() {
  const configuration = useHomeConfiguration();
  const result = useQuery(homepageProductsQueryOptions());
  const banners = useQuery({ queryKey: ["homepage-banners"], queryFn: getHomepageBanners });
  const data: HomepageProducts | undefined = result.data;
  const products = data?.products;
  const failed = result.isError;
  return (
    <HomepageContent
      products={products ?? []}
      sectionIds={data?.sectionIds ?? { weekly: [], discovery: [], new: [], room: [] }}
      configuration={configuration}
      banners={initialBannerData(banners.data).banners}
    >
      {!products && failed ? (
        <IndexError error={result.error} reset={() => void result.refetch()} />
      ) : !products ? (
        <HomepageLoadingState />
      ) : null}
    </HomepageContent>
  );
}

function HomepageLoadingState() {
  return (
    <section className="mobi-shelf mobi-wrap" aria-busy="true" aria-live="polite">
      <div className="mobi-section-title">
        <div>
          <h2>Carregando a vitrine</h2>
          <p>Estamos buscando os móveis para você.</p>
        </div>
      </div>
      <div className="mobi-grid" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="mobi-product animate-pulse overflow-hidden rounded-2xl border border-cacau/10 bg-white"
          >
            <div className="aspect-[4/3] bg-[#eee8de]" />
            <div className="space-y-3 p-4">
              <div className="h-3 w-1/2 rounded bg-[#eee8de]" />
              <div className="h-4 w-4/5 rounded bg-[#eee8de]" />
              <div className="h-3 w-2/3 rounded bg-[#eee8de]" />
            </div>
          </div>
        ))}
      </div>
      <p className="sr-only" role="status">
        Carregando produtos.
      </p>
    </section>
  );
}

function CatalogLoadingState() {
  return (
    <section id="catalogo" className="mobi-wrap py-12" role="status" aria-live="polite">
      Carregando produtos.
    </section>
  );
}
