import { Link } from "@tanstack/react-router";
import { Sparkles, Star } from "lucide-react";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { ProductPriceDisplay } from "@/components/ProductPriceDisplay";
import { CATEGORIES, categoryMatches, MAX_INSTALLMENTS } from "@/lib/constants";
import {
  getCatalogColors,
  getCatalogDimensionLabel,
  getCatalogMaterials,
} from "@/lib/catalog-search";
import type { Produto } from "@/lib/products.functions";
import { cardQuote } from "@/lib/payment";
import { productDisplayPrice } from "@/lib/product-display-price";
import { isBlackFridayProduct } from "@/lib/black-friday";
import { BlackFridayBadge } from "./BlackFridayBadge";
import { resolveDisplayOldPrice } from "@/lib/price-reference";
export { productDisplayPrice } from "@/lib/product-display-price";

export type ProductBadge = "week" | "new";
export function ProductCard({
  produto,
  badge,
  returnPage,
  returnCategory,
  returnSearch,
}: {
  produto: Produto;
  badge?: ProductBadge;
  returnPage?: number;
  returnCategory?: string;
  returnSearch?: string;
}) {
  const price = productDisplayPrice(produto);
  const blackFriday = isBlackFridayProduct(produto);
  const payment = cardQuote(price, MAX_INSTALLMENTS);
  const saveCatalogReturnPosition = () => {
    if (!returnPage || typeof window === "undefined") return;
    try {
      sessionStorage.setItem(
        "mobi:catalog-return-position",
        JSON.stringify({
          category: returnCategory ?? "__root__",
          page: returnPage,
          scrollY: window.scrollY,
        }),
      );
    } catch {
      // Navigation should still work if browser storage is unavailable.
    }
  };
  const hasPricedVariations = (produto.variacoes_preco ?? []).some(
    (variation) => variation.sale_price != null && variation.sale_price > 0,
);
  const displayOldPrice = resolveDisplayOldPrice({ oldPrice: hasPricedVariations ? 0 : produto.preco_antigo, currentPrice: price, productKey: produto.slug, isBlackFriday: blackFriday });
  
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
        search={{
          ...(returnPage ? { returnPage } : {}),
          ...(returnCategory ? { returnCategory } : {}),
          ...(returnSearch ? { returnSearch } : {}),
        }}
        onClick={saveCatalogReturnPosition}
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
      {blackFriday && <BlackFridayBadge />}
      {badge && !blackFriday && (
        <div className="mobi-badge-row">
          {
            <span className={`mobi-badge mobi-badge-${badge}`}>
              {badge === "new" ? (
                <Sparkles size={13} strokeWidth={1.8} aria-hidden="true" />
              ) : (
                <Star size={13} strokeWidth={1.8} aria-hidden="true" />
              )}
              <span>{badge === "new" ? "Novo no catálogo" : "Escolha da semana"}</span>
            </span>
          }
        </div>
      )}
      <div className="mobi-product-body">
        <small>{categoryLabel}</small>
        <h3 title={produto.nome}>{produto.nome}</h3>
        <p className="mobi-detail" title={detail}>
          {detail}
        </p>
        <div className="mobi-price-panel">
          <ProductPriceDisplay
            oldPrice={displayOldPrice}
            price={price}
            payment={payment}
            layout="card"
          />
        </div>
        <Link
          to="/produto/$id"
          params={{ id: produto.slug }}
          search={{
            ...(returnPage ? { returnPage } : {}),
            ...(returnCategory ? { returnCategory } : {}),
            ...(returnSearch ? { returnSearch } : {}),
          }}
          onClick={saveCatalogReturnPosition}
          className="mobi-product-cta"
        >
          Ver detalhes
        </Link>
      </div>
    </article>
  );
}
