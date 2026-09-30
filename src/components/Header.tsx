import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { BookOpen, ShoppingCart } from "lucide-react";
import { MobiliLogo } from "@/components/MobiliLogo";
import { useCart } from "@/lib/cart-context";
import { useUI } from "@/lib/ui-context";
export function Header() {
  const { searchOpen, closeSearch } = useUI();
  const { count, openCart } = useCart();
  const navigate = useNavigate();
  const routeQuery = useRouterState({
    select: (state) => (state.location.search as { q?: string }).q ?? "",
  });
  const [query, setQuery] = useState(routeQuery);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setQuery(routeQuery);
  }, [routeQuery]);
  useEffect(() => {
    if (searchOpen) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      searchRef.current?.focus({ preventScroll: true });
      closeSearch();
    }
  }, [searchOpen, closeSearch]);
  return (
    <header className="mobi-header">
      <div className="mobi-header-inner mobi-wrap">
        <Link to="/" search={{}} aria-label="Mobi início" className="mobi-logo">
          <MobiliLogo className="mobi-logo-image" />
        </Link>
        <form
          className="mobi-search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            navigate({
              to: "/",
              search: { all: true, page: 1, ...(query.trim() ? { q: query.trim() } : {}) },
              hash: "catalogo",
            });
          }}
        >
          <input
            ref={searchRef}
            type="search"
            aria-label="Buscar móveis"
            placeholder="O que você procura para sua casa?"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit">Buscar</button>
        </form>
        <div className="mobi-header-actions">
          <Link
            to="/"
            search={{ all: true, page: 1 }}
            hash="catalogo"
            className="mobi-header-catalog"
          >
            <BookOpen size={16} strokeWidth={1.8} aria-hidden="true" />
            <span>Catálogo</span>
          </Link>
          {count > 0 && (
            <button
              className="mobi-header-cart"
              onClick={openCart}
              aria-label={`Carrinho com ${count} produtos`}
            >
              <ShoppingCart size={22} />
              <span>{count}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
