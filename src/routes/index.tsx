import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Sofa } from "lucide-react";
import { produtosQueryOptions } from "@/lib/products.functions";
import { ProductCard } from "@/components/ProductCard";
import { HeroCarousel } from "@/components/HeroCarousel";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === "string" && search.q ? search.q : undefined,
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(produtosQueryOptions());
  },
  head: () => ({
    meta: [
      { title: "Mobili – Móveis direto da fábrica" },
      {
        name: "description",
        content:
          "Poltronas, Sofás e muito mais. Design sofisticado, qualidade artesanal e entrega na Baixada.",
      },
      { property: "og:title", content: "Mobili – Móveis direto da fábrica" },
      {
        property: "og:description",
        content:
          "Poltronas, Sofás e muito mais. Design sofisticado, qualidade artesanal e entrega na Baixada.",
      },
      {
        property: "og:image",
        content: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800",
      },
      {
        name: "twitter:image",
        content: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800",
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
  const { q } = Route.useSearch();
  const { data: produtos } = useSuspenseQuery(produtosQueryOptions());

  const filtered = q
    ? produtos.filter((p) => p.nome.toLowerCase().includes(q.toLowerCase().trim()))
    : produtos;

  return (
    <>
      <HeroCarousel />

      {/* Vitrine */}
      <div className="mx-auto my-14 max-w-[1300px] px-[5%]">
        <h2 className="section-title-line mb-12 text-center text-3xl uppercase tracking-[3px] text-deep-green md:text-4xl">
          Destaques da Temporada
        </h2>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center text-text-light">
            <Sofa className="h-12 w-12 text-gold/50" />
            <p className="text-sm">Nenhum móvel encontrado para a busca "{q}".</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 items-stretch gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 lg:gap-9">
            {filtered.map((produto) => (
              <ProductCard key={produto.id} produto={produto} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
