import { Link } from "@tanstack/react-router";
import { HeroCarouselView } from "./HeroCarouselView";
import { CategoryNavigation } from "./CategoryNavigation";
import { HomepageSectionOrder } from "./HomepageSectionOrder";
import { HomeProductSection } from "./HomeProductSection";
import { DEFAULT_HOMEPAGE_BANNERS } from "../lib/homepage-banners";
import { CATEGORIES, MAX_INSTALLMENTS } from "../lib/constants";
import {
  defaultHomeSections,
  type HomeConfiguration,
  type HomeBanner,
} from "../lib/home-configuration";
import type { Produto } from "../lib/products.functions";
import type { ProductBadge } from "./ProductCard";
import { useHomeConfiguration } from "./HomeConfigurationContext";

/** Same renderer for storefront, full admin preview and locally applied revision. */
export function HomepageContent({
  products,
  sectionIds,
  configuration,
  banners,
  children,
}: {
  products: Produto[];
  sectionIds: HomeConfiguration["sectionIds"];
  configuration?: HomeConfiguration | null;
  banners?: HomeBanner[];
  children?: React.ReactNode;
}) {
  const context = useHomeConfiguration(),
    config = configuration ?? context;
  const ids = sectionIds;
  const byId = new Map(products.map((p) => [p.id, p]));
  const badges: Record<string, ProductBadge> = {};
  ids.new.forEach((id) => (badges[id] = "new"));
  ids.weekly.forEach((id) => (badges[id] = "week"));
  const categories = config
    ? config.navigation
        .filter((n) => n.visible)
        .flatMap((n) => {
          const c = CATEGORIES.find((c) => c.slug === n.id);
          return c ? [{ ...c, shortLabel: n.label, label: n.label }] : [];
        })
    : CATEGORIES;
  return (
    <HomepageSectionOrder
      sections={config?.sections ?? defaultHomeSections()}
      renderSection={(section) => {
        if (section.id === "intro")
          return (
            <>
              <HeroCarouselView banners={config?.banners ?? banners} />
              <section className="mobi-wrap mobi-home-intro" aria-label="Atendimento online Mobi">
                <div>
                  <span className="mobi-home-kicker">MOBI · SUA CASA, DO SEU JEITO</span>
                  <h2>Móveis para sua casa em Nova Iguaçu</h2>
                  <p>Escolha pelo catálogo. Tire suas dúvidas com a Mobi pelo WhatsApp.</p>
                </div>
                <Link to="/moveis-nova-iguacu" className="mobi-text-link">
                  Conheça nosso atendimento
                </Link>
              </section>
              <div className="mobi-trust">
                <span>Pague somente na entrega</span>
                <span>PIX com desconto</span>
                <span>Cartão em até {MAX_INSTALLMENTS}x sem juros</span>
              </div>
              {!!categories.length && (
                <div className="mobi-category-wrap mobi-wrap">
                  <CategoryNavigation categories={categories} destinations={config?.navigation} />
                </div>
              )}
              {children}
            </>
          );
        if (["weekly", "discovery", "new", "room"].includes(section.id))
          return (
            <HomeProductSection
              title={section.title}
              subtitle={section.subtitle}
              products={(ids[section.id as keyof typeof ids] ?? []).flatMap(
                (id) => byId.get(id) ?? [],
              )}
              badges={badges}
              category={section.id === "room" ? "sala-de-estar" : undefined}
            />
          );
        if (section.id === "inspiration")
          return (
            <section className="mobi-inspiration mobi-wrap">
              <img
                src={DEFAULT_HOMEPAGE_BANNERS[0].image_url}
                alt="Inspiração de sala de estar"
                loading="lazy"
              />
              <div>
                <span className="mobi-eyebrow">CONFORTO EM CADA DETALHE</span>
                <h2>{section.title}</h2>
                {section.subtitle && <p>{section.subtitle}</p>}
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
          );
        if (section.id === "catalog")
          return (
            <section className="mobi-catalog-invite mobi-wrap">
              <h2>Móveis para Nova Iguaçu e Baixada Fluminense.</h2>
              <p>
                Compare modelos, medidas e cores.{" "}
                {config?.service.deliveryMessage ??
                  "Frete e data de entrega combinados pelo WhatsApp."}
              </p>
              <Link to="/" search={{ all: true, page: 1 }} hash="catalogo" className="mobi-primary">
                Explorar todo o catálogo
              </Link>
            </section>
          );
        return null;
      }}
    />
  );
}
