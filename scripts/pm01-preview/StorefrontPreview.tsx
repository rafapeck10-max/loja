import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import { Header } from "../../src/components/Header";
import { Footer } from "../../src/components/Footer";
import { MenuDrawer } from "../../src/components/MenuDrawer";
import { CartDrawer } from "../../src/components/CartDrawer";
import { MobileBottomBar } from "../../src/components/MobileBottomBar";
import { WhatsAppFloat } from "../../src/components/WhatsAppFloat";
import { HomeConfigurationProvider } from "../../src/components/HomeConfigurationContext";
import { HomepageContent } from "../../src/components/HomepageContent";
import { StoreCatalog } from "../../src/components/StoreCatalog";
import { ProductDetailView } from "../../src/components/ProductDetailView";
import { HelpPortalView } from "../../src/components/HelpPortalView";
import { InspirationIndexView } from "../../src/components/InspirationIndexView";
import { InspirationArticleView } from "../../src/components/InspirationArticleView";
import { HelpContentPage } from "../../src/components/HelpContentPage";
import { initialPageDraft, toStorefrontProducts } from "../../src/lib/pages-shelves";
import { homeProductSelections, type HomeConfiguration } from "../../src/lib/home-configuration";
import type { ProductDraftData } from "../../src/lib/operational-config";
import { overlayPreviewProducts, readPreviewProductDrafts } from "./product-drafts";
import { getCategory, WHATSAPP_URL } from "../../src/lib/constants";
import type { ProductBadge } from "../../src/components/ProductCard";
import type { Produto } from "../../src/lib/products.functions";
import { catalogUrlSearch, parseCatalogUrlState } from "../../src/lib/catalog-url-state";
import { categoryUrl } from "../../src/lib/seo";
import { SITE_URL } from "../../src/lib/site-metadata";
import { pageProducts } from "./data";
import type { PreviewSearch } from "./navigation-state";
import "./storefront-preview.css";

function previewProductForDetails(item: (typeof pageProducts)[number]): Produto {
  return {
    id: item.id,
    nome: item.nome,
    slug: item.slug ?? item.id,
    preco_antigo: Number(item.preco_antigo ?? 0),
    preco_novo: Number(item.preco_atual),
    imagem_url: item.url_imagem ?? "",
    categoria: item.categoria ?? "",
    descricao: item.descricao ?? "",
    imagens: item.imagens ?? [],
    sku: item.sku ?? null,
    fornecedor: item.fornecedor ?? null,
    medidas: item.medidas ?? null,
    cores: item.cores ?? null,
    compre_junto_ids: item.compre_junto_ids ?? [],
    parcelas_sem_juros: item.parcelas_sem_juros ?? 10,
    variacoes_preco: (item.variacoes_preco ?? []) as Produto["variacoes_preco"],
    created_at: item.created_at ?? "",
    vitrine_semana_ordem: item.vitrine_semana_ordem ?? null,
    vitrine_novidade: item.vitrine_novidade ?? "automatico",
    vitrine_sala: item.vitrine_sala ?? "automatico",
    vitrine_descoberta: item.vitrine_descoberta ?? true,
    curadoriaDisponivel: false,
  };
}

