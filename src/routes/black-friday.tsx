import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CreditCard, MessageCircle, Truck } from "lucide-react";
import { ProductCard, productDisplayPrice } from "@/components/ProductCard";
import { produtosQueryOptions } from "@/lib/products.functions";
import { hasRealReferencePrice } from "@/lib/price-reference";
import { MAX_INSTALLMENTS, WHATSAPP_URL } from "@/lib/constants";
import { seoHead } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-metadata";

export const Route = createFileRoute("/black-friday")({
  loader: ({ context }) => context.queryClient.ensureQueryData(produtosQueryOptions()),
  head: () =>
    seoHead(
      "Black Friday Mobi | Ofertas para sua casa",
      "Confira as ofertas disponíveis na Mobi. Compare móveis, medidas e preços e compre com pagamento na entrega.",
      `${SITE_URL}/black-friday`,
    ),
  pendingComponent: () => (
    <div className="mobi-black-page mobi-black-state" role="status">
      Carregando ofertas da Mobi…
    </div>
  ),
  errorComponent: ({ reset }) => (
    <div className="mobi-black-page mobi-black-state" role="alert">
      <h1>Não foi possível carregar as ofertas.</h1>
      <button onClick={reset}>Tentar novamente</button>
      <Link to="/" search={{}}>
        Voltar à loja
      </Link>
    </div>
  ),
  component: BlackFridayPage,
});

function BlackFridayPage() {
  const initialData = Route.useLoaderData();
  const { data: products = initialData } = useQuery({ ...produtosQueryOptions(), initialData });
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("recommended");
  const offers = useMemo(
    () =>
      products.filter((product) =>
        hasRealReferencePrice(product.preco_antigo, productDisplayPrice(product)),
      ),
    [products],
  );
  const categories = [...new Set(offers.map((product) => product.categoria))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
  const filtered = useMemo(() => {
    const result = offers.filter((product) => category === "all" || product.categoria === category);
    if (sort === "low") result.sort((a, b) => productDisplayPrice(a) - productDisplayPrice(b));
    if (sort === "high") result.sort((a, b) => productDisplayPrice(b) - productDisplayPrice(a));
    return result;
  }, [offers, category, sort]);
  const [limit, setLimit] = useState(24);
  return (
    <div className="mobi-black-page">
      <div className="mobi-wrap mobi-black-breadcrumb">
        <Link to="/" search={{}}>
          Início
        </Link>
        <span aria-hidden="true">/</span>
        <span>Black Friday Mobi</span>
      </div>
      <a
        className="mobi-black-art"
        href="#ofertas-black"
        aria-label="Black Friday Mobi: confira as ofertas disponíveis"
      >
        <picture>
          <source media="(max-width: 767px)" srcSet="/banners/mobi-20261117-black-mobile.webp" />
          <img
            src="/banners/mobi-20261117-black-desktop.webp"
            alt="Black Friday Mobi. Conforto para renovar sua casa. Confira os modelos."
            width="1958"
            height="803"
            fetchPriority="high"
          />
        </picture>
      </a>
      <div className="mobi-wrap mobi-black-benefits" aria-label="Como comprar na Mobi">
        <span>
          <Truck size={18} aria-hidden="true" />
          Pagamento na entrega
        </span>
        <span>
          <CreditCard size={18} aria-hidden="true" />
          Cartão em até {MAX_INSTALLMENTS}x
        </span>
        <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
          <MessageCircle size={18} aria-hidden="true" />
          Atendimento pelo WhatsApp
        </a>
      </div>
      <section
        id="ofertas-black"
        className="mobi-wrap mobi-black-offers"
        aria-labelledby="black-title"
      >
        <div className="mobi-black-heading">
          <div>
            <span className="mobi-black-eyebrow">SUA CASA, SEU NOVO MOMENTO</span>
            <h1 id="black-title">
              Black Friday <span>Mobi</span>
            </h1>
            <p>
              Explore as ofertas disponíveis no catálogo e encontre o móvel que combina com você.
            </p>
          </div>
          <Link to="/" search={{ all: true, page: 1 }}>
            Ver catálogo completo <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
        {offers.length > 0 ? (
          <>
            <div className="mobi-black-toolbar">
              <label>
                Categoria
                <select
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value);
                    setLimit(24);
                  }}
                >
                  <option value="all">Todas as categorias</option>
                  {categories.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Ordenar por
                <select
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value);
                    setLimit(24);
                  }}
                >
                  <option value="recommended">Recomendados</option>
                  <option value="low">Menor preço</option>
                  <option value="high">Maior preço</option>
                </select>
              </label>
              <p role="status" aria-live="polite">
                {filtered.length}{" "}
                {filtered.length === 1 ? "oferta disponível" : "ofertas disponíveis"}
              </p>
            </div>
            <div className="mobi-grid mobi-home-product-grid">
              {filtered.slice(0, limit).map((product) => (
                <ProductCard key={product.id} produto={product} />
              ))}
            </div>
            {limit < filtered.length && (
              <div className="mobi-black-more">
                <button onClick={() => setLimit((value) => value + 24)}>
                  Ver mais ofertas <ArrowRight size={17} aria-hidden="true" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="mobi-black-empty">
            <h2>Estamos preparando nossa seleção.</h2>
            <p>Enquanto isso, conheça os móveis e preços atuais da Mobi.</p>
            <Link to="/" search={{ all: true, page: 1 }}>
              Explorar o catálogo <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        )}
        <div className="mobi-black-help">
          <div>
            <h2>Encontrou o móvel ideal?</h2>
            <p>Fale com a Mobi para conferir cores, medidas e entrega para sua região.</p>
          </div>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
            Falar com a Mobi <MessageCircle size={18} aria-hidden="true" />
          </a>
        </div>
      </section>
    </div>
  );
}
