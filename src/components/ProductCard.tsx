import { Link } from "@tanstack/react-router";
import { Sparkles, Star } from "lucide-react";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { ProductDiscountLine } from "@/components/ProductDiscountLine";
import { CATEGORIES, categoryMatches, formatBRL, MAX_INSTALLMENTS } from "@/lib/constants";
import {
  getCatalogColors,
  getCatalogDimensionLabel,
  getCatalogMaterials,
} from "@/lib/catalog-search";
import type { Produto } from "@/lib/products.functions";
import { cardQuote } from "@/lib/payment";

export type ProductBadge = "week" | "new";
export function productDisplayPrice(produto: Produto) {
  const variations = (produto as Produto & { variacoes_preco?: { sale_price: number | null }[] })
    .variacoes_preco;
  return (
    variations?.find((variation) => variation.sale_price != null && variation.sale_price > 0)
      ?.sale_price ?? produto.preco_novo
  );
}
export function ProductCard({
  produto,
  badge,
  returnPage,
}: {
  produto: Produto;
  badge?: ProductBadge;
  returnPage?: number;
}) {
  const price = productDisplayPrice(produto);
  const payment = cardQuote(price, MAX_INSTALLMENTS);
  const hasPricedVariations = (produto.variacoes_preco ?? []).some(
    (variation) => variation.sale_price != null && variation.sale_price > 0,
  );
  const category = CATEGORIES.find(
    (item) => item.slug !== "sala-de-estar" && categoryMatches(produto.categoria, item.slug),
  );
  const categoryLabel =
    category?.slug === "decoracao" ? "Decoração" : (category?.shortLabel ?? produto.categoria);
  const detail =
    [
      getCatalogDimensionLabel(produto),
      getCatalogMaterials(produto).slice(0, 2).join(" / "),
      getCatalogColors(produto).slice(0, 2).join(" / "),
    ]
      .filter(Boolean)
      .join(" · ") || produto.categoria;
  return (
    <article className="mobi-product">
      <Link
        to="/produto/$id"
        params={{ id: produto.slug }}
        search={returnPage ? { returnPage } : {}}
        className="mobi-photo"
        aria-label={`Ver ${produto.nome}`}
      >
        <ImageWithFallback
          src={produto.imagem_url}
          fallbackSrcs={produto.imagens}
          alt={produto.nome}
          loading="lazy"
        />
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
          <ProductDiscountLine
            oldPrice={hasPricedVariations ? 0 : produto.preco_antigo}
            currentPrice={price}
            reserveSpace
          />
          <div className="mobi-price-label">À vista no Pix ou dinheiro</div>
          <div className="mobi-price">{formatBRL(price)}</div>
          <p className="mobi-installments">
            <strong>
              ou {payment.count}x de {formatBRL(payment.approximateInstallment)} sem juros
            </strong>
            <span>Total no cartão: {formatBRL(payment.total)}</span>
          </p>
        </div>
        <Link
          to="/produto/$id"
          params={{ id: produto.slug }}
          search={returnPage ? { returnPage } : {}}
          className="mobi-product-cta"
        >
          Ver detalhes
        </Link>
      </div>
    </article>
  );
}
