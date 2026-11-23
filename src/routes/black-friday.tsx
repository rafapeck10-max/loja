import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, CreditCard, ShieldCheck, Tag, Truck } from "lucide-react";
import { CepCoverageChecker } from "@/components/CepCoverageChecker";
import { ProductCard } from "@/components/ProductCard";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import {
  BLACK_FRIDAY_COPY,
  BLACK_FRIDAY_PUBLIC_ENABLED,
  BLACK_FRIDAY_TABS,
  productBlackFridayDiscount,
  selectBlackFridayTabProducts,
} from "@/lib/black-friday";
import { WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/constants";
import { produtosQueryOptions, type Produto } from "@/lib/products.functions";
import { breadcrumbs, collectionSeo, jsonLd, seoHead } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-metadata";

const BATCH_SIZE = 24;

export const Route = createFileRoute("/black-friday")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => {
    const rawTab = typeof search.tab === "string" ? search.tab.trim() : "";
    const valid = BLACK_FRIDAY_TABS.some((item) => item.id === rawTab && item.id !== "ofertas");
    return valid ? { tab: rawTab } : {};
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(produtosQueryOptions()),
  head: ({ loaderData }) => {
    const url = `${SITE_URL}/black-friday`;
    const title = "Black Friday Mobi 2026 – Móveis com Pagamento na Entrega | Nova Iguaçu";
    const description =
      "Aproveite a Black Friday Mobi: sofás, guarda-roupas, cozinhas e mesas com pagamento somente na entrega e frete grátis em Nova Iguaçu e Baixada Fluminense.";
    const featured = selectBlackFridayTabProducts(loaderData ?? [], "ofertas").items;
    return {
      ...seoHead(title, description, url),
      scripts: [
        jsonLd(
          breadcrumbs([
            { name: "Início", url: `${SITE_URL}/` },
            { name: "Black Friday Mobi", url },
          ]),
        ),
        jsonLd(
          collectionSeo({
            label: "Black Friday Mobi",
            description,
            url,
            products: featured,
          }),
        ),
        jsonLd({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: BLACK_FRIDAY_COPY.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }),
      ],
    };
  },
  pendingComponent: BlackFridayLoadingState,
  component: BlackFridayPage,
  errorComponent: BlackFridayError,
});

function BlackFridayLoadingState() {
  return (
    <section className="mobi-bf-landing" aria-busy="true" aria-live="polite">
      <div className="mobi-wrap py-10">
        <div className="h-6 w-48 animate-pulse rounded bg-[#1b2d21]" />
        <div className="mt-4 h-12 max-w-2xl animate-pulse rounded bg-[#1b2d21]" />
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-80 animate-pulse rounded-xl bg-[#16261b]" />
          ))}
        </div>
        <p className="sr-only">Carregando área de Black Friday.</p>
      </div>
    </section>
  );
}

function BlackFridayError({ reset }: { error: unknown; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="mobi-wrap py-16 text-center">
      <h1 className="text-2xl text-deep-green">Não foi possível carregar as ofertas agora</h1>
      <p className="mt-2 text-sm text-text-light">
        Tente atualizar a página ou explore todo o catálogo da loja.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mobi-primary"
        >
          Tentar novamente
        </button>
        <Link to="/" search={{ all: true, page: 1 }} hash="catalogo" className="mobi-product-cta">
          Ver catálogo completo
        </Link>
      </div>
    </div>
  );
}

const pillarIcons = [ShieldCheck, Truck, CreditCard] as const;

