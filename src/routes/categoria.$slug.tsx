import { useEffect } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Sofa } from "lucide-react";
import { categoriaProdutosQueryOptions } from "@/lib/products.functions";
import { ProductCard } from "@/components/ProductCard";
import { CategoryNavigation } from "@/components/CategoryNavigation";
import { CatalogPagination, PAGE_SIZE, parsePage } from "@/components/CatalogPagination";
import { CATEGORIES, getCategory, getSubcategories, categoryMatches } from "@/lib/constants";

export const Route = createFileRoute("/categoria/$slug")({
  validateSearch: (search: Record<string, unknown>) => ({ page: parsePage(search.page) }),
  loader: ({ context, params }) => {
    return context.queryClient.ensureQueryData(categoriaProdutosQueryOptions(params.slug));
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
  const { data: produtos } = useSuspenseQuery(categoriaProdutosQueryOptions(slug));
  const cat = getCategory(slug);
  const parent = CATEGORIES.find((c) => c.children.includes(cat?.slug ?? slug));
  const subcategories = getSubcategories(slug);
  const label = cat?.label ?? slug;
  const { page: requestedPage } = Route.useSearch();
  const page = Math.min(requestedPage, Math.max(1, Math.ceil(produtos.length / PAGE_SIZE)));
  useEffect(() => {
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "instant", block: "start" });
  }, [page, slug]);
  const visible = produtos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div id="catalogo" className="mx-auto my-6 max-w-[1300px] px-4 sm:my-9 sm:px-8">
      {/* Breadcrumb */}
      <div className="mb-6 text-[11px] uppercase tracking-wider text-text-light">
        <Link to="/" search={{}} className="text-inherit no-underline hover:text-gold">
          Início
        </Link>
        {" \u00A0/\u00A0 "}
        <span className="font-semibold text-gold">{label}</span>
      </div>

      <h1 className="mb-3 text-center text-3xl text-deep-green md:text-4xl">{label}</h1>
      <p className="mx-auto mb-5 max-w-xl text-center text-sm leading-relaxed text-text-light">
        {cat?.description ?? "Encontre móveis selecionados para a sua casa."}
      </p>

      <div className="mb-4">
        <CategoryNavigation
          categories={CATEGORIES}
          activeSlug={parent?.slug ?? cat?.slug}
          label="Departamentos"
          variant="tabs"
        />
      </div>
      {parent && (
        <Link
          to="/categoria/$slug"
          params={{ slug: parent.slug }}
          search={{ page: 1 }}
          className="mb-4 inline-block text-sm text-deep-green underline"
        >
          ← Ver todos em {parent.label}
        </Link>
      )}

      {subcategories.length > 0 && (
        <nav aria-label="Tipos de produto" className="mb-6 rounded-xl bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-deep-green">Escolha o tipo de produto</p>
          <div className="scrollbar-none -mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
              {subcategories.map((item) => {
                const count = produtos.filter((product) =>
                  categoryMatches(product.categoria, item.slug),
                ).length;
                return (
                  <Link
                    key={item.slug}
                    to="/categoria/$slug"
                    params={{ slug: item.slug }}
                    search={{ page: 1 }}
                    className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-gold/30 px-3.5 text-sm text-deep-green no-underline transition-colors hover:bg-sand"
                  >
                    {item.label} <span className="ml-1 text-text-light">({count})</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}
      <p className="mb-4 text-sm text-text-light" aria-live="polite">
        {produtos.length} produtos nesta seleção
      </p>
      {produtos.length === 0 ? (
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-cacau/10 bg-white px-6 py-14 text-center text-text-light shadow-premium">
          <Sofa className="h-12 w-12 text-gold/50" />
          <h2 className="text-2xl text-deep-green">Estamos preparando esta seleção</h2>
          <p className="text-sm">
            Ainda não há produtos com preço de venda e foto publicados neste grupo.
          </p>
          <Link
            to="/"
            search={{}}
            className="mt-2 bg-deep-green px-6 py-3 text-xs font-bold uppercase tracking-wider text-sand no-underline transition-colors hover:bg-gold hover:text-deep-green"
          >
            Ver todos os destaques
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 items-stretch gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {visible.map((produto) => (
            <ProductCard key={produto.id} produto={produto} />
          ))}
        </div>
      )}
      <CatalogPagination page={page} total={produtos.length} category={slug} />
    </div>
  );
}
