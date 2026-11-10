import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import { ChevronLeft, Minus, Plus, ShoppingCart } from "lucide-react";
import { Header } from "../../src/components/Header";
import { Footer } from "../../src/components/Footer";
import { MenuDrawer } from "../../src/components/MenuDrawer";
import { CartDrawer } from "../../src/components/CartDrawer";
import { MobileBottomBar } from "../../src/components/MobileBottomBar";
import { WhatsAppFloat } from "../../src/components/WhatsAppFloat";
import { HomeConfigurationProvider } from "../../src/components/HomeConfigurationContext";
import { HomepageContent } from "../../src/components/HomepageContent";
import { StoreCatalog } from "../../src/components/StoreCatalog";
import { ImageWithFallback } from "../../src/components/ImageWithFallback";
import { ProductDiscountLine } from "../../src/components/ProductDiscountLine";
import { useCart } from "../../src/lib/cart-context";
import { initialPageDraft, toStorefrontProducts } from "../../src/lib/pages-shelves";
import { homeProductSelections, type HomeConfiguration } from "../../src/lib/home-configuration";
import { formatBRL, getCategory, MAX_INSTALLMENTS, WHATSAPP_URL } from "../../src/lib/constants";
import { cardQuote } from "../../src/lib/payment";
import type { Produto } from "../../src/lib/products.functions";
import type { ProductBadge } from "../../src/components/ProductCard";
import { pageProducts } from "./data";
import type { PreviewSearch } from "./navigation-state";
import "./storefront-preview.css";

