import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Minus,
  Plus,
  ShoppingCart,
} from "lucide-react";
import { produtoQueryOptions } from "@/lib/products.functions";
import { PRODUCT_DETAILS, FALLBACK_DETAIL, type ProductDetail } from "@/lib/product-details";
import { formatBRL } from "@/lib/constants";
import { useCart } from "@/lib/cart-context";
import { CompreJunto } from "@/components/CompreJunto";

export const Route = createFileRoute("/produto/$id")({
  loader: async ({ context, params }) => {
    const produto = await context.queryClient.ensureQueryData(produtoQueryOptions(params.id));
    if (!produto) throw notFound();
    return { nome: produto.nome, imagem: produto.imagem_url };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Produto não encontrado | Mobili" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    return {
      meta: [
        { title: `${loaderData.nome} | Mobili` },
        {
          name: "description",
          content: `${loaderData.nome} — móvel premium da coleção Raízes do Luxo, direto da fábrica com entrega na Baixada Fluminense.`,
        },
        { property: "og:title", content: `${loaderData.nome} | Mobili` },
        {
          property: "og:description",
          content: `${loaderData.nome} — móvel premium direto da fábrica com entrega na Baixada.`,
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
    <div className="mx-auto flex min-h-[40vh] max-w-[1300px] flex-col items-center justify-center gap-4 px-[5%] py-20 text-center">
      <h1 className="text-3xl text-deep-green">Produto não encontrado</h1>
      <p className="text-sm text-text-light">Este móvel não está mais disponível na coleção.</p>
      <Link
        to="/"
        search={{}}
        className="bg-deep-green px-6 py-3 text-xs font-bold uppercase tracking-wider text-sand no-underline transition-colors hover:bg-gold hover:text-deep-green"
      >
        Ver coleção completa
      </Link>
    </div>
  );
}

function ProductError({ reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-[1300px] flex-col items-center justify-center gap-4 px-[5%] py-20 text-center">
      <p className="text-text-light">Não foi possível carregar este produto agora.</p>
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

/* Timer de escassez: contagem regressiva até a meia-noite (renderizado só no cliente) */
function ScarcityTimer() {
  const [remaining, setRemaining] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      const diff = Math.max(0, end.getTime() - now.getTime());
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setRemaining(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mb-6 flex items-center gap-3 border border-gold bg-gold/10 px-4 py-3">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold" />
      </span>
      <Clock className="h-4 w-4 text-gold" />
      <p className="text-xs font-semibold uppercase tracking-wide text-cacau">
        Oferta relâmpago termina em{" "}
        <span className="font-mono text-sm font-bold text-gold">{remaining ?? "--:--:--"}</span>
      </p>
    </div>
  );
}

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-cacau/10">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left font-sans text-sm font-bold uppercase tracking-wide text-cacau transition-colors hover:text-gold"
      >
        <span>{title}</span>
        <ChevronDown
          className={`h-4 w-4 text-gold transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open ? "grid-rows-[1fr] pb-4 opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
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

  const detail: ProductDetail = PRODUCT_DETAILS[id] ?? {
    ...FALLBACK_DETAIL,
    fullTitle: produto?.nome ?? "",
    images: [{ src: produto?.imagem_url ?? "", alt: produto?.nome ?? "" }],
  };

  const [activeSlide, setActiveSlide] = useState(0);
  const [color, setColor] = useState(detail.colors[0]?.name ?? null);
  const [finish, setFinish] = useState(detail.finishes[0] ?? null);
  const [qty, setQty] = useState(1);

  const ctaRef = useRef<HTMLDivElement | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Mostra a barra quando o CTA principal saiu de vista (usuário rolou para baixo)
        setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0, rootMargin: "0px 0px -20% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!produto) return null;

  const pixPrice = produto.preco_novo * 0.95;
  const installment = produto.preco_novo / 10;

  const handleAdd = () => {
    addItem({
      id: produto.id,
      name: produto.nome,
      price: produto.preco_novo,
      img: produto.imagem_url,
      quantity: qty,
      color,
      finish,
    });
  };

  const handleBuyNow = () => {
    handleAdd();
    openCart();
  };

  return (
    <div className="mx-auto my-10 max-w-[1300px] px-[5%]">
      {/* Breadcrumb */}
      <div className="mb-6 text-[11px] uppercase tracking-wider text-text-light">
        <Link to="/" search={{}} className="text-inherit no-underline hover:text-gold">
          Início
        </Link>
        {" \u00A0/\u00A0 "}
        <span>{detail.category}</span>
        {" \u00A0/\u00A0 "}
        <span className="font-semibold text-gold">{produto.nome}</span>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        {/* Galeria */}
        <div>
          <div className="relative overflow-hidden bg-white">
            <div
              className="flex transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
              {detail.images.map((img) => (
                <img
                  key={img.src}
                  src={img.src}
                  alt={img.alt}
                  className="aspect-square w-full shrink-0 object-cover"
                />
              ))}
            </div>
            {detail.images.length > 1 && (
              <>
                <button
                  aria-label="Imagem Anterior"
                  onClick={() =>
                    setActiveSlide((s) => (s - 1 + detail.images.length) % detail.images.length)
                  }
                  className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-deep-green shadow-premium transition-colors hover:bg-gold hover:text-white"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  aria-label="Próxima Imagem"
                  onClick={() => setActiveSlide((s) => (s + 1) % detail.images.length)}
                  className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-deep-green shadow-premium transition-colors hover:bg-gold hover:text-white"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                  {detail.images.map((img, i) => (
                    <button
                      key={img.src}
                      aria-label={`Ir para imagem ${i + 1}`}
                      onClick={() => setActiveSlide(i)}
                      className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                        i === activeSlide ? "scale-110 bg-gold" : "bg-white/70 hover:bg-white"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {detail.images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {detail.images.map((img, i) => (
                <button
                  key={img.src}
                  onClick={() => setActiveSlide(i)}
                  aria-label={img.alt}
                  className={`overflow-hidden border-2 transition-all duration-300 ${
                    i === activeSlide
                      ? "border-gold opacity-100"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img.src} alt={img.alt} className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Painel de compra — sticky no desktop */}
        <div className="lg:sticky lg:top-32 lg:self-start">
          <span className="text-[11px] font-semibold uppercase tracking-[2px] text-gold">
            {detail.tag}
          </span>
          <h1 className="mb-5 mt-2 text-3xl leading-tight text-deep-green md:text-4xl">
            {detail.fullTitle || produto.nome}
          </h1>

          <ScarcityTimer />

          <div className="mb-6 border-l-[3px] border-gold bg-white px-5 py-4">
            <div className="text-sm text-text-light line-through">
              {formatBRL(produto.preco_antigo)}
            </div>
            <div className="text-4xl font-bold text-price-green">
              {formatBRL(produto.preco_novo)}
            </div>
            <div className="mt-1 flex items-start gap-1.5 text-xs text-text-light">
              <svg
                viewBox="0 0 512 512"
                fill="currentColor"
                className="mt-px h-4 w-4 shrink-0 text-price-green"
                aria-hidden="true"
              >
                <path d="M393.8 183.3c-16.8-16.8-44-16.8-60.8 0l-73.6 73.6c-4.7 4.7-12.3 4.7-17 0l-73.6-73.6c-16.8-16.8-44-16.8-60.8 0L56.3 235c-16.8 16.8-16.8 44 0 60.8l51.6 51.7c16.8 16.8 44 16.8 60.8 0l73.6-73.6c4.7-4.7 12.3-4.7 17 0l73.6 73.6c16.8 16.8 44 16.8 60.8 0l51.7-51.7c16.8-16.8 16.8-44 0-60.8l-51.7-51.7z" />
              </svg>
              <span>
                <strong className="text-cacau">{formatBRL(pixPrice)}</strong> à vista no PIX (5%
                desc.) ou <strong className="text-cacau">10x de {formatBRL(installment)}</strong> sem
                juros nos cartões.
              </span>
            </div>
          </div>

          {/* Seletores */}
          <div className="mb-6 flex flex-wrap gap-x-10 gap-y-5">
            {detail.colors.length > 0 && (
              <div>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-cacau">
                  Cor do Tecido:
                </span>
                <div className="flex gap-2.5">
                  {detail.colors.map((c) => (
                    <button
                      key={c.name}
                      title={c.name}
                      aria-label={c.name}
                      onClick={() => setColor(c.name)}
                      className={`h-8 w-8 rounded-full border-2 transition-all duration-300 ${
                        color === c.name
                          ? "scale-110 border-gold ring-2 ring-gold/30"
                          : "border-cacau/20 hover:scale-105"
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            {detail.finishes.length > 0 && (
              <div>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-cacau">
                  Pés:
                </span>
                <div className="flex flex-wrap gap-2">
                  {detail.finishes.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFinish(f)}
                      className={`border px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${
                        finish === f
                          ? "border-gold bg-gold text-deep-green"
                          : "border-cacau/20 bg-white text-cacau hover:border-gold"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-cacau">
                Quantidade:
              </span>
              <div className="flex items-center gap-4 border border-cacau/20 bg-white px-3 py-1.5">
                <button
                  aria-label="Diminuir"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="text-cacau transition-colors hover:text-gold"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-5 text-center font-sans text-sm font-bold">{qty}</span>
                <button
                  aria-label="Aumentar"
                  onClick={() => setQty((q) => q + 1)}
                  className="text-cacau transition-colors hover:text-gold"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <p className="mb-7 text-sm leading-relaxed text-text-light">{detail.description}</p>

          {/* CTAs */}
          <div ref={ctaRef} className="mb-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleAdd}
              className="grow bg-deep-green px-6 py-4 text-sm font-bold uppercase tracking-[1.5px] text-sand transition-all duration-300 hover:bg-gold hover:text-deep-green"
            >
              Adicionar ao Carrinho
            </button>
            <button
              onClick={handleBuyNow}
              className="grow border-2 border-gold bg-transparent px-6 py-4 text-sm font-bold uppercase tracking-[1.5px] text-gold transition-all duration-300 hover:bg-gold hover:text-deep-green"
            >
              Comprar Agora
            </button>
          </div>

          {/* Accordions */}
          <div className="border-t border-cacau/10">
            {detail.specs.length > 0 && (
              <Accordion title="Especificações Técnicas">
                <ul className="space-y-2">
                  {detail.specs.map((s) => (
                    <li key={s.label}>
                      <strong className="text-cacau">{s.label}:</strong> {s.value}
                    </li>
                  ))}
                </ul>
              </Accordion>
            )}
            <Accordion title="Entrega e Montagem (Baixada Fluminense)">
              <p className="mb-3">
                Entregamos e montamos em toda a Baixada Fluminense (Nova Iguaçu, Duque de Caxias,
                Belford Roxo, Nilópolis, Mesquita, São João de Meriti) e Grande Rio de Janeiro.
                Nossos entregadores sobem até o apartamento (verifique as dimensões dos elevadores e
                portas antes da compra).
              </p>
              <p>
                <strong className="text-cacau">Frete Grátis e Pagamento na Entrega:</strong> Combine
                sua data ideal via WhatsApp e pague apenas quando o produto for montado e aprovado
                em seu domicílio!
              </p>
            </Accordion>
            <Accordion title="Garantia e Assistência">
              <p>
                Todos os produtos da Mobili possuem garantia integral de 1 ano contra qualquer
                defeito estrutural, de solda ou costura da madeira. Assistência técnica rápida
                direta de fábrica em domicílio para o seu total conforto e segurança.
              </p>
            </Accordion>
          </div>
        </div>
      </div>

      <CompreJunto current={produto} />

      {/* Sticky Bottom Bar (mobile) */}
      <div
        aria-hidden={!showStickyBar}
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-cacau/10 bg-sand/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(73,51,39,0.12)] transition-transform duration-300 lg:hidden ${
          showStickyBar ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-[1300px] items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-wider text-text-light">Total</div>
            <div className="truncate text-lg font-bold leading-tight text-price-green">
              {formatBRL(produto.preco_novo * qty)}
            </div>
          </div>
          <button
            onClick={handleBuyNow}
            className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-deep-green px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-sand transition-colors duration-300 hover:bg-gold hover:text-deep-green"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Comprar Agora</span>
          </button>
        </div>
      </div>
    </div>
  );
}
