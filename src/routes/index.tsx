import { useEffect } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Sofa, Truck } from "lucide-react";
import { produtosQueryOptions } from "@/lib/products.functions";
import { ProductCard } from "@/components/ProductCard";
import { HeroCarousel } from "@/components/HeroCarousel";
import { CategoryNavigation } from "@/components/CategoryNavigation";
import { CatalogPagination, PAGE_SIZE, parsePage } from "@/components/CatalogPagination";
import { CATEGORIES, categoryMatches } from "@/lib/constants";
import { featuredProducts } from "@/lib/featured-products";

export const Route = createFileRoute("/")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { q?: string; ofertas?: boolean; all?: boolean; page?: number } => ({
    page: search.page === undefined ? undefined : parsePage(search.page),
    q: typeof search.q === "string" && search.q ? search.q : undefined,
    ofertas: search.ofertas === true || search.ofertas === "true" ? true : undefined,
    all: search.all === true || search.all === "true" ? true : undefined,
  }),
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(produtosQueryOptions());
  },
  head: () => ({
    meta: [
      { title: "Mobi – Móveis direto da fábrica" },
      {
        name: "description",
        content:
          "Poltronas, Sofás e muito mais. Design sofisticado, qualidade artesanal e entrega na Baixada.",
      },
      { property: "og:title", content: "Mobi – Móveis direto da fábrica" },
      {
        property: "og:description",
        content:
          "Poltronas, Sofás e muito mais. Design sofisticado, qualidade artesanal e entrega na Baixada.",
      },
      {
        property: "og:image",
        content: "https://www.mobimb.com.br/mobi-social-preview.png",
      },
      {
        name: "twitter:image",
        content: "https://www.mobimb.com.br/mobi-social-preview.png",
      },
    ],
  }),
  component: Index,
  errorComponent: IndexError,
  notFoundComponent: () => <IndexError error={new Error("Não encontrado")} reset={() => {}} />,
});

function IndexError({ reset }: { error: Error; reset: () => void }) {
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
  const { q, ofertas, all, page: requestedPage } = Route.useSearch();
  const { data: produtos } = useSuspenseQuery(produtosQueryOptions());
  const catalog = Boolean(all || ofertas || q || requestedPage);
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const filtered = produtos.filter(
    (p) =>
      (!q || normalize(p.nome).includes(normalize(q.trim()))) &&
      (!ofertas || p.preco_antigo > p.preco_novo),
  );
  const page = Math.min(requestedPage ?? 1, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const visibleProducts = catalog
    ? filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : featuredProducts(produtos);
  useEffect(() => {
    if (catalog)
      document.getElementById("catalogo")?.scrollIntoView({ behavior: "instant", block: "start" });
  }, [catalog, page, q, ofertas]);
  const categories = CATEGORIES.filter((category) =>
    produtos.some((p) => categoryMatches(p.categoria, category.slug)),
  );
  return (
    <>
      {!catalog && (
        <>
          <HeroCarousel />
          <section
            aria-label="Compre por ambiente"
            className="mx-auto max-w-[1300px] px-4 pt-3 sm:px-8 sm:pt-5"
          >
            <div className="flex items-center justify-center gap-3 rounded-lg bg-white px-3 py-3 text-sm font-semibold text-deep-green">
              <Truck className="h-6 w-6 shrink-0" strokeWidth={1.8} /> Pague somente na entrega
            </div>
            <div className="mt-3">
              <CategoryNavigation categories={categories} />
            </div>
          </section>
        </>
      )}
      <section id="catalogo" className="mx-auto my-6 max-w-[1300px] px-4 sm:my-9 sm:px-8">
        {catalog && (
          <Link
            to="/"
            search={{}}
            className="mb-4 inline-flex text-xs text-text-light underline underline-offset-4"
          >
            Início
          </Link>
        )}
        <div className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
          {catalog ? (
            <h1 className="text-2xl leading-tight text-deep-green sm:text-3xl">
              {q ? `Resultados para “${q}”` : ofertas ? "Ofertas da Mobi" : "Todos os produtos"}
            </h1>
          ) : (
            <h2 className="text-xl leading-tight text-deep-green sm:text-3xl">Destaques da Mobi</h2>
          )}
          {!catalog && (
            <>
              <span aria-hidden="true" className="hidden h-px flex-1 bg-gold/70 sm:block" />
              <Link
                to="/"
                search={{ all: true, page: 1 }}
                hash="catalogo"
                className="shrink-0 text-xs font-semibold text-deep-green no-underline sm:text-sm"
              >
                Ver todos →
              </Link>
            </>
          )}
        </div>
        {catalog && (
          <p className="mb-4 text-xs text-text-light" aria-live="polite">
            {filtered.length} produtos encontrados
          </p>
        )}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-cacau/10 bg-white px-5 py-8 text-center">
            <Sofa className="mx-auto mb-3 h-9 w-9 text-gold" />
            <p className="mb-4 text-sm">
              {q
                ? "Não encontramos produtos com esse nome. Tente outra palavra."
                : "Não há ofertas disponíveis no momento."}
            </p>
            <Link
              to="/"
              search={{ all: true, page: 1 }}
              className="inline-flex min-h-11 items-center rounded-full bg-deep-green px-5 text-sm text-white"
            >
              Explorar todos os produtos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 items-stretch gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {visibleProducts.map((produto) => (
              <ProductCard key={produto.id} produto={produto} />
            ))}
          </div>
        )}
        {catalog && (
          <CatalogPagination
            page={page}
            total={filtered.length}
            search={{ all: true, q, ofertas }}
          />
        )}
        {!catalog && filtered.length > visibleProducts.length && (
          <div className="mt-5 text-center">
            <Link
              to="/"
              search={{ all: true, page: 1 }}
              hash="catalogo"
              className="inline-flex min-h-11 items-center rounded-full border border-gold px-6 text-sm font-semibold text-deep-green"
            >
              Ver todos os produtos →
            </Link>
          </div>
        )}
      </section>
      {!catalog && (
        <section className="mx-auto mb-6 max-w-[1300px] px-4 sm:mb-9 sm:px-8">
          <div className="relative overflow-hidden rounded-xl bg-deep-green px-5 py-7 text-white sm:p-9">
            <img
              src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1000&q=80"
              alt="Inspiração para sua sala"
              className="absolute inset-0 h-full w-full object-cover opacity-25"
              loading="lazy"
            />
            <div className="relative max-w-xs">
              <h2 className="text-2xl leading-tight">
                Seu lar,
                <br />
                com mais estilo
              </h2>
              <p className="mb-4 mt-2 text-sm">Encontre móveis que combinam com você.</p>
              <Link
                to="/"
                search={{ all: true, page: 1 }}
                hash="catalogo"
                className="inline-flex min-h-11 items-center rounded-full bg-gold px-5 text-xs font-bold text-deep-green"
              >
                Explorar coleção →
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
