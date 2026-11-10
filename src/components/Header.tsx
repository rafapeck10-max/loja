import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { BookOpen, ShoppingCart, Menu, MapPin, MessageCircle } from "lucide-react";
import { WHATSAPP_URL, WHATSAPP_DISPLAY } from "../lib/constants";
import { useHomeConfiguration } from "./HomeConfigurationContext";
import { MobiliLogo } from "@/components/MobiliLogo";
import { useCart } from "@/lib/cart-context";
import { useUI } from "@/lib/ui-context";
export function Header() {
  const { searchOpen, closeSearch, openMenu, closeMenu, menuOpen } = useUI();
  const configuration = useHomeConfiguration();
  const isAdmin = useRouterState({ select: (state) => state.location.pathname === "/admin" });
  const { count, openCart, closeCart } = useCart();
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const header = headerRef.current;
    const shell = header?.closest<HTMLElement>(".store-shell");
    if (!header || !shell) return;
    const measure = () =>
      shell.style.setProperty("--mobi-header-height", `${header.getBoundingClientRect().height}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => {
      observer.disconnect();
      shell.style.removeProperty("--mobi-header-height");
    };
  }, []);
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
    <header ref={headerRef} className="mobi-header">
      {!isAdmin && (
        <div className="mobi-header-channel mobi-wrap">
          <Link to="/moveis-nova-iguacu">
            <MapPin size={13} aria-hidden="true" /> Entregas em Nova Iguaçu e região
          </Link>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
            WhatsApp {WHATSAPP_DISPLAY}
          </a>
        </div>
      )}
      <div className="mobi-header-inner mobi-wrap">
        {!isAdmin && (
          <button
            className="mobi-menu-trigger mobi-menu-mobile"
            aria-label="Abrir categorias"
            aria-expanded={menuOpen}
            aria-controls="mobi-navigation-menu"
            onClick={() => {
              closeCart();
              openMenu();
            }}
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
            placeholder="O que você procura para sua casa?"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit">Buscar</button>
        </form>
        <div className={`mobi-header-actions ${!isAdmin ? "mobi-storefront-actions" : ""}`}>
          {!isAdmin && (
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="mobi-header-whatsapp"
              aria-label="Fale com a Mobi pelo WhatsApp"
            >
              <MessageCircle size={21} />
              <span>
                Ajuda para escolher<strong>Fale com a Mobi</strong>
              </span>
            </a>
          )}
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
        <div className="mobi-head-browse mobi-wrap">
          <button
            className="mobi-menu-trigger"
            aria-label="Todas as categorias"
            aria-expanded={menuOpen}
            aria-controls="mobi-navigation-menu"
            onClick={() => {
              closeCart();
              openMenu();
            }}
          >
            <Menu size={17} />
            Todas as categorias
          </button>
          <nav aria-label="Acesso rápido às categorias">
            {(
              configuration?.navigation ?? [
                { id: "sofas", label: "Sofás", href: "/categoria/sofas", visible: true },
                {
                  id: "dormitorios",
                  label: "Quartos",
                  href: "/categoria/dormitorios",
                  visible: true,
                },
                { id: "cozinha", label: "Cozinha", href: "/categoria/cozinha", visible: true },
                {
                  id: "sala-de-estar",
                  label: "Sala de estar",
                  href: "/categoria/sala-de-estar",
                  visible: true,
                },
              ]
            )
              .filter((n) => n.visible)
              .slice(0, 6)
              .map((n) => (
                <a key={n.id} href={n.href}>
                  {n.label}
                </a>
              ))}
          </nav>
          <Link to="/moveis-nova-iguacu" className="mobi-head-service">
            Como comprar e receber
          </Link>
        </div>
      )}
    </header>
  );
}