export function LocalStorefront({
  page = "index",
}: {
  page?:
    | "index"
    | "category"
    | "product"
    | "service"
    | "help"
    | "help-index"
    | "inspiration"
    | "article";
}) {
  const [revisionId, setRevisionId] = useState<number | null>(null);
  const [config, setConfig] = useState<HomeConfiguration | null>(null);
  const [productDrafts, setProductDrafts] = useState<ProductDraftData>({ changes: {} });
  const [error, setError] = useState("");
  const [draftError, setDraftError] = useState("");
  const params = useParams({ strict: false }) as { id?: string; slug?: string };
  const search = useRouterState({ select: (state) => state.location.search }) as PreviewSearch;
  const navigate = useNavigate();
  useEffect(() => {
    const readProductDrafts = () => {
      try {
        const raw = localStorage.getItem("mobi:admin-studio:v1:demo");
        const next = readPreviewProductDrafts(raw, pageProducts);
        setProductDrafts(next);
        setDraftError("");
      } catch (e) {
        setDraftError(e instanceof Error ? e.message : "Não foi possível ler o rascunho local.");
      }
    };
    readProductDrafts();
    window.addEventListener("storage", readProductDrafts);
    return () => window.removeEventListener("storage", readProductDrafts);
  }, []);
  useEffect(() => {
    let active = true;
    fetch("/__mobi-local-home")
      .then(async (r) => {
        if (!r.ok) throw new Error("Não foi possível ler a revisão local.");
        return r.json();
      })
      .then((data) => {
        if (active) {
          setConfig(data?.config ?? null);
          setRevisionId(data?.revisionId ?? null);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [page]);
  const draftProducts = useMemo(
    () => overlayPreviewProducts(pageProducts, productDrafts),
    [productDrafts],
  );
  const products = useMemo(
    () => toStorefrontProducts(draftProducts, initialPageDraft(pageProducts).curation),
    [draftProducts],
  );
  const selections = homeProductSelections(products, config);
  const sectionIds = Object.fromEntries(
    Object.entries(selections).map(([key, ps]) => [key, ps.map((p) => p.id)]),
  ) as HomeConfiguration["sectionIds"];
  const badges: Record<string, ProductBadge> = {};
  selections.new.forEach((p) => {
    badges[p.id] = "new";
  });
  selections.weekly.forEach((p) => {
    badges[p.id] = "week";
  });
  const detailSource = draftProducts.find((p) => p.id === params.id || p.slug === params.id);
  const product =
    products.find((p) => p.id === params.id || p.slug === params.id) ??
    (page === "product" && detailSource ? previewProductForDetails(detailSource) : undefined);
  const category = params.slug && getCategory(params.slug);
  const helpPage =
    page === "help"
      ? config?.content?.pages.find((candidate) => candidate.slug === params.slug)
      : undefined;
  const article = config?.content?.articles.find(
    (candidate) => candidate.slug === params.slug && candidate.status === "review",
  );
  const isHelpPage = page === "help" || page === "help-index";
  const catalog =
    page === "category" ||
    !!(
      search.all ||
      search.q ||
      search.ofertas ||
      search.page ||
      search.sort ||
      search.minPrice ||
      search.maxPrice ||
      search.material ||
      search.color ||
      search.feature ||
      search.dimension ||
      search.widthMaxCm ||
      search.heightMaxCm ||
      search.depthClosedMaxCm ||
      search.depthOpenMaxCm
    );
  const listingState = parseCatalogUrlState(search);
  const shareParams = new URLSearchParams();
  if (search.q) shareParams.set("q", search.q);
  if (search.ofertas) shareParams.set("ofertas", "true");
  if (!search.q && !search.ofertas) shareParams.set("all", "true");
  const shareCategory =
    page === "category" && category
      ? { label: category.label, url: categoryUrl(params.slug!) }
      : catalog
        ? {
            label: search.q
              ? `resultados para “${search.q}”`
              : search.ofertas
                ? "ofertas para sua casa"
                : "todos os móveis",
            url: `${SITE_URL}/${shareParams.toString() ? `?${shareParams.toString()}` : ""}`,
          }
        : undefined;
  useEffect(() => {
    document.title =
      page === "product"
        ? `${product?.nome ?? "Produto não encontrado"} · Prévia Mobi`
        : page === "help-index"
          ? "Central de ajuda · Prévia Mobi"
          : page === "inspiration"
            ? "Inspiração · Prévia Mobi"
            : page === "article"
              ? `${article?.title ?? "Artigo"} · Prévia Mobi`
              : page === "help"
                ? `${helpPage?.title ?? "Ajuda"} · Prévia Mobi`
                : catalog
                  ? `${category?.label ?? (search.q ? `Busca: ${search.q}` : "Catálogo")} · Prévia Mobi`
                  : "Mobi · Prévia local";
  }, [page, product?.nome, helpPage?.title, article?.title, catalog, category, search.q]);
  return (
    <HomeConfigurationProvider configuration={config}>
      <div className="store-shell preview-storefront">
        <div className="mobi-local-review-label">
          Prévia local · dados de demonstração · nada publicado{" "}
          <a href="/scripts/pm01-preview/index.html?area=vitrine">Painel</a>
        </div>
        {!isHelpPage && <Header />}
        <main id="conteudo" className="preview-storefront-main">
          {(error || draftError) && (
            <p className="mobi-wrap preview-route-notice" role="alert">
              {error || draftError} A última versão válida foi preservada.
            </p>
          )}
          {page === "product" ? (
            product ? (
              <ProductDetailView
                key={product.id}
                product={product}
                catalogProducts={products}
                returnPage={search.returnPage}
                returnCategory={search.returnCategory}
                returnSearch={search.returnSearch}
              />
            ) : (
              <MissingProduct />
            )
          ) : page === "help-index" ? (
            <HelpPortalView revisionId={revisionId} />
          ) : page === "inspiration" ? (
            <InspirationIndexView revisionId={revisionId} />
          ) : page === "article" ? (
            article ? (
              <InspirationArticleView article={article} revisionId={revisionId} />
            ) : (
              <MissingHelp />
            )
          ) : page === "service" ? (
            <PreviewService />
          ) : page === "help" ? (
            helpPage ? (
              <HelpContentPage page={helpPage} />
            ) : (
              <MissingHelp />
            )
          ) : page === "category" && !category ? (
            <MissingProduct category />
          ) : catalog ? (
            <StoreCatalog
              products={products}
              query={search.q}
              offers={search.ofertas}
              initialCategory={page === "category" ? params.slug : undefined}
              requestedPage={search.page}
              initialFilters={{
                ...listingState,
                sort: search.sort ?? (search.q?.trim() ? "relevant" : "recommended"),
              }}
              badges={badges}
              shareCategory={shareCategory}
              onCatalogStateChange={(nextState, nextPage) => {
                void navigate({
                  search: (previous) => ({
                    ...previous,
                    ...catalogUrlSearch(
                      nextState,
                      nextPage,
                      search.q?.trim() ? "relevant" : "recommended",
                    ),
                  }),
                  replace: true,
                  resetScroll: false,
                });
              }}
            />
          ) : (
            <HomepageContent products={products} sectionIds={sectionIds} configuration={config} />
          )}
        </main>
        {!isHelpPage && <Footer />}
        <MenuDrawer />
        <CartDrawer />
        {!isHelpPage && <MobileBottomBar />}
        {!isHelpPage && <WhatsAppFloat />}
      </div>
    </HomeConfigurationProvider>
  );
}

function MissingHelp() {
  return (
    <main className="mobi-wrap py-16">
      <h1 className="text-2xl text-deep-green">Esta informação não está na prévia aplicada</h1>
      <p className="mt-3 text-sm text-text-light">
        Revise a página no PM-07, salve o rascunho, marque a versão como revisada e aplique somente
        à prévia local.
      </p>
    </main>
  );
}

function MissingProduct({ category = false }: { category?: boolean }) {
  return (
    <section className="mobi-wrap preview-missing">
      <h1>{category ? "Categoria não encontrada" : "Produto não encontrado nesta amostra"}</h1>
      <p>Você pode continuar navegando pelos móveis disponíveis na prévia.</p>
      <Link to="/" search={{ all: true }} className="mobi-primary">
        Ver catálogo
      </Link>
    </section>
  );
}

function PreviewService() {
  return (
    <section className="mobi-wrap preview-service">
      <nav className="preview-breadcrumb" aria-label="Caminho da página">
        <Link to="/" search={{}}>
          Início
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Atendimento</span>
      </nav>
      <h1>Mobi em Nova Iguaçu</h1>
      <p>
        Escolha seus móveis pelo catálogo e fale com a Mobi pelo WhatsApp para confirmar as
        condições da compra.
      </p>
      <ol>
        <li>
          <strong>Encontre seu móvel</strong>
          <span>Compare fotos, medidas e valores no catálogo.</span>
        </li>
        <li>
          <strong>Revise sua seleção</strong>
          <span>Adicione ao carrinho os modelos e as quantidades que deseja consultar.</span>
        </li>
        <li>
          <strong>Combine os detalhes com a Mobi</strong>
          <span>
            Disponibilidade, frete, montagem e data de entrega são confirmados no atendimento.
          </span>
        </li>
      </ol>
      <p>A Mobi atende online e não possui loja física para visitação.</p>
      <a className="mobi-primary" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
        Falar com a Mobi
      </a>
    </section>
  );
}
