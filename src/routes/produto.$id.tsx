import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ProductDetailView } from "@/components/ProductDetailView";
import { produtoQueryOptions } from "@/lib/products.functions";
import { parsePage } from "@/components/CatalogPagination";
import { jsonLd, productSeo, seoHead } from "@/lib/seo";
import { parseCatalogUrlString, serializeCatalogUrlState } from "@/lib/catalog-url-state";
export const Route = createFileRoute("/produto/$id")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { returnPage?: number; returnCategory?: string; returnSearch?: string } => ({
    returnPage: search.returnPage === undefined ? undefined : parsePage(search.returnPage),
    returnCategory:
      typeof search.returnCategory === "string" && /^[a-z0-9-]+$/i.test(search.returnCategory)
        ? search.returnCategory
        : undefined,
    returnSearch:
      typeof search.returnSearch === "string" && search.returnSearch.length <= 700
        ? serializeCatalogUrlState(
            parseCatalogUrlString(search.returnSearch),
            parseCatalogUrlString(search.returnSearch).page,
          ) || undefined
        : undefined,
  }),
  loader: async ({ context, params }) => {
    const produto = await context.queryClient.ensureQueryData(produtoQueryOptions(params.id));
    if (!produto) throw notFound();
    return productSeo(produto);
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Produto não encontrado | Mobi" }, { name: "robots", content: "noindex" }],
      };
    }
    return {
      ...seoHead(loaderData.title, loaderData.description, loaderData.url, loaderData.image),
      scripts: [jsonLd(loaderData.structured), jsonLd(loaderData.breadcrumb)],
    };
  },
  component: ProductPage,
  errorComponent: ProductError,
  notFoundComponent: ProductNotFound,
});

function ProductNotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-[1300px] flex-col items-center justify-center gap-4 px-[5%] py-20 text-center">
      <h1 className="text-3xl text-deep-green">Produto não encontrado</h1>
      <p className="text-sm text-text-light">Este móvel não está mais disponível na coleção.</p>
      <Link
        to="/"
        search={{}}
        className="rounded-full bg-deep-green px-6 py-3 text-xs font-bold uppercase tracking-wider text-sand no-underline transition-colors hover:bg-gold hover:text-deep-green"
      >
        Ver coleção completa
      </Link>
    </div>
  );
}

function ProductError({ reset }: { error: unknown; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-[1300px] flex-col items-center justify-center gap-4 px-[5%] py-20 text-center">
      <p className="text-text-light">Não foi possível carregar este produto agora.</p>
      <button
        onClick={() => {
          router.invalidate();
          reset();
        }}
        className="rounded-full bg-deep-green px-6 py-3 text-xs font-bold uppercase tracking-wider text-sand transition-colors hover:bg-gold hover:text-deep-green"
      >
        Tentar novamente
      </button>
    </div>
  );
}

function ProductPage() {
  const { id } = Route.useParams();
  const { returnPage, returnCategory, returnSearch } = Route.useSearch();
  const { data: product } = useSuspenseQuery(produtoQueryOptions(id));

  if (!product) return null;

  return (
    <ProductDetailView
      key={product.id}
      product={product}
      returnPage={returnPage}
      returnCategory={returnCategory}
      returnSearch={returnSearch}
    />
  );
}
