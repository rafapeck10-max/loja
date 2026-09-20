import { useState, type ReactNode } from "react";
import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
} from "lucide-react";
import { produtoQueryOptions, type Produto } from "@/lib/products.functions";
import { formatBRL, MAX_INSTALLMENTS, SUBCATEGORIES, categoryMatches } from "@/lib/constants";
import { useCart } from "@/lib/cart-context";
import { publicDescription } from "@/lib/product-copy";
import { CompreJunto } from "@/components/CompreJunto";
import { cardInstallment, cardTotal, installmentRate } from "@/lib/payment";

export const Route = createFileRoute("/produto/$id")({
  loader: async ({ context, params }) => {
    const produto = await context.queryClient.ensureQueryData(produtoQueryOptions(params.id));
    if (!produto) throw notFound();
    return { nome: produto.nome, imagem: produto.imagem_url };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Produto não encontrado | Mobi" }, { name: "robots", content: "noindex" }],
      };
    }
    return {
      meta: [
        { title: `${loaderData.nome} | Mobi` },
        {
          name: "description",
          content: `${loaderData.nome} — disponível para entrega na Baixada Fluminense.`,
        },
        { property: "og:title", content: `${loaderData.nome} | Mobi` },
        {
          property: "og:description",
          content: `${loaderData.nome} — confira preço, detalhes e condições de entrega.`,
        },
        { property: "og:image", content: loaderData.imagem },
        { name: "twitter:image", content: loaderData.imagem },
      ],
    };
  },
  component: ProductPage,
  errorComponent: ProductError,
  notFoundComponent: ProductNotFound,
});

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

