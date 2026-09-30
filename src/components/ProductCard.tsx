import { Link } from "@tanstack/react-router";
import { Sparkles, Star } from "lucide-react";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { CATEGORIES, categoryMatches, formatBRL, MAX_INSTALLMENTS } from "@/lib/constants";
import type { Produto } from "@/lib/products.functions";
import { cardInstallment } from "@/lib/payment";

export type ProductBadge = "week" | "new";
export function productDisplayPrice(produto: Produto) {
  const variations = (produto as Produto & { variacoes_preco?: { sale_price: number | null }[] })
    .variacoes_preco;
  return (
    variations?.find((variation) => variation.sale_price != null && variation.sale_price > 0)
      ?.sale_price ?? produto.preco_novo
  );
}
export function ProductCard({ produto, badge }: { produto: Produto; badge?: ProductBadge }) {
  const price = productDisplayPrice(produto);
  const category = CATEGORIES.find(
    (item) => item.slug !== "sala-de-estar" && categoryMatches(produto.categoria, item.slug),
  );
  const categoryLabel =
    category?.slug === "decoracao" ? "Decoração" : (category?.shortLabel ?? produto.categoria);
  const detail =
    [produto.medidas, ...(produto.cores ?? [])].filter(Boolean).join(" · ") || produto.categoria;
  return (
    <article className="mobi-product">
      <Link
        to="/produto/$id"
        params={{ id: produto.slug }}
        className="mobi-photo"
        aria-label={`Ver ${produto.nome}`}
      >
        <ImageWithFallback src={produto.imagem_url} alt={produto.nome} loading="lazy" />
      </Link>
      <div className="mobi-badge-row">
        {badge && (
          <span className={`mobi-badge mobi-badge-${badge}`}>
            {badge === "new" ? (
              <Sparkles size={13} strokeWidth={1.8} aria-hidden="true" />
            ) : (
              <Star size={13} strokeWidth={1.8} aria-hidden="true" />
            )}
            <span>{badge === "new" ? "Novo no catálogo" : "Escolha da semana"}</span>
          </span>
        )}
      </div>
      <div className="mobi-product-body">
        <small>{categoryLabel}</small>
        <h3 title={produto.nome}>{produto.nome}</h3>
        <p className="mobi-detail" title={detail}>
          {detail}
        </p>
        <div className="mobi-price-panel">
          <div className="mobi-price">
            {formatBRL(price)} <span>no PIX</span>
          </div>
          <p className="mobi-installments">
            ou {MAX_INSTALLMENTS}x de {formatBRL(cardInstallment(price))} no cartão
          </p>
        </div>
        <Link to="/produto/$id" params={{ id: produto.slug }} className="mobi-product-cta">
          Ver detalhes
        </Link>
      </div>
    </article>
  );
}
