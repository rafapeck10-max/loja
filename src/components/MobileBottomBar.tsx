import { Home, Search, ShoppingCart, Tag } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useCart } from "@/lib/cart-context";
import { useUI } from "@/lib/ui-context";

export function MobileBottomBar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { count, openCart } = useCart();
  const { openSearch } = useUI();
  const filters = useRouterState({
    select: (state) => state.location.search as { ofertas?: boolean; all?: boolean; q?: string },
  });
  const isHome = pathname === "/" && !filters.ofertas && !filters.all && !filters.q;

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-[1000] border-t border-gold/30 bg-deep-green text-white shadow-[0_-2px_10px_rgba(0,0,0,0.04)] md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-lg grid-cols-4">
        <Link
          to="/"
          search={{}}
          className={`flex min-h-[68px] flex-col items-center justify-center gap-1 text-[11px] font-semibold no-underline transition-colors ${isHome ? "text-gold" : "text-white"}`}
        >
          <Home className="h-6 w-6" strokeWidth={isHome ? 2.5 : 1.8} />
          Início
        </Link>
        <button
          onClick={openSearch}
          className="flex min-h-[68px] flex-col items-center justify-center gap-1 text-[11px] font-semibold text-white transition-colors hover:text-gold"
        >
          <Search className="h-6 w-6" strokeWidth={1.8} />
          Buscar
        </button>
        <Link
          to="/"
          search={{ ofertas: true, all: true, page: 1 }}
          hash="catalogo"
          aria-current={filters.ofertas ? "page" : undefined}
          className={`flex min-h-[68px] flex-col items-center justify-center gap-1 text-[11px] font-semibold no-underline ${filters.ofertas ? "text-gold" : "text-white"}`}
        >
          <Tag className="h-6 w-6" strokeWidth={1.8} />
          Ofertas
        </Link>
        <button
          onClick={openCart}
          className="relative flex min-h-[68px] flex-col items-center justify-center gap-1 text-[11px] font-semibold text-white transition-colors hover:text-gold"
        >
          <ShoppingCart className="h-6 w-6" strokeWidth={1.8} />
          Carrinho
          {count > 0 && (
            <span className="absolute right-[22%] top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-deep-green">
              {count}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
