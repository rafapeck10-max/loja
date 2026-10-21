import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, LayoutGrid } from "lucide-react";
import { useUI } from "@/lib/ui-context";
import { ProductCard, productDisplayPrice, type ProductBadge } from "@/components/ProductCard";
import { FurnitureCategoryIcon, categoryDisplayLabel } from "@/components/CategoryNavigation";
import { categoryMatches, getCategory, getSubcategories } from "@/lib/constants";
import {
  catalogSearchScore,
  getCatalogColorFilterValues,
  getCatalogFeatures,
  getCatalogMaterials,
  matchesCatalogColors,
  matchesCatalogDimensions,
  matchesCatalogFeatures,
  matchesCatalogMaterials,
  matchesCatalogSearch,
} from "@/lib/catalog-search";
import { catalogEnvironments as environments, catalogRoom } from "@/lib/catalog-navigation";
import { catalogPageForVisibleCount, catalogVisibleCountForPage } from "@/lib/catalog-page-state";
import type { Produto } from "@/lib/products.functions";
import { hasRealReferencePrice } from "@/lib/price-reference";

const ranges = [
  ["all", "Todos os preços"],
  ["500", "Até R$ 500"],
  ["1500", "De R$ 500 a R$ 1.500"],
  ["above", "Acima de R$ 1.500"],
] as const;
const quickCategories = ["sofas", "roupeiros", "camas-casal"].map((slug) => getCategory(slug)!);