function ProductError({ reset }: { error: Error; reset: () => void }) {
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

const COLOR_SWATCHES = ["#d1c7bd", "#493327", "#2e3f32", "#c5a059", "#5b6570", "#b16860"];

function galleryFor(produto: Produto) {
  return Array.from(new Set([produto.imagem_url, ...produto.imagens])).filter((src) =>
    /^https?:\/\//i.test(src),
  );
}

function Accordion({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-cacau/10">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-bold uppercase tracking-wide text-cacau transition-colors hover:text-gold"
        aria-expanded={open}
      >
        <span>{title}</span>
        <ChevronDown
          className={`h-4 w-4 text-gold transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr] pb-4 opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden text-sm leading-relaxed text-text-light">{children}</div>
      </div>
    </div>
  );
}

function ProductPage() {
  const { id } = Route.useParams();
  const { data: produto } = useSuspenseQuery(produtoQueryOptions(id));
  const { addItem, openCart } = useCart();
  const [activeSlide, setActiveSlide] = useState(0);
  const [qty, setQty] = useState(1);
  const [color, setColor] = useState<string | null>(produto?.cores?.[0] ?? null);
  const [installmentCount, setInstallmentCount] = useState(MAX_INSTALLMENTS);

  if (!produto) return null;

  const images = galleryFor(produto);
  const pixPrice = produto.preco_novo;
  const cardPrice = cardTotal(pixPrice, installmentCount);
  const installment = cardInstallment(pixPrice, installmentCount);
  const installmentOptions = Array.from({ length: MAX_INSTALLMENTS }, (_, index) => index + 1);
  const colors = (produto.cores ?? []).map((name, index) => ({
    name,
    hex: COLOR_SWATCHES[index % COLOR_SWATCHES.length],
  }));
  const productDetails = [
    produto.sku ? { label: "Referência", value: produto.sku.split("|")[0].trim() } : null,
    produto.medidas ? { label: "Medidas", value: produto.medidas } : null,
    produto.cores?.length ? { label: "Cores", value: produto.cores.join(", ") } : null,
  ].filter((detail): detail is { label: string; value: string } => Boolean(detail));

  const handleAdd = () => {
    addItem({
      id: produto.id,
      name: produto.nome,
      price: produto.preco_novo,
      cardPrice,
      installmentCount,
      img: produto.imagem_url,
      quantity: qty,
      color,
    });
  };

  const handleBuyNow = () => {
    handleAdd();
    openCart();
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 pb-10 sm:px-6 sm:py-10 lg:px-10">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider text-text-light">
        <Link to="/" search={{}} className="text-inherit no-underline hover:text-gold">
          Início
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          to="/categoria/$slug"
          params={{ slug: categorySlug(produto.categoria) }}
          search={{ page: 1 }}
          className="text-inherit no-underline hover:text-gold"
        >
          {produto.categoria}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="max-w-full truncate font-semibold text-gold">{produto.nome}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:gap-14">
        <section aria-label="Galeria do produto">
          <div className="relative overflow-hidden rounded-3xl border border-cacau/10 bg-white p-2 shadow-premium sm:p-4">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
              {images.map((src) => (
                <div
                  key={src}
                  className="flex aspect-[4/3] w-full shrink-0 items-center justify-center bg-white"
                >
                  <img
                    src={src}
                    alt={produto.nome}
                    className="h-full w-full object-contain"
                    onError={(event) => {
                      event.currentTarget.style.visibility = "hidden";
                    }}
                  />
                </div>
              ))}
            </div>
            {images.length > 1 && (
              <>
                <button
                  aria-label="Imagem anterior"
                  onClick={() =>
                    setActiveSlide((slide) => (slide - 1 + images.length) % images.length)
                  }
                  className="absolute left-5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-deep-green shadow-premium transition-colors hover:bg-gold"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  aria-label="Próxima imagem"
                  onClick={() => setActiveSlide((slide) => (slide + 1) % images.length)}
                  className="absolute right-5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-deep-green shadow-premium transition-colors hover:bg-gold"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-deep-green/80 px-3 py-2">
                  {images.map((src, index) => (
                    <button
                      key={src}
                      aria-label={`Ir para imagem ${index + 1}`}
                      onClick={() => setActiveSlide(index)}
                      className={`h-2 w-2 rounded-full transition-all ${index === activeSlide ? "w-6 bg-gold" : "bg-white/70"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="scrollbar-none mt-3 flex gap-3 overflow-x-auto pb-1">
              {images.map((src, index) => (
                <button
                  key={src}
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Selecionar imagem ${index + 1}`}
                  className={`h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 bg-white p-1 transition-colors sm:h-24 sm:w-32 ${index === activeSlide ? "border-gold" : "border-transparent"}`}
                >
                  <img src={src} alt="" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="lg:sticky lg:top-28 lg:self-start">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[1.5px] text-gold">
            <span>{produto.categoria}</span>
          </div>
          <h1 className="max-w-2xl text-3xl leading-tight text-deep-green sm:text-4xl">
            {produto.nome}
          </h1>

          <div className="mt-5 flex items-center gap-2 rounded-xl border border-price-green/20 bg-price-green/5 px-4 py-3 text-sm font-semibold text-deep-green">
            <PackageCheck className="h-5 w-5 text-price-green" />
            Disponível para confirmar entrega
          </div>

          <div className="mt-5 rounded-2xl border-l-4 border-gold bg-white px-5 py-5 shadow-premium">
            <div className="text-sm text-text-light line-through">{formatBRL(cardPrice)}</div>
            <div className="text-4xl font-bold tracking-tight text-price-green sm:text-5xl">
              {formatBRL(produto.preco_novo)}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-text-light">
              <strong className="text-cacau">{formatBRL(pixPrice)}</strong> à vista no PIX ou cartão
              em até{" "}
              <strong className="text-cacau">
                {installmentCount}x de {formatBRL(installment)}
              </strong>{" "}
              na entrega.
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-cacau/10 bg-white shadow-premium">
            <div className="border-b border-cacau/10 px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-gold">
                Condições de pagamento
              </p>
              <h2 className="mt-1 text-2xl text-deep-green">Parcelamento no cartão</h2>
              <p className="mt-1 text-xs text-text-light">
                Escolha o número de parcelas. O valor de cada opção já considera a taxa do cartão.
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2 p-4 sm:grid-cols-6">
              {installmentOptions.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value} parcelas`}
                  aria-pressed={installmentCount === value}
                  onClick={() => setInstallmentCount(value)}
                  className={`flex min-h-12 flex-col items-center justify-center rounded-lg border text-sm font-bold transition-colors ${installmentCount === value ? "border-gold bg-gold/15 text-cacau" : "border-cacau/10 text-cacau hover:border-gold"}`}
                >
                  <span>{value}x</span>
                  <span className="text-[10px] font-medium">
                    {installmentRate(value).toFixed(2).replace(".", ",")}%
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-end justify-between gap-4 border-t border-cacau/10 px-5 py-4">
              <div>
                <p className="text-xs text-text-light">{installmentCount} parcelas de</p>
                <p className="text-xl font-bold text-price-green">{formatBRL(installment)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-light">Total no cartão</p>
                <p className="text-lg font-bold text-cacau">{formatBRL(cardPrice)}</p>
              </div>
            </div>
          </div>

          {colors.length > 0 && (
            <div className="mt-6">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-cacau">
                Cor / variação
              </span>
              <div className="flex flex-wrap gap-3">
                {colors.map((item) => (
                  <button
                    key={item.name}
                    title={item.name}
                    aria-label={item.name}
                    onClick={() => setColor(item.name)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${color === item.name ? "border-gold bg-gold/15 text-cacau" : "border-cacau/15 bg-white text-text-light hover:border-gold"}`}
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-cacau/20"
                      style={{ backgroundColor: item.hex }}
                    />
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-cacau">
                Quantidade
              </span>
              <div className="flex items-center gap-4 rounded-full border border-cacau/15 bg-white px-4 py-2">
                <button
                  aria-label="Diminuir quantidade"
                  onClick={() => setQty((value) => Math.max(1, value - 1))}
                  className="text-cacau hover:text-gold"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-5 text-center text-sm font-bold">{qty}</span>
                <button
                  aria-label="Aumentar quantidade"
                  onClick={() => setQty((value) => value + 1)}
                  className="text-cacau hover:text-gold"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            <span className="text-right text-xs text-text-light">
              Entrega em Nova Iguaçu
              <br />e regiões próximas
            </span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              onClick={handleBuyNow}
              className="flex items-center justify-center gap-2 rounded-full bg-deep-green px-5 py-4 text-xs font-bold uppercase tracking-[1.2px] text-sand transition-colors hover:bg-gold hover:text-deep-green"
            >
              <ShoppingCart className="h-4 w-4" /> Comprar agora
            </button>
            <button
              onClick={handleAdd}
              className="rounded-full border-2 border-gold px-5 py-4 text-xs font-bold uppercase tracking-[1.2px] text-cacau transition-colors hover:bg-gold hover:text-deep-green"
            >
              Adicionar ao carrinho
            </button>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 border-y border-cacau/10 py-4 text-center text-[10px] font-semibold uppercase tracking-wide text-text-light">
            <div className="flex flex-col items-center gap-1">
              <Truck className="h-5 w-5 text-gold" />
              Entrega combinada
            </div>
            <div className="flex flex-col items-center gap-1">
              <Store className="h-5 w-5 text-gold" />
              Pague na entrega
            </div>
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="h-5 w-5 text-gold" />
              Compra segura
            </div>
          </div>

          <div className="mt-2 border-t border-cacau/10">
            <Accordion title="Entrega e pagamento">
              <div className="space-y-3">
                <p className="flex gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  Atendemos Nova Iguaçu e regiões próximas. A data e o frete são combinados pelo
                  WhatsApp.
                </p>
                <p>
                  O pagamento é feito somente na entrega: PIX com desconto, cartão em até{" "}
                  {MAX_INSTALLMENTS}x ou dinheiro.
                </p>
              </div>
            </Accordion>
            <Accordion title="Garantia e Assistência">
              <p>
                Todos os produtos da Mobi possuem garantia legal de 90 dias para defeitos de
                fabricação, conforme o Código de Defesa do Consumidor. Em caso de necessidade,
                oferecemos assistência para orientar a solução do problema.
              </p>
            </Accordion>
          </div>
        </section>
      </div>

      {(productDetails.length > 0 || produto.descricao) && (
        <section className="mt-10 grid items-start gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          {productDetails.length > 0 && (
            <div className="rounded-2xl border border-cacau/10 bg-white p-5 shadow-premium sm:p-7">
              <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-gold">
                Informações do produto
              </p>
              <h2 className="mt-1 text-2xl text-deep-green">Características</h2>
              <dl className="mt-3 grid gap-x-5 sm:grid-cols-2 lg:grid-cols-1">
                {productDetails.map((detail) => (
                  <div key={detail.label} className="border-b border-cacau/10 py-3">
                    <dt className="text-xs font-medium text-text-light">{detail.label}</dt>
                    <dd className="mt-1 text-sm font-semibold leading-relaxed text-cacau">
                      {detail.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {produto.descricao && (
            <div className="rounded-2xl border border-cacau/10 bg-white p-5 shadow-premium sm:p-7">
              <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-gold">Detalhes</p>
              <h2 className="mt-1 text-2xl text-deep-green">Descrição do produto</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-cacau">
                {publicDescription(produto.descricao)}
              </p>
            </div>
          )}
        </section>
      )}

      <CompreJunto current={produto} />
    </div>
  );
}

function categorySlug(category: string) {
  return SUBCATEGORIES.find((c) => categoryMatches(category, c.slug))?.slug ?? "sala-de-estar";
}
