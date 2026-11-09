import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { BookOpen, ShoppingCart, Menu, MapPin } from "lucide-react";
import { WHATSAPP_URL, WHATSAPP_DISPLAY } from "../lib/constants";
import { useHomeConfiguration } from "./HomeConfigurationContext";
import { MobiliLogo } from "@/components/MobiliLogo";
import { useCart } from "@/lib/cart-context";
import { useUI } from "@/lib/ui-context";
export function Header() {
  const { searchOpen, closeSearch, openMenu, closeMenu, menuOpen } = useUI();
  const configuration = useHomeConfiguration();
  const isAdmin = useRouterState({ select: (state) => state.location.pathname === "/admin" });
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
      {!isAdmin && (
        <div className="mobi-header-channel mobi-wrap">
          <span>Loja online · atendimento com a Mobi</span>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
            WhatsApp {WHATSAPP_DISPLAY}
          </a>
        </div>
      )}
      <div className="mobi-header-inner mobi-wrap">
        {!isAdmin && (
          <button
            className="mobi-menu-trigger"
            aria-label="Abrir categorias"
            aria-expanded={menuOpen}
            aria-controls="mobi-navigation-menu"
            onClick={() => openMenu()}
          >
            <Menu size={23} />
            <span>Categorias</span>
          </button>
        )}
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
            placeholder="Ex.: sofá retrátil 2,10 m, linho cinza"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit">Buscar</button>
        </form>
        <div className={`mobi-header-actions ${!isAdmin ? "mobi-storefront-actions" : ""}`}>
          {isAdmin && (
            <Link
              to="/"
              search={{ all: true, page: 1 }}
              hash="catalogo"
              className="mobi-header-catalog"
            >
              <BookOpen size={16} strokeWidth={1.8} aria-hidden="true" />
              <span>Catálogo</span>
            </Link>
          )}
          {
            <button
              className="mobi-header-cart"
              onClick={() => {
                closeMenu();
                openCart();
              }}
              aria-label={`Carrinho com ${count} produtos`}
            >
              <ShoppingCart size={22} />
              <span className={count ? "mobi-cart-count" : "mobi-cart-empty-label"}>
                {count || "Carrinho"}
              </span>
            </button>
          }
        </div>
      </div>
      {!isAdmin && (
        <div className="mobi-header-region mobi-wrap">
          <MapPin size={14} aria-hidden="true" />
          <span>
            {configuration?.service.regionMessage ??
              "Nova Iguaçu e região · consulte a entrega para seu endereço"}
          </span>
        </div>
      )}
    </header>
  );
}
