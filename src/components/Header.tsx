import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, ShoppingCart } from "lucide-react";
import { MobiliLogo } from "@/components/MobiliLogo";
import { useCart } from "@/lib/cart-context";
import { useUI } from "@/lib/ui-context";

export function Header() {
  const { openMenu, searchOpen, closeSearch } = useUI();
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const { count, openCart } = useCart();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const submitSearch = (value: string, close = true) => {
    setQuery(value);
    navigate({
      to: "/",
      search: value.trim() ? { q: value.trim(), all: true, page: 1 } : {},
      hash: value.trim() ? "catalogo" : undefined,
      replace: true,
    });
    if (close && value.trim()) closeSearch();
  };

  return (
    <header
      className={`sticky top-0 z-[1000] border-b border-gold/20 bg-deep-green px-[5%] transition-all duration-500 ${
        scrolled ? "py-3 shadow-[0_10px_30px_rgba(0,0,0,0.25)]" : "py-5 md:py-6"
      }`}
    >
      <div className="mx-auto flex w-full min-w-0 max-w-[1300px] items-center justify-between gap-3 md:gap-8">
        <button
          onClick={openMenu}
          aria-label="Abrir menu"
          className="flex h-10 w-10 items-center justify-center text-gold transition-colors hover:text-sand"
        >
          <Menu className="h-6 w-6" />
        </button>

        <Link
          to="/"
          search={{}}
          className="flex shrink-0 items-center"
          aria-label="Página inicial Mobi"
        >
          <MobiliLogo
            className={
              scrolled
                ? "h-[38px] w-[87px] transition-all duration-500"
                : "h-[42px] w-[96px] transition-all duration-500"
            }
          />
        </Link>

        <div className="relative hidden max-w-[500px] grow sm:block">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitSearch(query);
            }}
            placeholder="Buscar móveis..."
            className="w-full rounded-full border border-gold/30 bg-sand/10 py-3 pl-6 pr-14 font-sans text-sm text-sand outline-none transition-all duration-500 placeholder:text-sand/60 focus:border-gold focus:bg-white/95 focus:text-cacau focus:placeholder:text-cacau/50"
          />
          <button
            aria-label="Buscar"
            onClick={() => submitSearch(query)}
            className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-gold transition-colors hover:bg-gold/10"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-5 md:gap-6">
          <button
            aria-label="Carrinho de Compras"
            onClick={openCart}
            className="relative flex items-center justify-center p-1 text-gold transition-all duration-300 hover:-translate-y-0.5 hover:text-sand"
          >
            <ShoppingCart className="h-[22px] w-[22px]" />
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-deep-green bg-gold font-sans text-[10px] font-bold text-deep-green">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
      {searchOpen && (
        <div className="mx-auto mt-4 max-w-[1300px] sm:hidden">
          <div className="relative">
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar móveis..."
              className="w-full rounded-xl border border-gold/40 bg-white px-4 py-3 pr-11 font-sans text-sm text-cacau outline-none placeholder:text-text-light focus:border-gold"
              onKeyDown={(e) => {
                if (e.key === "Enter") submitSearch(query);
              }}
            />
            <button
              aria-label="Buscar móveis"
              onClick={() => submitSearch(query)}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 text-lg text-text-light"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
