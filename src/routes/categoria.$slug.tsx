import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Sofa } from "lucide-react";
import { categoriaProdutosQueryOptions } from "@/lib/products.functions";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES } from "@/lib/constants";

export const Route = createFileRoute("/categoria/$slug")({
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(categoriaProdutosQueryOptions(params.slug));
  },
  head: ({ params }) => {
    const cat = CATEGORIES.find((c) => c.slug === params.slug);
    const title = cat ? `${cat.label} | Mobili` : "Categoria | Mobili";
    const desc = cat
      ? `Confira nossa coleção de ${cat.label}. Móveis premium, direto da fábrica com entrega na Baixada Fluminense.`
      : "Categoria de produtos Mobili.";
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
  const cat = CATEGORIES.find((c) => c.slug === slug);
  const label = cat?.label ?? slug;

  return (
    <div className="mx-auto my-14 max-w-[1300px] px-[5%]">
      {/* Breadcrumb */}
      <div className="mb-6 text-[11px] uppercase tracking-wider text-text-light">
        <Link to="/" search={{}} className="text-inherit no-underline hover:text-gold">
          Início
        </Link>
        {" \u00A0/\u00A0 "}
        <span className="font-semibold text-gold">{label}</span>
      </div>

      <h1 className="section-title-line mb-12 text-center text-3xl uppercase tracking-[3px] text-deep-green md:text-4xl">
        {label}
      </h1>

      {produtos.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center text-text-light">
          <Sofa className="h-12 w-12 text-gold/50" />
          <p className="text-sm">Nenhum móvel encontrado nesta categoria.</p>
          <Link
            to="/"
            search={{}}
            className="mt-2 bg-deep-green px-6 py-3 text-xs font-bold uppercase tracking-wider text-sand no-underline transition-colors hover:bg-gold hover:text-deep-green"
          >
            Ver todos os destaques
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 items-stretch gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 lg:gap-9">
          {produtos.map((produto) => (
            <ProductCard key={produto.id} produto={produto} />
          ))}
        </div>
      )}
    </div>
  );
}