function BlackFridayPage() {
  const navigate = useNavigate({ from: "/black-friday" });
  const { tab } = Route.useSearch();
  const activeTab = BLACK_FRIDAY_TABS.some((item) => item.id === tab) ? tab! : "ofertas";
  const loaderProducts = Route.useLoaderData();
  const { data: products = loaderProducts ?? [] } = useQuery({
    ...produtosQueryOptions(),
    ...(loaderProducts ? { initialData: loaderProducts } : {}),
    staleTime: 60_000,
  });
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);

  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [activeTab]);

  const tabCounts = useMemo(
    () =>
      Object.fromEntries(
        BLACK_FRIDAY_TABS.map((item) => [
          item.id,
          selectBlackFridayTabProducts(products, item.id).items.length,
        ]),
      ),
    [products],
  );

  const currentSelection = useMemo(
    () => selectBlackFridayTabProducts(products, activeTab),
    [products, activeTab],
  );
  const currentTabDefinition =
    BLACK_FRIDAY_TABS.find((item) => item.id === activeTab) ?? BLACK_FRIDAY_TABS[0];

  if (!BLACK_FRIDAY_PUBLIC_ENABLED) {
    return (
      <section className="mobi-wrap py-12">
        <h1 className="text-3xl text-deep-green">Campanha encerrada</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-light">
          As condições sazonais de Black Friday foram encerradas, mas você pode continuar explorando
          todo o catálogo da Mobi com pagamento na entrega e frete grátis na região atendida.
        </p>
        <div className="mt-5">
          <Link to="/" search={{ all: true, page: 1 }} hash="catalogo" className="mobi-primary">
            Explorar catálogo completo
          </Link>
        </div>
      </section>
    );
  }

  const visibleItems: Produto[] = currentSelection.items.slice(0, visibleCount);
  const hasMore = visibleCount < currentSelection.items.length;

  return (
    <div className="mobi-bf-landing">
      <section className="mobi-bf-hero" aria-labelledby="mobi-bf-hero-title">
        <div className="mobi-wrap">
          <nav aria-label="Caminho da página" className="mobi-bf-breadcrumb">
            <Link to="/" search={{}}>
              Início
            </Link>
            <span aria-hidden="true">/</span>
            <span>Black Friday Mobi</span>
          </nav>

          <span className="mobi-bf-hero-kicker">
            <Tag size={14} aria-hidden="true" />
            <span>{BLACK_FRIDAY_COPY.kicker}</span>
          </span>

          <h1 id="mobi-bf-hero-title">{BLACK_FRIDAY_COPY.heroTitle}</h1>
          <p className="mobi-bf-hero-subtitle">{BLACK_FRIDAY_COPY.heroSubtitle}</p>

          <div className="mobi-bf-hero-actions">
            <a href="#ofertas-black" className="mobi-bf-hero-primary">
              <span>Explorar seleção Black Friday</span>
              <ArrowDown size={16} aria-hidden="true" />
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="mobi-bf-hero-secondary"
            >
              <WhatsAppIcon className="h-4 w-4 shrink-0" />
              <span>Falar no WhatsApp · {WHATSAPP_DISPLAY}</span>
            </a>
          </div>

          <div className="mobi-bf-pillars">
            {BLACK_FRIDAY_COPY.pillars.map((pillar, index) => {
              const Icon = pillarIcons[index] ?? ShieldCheck;
              return (
                <article key={pillar.title} className="mobi-bf-pillar">
                  <span className="mobi-bf-pillar-icon">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2>{pillar.title}</h2>
                    <p>{pillar.detail}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="ofertas-black"
        className="mobi-bf-catalog-section"
        aria-labelledby="mobi-bf-catalog-title"
      >
        <div className="mobi-wrap">
          <div className="mobi-bf-catalog-head">
            <div>
              <h2 id="mobi-bf-catalog-title">{currentTabDefinition.label}</h2>
              <p>
                {currentSelection.items.length}{" "}
                {currentSelection.items.length === 1 ? "móvel disponível" : "móveis disponíveis"}
                {currentSelection.realDealCount > 0
                  ? ` · ${currentSelection.realDealCount} com desconto real verificado no catálogo`
                  : ""}
              </p>
            </div>
            <Link
              to="/"
              search={{ all: true, page: 1 }}
              hash="catalogo"
              className="mobi-bf-catalog-link"
            >
              Ver catálogo completo
            </Link>
          </div>

          <div
            className="mobi-bf-tabs"
            role="tablist"
            aria-label="Filtrar Black Friday por ambiente"
          >
            {BLACK_FRIDAY_TABS.map((item) => {
              const selected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className={`mobi-bf-tab${selected ? " is-active" : ""}`}
                  onClick={() => {
                    void navigate({
                      search: item.id === "ofertas" ? {} : { tab: item.id },
                      replace: true,
                      resetScroll: false,
                    });
                  }}
                >
                  <span>{item.label}</span>
                  <small>{tabCounts[item.id] ?? 0}</small>
                </button>
              );
            })}
          </div>

          {visibleItems.length > 0 ? (
            <>
              <div
                className={`mobi-grid mobi-home-product-grid${visibleItems.length === 1 ? " is-single" : ""}`}
              >
                {visibleItems.map((produto) => {
                  const discount = productBlackFridayDiscount(produto);
                  return (
                    <ProductCard
                      key={produto.id}
                      produto={produto}
                      badge={discount ? "blackFriday" : undefined}
                      theme="blackFriday"
                      discountPercent={discount}
                    />
                  );
                })}
              </div>

              {hasMore && (
                <div className="mobi-bf-load-more">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + BATCH_SIZE)}
                    className="mobi-bf-load-more-btn"
                  >
                    Mostrar mais móveis ({currentSelection.items.length - visibleItems.length}{" "}
                    restantes)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="mobi-bf-empty">
              <p>Nenhum móvel disponível nesta seleção no momento.</p>
              <button
                type="button"
                onClick={() => {
                  void navigate({ search: {}, replace: true, resetScroll: false });
                }}
                className="mobi-bf-hero-primary"
              >
                Voltar para ofertas em destaque
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="mobi-bf-cep-section" aria-labelledby="mobi-bf-cep-title">
        <div className="mobi-wrap mobi-bf-cep-grid">
          <div className="mobi-bf-cep-copy">
            <span className="mobi-black-friday-kicker">COBERTURA DE ENTREGA</span>
            <h2 id="mobi-bf-cep-title">Confirme o frete grátis no seu CEP antes de pedir</h2>
            <p>
              Atendemos com frete grátis em até 7 dias úteis endereços dentro do raio de 30 km a
              partir do bairro Botafogo, em Nova Iguaçu (exceto Belford Roxo e áreas com barricadas
              ou restrição de acesso).
            </p>
            <div className="mobi-bf-cep-links">
              <Link to="/moveis-nova-iguacu">Cidades e bairros atendidos</Link>
              <Link to="/moveis-pagamento-na-entrega">Como funciona o pagamento na entrega</Link>
            </div>
          </div>
          <CepCoverageChecker variant="dark" />
        </div>
      </section>

      <section className="mobi-bf-faq-section" aria-labelledby="mobi-bf-faq-title">
        <div className="mobi-wrap">
          <h2 id="mobi-bf-faq-title">Perguntas frequentes da Black Friday Mobi</h2>
          <div className="mobi-bf-faq-list">
            {BLACK_FRIDAY_COPY.faqs.map((faq) => (
              <details key={faq.question} className="mobi-bf-faq-item">
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
