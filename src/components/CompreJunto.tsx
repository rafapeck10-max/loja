import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, RefreshCw, ShoppingCart } from "lucide-react";
import { produtosQueryOptions, type Produto } from "@/lib/products.functions";
import { formatBRL } from "@/lib/constants";
import { useCart } from "@/lib/cart-context";

interface Props {
  current: Produto;
}

function discountPct(oldPrice: number, newPrice: number) {
  if (!oldPrice || oldPrice <= newPrice) return 0;
  return Math.round(((oldPrice - newPrice) / oldPrice) * 100);
}

export function CompreJunto({ current }: Props) {
  const { data: produtos = [] } = useQuery(produtosQueryOptions());
  const { addItem, openCart } = useCart();

  const others = useMemo(() => produtos.filter((p) => p.id !== current.id), [produtos, current.id]);
  const [suggIndex, setSuggIndex] = useState(0);
  const [include, setInclude] = useState(true);

  if (others.length === 0) return null;

  const suggestion = others[suggIndex % others.length];
  const currentDiscount = discountPct(current.preco_antigo, current.preco_novo);
  const suggestionDiscount = discountPct(suggestion.preco_antigo, suggestion.preco_novo);

  const total = current.preco_novo + (include ? suggestion.preco_novo : 0);

  const handleAdd = () => {
    addItem({
      id: current.id,
      name: current.nome,
      price: current.preco_novo,
      img: current.imagem_url,
    });
    if (include) {
      addItem({
        id: suggestion.id,
        name: suggestion.nome,
        price: suggestion.preco_novo,
        img: suggestion.imagem_url,
      });
    }
    openCart();
  };

  const cycle = () => setSuggIndex((i) => (i + 1) % others.length);

  return (
    <section className="mx-auto mt-16 max-w-[1300px] px-[5%]">
      <h2 className="section-title-line mb-10 text-center text-3xl uppercase tracking-[3px] text-deep-green md:text-4xl">
        Compre Junto
      </h2>

      <div className="mx-auto max-w-[520px]">
        <ProductRow produto={current} discount={currentDiscount} primary />

        {/* Divisor */}
        <div className="relative my-5 flex items-center">
          <div className="h-px flex-1 bg-cacau/15" />
          <div className="mx-3 flex h-9 w-9 items-center justify-center rounded-full border border-gold bg-sand text-gold">
            <Plus className="h-4 w-4" />
          </div>
          <div className="h-px flex-1 bg-cacau/15" />
        </div>

        <ProductRow
          produto={suggestion}
          discount={suggestionDiscount}
          checkbox={{ checked: include, onChange: setInclude }}
          onSwap={others.length > 1 ? cycle : undefined}
        />

        {/* Barra de total */}
        <div className="mt-6 flex flex-col gap-3 border-t-2 border-gold bg-white p-5 shadow-premium sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[1.5px] text-text-light">
              Total {include ? "dos 2 itens" : "do item"}
            </div>
            <div className="text-2xl font-bold text-price-green">{formatBRL(total)}</div>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center justify-center gap-2 bg-deep-green px-5 py-3.5 text-xs font-bold uppercase tracking-[1.5px] text-sand transition-colors hover:bg-gold hover:text-deep-green"
          >
            <ShoppingCart className="h-4 w-4" /> Adicionar ao Carrinho
          </button>
        </div>
      </div>
    </section>
  );
}

function ProductRow({
  produto,
  discount,
  primary,
  checkbox,
  onSwap,
}: {
  produto: Produto;
  discount: number;
  primary?: boolean;
  checkbox?: { checked: boolean; onChange: (v: boolean) => void };
  onSwap?: () => void;
}) {
  return (
    <div className="flex gap-4 border border-cacau/10 bg-white p-4">
      <img
        src={produto.imagem_url}
        alt={produto.nome}
        className="h-24 w-24 shrink-0 object-cover sm:h-28 sm:w-28"
      />
      <div className="flex flex-1 flex-col">
        <div className="mb-1 flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            {checkbox && (
              <input
                type="checkbox"
                checked={checkbox.checked}
                onChange={(e) => checkbox.onChange(e.target.checked)}
                aria-label={`Incluir ${produto.nome}`}
                className="mt-1 h-4 w-4 accent-[#2E3F32]"
              />
            )}
            <h3 className="font-sans text-sm font-medium lowercase leading-snug text-cacau">
              {produto.nome}
            </h3>
          </div>
          {discount > 0 && (
            <span className="shrink-0 rounded bg-deep-green px-2 py-0.5 text-[11px] font-bold text-sand">
              -{discount}%
            </span>
          )}
        </div>

        <div className="text-xs text-text-light line-through">
          {formatBRL(produto.preco_antigo)}
        </div>
        <div className="text-lg font-bold text-price-green">{formatBRL(produto.preco_novo)}</div>

        {primary && (
          <span className="mt-1 text-[10px] uppercase tracking-wider text-gold">Este produto</span>
        )}

        {onSwap && (
          <button
            onClick={onSwap}
            className="mt-2 flex w-fit items-center gap-1.5 border border-cacau/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cacau transition-colors hover:border-gold hover:text-gold"
          >
            <RefreshCw className="h-3 w-3" /> Trocar produto
          </button>
        )}
      </div>
    </div>
  );
}