export function LocalStorefront({
  page = "index",
}: {
  page?: "index" | "category" | "product" | "service";
}) {
  const [config, setConfig] = useState<HomeConfiguration | null>(null);
  const [error, setError] = useState("");
  const params = useParams({ strict: false }) as { id?: string; slug?: string };
  const search = useRouterState({ select: (state) => state.location.search }) as PreviewSearch;
  const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    fetch("/__mobi-local-home")
      .then(async (r) => {
        if (!r.ok) throw new Error("Não foi possível ler a revisão local.");
        return r.json();
      })
      .then((data) => {
        if (active) setConfig(data?.config ?? null);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  const products = toStorefrontProducts(pageProducts, initialPageDraft(pageProducts).curation);
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
  const product = products.find((p) => p.id === params.id || p.slug === params.id);
  const category = params.slug && getCategory(params.slug);
  const catalog =
    page === "category" || !!(search.all || search.q || search.ofertas || search.page);
  useEffect(() => {
    document.title =
      page === "product"
        ? `${product?.nome ?? "Produto não encontrado"} · Prévia Mobi`
        : catalog
          ? `${category?.label ?? (search.q ? `Busca: ${search.q}` : "Catálogo")} · Prévia Mobi`
          : "Mobi · Prévia local";
  }, [page, product?.nome, catalog, category, search.q]);
  return (
    <HomeConfigurationProvider configuration={config}>
      <div className="store-shell preview-storefront">
        <div className="mobi-local-review-label">
          Prévia local · amostra histórica · sem alteração na loja{" "}
          <a href="/scripts/pm01-preview/index.html?area=vitrine">Painel</a>
        </div>
        <Header />
        <main id="conteudo" className="preview-storefront-main">
          {error && (
            <p className="mobi-wrap preview-route-notice" role="alert">
              {error} A configuração anterior da loja foi preservada.
            </p>
          )}
          {page === "product" ? (
            product ? (
              <PreviewProduct key={product.id} product={product} search={search} />
            ) : (
              <MissingProduct />
            )
          ) : page === "service" ? (
            <PreviewService />
          ) : page === "category" && !category ? (
            <MissingProduct category />
          ) : catalog ? (
            <StoreCatalog
              products={products}
              query={search.q}
              offers={search.ofertas}
              initialCategory={page === "category" ? params.slug : undefined}
              requestedPage={search.page}
              badges={badges}
              onPageChange={(next) => {
                void navigate({
                  search: (previous) => ({ ...previous, page: next }),
                  replace: true,
                  resetScroll: false,
                });
              }}
            />
          ) : (
            <HomepageContent products={products} sectionIds={sectionIds} configuration={config} />
          )}
        </main>
        <Footer />
        <MenuDrawer />
        <CartDrawer />
        <MobileBottomBar />
        <WhatsAppFloat />
      </div>
    </HomeConfigurationProvider>
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

function PreviewProduct({ product, search }: { product: Produto; search: PreviewSearch }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [variantSku, setVariantSku] = useState("");
  const variants = product.variacoes_preco.filter((v) => v.sale_price != null && v.sale_price > 0);
  const variant = variants.find((v) => v.sku === variantSku) ?? variants[0];
  const price = variant?.sale_price ?? product.preco_novo;
  const quote = cardQuote(price, MAX_INSTALLMENTS);
  const images = [...new Set([product.imagem_url, ...product.imagens])];
  const origin = search.returnCategory && getCategory(search.returnCategory);
  const add = () =>
    addItem({
      id: product.id,
      name: product.nome,
      price,
      cardPrice: quote.total,
      cardRateVerification: quote.rateVerification,
      paymentConfigId: quote.configId,
      installmentCount: MAX_INSTALLMENTS,
      img: product.imagem_url,
      quantity,
      variant: variant?.name ?? null,
    });
  return (
    <section className="mobi-wrap preview-product">
      <nav className="preview-breadcrumb" aria-label="Caminho da página">
        <Link to="/" search={{}}>
          Início
        </Link>
        <span aria-hidden="true">/</span>
        {origin ? (
          <Link
            to="/categoria/$slug"
            params={{ slug: origin.slug }}
            search={{ page: search.returnPage ?? 1 }}
          >
            {origin.label}
          </Link>
        ) : (
          <Link to="/" search={{ all: true, page: search.returnPage ?? 1 }}>
            Catálogo
          </Link>
        )}
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.nome}</span>
      </nav>
      <div className="preview-product-grid">
        <div className="preview-product-gallery">
          <ImageWithFallback
            src={images[imageIndex] ?? images[0]}
            alt={product.nome}
            className="preview-product-main-image"
          />
          {images.length > 1 && (
            <div className="preview-product-thumbnails">
              {images.map((src, index) => (
                <button
                  key={src}
                  aria-label={`Ver foto ${index + 1} de ${product.nome}`}
                  aria-pressed={index === imageIndex}
                  onClick={() => setImageIndex(index)}
                >
                  <ImageWithFallback src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="preview-product-info">
          <span className="preview-product-category">{product.categoria}</span>
          <h1>{product.nome}</h1>
          {product.sku && <p className="preview-product-reference">Referência: {product.sku}</p>}
          <ProductDiscountLine oldPrice={product.preco_antigo} currentPrice={price} />
          <div className="preview-product-price">
            <span>À vista no Pix ou dinheiro</span>
            <strong>{formatBRL(price)}</strong>
            <p>
              ou {MAX_INSTALLMENTS}x de <b>{formatBRL(quote.approximateInstallment)}</b> sem juros
            </p>
            <small>Total no cartão: {formatBRL(quote.total)}</small>
          </div>
          {variants.length > 1 && (
            <label className="preview-product-variant">
              Opção
              <select value={variant?.sku} onChange={(e) => setVariantSku(e.target.value)}>
                {variants.map((v) => (
                  <option key={v.sku} value={v.sku}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {!!product.cores?.length && (
            <p className="preview-product-details">
              <b>Cores informadas:</b> {product.cores.join(", ")}
            </p>
          )}
          {!!product.medidas && (
            <p className="preview-product-details">
              <b>Medidas:</b> {product.medidas}
            </p>
          )}
          <div className="preview-product-buy">
            <div className="preview-product-quantity" aria-label="Quantidade">
              <button
                aria-label="Diminuir quantidade"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => q - 1)}
              >
                <Minus size={16} />
              </button>
              <output aria-live="polite">{quantity}</output>
              <button
                aria-label="Aumentar quantidade"
                disabled={quantity >= 99}
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus size={16} />
              </button>
            </div>
            <button className="mobi-primary" onClick={add}>
              <ShoppingCart size={18} /> Adicionar ao carrinho
            </button>
          </div>
          <p className="preview-product-consult">
            Atendimento online. Consulte disponibilidade, frete e prazo com a Mobi. Valores
            históricos nesta demonstração.
          </p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="preview-product-contact"
          >
            Tirar dúvidas pelo WhatsApp
          </a>
        </div>
      </div>
      {!!product.descricao && (
        <div className="preview-product-description">
          <h2>Sobre este móvel</h2>
          <p>{product.descricao}</p>
        </div>
      )}
      <Link to="/" search={{ all: true }} className="preview-product-back">
        <ChevronLeft size={16} /> Continuar no catálogo
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
