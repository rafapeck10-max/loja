import { Link } from "@tanstack/react-router";
import { HeroCarouselView } from "./HeroCarouselView";
import { HomepageCategories } from "./HomepageCategories";
import { CreditCard, Truck, MessageCircle } from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";
import { HomepageSectionOrder } from "./HomepageSectionOrder";
import { HomeProductSection } from "./HomeProductSection";

import { MAX_INSTALLMENTS, categoryMatches, WHATSAPP_URL } from "../lib/constants";
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
  roomImages,
}: {
  products: Produto[];
  sectionIds: HomeConfiguration["sectionIds"];
  configuration?: HomeConfiguration | null;
  banners?: HomeBanner[];
  children?: React.ReactNode;
  roomImages?: import("../lib/homepage-room-categories").HomepageRoomImage[];
}) {
  const context = useHomeConfiguration(),
    config = configuration ?? context;
  const ids = sectionIds;
  const byId = new Map(products.map((p) => [p.id, p]));
  const badges: Record<string, ProductBadge> = {};
  ids.new.forEach((id) => (badges[id] = "new"));
  ids.weekly.forEach((id) => (badges[id] = "week"));
  return (
    <HomepageSectionOrder
      sections={config?.sections ?? defaultHomeSections()}
      renderSection={(section) => {
        if (section.id === "intro")
          return (
            <>
              <HeroCarouselView banners={config?.banners ?? banners} />
              <div className="mobi-home-benefits mobi-wrap" aria-label="Como comprar na Mobi">
                <span>
                  <Truck size={16} />
                  Pague na entrega
                </span>
                <span>
                  <CreditCard size={16} />
                  Cartão em até {MAX_INSTALLMENTS}x
                </span>
                <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
                  <MessageCircle size={16} />
                  Ajuda pelo WhatsApp
                </a>
              </div>
              <HomepageCategories
                products={products}
                roomImages={roomImages}
                destinations={config?.navigation}
              />
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
              badges={section.id === "weekly" || section.id === "new" ? {} : badges}
              category={section.id === "room" ? "sala-de-estar" : undefined}
            />
          );
        if (section.id === "inspiration") {
          const rooms = [
            { slug: "sala-de-estar", label: "Para a sala" },
            { slug: "dormitorios", label: "Para o quarto" },
          ].flatMap((room) => {
            const product = products.find((p) => categoryMatches(p.categoria, room.slug));
            return product ? [{ ...room, product }] : [];
          });
          if (!rooms.length) return null;
          return (
            <section className="mobi-room-highlights mobi-wrap">
              <div className="mobi-section-title">
                <div>
                  <h2>{section.title}</h2>
                  {section.subtitle && <p>{section.subtitle}</p>}
                </div>
              </div>
              <div>
                {rooms.map((room) => (
                  <a href={`/categoria/${room.slug}`} key={room.slug}>
                    <ImageWithFallback
                      src={room.product.imagem_url}
                      alt={room.product.nome}
                      loading="lazy"
                    />
                    <span>
                      {room.label}
                      <small>Ver móveis →</small>
                    </span>
                  </a>
                ))}
              </div>
            </section>
          );
        }
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
