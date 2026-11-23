import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProductDetailView } from "@/components/ProductDetailView";
import { produtoQueryOptions, relatedProdutosQueryOptions } from "@/lib/products.functions";
import { parsePage } from "@/components/CatalogPagination";
import { jsonLd, productSeo, seoHead } from "@/lib/seo";
import { normalizeCatalogReturnSearch } from "@/lib/catalog-url-state";

export const Route = createFileRoute("/produto/$id")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { returnPage?: number; returnCategory?: string; returnSearch?: string } => ({
    returnPage: search.returnPage === undefined ? undefined : parsePage(search.returnPage),
    returnCategory:
      typeof search.returnCategory === "string" && /^[a-z0-9-]+$/i.test(search.returnCategory)
        ? search.returnCategory
        : undefined,
    returnSearch: normalizeCatalogReturnSearch(search.returnSearch),
  }),
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(produtoQueryOptions(params.id));
    if (!product) throw notFound();
    const relatedProducts = await context.queryClient
      .ensureQueryData(
        relatedProdutosQueryOptions(product.id, product.categoria, product.preco_novo),
      )
      .catch(() => []);
    return { seo: productSeo(product), product, relatedProducts };
  },
  head: ({ loaderData }) => {
    if (!loaderData?.seo) {
      return {
        meta: [{ title: "Produto não encontrado | Mobi" }, { name: "robots", content: "noindex" }],
      };
    }
    const { seo } = loaderData;
    return {
      ...seoHead(seo.title, seo.description, seo.url, seo.image, {
        imageAlt: seo.structured.name,
        type: "product",
      }),
      scripts: [jsonLd(seo.structured), jsonLd(seo.breadcrumb)],
    };
  },
  pendingComponent: ProductLoadingState,
  component: ProductPage,
  errorComponent: ProductError,
  notFoundComponent: ProductNotFound,
});

function ProductLoadingState() {
  return (
    <section className="mobi-wrap py-8" role="status" aria-busy="true" aria-live="polite">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(390px,0.92fr)]">
        <div className="aspect-[4/3] animate-pulse rounded-2xl bg-[#eee8de]" />
        <div className="space-y-4">
          <div className="h-4 w-28 animate-pulse rounded bg-[#eee8de]" />
          <div className="h-8 w-4/5 animate-pulse rounded bg-[#eee8de]" />
          <div className="h-32 animate-pulse rounded-xl bg-[#eee8de]" />
        </div>
      </div>
      <p className="sr-only">Carregando produto.</p>
    </section>
  );
}

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
  const loaderData = Route.useLoaderData();
  const { data: product = loaderData?.product } = useQuery({
    ...produtoQueryOptions(id),
    ...(loaderData?.product ? { initialData: loaderData.product } : {}),
    staleTime: 30_000,
  });
  const relatedQuery = useQuery({
    ...relatedProdutosQueryOptions(
      product?.id ?? "pending",
      product?.categoria ?? "Sofás",
      product?.preco_novo && product.preco_novo > 0 ? product.preco_novo : 1,
    ),
    enabled: Boolean(product?.id && product?.categoria && product?.preco_novo > 0),
    ...(loaderData?.relatedProducts ? { initialData: loaderData.relatedProducts } : {}),
    staleTime: 60_000,
  });

  if (!product) return null;

  return (
    <ProductDetailView
      key={product.id}
      product={product}
      relatedProducts={relatedQuery.data ?? loaderData?.relatedProducts}
      returnPage={returnPage}
      returnCategory={returnCategory}
      returnSearch={returnSearch}
    />
  );
}
