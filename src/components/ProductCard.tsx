import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatBRL } from "@/lib/constants";
import type { Produto } from "@/lib/products.functions";

export function ProductCard({ produto }: { produto: Produto }) {
  const { addItem } = useCart();

  return (
    <div className="group relative flex h-full flex-col border border-cacau/8 bg-card p-4 transition-all duration-500 hover:-translate-y-2 hover:shadow-hover md:p-6">
      <span className="pointer-events-none absolute inset-0 border border-transparent transition-colors duration-500 group-hover:border-gold" />
      <Link
        to="/produto/$id"
        params={{ id: produto.slug }}
        className="mb-4 block overflow-hidden"
        aria-label={produto.nome}
      >
        <img
          src={produto.imagem_url}
          alt={produto.nome}
          loading="lazy"
          className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </Link>
      <h3 className="mb-2 font-sans text-sm font-semibold leading-snug text-cacau md:text-base">
        {produto.nome}
      </h3>
      <div className="text-xs text-text-light line-through">{formatBRL(produto.preco_antigo)}</div>
      <div className="text-xl font-bold text-price-green">{formatBRL(produto.preco_novo)}</div>
      <div className="mb-4 text-[11px] font-medium text-text-light">
        À vista no PIX ou 10x sem juros
      </div>
      <div className="mt-auto flex gap-2.5">
        <Link
          to="/produto/$id"
          params={{ id: produto.slug }}
          className="grow border border-deep-green bg-deep-green px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-sand no-underline transition-all duration-300 hover:bg-gold hover:border-gold hover:text-deep-green"
        >
          Detalhes
        </Link>
        <button
          aria-label={`Adicionar ${produto.nome} ao carrinho`}
          onClick={() =>
            addItem({
              id: produto.id,
              name: produto.nome,
              price: produto.preco_novo,
              img: produto.imagem_url,
            })
          }
          className="flex w-11 shrink-0 items-center justify-center border border-deep-green text-deep-green transition-all duration-300 hover:bg-gold hover:border-gold hover:text-deep-green"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
