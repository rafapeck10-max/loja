import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, ShoppingCart } from "lucide-react";
import { MobiliLogo } from "@/components/MobiliLogo";
import { useCart } from "@/lib/cart-context";
import { useUI } from "@/lib/ui-context";

export function Header() {
  const { openMenu } = useUI();
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const { count, openCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submitSearch = (value: string) => {
    setQuery(value);
    navigate({
      to: "/",
      search: value.trim() ? { q: value } : {},
      replace: true,
    });
  };

  return (
    <header
      className={`sticky top-0 z-[1000] border-b border-gold/20 bg-deep-green transition-all duration-500 ${
        scrolled ? "px-[5%] py-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]" : "px-[5%] py-6"
      }`}
    >
      <div className="mx-auto flex max-w-[1300px] items-center justify-between gap-3 md:gap-8">
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
          aria-label="Página inicial Mobili"
        >
          <MobiliLogo
            className={
              scrolled
                ? "h-[30px] transition-all duration-500"
                : "h-[38px] transition-all duration-500"
            }
          />
        </Link>

        <div className="relative hidden max-w-[500px] grow sm:block">
          <input
            type="text"
            value={query}
            onChange={(e) => submitSearch(e.target.value)}
            placeholder="Busque por móveis de luxo..."
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
    </header>
  );
}