function facetOptions(products: Produto[], getValues: (product: Produto) => string[]) {
  const counts = new Map<string, number>();
  for (const product of products) {
    for (const value of new Set(getValues(product)))
      counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"));
}

export function StoreCatalog({
  products,
  query = "",
  offers = false,
  initialCategory = "all",
  requestedPage = 1,
  badges = {},
  onPageChange,
}: {
  products: Produto[];
  query?: string;
  offers?: boolean;
  initialCategory?: string;
  requestedPage?: number;
  badges?: Record<string, ProductBadge>;
  onPageChange?: (page: number) => void;
}) {
  const [category, setCategory] = useState(initialCategory);
  const [selectedRoom, setSelectedRoom] = useState(
    () => catalogRoom(initialCategory)?.slug ?? "all",
  );
  const [range, setRange] = useState("all");
  const [sort, setSort] = useState("recommended");
  const [material, setMaterial] = useState("all");
  const [color, setColor] = useState("all");
  const [feature, setFeature] = useState("all");
  const [dimension, setDimension] = useState("");
  const [count, setCount] = useState(catalogVisibleCountForPage(requestedPage));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const navigate = useNavigate();
  const { openMenu, menuOpen } = useUI();
  const filtersRef = useRef<HTMLElement>(null);
  const setVisibleCount = (nextCount: number) => {
    const safeCount = Math.max(24, nextCount);
    setCount(safeCount);
    onPageChange?.(catalogPageForVisibleCount(safeCount));
  };
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
    setRange("all");
    setMaterial("all");
    setColor("all");
    setFeature("all");
    setDimension("");
    setSort(query.trim() ? "relevant" : "recommended");
    setCount(catalogVisibleCountForPage(requestedPage));
  }, [initialCategory, query, offers]);
  useEffect(() => {
    setCount(catalogVisibleCountForPage(requestedPage));
  }, [requestedPage]);
  const baseFiltered = useMemo(() => {
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
    return result;
  }, [products, category, range, query, offers]);
  const materialOptions = useMemo(
    () => facetOptions(baseFiltered, getCatalogMaterials),
    [baseFiltered],
  );
  const colorOptions = useMemo(
    () => facetOptions(baseFiltered, getCatalogColorFilterValues),
    [baseFiltered],
  );
  const featureOptions = useMemo(
    () => facetOptions(baseFiltered, getCatalogFeatures),
    [baseFiltered],
  );
  const filtered = useMemo(() => {
    const result = baseFiltered.filter(
      (product) =>
        matchesCatalogMaterials(product, material) &&
        matchesCatalogColors(product, color) &&
        matchesCatalogFeatures(product, feature) &&
        matchesCatalogDimensions(product, dimension),
    );
    if (sort === "low") result.sort((a, b) => productDisplayPrice(a) - productDisplayPrice(b));
    if (sort === "high") result.sort((a, b) => productDisplayPrice(b) - productDisplayPrice(a));
    if (sort === "new") result.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
    if (sort === "relevant")
      result.sort((a, b) => catalogSearchScore(b, query) - catalogSearchScore(a, query));
    if (sort === "recommended")
      result.sort(
        (a, b) =>
          Number(b.vitrine_semana_ordem != null) - Number(a.vitrine_semana_ordem != null) ||
          (a.ordem ?? 0) - (b.ordem ?? 0),
      );
    return result;
  }, [baseFiltered, material, color, feature, dimension, sort, query]);
  const reset = () => {
    setCategory("all");
    setSelectedRoom("all");
    setRange("all");
    setMaterial("all");
    setColor("all");
    setFeature("all");
    setDimension("");
    setSort("recommended");
    setVisibleCount(24);
    setFiltersOpen(false);
    navigate({ to: "/", search: { all: true, page: 1 }, hash: "catalogo" });
  };
  const selectCategory = (slug: string) => {
    setCategory(slug);
    setSelectedRoom((preferred) => catalogRoom(slug, preferred)?.slug ?? "all");
    setVisibleCount(24);
    setMaterial("all");
    setColor("all");
    setFeature("all");
    setDimension("");
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
      {materialOptions.length > 0 && (
        <>
          <label htmlFor="mobi-catalog-material">Material / tecido</label>
          <select
            id="mobi-catalog-material"
            value={material}
            onChange={(event) => {
              setMaterial(event.target.value);
              setVisibleCount(24);
            }}
          >
            <option value="all">Todos os materiais</option>
            {materialOptions.map(([value, total]) => (
              <option key={value} value={value}>
                {value} ({total})
              </option>
            ))}
          </select>
        </>
      )}
      {colorOptions.length > 0 && (
        <>
          <label htmlFor="mobi-catalog-color">Cor</label>
          <select
            id="mobi-catalog-color"
            value={color}
            onChange={(event) => {
              setColor(event.target.value);
              setVisibleCount(24);
            }}
          >
            <option value="all">Todas as cores</option>
            {colorOptions.map(([value, total]) => (
              <option key={value} value={value}>
                {value} ({total})
              </option>
            ))}
          </select>
        </>
      )}
      <label htmlFor="mobi-catalog-dimension">Tamanho ou medida</label>
      <input
        id="mobi-catalog-dimension"
        type="search"
        inputMode="decimal"
        placeholder="Ex.: 2,10 m ou 210 cm"
        value={dimension}
        onChange={(event) => {
          setDimension(event.target.value);
          setVisibleCount(24);
        }}
        aria-describedby="mobi-catalog-dimension-help"
      />
      <small id="mobi-catalog-dimension-help" className="mobi-dimension-help">
        Use m, cm ou mm. Medidas equivalentes são reconhecidas.
      </small>
      {featureOptions.length > 0 && (
        <>
          <label htmlFor="mobi-catalog-feature">Característica</label>
          <select
            id="mobi-catalog-feature"
            value={feature}
            onChange={(event) => {
              setFeature(event.target.value);
              setVisibleCount(24);
            }}
          >
            <option value="all">Todas as características</option>
            {featureOptions.map(([value, total]) => (
              <option key={value} value={value}>
                {value} ({total})
              </option>
            ))}
          </select>
        </>
      )}
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
                setVisibleCount(24);
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
                  setVisibleCount(24);
                }}
              >
                <option value="relevant">Mais relevantes</option>
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
                  setVisibleCount(24);
                }}
              >
                Faixa de preço · Remover
              </button>
            )}
            {material !== "all" && (
              <button type="button" onClick={() => setMaterial("all")}>
                Material: {material} · Remover
              </button>
            )}
            {color !== "all" && (
              <button type="button" onClick={() => setColor("all")}>
                Cor: {color} · Remover
              </button>
            )}
            {feature !== "all" && (
              <button type="button" onClick={() => setFeature("all")}>
                {feature} · Remover
              </button>
            )}
            {dimension.trim() && (
              <button type="button" onClick={() => setDimension("")}>
                Medida: {dimension} · Remover
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
                  <ProductCard
                    key={product.id}
                    produto={product}
                    badge={badges[product.id]}
                    returnPage={initialCategory !== "all" ? requestedPage : undefined}
                    returnCategory={initialCategory !== "all" ? initialCategory : undefined}
                  />
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
                    onClick={() => setVisibleCount(count + 24)}
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
