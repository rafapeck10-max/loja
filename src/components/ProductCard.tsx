import { Link } from "@tanstack/react-router";
import { Search, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatBRL, MAX_INSTALLMENTS } from "@/lib/constants";
import type { Produto } from "@/lib/products.functions";
import { cardInstallment, cardTotal } from "@/lib/payment";

export function ProductCard({ produto }: { produto: Produto }) {
  const { addItem } = useCart();
  const cardPrice = cardTotal(produto.preco_novo);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-cacau/8 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-hover">
      <span className="pointer-events-none absolute inset-0 border border-transparent transition-colors duration-500 group-hover:border-gold" />
      <Link
        to="/produto/$id"
        params={{ id: produto.slug }}
        className="block overflow-hidden bg-sand"
        aria-label={produto.nome}
      >
        <img
          src={produto.imagem_url}
          alt={produto.nome}
          loading="lazy"
          className="aspect-square w-full object-contain p-2 transition-transform duration-700 group-hover:scale-105 sm:p-3"
          onError={(event) => {
            event.currentTarget.style.visibility = "hidden";
          }}
        />
      </Link>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="mb-2 min-h-[2.5rem] line-clamp-2 font-sans text-sm font-semibold leading-snug text-cacau md:min-h-[3rem] md:text-base">
          {produto.nome}
        </h3>
        <div className="text-xs text-text-light line-through">{formatBRL(cardPrice)}</div>
        <div className="text-lg font-bold text-price-green sm:text-2xl">
          {formatBRL(produto.preco_novo)}
        </div>
        <div className="mb-3 min-h-[3.2em] text-[11px] font-medium leading-relaxed text-text-light">
          À vista no PIX ou {MAX_INSTALLMENTS}x de {formatBRL(cardInstallment(produto.preco_novo))}{" "}
          no cartão
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <Link
            to="/produto/$id"
            params={{ id: produto.slug }}
            className="flex min-w-0 items-center justify-center gap-1 rounded-full border border-gold px-2 min-h-11 py-2 text-center text-xs font-bold text-cacau no-underline transition-all duration-300 hover:bg-gold hover:text-deep-green sm:gap-2 sm:px-3 sm:text-xs"
          >
            <Search className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" /> Olhar{" "}
          </Link>
          <button
            type="button"
            aria-label={"Comprar " + produto.nome}
            onClick={() =>
              addItem({
                id: produto.id,
                name: produto.nome,
                price: produto.preco_novo,
                cardPrice,
                img: produto.imagem_url,
              })
            }
            className="flex min-w-0 items-center justify-center gap-1 rounded-full bg-deep-green px-2 min-h-11 py-2 text-xs font-bold text-sand transition-colors hover:bg-gold hover:text-deep-green sm:gap-2 sm:px-3 sm:text-xs"
          >
            <ShoppingBag className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" /> Comprar
          </button>
        </div>
      </div>
    </article>
  );
}
