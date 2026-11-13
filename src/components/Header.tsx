import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  ShoppingCart,
  Menu,
  MapPin,
  MessageCircle,
  Search,
  Clock3,
  X,
} from "lucide-react";
import {
  ALL_CATEGORIES,
  WHATSAPP_URL,
  WHATSAPP_DISPLAY,
  normalizeCategory,
} from "../lib/constants";
import { catalogSearchScore, matchesCatalogSearch } from "@/lib/catalog-search";
import { produtosQueryOptions, type Produto } from "@/lib/products.functions";
import { useHomeConfiguration } from "./HomeConfigurationContext";
import { MobiliLogo } from "@/components/MobiliLogo";
import { useCart } from "@/lib/cart-context";
import { useUI } from "@/lib/ui-context";

const SEARCH_HISTORY_KEY = "mobi:store-search-history:v1";
const SEARCH_HISTORY_LIMIT = 5;

type SearchSuggestion =
  | { kind: "category"; key: string; label: string; slug: string }
  | { kind: "product"; key: string; label: string; product: Produto }
  | { kind: "history"; key: string; label: string };

function readSearchHistory() {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(SEARCH_HISTORY_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed
          .filter((value): value is string => typeof value === "string")
          .slice(0, SEARCH_HISTORY_LIMIT)
      : [];
  } catch {
    return [];
  }
}
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
  const { data: catalogProducts = [] } = useQuery(produtosQueryOptions());
  const routeQuery = useRouterState({
    select: (state) => (state.location.search as { q?: string }).q ?? "",
  });
  const [query, setQuery] = useState(routeQuery);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const searchRef = useRef<HTMLInputElement>(null);
  const suggestionBlurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setSearchHistory(readSearchHistory());
  }, []);
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

  const suggestions = useMemo<SearchSuggestion[]>(() => {
    const cleaned = query.trim();
    if (!cleaned)
      return searchHistory.map((label) => ({ kind: "history", key: `history-${label}`, label }));
    if (cleaned.length < 2) return [];

    const normalizedQuery = normalizeCategory(cleaned);
    const categories = ALL_CATEGORIES.filter((category) =>
      normalizeCategory(category.label).includes(normalizedQuery),
    )
      .slice(0, 3)
      .map((category) => ({
        kind: "category" as const,
        key: `category-${category.slug}`,
        label: category.label,
        slug: category.slug,
      }));
    const products = catalogProducts
      .filter((product) => matchesCatalogSearch(product, cleaned))
      .sort((left, right) => catalogSearchScore(right, cleaned) - catalogSearchScore(left, cleaned))
      .slice(0, 4)
      .map((product) => ({
        kind: "product" as const,
        key: `product-${product.id}`,
        label: product.nome,
        product,
      }));
    return [...categories, ...products];
  }, [catalogProducts, query, searchHistory]);

  const runSearch = (value: string) => {
    const cleaned = value.trim();
    if (cleaned) {
      const next = [
        cleaned,
        ...searchHistory.filter((entry) => normalizeCategory(entry) !== normalizeCategory(cleaned)),
      ].slice(0, SEARCH_HISTORY_LIMIT);
      setSearchHistory(next);
      try {
        window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
      } catch {
        // Busca continua funcionando quando o navegador bloqueia armazenamento local.
      }
    }
    setSuggestionsOpen(false);
    setActiveSuggestion(-1);
    navigate({
      to: "/",
      search: { all: true, page: 1, ...(cleaned ? { q: cleaned } : {}) },
      hash: "catalogo",
    });
  };

  const chooseSuggestion = (suggestion: SearchSuggestion) => {
    if (suggestion.kind === "category") {
      setSuggestionsOpen(false);
      setActiveSuggestion(-1);
      navigate({ to: "/categoria/$slug", params: { slug: suggestion.slug }, search: { page: 1 } });
      return;
    }
    runSearch(suggestion.kind === "product" ? suggestion.product.nome : suggestion.label);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    try {
      window.localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch {
      // A interface permanece utilizável se o armazenamento estiver indisponível.
    }
  };

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setSuggestionsOpen(false);
      setActiveSuggestion(-1);
    } else if (event.key === "ArrowDown" && suggestions.length) {
      event.preventDefault();
      setSuggestionsOpen(true);
      setActiveSuggestion((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp" && suggestions.length) {
      event.preventDefault();
      setSuggestionsOpen(true);
      setActiveSuggestion((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeSuggestion >= 0 && suggestions[activeSuggestion]) {
      event.preventDefault();
      chooseSuggestion(suggestions[activeSuggestion]);
    }
  };
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
            if (activeSuggestion >= 0 && suggestions[activeSuggestion])
              chooseSuggestion(suggestions[activeSuggestion]);
            else runSearch(query);
          }}
          onBlur={() => {
            suggestionBlurTimer.current = setTimeout(() => setSuggestionsOpen(false), 130);
          }}
          onFocus={() => {
            if (suggestionBlurTimer.current) clearTimeout(suggestionBlurTimer.current);
            setSuggestionsOpen(true);
          }}
        >
          <input
            ref={searchRef}
            type="search"
            aria-label="Buscar móveis"
            aria-autocomplete="list"
            aria-controls="mobi-search-suggestions"
            aria-expanded={suggestionsOpen && suggestions.length > 0}
            aria-activedescendant={
              activeSuggestion >= 0 ? `mobi-search-option-${activeSuggestion}` : undefined
            }
            placeholder="Busque móveis para sua casa"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveSuggestion(-1);
              setSuggestionsOpen(true);
            }}
            onKeyDown={onSearchKeyDown}
          />
          <button type="submit" aria-label="Buscar móveis">
            <Search className="mobi-search-submit-icon" size={20} aria-hidden="true" />
            <span className="mobi-search-submit-label">Buscar</span>
          </button>
          {suggestionsOpen && suggestions.length > 0 && (
            <div
              id="mobi-search-suggestions"
              className="mobi-search-suggestions"
              role="listbox"
              aria-label={query.trim() ? "Sugestões de busca" : "Buscas recentes"}
              onMouseDown={(event) => event.preventDefault()}
            >
              {!query.trim() && (
                <div className="mobi-search-suggestions-heading">
                  <span>Buscas recentes</span>
                  <button type="button" onClick={clearSearchHistory}>
                    <X size={14} aria-hidden="true" /> Limpar
                  </button>
                </div>
              )}
              {suggestions.map((suggestion, index) => (
                <button
                  id={`mobi-search-option-${index}`}
                  key={suggestion.key}
                  type="button"
                  role="option"
                  aria-selected={activeSuggestion === index}
                  className={activeSuggestion === index ? "active" : ""}
                  onClick={() => chooseSuggestion(suggestion)}
                >
                  {suggestion.kind === "category" ? (
                    <Search size={16} aria-hidden="true" />
                  ) : suggestion.kind === "history" ? (
                    <Clock3 size={16} aria-hidden="true" />
                  ) : (
                    <span className="mobi-search-suggestion-product" aria-hidden="true">
                      {suggestion.product.imagem_url ? (
                        <img src={suggestion.product.imagem_url} alt="" loading="lazy" />
                      ) : null}
                    </span>
                  )}
                  <span>{suggestion.label}</span>
                  {suggestion.kind === "category" && <small>Categoria</small>}
                </button>
              ))}
            </div>
          )}
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
              aria-label={`Carrinho com ${count} ${count === 1 ? "produto" : "produtos"}`}
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
