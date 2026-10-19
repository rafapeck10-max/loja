import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, LayoutGrid } from "lucide-react";
import { useUI } from "@/lib/ui-context";
import { ProductCard, productDisplayPrice, type ProductBadge } from "@/components/ProductCard";
import { FurnitureCategoryIcon, categoryDisplayLabel } from "@/components/CategoryNavigation";
import { categoryMatches, getCategory, getSubcategories } from "@/lib/constants";
import { matchesCatalogSearch } from "@/lib/catalog-search";
import { catalogEnvironments as environments, catalogRoom } from "@/lib/catalog-navigation";
import type { Produto } from "@/lib/products.functions";
import { hasRealReferencePrice } from "@/lib/price-reference";

const ranges = [
  ["all", "Todos os preços"],
  ["500", "Até R$ 500"],
  ["1500", "De R$ 500 a R$ 1.500"],
  ["above", "Acima de R$ 1.500"],
] as const;
const quickCategories = ["sofas", "roupeiros", "camas-casal"].map((slug) => getCategory(slug)!);
export function StoreCatalog({
  products,
  query = "",
  offers = false,
  initialCategory = "all",
  requestedPage = 1,
  badges = {},
}: {
  products: Produto[];
  query?: string;
  offers?: boolean;
  initialCategory?: string;
  requestedPage?: number;
  badges?: Record<string, ProductBadge>;
}) {
  const [category, setCategory] = useState(initialCategory);
  const [selectedRoom, setSelectedRoom] = useState(
    () => catalogRoom(initialCategory)?.slug ?? "all",
  );
  const [range, setRange] = useState("all");
  const [sort, setSort] = useState("recommended");
  const [count, setCount] = useState(Math.max(1, requestedPage) * 24);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const navigate = useNavigate();
  const { openMenu, menuOpen } = useUI();
  const filtersRef = useRef<HTMLElement>(null);
  const room = catalogRoom(category, selectedRoom);
  const relatedTypes = getSubcategories(category).length
    ? getSubcategories(category)
    : category === "all"
      ? quickCategories
      : getSubcategories(room?.slug ?? "");
  useEffect(() => {
    if (filtersOpen && window.matchMedia("(max-width: 767px)").matches)
      filtersRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [filtersOpen]);
  useEffect(() => {
    setCategory(initialCategory);
    setSelectedRoom(catalogRoom(initialCategory)?.slug ?? "all");
    setCount(Math.max(1, requestedPage) * 24);
  }, [initialCategory, requestedPage, query, offers]);
  const filtered = useMemo(() => {
    const result = products.filter(
      (product) =>
        (category === "all" || categoryMatches(product.categoria, category)) &&
        matchesCatalogSearch(product, query) &&
        (!offers || hasRealReferencePrice(product.preco_antigo, productDisplayPrice(product))) &&
        (range === "all" ||
          (range === "500"
            ? productDisplayPrice(product) <= 500
            : range === "1500"
              ? productDisplayPrice(product) > 500 && productDisplayPrice(product) <= 1500
              : productDisplayPrice(product) > 1500)),
    );
    if (sort === "low") result.sort((a, b) => productDisplayPrice(a) - productDisplayPrice(b));
    if (sort === "high") result.sort((a, b) => productDisplayPrice(b) - productDisplayPrice(a));
    if (sort === "new") result.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
    if (sort === "recommended")
      result.sort(
        (a, b) =>
          Number(b.vitrine_semana_ordem != null) - Number(a.vitrine_semana_ordem != null) ||
          (a.ordem ?? 0) - (b.ordem ?? 0),
      );
    return result;
  }, [products, category, range, sort, query, offers]);
  const reset = () => {
    setCategory("all");
    setSelectedRoom("all");
    setRange("all");
    setSort("recommended");
    setCount(24);
    setFiltersOpen(false);
    navigate({ to: "/", search: { all: true, page: 1 }, hash: "catalogo" });
  };
  const selectCategory = (slug: string) => {
    setCategory(slug);
    setSelectedRoom((preferred) => catalogRoom(slug, preferred)?.slug ?? "all");
    setCount(24);
  };
  const filters = (
    <>
      <div className="mobi-filter-heading">
        <h3>Encontre seu móvel</h3>
        <button type="button" className="mobi-text-link" onClick={reset}>
          Limpar
        </button>
      </div>
      <label htmlFor="mobi-catalog-room">Ambiente</label>
      <select
        id="mobi-catalog-room"
        value={room?.slug ?? "all"}
        onChange={(event) => selectCategory(event.target.value)}
      >
        <option value="all">Todos os ambientes</option>
        {environments.map((item) => (
          <option key={item.slug} value={item.slug}>
            {item.label}
          </option>
        ))}
      </select>
      <label htmlFor="mobi-catalog-category">Tipo de móvel</label>
      <select
        id="mobi-catalog-category"
        disabled={!room}
        value={room?.slug === category ? "all" : category}
        onChange={(event) =>
          selectCategory(event.target.value === "all" ? (room?.slug ?? "all") : event.target.value)
        }
      >
        <option value="all">{room ? `Todos em ${room.label}` : "Escolha um ambiente"}</option>
        {getSubcategories(room?.slug ?? "").map((item) => {
          const children = getSubcategories(item.slug).filter(
            (child) => child.label !== item.label,
          );
          return children.length ? (
            <optgroup key={item.slug} label={item.label}>
              <option value={item.slug}>Todos os {item.label.toLowerCase()}</option>
              {children.map((child) => (
                <option key={child.slug} value={child.slug}>
                  {child.label}
                </option>
              ))}
            </optgroup>
          ) : (
            <option key={item.slug} value={item.slug}>
              {item.label}
            </option>
          );
        })}
      </select>
      <fieldset>
        <legend>Preço no PIX</legend>
        {ranges.map(([value, label]) => (
          <label className="mobi-radio" key={value}>
            <input
              type="radio"
              name="mobi-price"
              value={value}
              checked={range === value}
              onChange={() => {
                setRange(value);
                setCount(24);
              }}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <p className="mobi-filter-note">Um novo detalhe pode transformar a sua casa.</p>
      {filtersOpen && (
        <button type="button" className="mobi-primary" onClick={() => setFiltersOpen(false)}>
          Mostrar {filtered.length} produtos
        </button>
      )}
    </>
  );
  return (
    <section className="mobi-catalog mobi-wrap" id="catalogo">
      <div className="mobi-breadcrumb">
        <Link to="/" search={{}} className="mobi-text-link">
          Início
        </Link>{" "}
        /{" "}
        <Link to="/" search={{ all: true, page: 1 }} hash="catalogo" className="mobi-text-link">
          Catálogo completo
        </Link>
      </div>
      <div className="mobi-section-title mobi-catalog-title">
        <div>
          <span className="mobi-eyebrow">MÓVEIS PARA A SUA VIDA</span>
          <h1>
            {query.trim()
              ? `Resultados para “${query.trim()}”`
              : category !== "all"
                ? (getCategory(category)?.label ?? "Produtos")
                : offers
                  ? "Ofertas para sua casa."
                  : "Catálogo completo"}
          </h1>
          <p aria-live="polite">
            {filtered.length}{" "}
            {filtered.length === 1 ? "produto encontrado" : "produtos encontrados"}
            {query.trim() && category !== "all" ? ` em ${getCategory(category)?.label}` : ""}
          </p>
        </div>
      </div>
      <div className="mobi-catalog-navigation">
        <div className="mobi-types-heading">
          <h2>Escolha um ambiente</h2>
          <button
            type="button"
            className="mobi-types-all"
            onClick={openMenu}
            aria-expanded={menuOpen}
            aria-controls="mobi-navigation-menu"
          >
            <LayoutGrid size={16} aria-hidden="true" /> Ver categorias
          </button>
        </div>
        <nav className="mobi-catalog-environments" aria-label="Ambientes">
          <button
            type="button"
            className={category === "all" ? "selected" : ""}
            aria-pressed={category === "all"}
            onClick={() => selectCategory("all")}
          >
            Todos
          </button>
          {environments.map((item) => (
            <button
              type="button"
              key={item.slug}
              className={room?.slug === item.slug ? "selected" : ""}
              aria-pressed={room?.slug === item.slug}
              onClick={() => selectCategory(item.slug)}
            >
              <FurnitureCategoryIcon category={item} />
              {categoryDisplayLabel(item)}
            </button>
          ))}
        </nav>
        <div className="mobi-types-panel">
          <div className="mobi-types-heading">
            <h2>
              {category === "all"
                ? "Tipos mais procurados"
                : `Tipos de móveis em ${room?.label ?? getCategory(category)?.label ?? "esta categoria"}`}
            </h2>
          </div>
          <nav className="mobi-product-types" aria-label="Tipos de móveis">
            {relatedTypes.map((item) => (
              <button
                type="button"
                key={item.slug}
                aria-pressed={category === item.slug}
                onClick={() => selectCategory(item.slug)}
              >
                <span className="mobi-type-icon">
                  <FurnitureCategoryIcon category={item} />
                </span>
                <span>{item.label}</span>
                <ChevronRight size={14} aria-hidden="true" />
              </button>
            ))}
          </nav>
        </div>
      </div>
      <div className="mobi-catalog-layout">
        <aside
          ref={filtersRef}
          id="mobi-catalog-filters"
          className={`mobi-filters ${filtersOpen ? "open" : ""}`}
          aria-label="Filtros do catálogo"
        >
          {filters}
        </aside>
        <div className="mobi-results">
          <div className="mobi-results-toolbar">
            <span aria-live="polite">{filtered.length} produtos encontrados</span>
            <button
              type="button"
              className="mobi-filter-toggle"
              aria-expanded={filtersOpen}
              aria-controls="mobi-catalog-filters"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              {filtersOpen ? "Fechar filtros" : "Filtrar"}
            </button>
            <label className="mobi-sort">
              Ordenar por{" "}
              <select
                aria-label="Ordenar produtos"
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  setCount(24);
                }}
              >
                <option value="recommended">Recomendados</option>
                <option value="low">Menor preço</option>
                <option value="high">Maior preço</option>
                <option value="new">Novidades</option>
              </select>
            </label>
          </div>
          <div className="mobi-applied">
            {category !== "all" && (
              <button type="button" onClick={() => selectCategory("all")}>
                {getCategory(category)?.label ?? category} · Remover
              </button>
            )}
            {range !== "all" && (
              <button
                type="button"
                onClick={() => {
                  setRange("all");
                  setCount(24);
                }}
              >
                Faixa de preço · Remover
              </button>
            )}
            {query && (
              <Link to="/" search={{ all: true, page: 1 }} hash="catalogo">
                “{query}” · Remover
              </Link>
            )}
          </div>
          {filtered.length ? (
            <>
              <div className="mobi-grid mobi-catalog-grid">
                {filtered.slice(0, count).map((product) => (
                  <ProductCard key={product.id} produto={product} badge={badges[product.id]} />
                ))}
              </div>
              <div className="mobi-load-more">
                <p>
                  Você viu {Math.min(count, filtered.length)} de {filtered.length} produtos
                </p>
                <progress value={Math.min(count, filtered.length)} max={filtered.length} />
                {count < filtered.length && (
                  <button
                    type="button"
                    className="mobi-primary"
                    onClick={() => setCount((visible) => visible + 24)}
                  >
                    Carregar mais
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="mobi-empty">
              <h2>Vamos tentar outra combinação?</h2>
              <p>Nenhum produto corresponde aos filtros escolhidos.</p>
              <button type="button" className="mobi-primary" onClick={reset}>
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
