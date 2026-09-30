import { useEffect, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { produtosQueryOptions } from "@/lib/products.functions";
import type { ProductBadge } from "@/components/ProductCard";
import { HeroCarousel, MOBI_HERO } from "@/components/HeroCarousel";
import { CategoryNavigation } from "@/components/CategoryNavigation";
import { parsePage } from "@/components/CatalogPagination";
import { CATEGORIES } from "@/lib/constants";
import { HomeProductSection } from "@/components/HomeProductSection";
import { StoreCatalog } from "@/components/StoreCatalog";
import {
  discoverHomepageProducts,
  newHomepageProducts,
  roomHomepageProducts,
  weeklyHomepageProducts,
} from "@/lib/home-curation";

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
  const [rotationDate, setRotationDate] = useState(() => new Date("2000-01-01T12:00:00.000Z"));
  const { q, ofertas, all, page } = Route.useSearch();
  const { data: produtos } = useSuspenseQuery(produtosQueryOptions());
  const catalog = Boolean(all || ofertas || q || page);
  const weeklyProducts = weeklyHomepageProducts(produtos);
  const newProducts = newHomepageProducts(produtos, rotationDate);
  const roomProducts = roomHomepageProducts(produtos);
  const excluded = new Set(
    [...weeklyProducts, ...newProducts, ...roomProducts].map((product) => product.id),
  );
  const discoveryProducts = discoverHomepageProducts(produtos, excluded, rotationDate);
  const badges: Record<string, ProductBadge> = {};
  newProducts.forEach((product) => {
    badges[product.id] = "new";
  });
  weeklyProducts.forEach((product) => {
    badges[product.id] = "week";
  });
  useEffect(() => {
    if (!catalog) setRotationDate(new Date());
  }, [catalog]);
  useEffect(() => {
    if (catalog)
      document.getElementById("catalogo")?.scrollIntoView({ behavior: "instant", block: "start" });
  }, [catalog, q, ofertas]);
  if (catalog)
    return (
      <StoreCatalog
        key={(q ?? "") + String(ofertas)}
        products={produtos}
        query={q}
        offers={ofertas}
        requestedPage={page}
        badges={badges}
      />
    );
  const mobileCategories = ["sala-de-estar", "cozinha", "dormitorios"].flatMap((slug) =>
    CATEGORIES.filter((category) => category.slug === slug),
  );
  return (
    <>
      <HeroCarousel />
      <div className="mobi-trust">
        <span>Pague somente na entrega</span>
        <span>PIX com desconto</span>
        <span>Cartão em até 12x</span>
      </div>
      <div className="mobi-category-wrap mobi-wrap">
        <CategoryNavigation categories={CATEGORIES} mobileCategories={mobileCategories} />
      </div>
      <HomeProductSection
        title="Descubra algo novo"
        subtitle="Uma seleção diferente a cada visita. Encontre o que combina com você."
        products={discoveryProducts}
        badges={badges}
      />
      <HomeProductSection
        title="Escolhas da semana"
        subtitle="Uma seleção especial da Mobi para sua casa."
        products={weeklyProducts}
        badges={badges}
      />
      <section className="mobi-inspiration mobi-wrap">
        <img src={MOBI_HERO} alt="Inspiração de sala de estar" loading="lazy" />
        <div>
          <span className="mobi-eyebrow">CONFORTO EM CADA DETALHE</span>
          <h2>
            Para sua sala,
            <br />
            mais personalidade.
          </h2>
          <p>Um lugar para descansar, receber e viver bons momentos.</p>
          <Link
            to="/categoria/$slug"
            params={{ slug: "sala-de-estar" }}
            search={{ page: 1 }}
            className="mobi-primary"
          >
            Explorar móveis para sala
          </Link>
        </div>
      </section>
      <HomeProductSection
        title="Novidades"
        subtitle="Novas possibilidades para renovar seus ambientes."
        products={newProducts}
        badges={badges}
      />
      <HomeProductSection
        title="Para sua sala"
        subtitle="Conforto e detalhes que fazem a diferença."
        products={roomProducts}
        badges={badges}
        category="sala-de-estar"
      />
      <section className="mobi-catalog-invite mobi-wrap">
        <h2>Seu próximo móvel está aqui.</h2>
        <p>Explore por categoria, encontre seu preço e escolha com calma.</p>
        <Link to="/" search={{ all: true, page: 1 }} hash="catalogo" className="mobi-primary">
          Explorar todo o catálogo
        </Link>
      </section>
    </>
  );
}
