import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import { Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Expand,
  MessageCircle,
  Minus,
  MoveDown,
  MoveHorizontal,
  Plus,
  Ruler,
  Share2,
  ShoppingCart,
  Truck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { ProductPriceDisplay } from "@/components/ProductPriceDisplay";
import {
  categoryMatches,
  formatBRL,
  MAX_INSTALLMENTS,
  SUBCATEGORIES,
  WHATSAPP_URL,
} from "@/lib/constants";
import { useCart } from "@/lib/cart-context";
import { publicDescription } from "@/lib/product-copy";
import { cardQuote } from "@/lib/payment";
import { productMeasurements } from "@/lib/product-measurements";
import { catalogUrlSearch, parseCatalogUrlString } from "@/lib/catalog-url-state";
import type { Produto, ProductPriceVariation } from "@/lib/products.functions";

type ProductDetailViewProps = {
  product: Produto;
  catalogProducts?: Produto[];
  returnPage?: number;
  returnCategory?: string;
  returnSearch?: string;
};

const VISIBLE_PRODUCT_THUMBNAILS = 6;

function priceOptionsFor(product: Produto) {
  return product.variacoes_preco.filter(
    (item): item is ProductPriceVariation & { sale_price: number } =>
      Boolean(
        item.sku &&
        item.name &&
        item.sale_price != null &&
        Number.isFinite(item.sale_price) &&
        item.sale_price > 0,
      ),
  );
}

function colorsFor(product: Produto) {
  return [...new Set((product.cores ?? []).map((color) => color.trim()).filter(Boolean))];
}

function bundleChoiceFor(product: Produto, sku?: string, colorName?: string) {
  const options = priceOptionsFor(product);
  const option =
    options.find((item) => item.sku === sku) ?? (options.length === 1 ? options[0] : null);
  const colors = options.length === 0 ? colorsFor(product) : [];
  const color =
    colors.find((item) => item === colorName) ?? (colors.length === 1 ? colors[0] : null);
  return {
    price:
      option?.sale_price ??
      (options.length ? Math.min(...options.map((item) => item.sale_price)) : product.preco_novo),
    variant: option?.name ?? null,
    color,
    ready: (options.length === 0 || Boolean(option)) && (colors.length < 2 || Boolean(color)),
  };
}

function galleryFor(product: Produto) {
  return Array.from(new Set([product.imagem_url, ...product.imagens])).filter((src) =>
    /^https?:\/\//i.test(src),
  );
}

function categorySlug(category: string) {
  return (
    SUBCATEGORIES.find((item) => categoryMatches(category, item.slug))?.slug ?? "sala-de-estar"
  );
}

function whatsappProductLink(productName: string) {
  const text = `Olá! Quero consultar disponibilidade e entrega para: ${productName}.`;
  return `${WHATSAPP_URL}?text=${encodeURIComponent(text)}`;
}

export function ProductDetailView({
  product,
  catalogProducts,
  returnPage,
  returnCategory,
  returnSearch,
}: ProductDetailViewProps) {
  const { addItem, openCart } = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cash" | "card">("pix");
  const paymentTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [selectedBundleIds, setSelectedBundleIds] = useState<string[]>([]);
  const [bundleOptionSkus, setBundleOptionSkus] = useState<Record<string, string>>({});
  const [bundleColorNames, setBundleColorNames] = useState<Record<string, string>>({});
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swipedImage = useRef(false);
  const { data: fetchedProducts = [] } = useQuery({
    queryKey: ["catalog-products-for-product-bundles"],
    queryFn: async () => {
      const { getProdutos } = await import("@/lib/products.functions");
      return getProdutos();
    },
    enabled: !catalogProducts && Boolean(product.compre_junto_ids?.length),
  });

  const gallery = galleryFor(product);
  const images = gallery.length ? gallery : [""];
  const activePhoto = Math.min(activeImage, images.length - 1);
  const visibleGalleryImages = images.slice(0, VISIBLE_PRODUCT_THUMBNAILS);
  const hiddenGalleryImages = images.slice(VISIBLE_PRODUCT_THUMBNAILS);
  const allProducts = catalogProducts ?? fetchedProducts;
  const pricedOptions = priceOptionsFor(product);
  const selectedOption =
    pricedOptions.find((option) => option.sku === selectedSku) ?? pricedOptions[0] ?? null;
  const colors = colorsFor(product);
  const currentColor =
    pricedOptions.length === 0
      ? (colors.find((color) => color === selectedColor) ?? colors[0] ?? null)
      : null;
  const currentPrice = selectedOption?.sale_price ?? product.preco_novo;
  const payment = cardQuote(currentPrice, MAX_INSTALLMENTS);
  const measurements = productMeasurements(product.medidas);
  const keyFacts =
    measurements.length > 0
      ? measurements
      : product.medidas?.trim()
        ? [{ label: "Medidas informadas", value: product.medidas, icon: "ruler" as const }]
        : [];
  const rawDescription = publicDescription(product.descricao);
  const descriptionParts = rawDescription
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  const reference = product.sku?.split("|")[0]?.trim();
  const hasCharacteristics = Boolean(
    product.medidas?.trim() || colors.length || pricedOptions.length || reference,
  );
  const hasInformation = Boolean(descriptionParts.length || hasCharacteristics);
  const bundleProducts = useMemo(() => {
    const byId = new Map(allProducts.map((item) => [item.id, item]));
    return [...new Set(product.compre_junto_ids ?? [])]
      .slice(0, 3)
      .filter((id) => id !== product.id)
      .map((id) => byId.get(id))
      .filter((item): item is Produto => Boolean(item && item.preco_novo > 0 && item.imagem_url));
  }, [allProducts, product.compre_junto_ids, product.id]);
  const bundleChoice = (item: Produto) =>
    bundleChoiceFor(item, bundleOptionSkus[item.id], bundleColorNames[item.id]);
  const selectedBundleProducts = bundleProducts.filter(
    (item) => selectedBundleIds.includes(item.id) && bundleChoice(item).ready,
  );
  const bundleTotal =
    currentPrice * quantity +
    selectedBundleProducts.reduce((total, item) => total + bundleChoice(item).price, 0);
  const bundleCount = quantity + selectedBundleProducts.length;
  const bundleRelationsKey = (product.compre_junto_ids ?? []).join("|");

  useEffect(() => {
    setSelectedBundleIds([]);
    setBundleOptionSkus({});
    setBundleColorNames({});
  }, [product.id, bundleRelationsKey]);

  useEffect(() => {
    setActiveImage(0);
    setQuantity(1);
    setSelectedSku(null);
    setSelectedColor(null);
    setZoomOpen(false);
  }, [product.id]);

  const addToCart = () => {
    addItem({
      id: product.id,
      name: product.nome,
      price: currentPrice,
      cardPrice: payment.total,
      cardRateVerification: payment.rateVerification,
      paymentConfigId: payment.configId,
      installmentCount: MAX_INSTALLMENTS,
      img: product.imagem_url || images[0],
      quantity,
      color: currentColor,
      variant: selectedOption?.name ?? null,
    });
  };

  const addBundleToCart = () => {
    addToCart();
    for (const item of selectedBundleProducts) {
      const option = bundleChoice(item);
      const quote = cardQuote(option.price, MAX_INSTALLMENTS);
      addItem({
        id: item.id,
        name: item.nome,
        price: option.price,
        cardPrice: quote.total,
        cardRateVerification: quote.rateVerification,
        paymentConfigId: quote.configId,
        installmentCount: MAX_INSTALLMENTS,
        img: item.imagem_url,
        quantity: 1,
        color: option.color,
        variant: option.variant,
      });
    }
    openCart();
  };

  const shareProduct = async () => {
    if (typeof window === "undefined") return;
    const url = new URL(
      `/produto/${encodeURIComponent(product.slug)}`,
      window.location.origin,
    ).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title: product.nome, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link do produto copiado.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link do produto copiado.");
      } catch {
        toast.error("Não foi possível copiar o link agora.");
      }
    }
  };

  const moveImage = (direction: -1 | 1) => {
    setActiveImage((current) => (current + direction + images.length) % images.length);
  };

  return (
    <div className="mobi-product-page mx-auto w-full min-w-0 max-w-[1280px] px-4 pb-10 pt-4 sm:px-6 lg:px-8 lg:pb-12 lg:pt-6">
      <nav
        aria-label="Caminho da página"
        className="mb-4 flex min-w-0 items-center gap-2 overflow-hidden text-xs text-text-light"
      >
        <Link
          to="/"
          search={{}}
          className="shrink-0 text-inherit no-underline hover:text-price-green"
        >
          Início
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          to="/categoria/$slug"
          params={{ slug: returnCategory ?? categorySlug(product.categoria) }}
          search={catalogUrlSearch(
            parseCatalogUrlString(returnSearch),
            returnPage ?? parseCatalogUrlString(returnSearch).page,
          )}
          resetScroll={false}
          className="shrink-0 text-inherit no-underline hover:text-price-green"
        >
          {product.categoria}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="truncate font-medium text-cacau">
          {product.nome}
        </span>
      </nav>

      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(390px,0.92fr)] lg:gap-8 xl:gap-10">
        <section
          aria-label="Fotos do produto"
          aria-roledescription="carrossel"
          className="mobi-product-gallery-column min-w-0"
        >
          <div className={`mobi-product-gallery-grid ${images.length > 1 ? "has-thumbnails" : ""}`}>
            {images.length > 1 && (
              <div className="mobi-product-thumbnails" aria-label="Miniaturas do produto">
                {visibleGalleryImages.map((src, index) => (
                  <button
                    key={`${src}-${index}`}
                    type="button"
                    aria-label={`Ver foto ${index + 1} de ${product.nome}`}
                    aria-pressed={activePhoto === index}
                    onClick={() => setActiveImage(index)}
                    className={`mobi-product-thumbnail ${activePhoto === index ? "is-active" : ""}`}
                  >
                    <ImageWithFallback src={src} fallbackSrcs={images} alt="" loading="lazy" />
                  </button>
                ))}
                {hiddenGalleryImages.length > 0 && (
                  <button
                    type="button"
                    aria-label={`Ver mais ${hiddenGalleryImages.length} fotos`}
                    aria-pressed={activePhoto >= VISIBLE_PRODUCT_THUMBNAILS}
                    onClick={() => {
                      setActiveImage(VISIBLE_PRODUCT_THUMBNAILS);
                      setZoomOpen(true);
                    }}
                    className={`mobi-product-thumbnail mobi-product-thumbnail-more ${
                      activePhoto >= VISIBLE_PRODUCT_THUMBNAILS ? "is-active" : ""
                    }`}
                  >
                    <ImageWithFallback
                      src={hiddenGalleryImages[0]}
                      fallbackSrcs={hiddenGalleryImages.slice(1)}
                      alt=""
                      loading="lazy"
                    />
                    <span className="mobi-product-thumbnail-more-count" aria-hidden="true">
                      +{hiddenGalleryImages.length}
                    </span>
                  </button>
                )}
              </div>
            )}

            <div
              className="mobi-product-image-frame"
              onClickCapture={(event) => {
                if (!swipedImage.current) return;
                event.preventDefault();
                event.stopPropagation();
                swipedImage.current = false;
              }}
              onKeyDown={(event) => {
                if (images.length < 2 || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
                event.preventDefault();
                moveImage(event.key === "ArrowRight" ? 1 : -1);
              }}
              onTouchStart={(event) => {
                const touch = event.changedTouches[0];
                touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
                swipedImage.current = false;
              }}
              onTouchEnd={(event) => {
                const start = touchStart.current;
                touchStart.current = null;
                const end = event.changedTouches[0];
                if (!start || !end || images.length < 2) return;
                const x = end.clientX - start.x;
                const y = end.clientY - start.y;
                if (Math.abs(x) < 44 || Math.abs(x) <= Math.abs(y) * 1.2) return;
                swipedImage.current = true;
                moveImage(x < 0 ? 1 : -1);
              }}
              onTouchCancel={() => {
                touchStart.current = null;
              }}
            >
              <button
                type="button"
                className="mobi-product-image-trigger"
                aria-label={`Ampliar foto ${activePhoto + 1} de ${product.nome}`}
                onClick={() => setZoomOpen(true)}
              >
                <ImageWithFallback
                  src={images[activePhoto]}
                  fallbackSrcs={images.filter((_, index) => index !== activePhoto)}
                  alt={`${product.nome} — foto ${activePhoto + 1}`}
                  className="mobi-product-main-image"
                  loading={activePhoto === 0 ? "eager" : "lazy"}
                  fetchPriority={activePhoto === 0 ? "high" : "auto"}
                />
                <span className="mobi-product-zoom-hint">
                  <Expand size={15} aria-hidden="true" /> Ampliar
                </span>
              </button>

              {images.length > 1 && (
                <>
                  <span className="mobi-product-image-count" aria-live="polite">
                    {activePhoto + 1} / {images.length}
                  </span>
                  <button
                    type="button"
                    aria-label="Foto anterior"
                    onClick={() => moveImage(-1)}
                    className="mobi-product-gallery-arrow is-previous"
                  >
                    <ChevronLeft size={20} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Próxima foto"
                    onClick={() => moveImage(1)}
                    className="mobi-product-gallery-arrow is-next"
                  >
                    <ChevronRight size={20} aria-hidden="true" />
                  </button>
                </>
              )}

              <button
                type="button"
                aria-label="Compartilhar produto"
                onClick={() => void shareProduct()}
                className="mobi-product-share"
              >
                <Share2 size={17} aria-hidden="true" />
                <span>Compartilhar</span>
              </button>
            </div>

            {images.length > 1 && (
              <div className="mobi-product-image-dots" role="group" aria-label="Selecionar foto">
                {images.map((_, index) => (
                  <button
                    key={`photo-dot-${index}`}
                    type="button"
                    aria-label={`Ver foto ${index + 1} de ${images.length}`}
                    aria-pressed={activePhoto === index}
                    onClick={() => setActiveImage(index)}
                    className={activePhoto === index ? "is-active" : ""}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mobi-product-buy-column min-w-0" aria-label="Informações e compra">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-price-green">{product.categoria}</span>
          </div>
          <h1 className="mobi-product-title text-2xl font-semibold leading-tight text-deep-green sm:text-3xl">
            {product.nome}
          </h1>
          {reference ? <p className="mobi-product-reference">Referência: {reference}</p> : null}

          <div className="mobi-product-operation-note mt-3 flex items-center gap-2 rounded-lg border border-price-green/20 bg-price-green/5 px-3 py-2 text-sm text-deep-green">
            <MessageCircle size={17} className="shrink-0 text-price-green" aria-hidden="true" />
            <span>Compra online com atendimento da Mobi</span>
          </div>

          {pricedOptions.length > 0 && (
            <fieldset className="mt-4 border-0 p-0">
              <legend className="mb-2 text-sm font-semibold text-cacau">Opção do produto</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {pricedOptions.map((option) => {
                  const selected = selectedOption?.sku === option.sku;
                  return (
                    <button
                      key={option.sku}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setSelectedSku(option.sku)}
                      className={`mobi-product-option ${selected ? "is-selected" : ""}`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{option.name}</span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold">
                        {formatBRL(option.sale_price ?? 0)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-text-light">
                Confirme a opção e a disponibilidade com a Mobi antes de concluir o pedido.
              </p>
            </fieldset>
          )}

          {pricedOptions.length === 0 && colors.length === 1 && (
            <p className="mobi-product-color-summary">
              <span>Cor:</span>
              <strong className="mobi-product-color-name">{currentColor}</strong>
            </p>
          )}

          {pricedOptions.length === 0 && colors.length > 1 && (
            <fieldset className="mobi-product-colors">
              <legend>Cor</legend>
              <div>
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-pressed={currentColor === color}
                    className={`mobi-product-color ${currentColor === color ? "is-selected" : ""}`}
                    onClick={() => setSelectedColor(color)}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div className="mobi-product-price-panel mt-4 rounded-xl border border-cacau/10 border-l-4 border-l-gold bg-white p-4 sm:p-5">
            <ProductPriceDisplay
              oldPrice={selectedOption ? 0 : product.preco_antigo}
              price={currentPrice}
              payment={payment}
            />
            <button
              type="button"
              onClick={() => setPaymentOpen(true)}
              className="mobi-product-payment-link mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-price-green underline decoration-price-green/40 underline-offset-4 hover:decoration-price-green"
            >
              <CreditCard size={17} aria-hidden="true" /> Ver condições de pagamento
            </button>
            <p className="mobi-product-payment-note">
              Parcelamento de 1x a {MAX_INSTALLMENTS}x pelo mesmo total. Consulte a Mobi para outras
              bandeiras ou condições de cartão.
            </p>
          </div>

          <div className="mobi-product-quantity-row mt-4 flex flex-wrap items-end gap-4">
            <div>
              <span className="mb-1.5 block text-sm font-semibold text-cacau">Quantidade</span>
              <div className="mobi-product-quantity-control" aria-label="Quantidade">
                <button
                  type="button"
                  aria-label="Diminuir quantidade"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                >
                  <Minus size={16} aria-hidden="true" />
                </button>
                <output aria-live="polite">{quantity}</output>
                <button
                  type="button"
                  aria-label="Aumentar quantidade"
                  onClick={() => setQuantity((value) => value + 1)}
                >
                  <Plus size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <aside className="mobi-product-assembly" aria-label="Atenção à montagem">
            <h2>Atenção à montagem</h2>
            <p>
              O produto deve ser montado conforme o manual do fabricante por profissional
              qualificado. A Mobi não se responsabiliza por danos causados exclusivamente por
              montagem incorreta ou feita por pessoa não qualificada; esses danos podem não ser
              cobertos pela garantia do fabricante. Se desejar, podemos indicar um montador.
              Consulte disponibilidade e valores.
            </p>
          </aside>

          <div className="mobi-product-actions mt-4 grid gap-2">
            <button type="button" onClick={addToCart} className="mobi-product-buy-now">
              Comprar agora
            </button>
            <p>Revise no carrinho e combine o pedido com a Mobi. Pagamento somente na entrega.</p>
          </div>

          <section className="mobi-product-delivery mt-4 rounded-xl border border-cacau/10 bg-white p-4">
            <div className="flex items-start gap-3">
              <Truck size={20} className="mt-0.5 shrink-0 text-price-green" aria-hidden="true" />
              <div className="min-w-0">
                <h2 className="m-0 text-sm font-semibold text-deep-green">
                  Consulte entrega e disponibilidade
                </h2>
                <p className="mb-3 mt-1 text-sm leading-relaxed text-text-light">
                  A Mobi atende online em Nova Iguaçu e regiões próximas. Frete, prazo e
                  disponibilidade são confirmados pelo WhatsApp.
                </p>
                <a
                  href={whatsappProductLink(product.nome)}
                  target="_blank"
                  rel="noreferrer"
                  className="mobi-product-delivery-link inline-flex min-h-11 items-center justify-center rounded-md px-3 text-sm font-semibold"
                >
                  Consultar pelo WhatsApp
                </a>
              </div>
            </div>
          </section>

          {(keyFacts.length > 0 || !product.medidas?.trim()) && (
            <section
              className="mobi-product-key-facts mt-3"
              aria-labelledby="mobi-product-facts-title"
            >
              <h2 id="mobi-product-facts-title">O que saber sobre este produto</h2>
              {keyFacts.length > 0 ? (
                <div className="mobi-product-key-facts-grid">
                  {keyFacts.map((measure) => {
                    const Icon =
                      measure.icon === "horizontal"
                        ? MoveHorizontal
                        : measure.icon === "vertical"
                          ? MoveDown
                          : Ruler;
                    return (
                      <div className="mobi-product-key-fact" key={measure.label}>
                        <span className="mobi-product-key-fact-icon">
                          <Icon size={17} aria-hidden="true" />
                        </span>
                        <span>
                          <small>{measure.label}</small>
                          <strong>{measure.value}</strong>
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mobi-product-facts-missing">
                  As medidas deste móvel ainda não foram informadas.
                </p>
              )}
              {hasInformation ? (
                <a href="#caracteristicas-produto">
                  {descriptionParts.length && hasCharacteristics
                    ? "Descrição e características"
                    : hasCharacteristics
                      ? "Ver características"
                      : "Ver descrição"}
                </a>
              ) : null}
            </section>
          )}
        </section>
      </div>

      {bundleProducts.length > 0 && (
        <section className="mobi-product-bundle mt-8" aria-labelledby="mobi-product-bundle-title">
          <div className="mobi-product-section-heading">
            <div>
              <p>Seleção da Mobi</p>
              <h2 id="mobi-product-bundle-title">Compre junto</h2>
            </div>
            <span>Escolha os complementos que quiser</span>
          </div>
          <div className="mobi-product-bundle-row">
            <article className="mobi-product-bundle-item is-current">
              <ImageWithFallback
                src={product.imagem_url || images[0]}
                fallbackSrcs={images}
                alt=""
                loading="lazy"
              />
              <div className="mobi-product-bundle-copy">
                <span>Este móvel</span>
                <strong>{product.nome}</strong>
                {selectedOption?.name || currentColor ? (
                  <small>{selectedOption?.name ?? currentColor}</small>
                ) : null}
                {quantity > 1 ? <small>{quantity} unidades · valor por unidade</small> : null}
                <b>{formatBRL(currentPrice)}</b>
              </div>
            </article>
            {bundleProducts.map((item) => {
              const option = bundleChoice(item);
              const itemOptions = priceOptionsFor(item);
              const itemColors = itemOptions.length === 0 ? colorsFor(item) : [];
              const selected = selectedBundleIds.includes(item.id) && option.ready;
              return (
                <article
                  className={`mobi-product-bundle-item ${selected ? "is-selected" : ""}`}
                  key={item.id}
                >
                  <label className="mobi-product-bundle-check">
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={!option.ready}
                      onChange={(event) =>
                        setSelectedBundleIds((ids) =>
                          event.target.checked
                            ? [...ids, item.id]
                            : ids.filter((id) => id !== item.id),
                        )
                      }
                      aria-label={`Incluir ${item.nome}${option.variant || option.color ? ` — ${option.variant ?? option.color}` : ""} por ${formatBRL(option.price)}`}
                      aria-describedby={!option.ready ? `bundle-choice-${item.id}` : undefined}
                    />
                    <ImageWithFallback
                      src={item.imagem_url}
                      fallbackSrcs={item.imagens}
                      alt=""
                      loading="lazy"
                    />
                  </label>
                  <div className="mobi-product-bundle-copy">
                    <span>Complemento</span>
                    <Link to="/produto/$id" params={{ id: item.slug }} search={{}}>
                      {item.nome}
                    </Link>
                    {itemOptions.length > 1 ? (
                      <label className="mobi-product-bundle-choice" id={`bundle-choice-${item.id}`}>
                        Opção
                        <select
                          aria-label={`Opção de ${item.nome}`}
                          value={bundleOptionSkus[item.id] ?? ""}
                          onChange={(event) =>
                            setBundleOptionSkus((values) => ({
                              ...values,
                              [item.id]: event.target.value,
                            }))
                          }
                        >
                          <option value="" disabled>
                            Escolha uma opção
                          </option>
                          {itemOptions.map((choice) => (
                            <option key={choice.sku} value={choice.sku}>
                              {choice.name} · {formatBRL(choice.sale_price)}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : itemColors.length > 1 ? (
                      <label className="mobi-product-bundle-choice" id={`bundle-choice-${item.id}`}>
                        Cor / variação
                        <select
                          aria-label={`Cor de ${item.nome}`}
                          value={bundleColorNames[item.id] ?? ""}
                          onChange={(event) =>
                            setBundleColorNames((values) => ({
                              ...values,
                              [item.id]: event.target.value,
                            }))
                          }
                        >
                          <option value="" disabled>
                            Escolha uma cor
                          </option>
                          {itemColors.map((color) => (
                            <option key={color} value={color}>
                              {color}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : option.variant || option.color ? (
                      <small>{option.variant ?? option.color}</small>
                    ) : null}
                    <b>
                      {!option.ready && itemOptions.length > 1 ? "A partir de " : ""}
                      {formatBRL(option.price)}
                    </b>
                  </div>
                </article>
              );
            })}
            <aside className="mobi-product-bundle-total">
              <span>
                Total da seleção · {bundleCount} {bundleCount === 1 ? "item" : "itens"}
              </span>
              <strong>{formatBRL(bundleTotal)}</strong>
              <small>Valor à vista. Condições do cartão são calculadas por móvel.</small>
              <button type="button" onClick={addBundleToCart}>
                <ShoppingCart size={16} aria-hidden="true" /> Adicionar {bundleCount}{" "}
                {bundleCount === 1 ? "item" : "itens"}
              </button>
            </aside>
          </div>
        </section>
      )}

      {hasInformation && (
        <section className="mobi-product-information mt-8" id="caracteristicas-produto">
          {descriptionParts.length > 0 && (
            <section
              className="mobi-product-description-section"
              aria-labelledby="mobi-product-description-title"
            >
              <div className="mobi-product-section-heading">
                <div>
                  <p>Detalhes do móvel</p>
                  <h2 id="mobi-product-description-title">Descrição</h2>
                </div>
              </div>
              <p className="mobi-product-description-lead">{descriptionParts[0]}</p>
              {descriptionParts.length > 1 && (
                <details className="mobi-product-description">
                  <summary>Ver descrição completa</summary>
                  <div className="mobi-product-description-rest">
                    {descriptionParts.slice(1).map((paragraph, index) => (
                      <p key={`${index}-${paragraph}`}>{paragraph}</p>
                    ))}
                  </div>
                </details>
              )}
            </section>
          )}

          {hasCharacteristics && (
            <section
              className="mobi-product-characteristics"
              aria-labelledby="mobi-product-characteristics-title"
            >
              <div className="mobi-product-section-heading">
                <div>
                  <p>Informações cadastradas</p>
                  <h2 id="mobi-product-characteristics-title">Características do produto</h2>
                </div>
              </div>
              <div className="mobi-product-characteristics-grid">
                {(product.medidas || measurements.length > 0) && (
                  <div className="mobi-product-characteristic-group">
                    <h3>Dimensões</h3>
                    <dl>
                      {measurements.length > 0 ? (
                        measurements.map((measure) => (
                          <div key={measure.label}>
                            <dt>{measure.label}</dt>
                            <dd>{measure.value}</dd>
                          </div>
                        ))
                      ) : (
                        <div>
                          <dt>Medidas informadas</dt>
                          <dd>{product.medidas}</dd>
                        </div>
                      )}
                    </dl>
                    {measurements.length > 0 ? (
                      <details className="mobi-product-measures-source">
                        <summary>Ver medidas informadas</summary>
                        <p>{product.medidas}</p>
                      </details>
                    ) : null}
                  </div>
                )}
                {(colors.length > 0 || pricedOptions.length > 0 || reference) && (
                  <div className="mobi-product-characteristic-group">
                    <h3>Acabamento e opções</h3>
                    <dl>
                      {reference ? (
                        <div>
                          <dt>Referência</dt>
                          <dd>{reference}</dd>
                        </div>
                      ) : null}
                      {colors.length ? (
                        <div>
                          <dt>Cores informadas</dt>
                          <dd>{colors.join(", ")}</dd>
                        </div>
                      ) : null}
                      {pricedOptions.map((option) => (
                        <div key={option.sku}>
                          <dt>{option.name}</dt>
                          <dd>{formatBRL(option.sale_price ?? 0)}</dd>
                        </div>
                      ))}
                    </dl>
                    {product.cores?.length ? (
                      <p>
                        As cores cadastradas não garantem disponibilidade imediata. Confirme a opção
                        com a Mobi.
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </section>
          )}
        </section>
      )}

      <div className="mobi-product-legal mt-3">
        <details>
          <summary>Garantia e assistência</summary>
          <p>
            Todos os produtos da Mobi possuem garantia legal de 90 dias para defeitos de fabricação,
            conforme o Código de Defesa do Consumidor. Em caso de necessidade, a Mobi orienta a
            solução pelo atendimento.
          </p>
        </details>
      </div>

      <div className="mobi-product-sticky" aria-label="Compra rápida">
        <div className="min-w-0">
          <span className="block text-[11px] leading-tight text-text-light">À vista</span>
          <strong className="block truncate text-base font-bold leading-tight text-deep-green">
            {formatBRL(currentPrice)}
          </strong>
        </div>
        <button type="button" onClick={addToCart} className="mobi-product-sticky-button">
          Comprar agora
        </button>
      </div>

      <Dialog.Root open={zoomOpen} onOpenChange={setZoomOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="mobi-product-dialog-overlay" />
          <Dialog.Content
            className="mobi-product-zoom-dialog"
            onKeyDown={(event) => {
              if (images.length < 2 || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
              event.preventDefault();
              moveImage(event.key === "ArrowRight" ? 1 : -1);
            }}
          >
            <Dialog.Title className="sr-only">Foto ampliada de {product.nome}</Dialog.Title>
            <Dialog.Description className="sr-only">
              Use as setas para passar as fotos. Pressione Escape para fechar.
            </Dialog.Description>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Fechar foto ampliada"
                className="mobi-product-dialog-close"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </Dialog.Close>
            <ImageWithFallback
              src={images[activePhoto]}
              fallbackSrcs={images.filter((_, index) => index !== activePhoto)}
              alt={`${product.nome} — foto ampliada ${activePhoto + 1}`}
              className="mobi-product-zoom-image"
            />
            {images.length > 1 && (
              <div className="mobi-product-zoom-controls">
                <button type="button" aria-label="Foto anterior" onClick={() => moveImage(-1)}>
                  <ChevronLeft size={19} aria-hidden="true" />
                </button>
                <span>
                  {activePhoto + 1} de {images.length}
                </span>
                <button type="button" aria-label="Próxima foto" onClick={() => moveImage(1)}>
                  <ChevronRight size={19} aria-hidden="true" />
                </button>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={paymentOpen} onOpenChange={setPaymentOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="mobi-product-dialog-overlay" />
          <Dialog.Content className="mobi-product-payment-dialog">
            <div className="mobi-product-payment-header">
              <div>
                <Dialog.Title className="m-0 text-xl font-semibold text-deep-green">
                  Formas de pagamento
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-text-light">
                  Condições usadas no preço deste móvel.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Fechar formas de pagamento"
                  className="mobi-product-dialog-close-inline"
                >
                  <X size={19} aria-hidden="true" />
                </button>
              </Dialog.Close>
            </div>
            <div
              className="mobi-product-payment-tabs"
              role="tablist"
              aria-label="Meio de pagamento"
            >
              {(["pix", "cash", "card"] as const).map((method, index) => (
                <button
                  key={method}
                  ref={(element) => {
                    paymentTabRefs.current[index] = element;
                  }}
                  type="button"
                  role="tab"
                  id={`mobi-payment-tab-${method}`}
                  aria-controls="mobi-payment-panel"
                  aria-selected={paymentMethod === method}
                  tabIndex={paymentMethod === method ? 0 : -1}
                  onClick={() => setPaymentMethod(method)}
                  onKeyDown={(event) => {
                    const methods = ["pix", "cash", "card"] as const;
                    const next =
                      event.key === "ArrowRight"
                        ? (index + 1) % methods.length
                        : event.key === "ArrowLeft"
                          ? (index - 1 + methods.length) % methods.length
                          : event.key === "Home"
                            ? 0
                            : event.key === "End"
                              ? methods.length - 1
                              : -1;
                    if (next < 0) return;
                    event.preventDefault();
                    setPaymentMethod(methods[next]);
                    paymentTabRefs.current[next]?.focus();
                  }}
                >
                  {method === "pix" ? "Pix" : method === "cash" ? "Dinheiro" : "Cartão"}
                </button>
              ))}
            </div>
            <div
              className="mobi-product-payment-detail"
              role="tabpanel"
              id="mobi-payment-panel"
              aria-labelledby={`mobi-payment-tab-${paymentMethod}`}
              tabIndex={0}
            >
              {paymentMethod === "card" ? (
                <>
                  <span className="text-sm text-text-light">Até {MAX_INSTALLMENTS} parcelas</span>
                  <strong>
                    {MAX_INSTALLMENTS}x de {formatBRL(payment.approximateInstallment)}
                  </strong>
                  <span className="text-sm text-cacau">
                    Total no cartão: {formatBRL(payment.total)}
                  </span>
                  <span className="text-xs text-text-light">
                    Parcelamento de 1x a {MAX_INSTALLMENTS}x pelo mesmo total. Consulte outras
                    condições com a Mobi.
                  </span>
                </>
              ) : (
                <>
                  <span className="text-sm text-text-light">
                    Valor à vista no {paymentMethod === "pix" ? "Pix" : "dinheiro"}
                  </span>
                  <strong>{formatBRL(currentPrice)}</strong>
                  <span className="text-sm text-cacau">
                    Pagamento combinado na entrega com a Mobi.
                  </span>
                </>
              )}
            </div>
            <Dialog.Close asChild>
              <button type="button" className="mobi-product-payment-close">
                Fechar
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
