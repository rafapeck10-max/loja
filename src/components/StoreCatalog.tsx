import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { SlidersHorizontal } from "lucide-react";
import { ProductCard, productDisplayPrice, type ProductBadge } from "@/components/ProductCard";
import { FurnitureCategoryIcon, categoryDisplayLabel } from "@/components/CategoryNavigation";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { categoryMatches, formatBRL, getCategory, getSubcategories } from "@/lib/constants";
import {
  catalogSearchScore,
  getCatalogColorFilterValues,
  getCatalogDimensions,
  getCatalogFeatures,
  getCatalogMaterials,
  matchesCatalogColors,
  matchesCatalogDimensions,
  matchesCatalogDimensionLimits,
  matchesCatalogFeatures,
  matchesCatalogMaterials,
  matchesCatalogSearch,
} from "@/lib/catalog-search";
import { catalogEnvironments as environments, catalogRoom } from "@/lib/catalog-navigation";
import { catalogPageForVisibleCount, catalogVisibleCountForPage } from "@/lib/catalog-page-state";
import {
  DEFAULT_CATALOG_FILTERS,
  isValidCatalogPriceRange,
  priceToCents,
  serializeCatalogUrlState,
  type CatalogFilterState,
} from "@/lib/catalog-url-state";
import type { Produto } from "@/lib/products.functions";
import { hasRealReferencePrice } from "@/lib/price-reference";
import { useHomeConfiguration } from "./HomeConfigurationContext";
import type { FilterKey } from "@/lib/operational-config";

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
  initialFilters,
  badges = {},
  shareCategory,
  onPageChange,
  onCatalogStateChange,
}: {
  products: Produto[];
  query?: string;
  offers?: boolean;
  initialCategory?: string;
  requestedPage?: number;
  initialFilters?: CatalogFilterState;
  badges?: Record<string, ProductBadge>;
  shareCategory?: { label: string; url: string };
  onPageChange?: (page: number) => void;
  onCatalogStateChange?: (state: CatalogFilterState, page: number) => void;
}) {
  const category = initialCategory;
  const configuration = useHomeConfiguration();
  const [filterState, setFilterState] = useState<CatalogFilterState>(() => ({
    ...DEFAULT_CATALOG_FILTERS,
    ...initialFilters,
  }));
  const [count, setCount] = useState(catalogVisibleCountForPage(requestedPage));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLElement>(null);
  const setVisibleCount = (nextCount: number) => {
    const safeCount = Math.max(24, nextCount);
    setCount(safeCount);
    const page = catalogPageForVisibleCount(safeCount);
    onCatalogStateChange?.(filterState, page);
    onPageChange?.(page);
  };
  const updateFilters = (patch: Partial<CatalogFilterState>) => {
    const next = { ...filterState, ...patch };
    setFilterState(next);
    setCount(24);
    onCatalogStateChange?.(next, 1);
    onPageChange?.(1);
  };
  const room = catalogRoom(category);
  const categoryNavigation = configuration?.navigation.find(
    (item) => item.id === (room?.slug ?? category),
  );
  const filterOrder: FilterKey[] = categoryNavigation?.filters ?? [
    "material",
    "color",
    "dimensions",
    "features",
  ];
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
    setFilterState({
      ...DEFAULT_CATALOG_FILTERS,
      sort: query.trim() ? "relevant" : "recommended",
      ...initialFilters,
    });
  }, [initialCategory, initialFilters, query, offers]);
  useEffect(() => {
    setCount(catalogVisibleCountForPage(requestedPage));
  }, [requestedPage]);
  const minPriceCents = priceToCents(filterState.minPrice);
  const maxPriceCents = priceToCents(filterState.maxPrice);
  const validPriceRange =
    minPriceCents === undefined || maxPriceCents === undefined || minPriceCents <= maxPriceCents;
  const baseFiltered = useMemo(() => {
    const result = products.filter(
      (product) =>
        (category === "all" || categoryMatches(product.categoria, category)) &&
        matchesCatalogSearch(product, query) &&
        (!offers || hasRealReferencePrice(product.preco_antigo, productDisplayPrice(product))) &&
        (!validPriceRange ||
          ((minPriceCents === undefined ||
            Math.round(productDisplayPrice(product) * 100) >= minPriceCents) &&
            (maxPriceCents === undefined ||
              Math.round(productDisplayPrice(product) * 100) <= maxPriceCents))),
    );
    return result;
  }, [products, category, minPriceCents, maxPriceCents, validPriceRange, query, offers]);
  const materialOptions = useMemo(() => {
    const options = facetOptions(baseFiltered, getCatalogMaterials);
    return filterState.material !== "all" &&
      !options.some(([value]) => value === filterState.material)
      ? [[filterState.material, 0] as [string, number], ...options]
      : options;
  }, [baseFiltered, filterState.material]);
  const colorOptions = useMemo(() => {
    const options = facetOptions(baseFiltered, getCatalogColorFilterValues);
    return filterState.color !== "all" && !options.some(([value]) => value === filterState.color)
      ? [[filterState.color, 0] as [string, number], ...options]
      : options;
  }, [baseFiltered, filterState.color]);
  const featureOptions = useMemo(() => {
    const options = facetOptions(baseFiltered, getCatalogFeatures);
    return filterState.feature !== "all" &&
      !options.some(([value]) => value === filterState.feature)
      ? [[filterState.feature, 0] as [string, number], ...options]
      : options;
  }, [baseFiltered, filterState.feature]);
  const dimensionCoverage = useMemo(() => {
    const keys = ["widthCm", "heightCm", "depthClosedCm", "depthOpenCm"] as const;
    const coverage = Object.fromEntries(keys.map((key) => [key, 0])) as Record<
      (typeof keys)[number],
      number
    >;
    for (const product of baseFiltered) {
      const dimensions = getCatalogDimensions(product);
      for (const key of keys) if (dimensions[key] !== undefined) coverage[key]++;
    }
    return coverage;
  }, [baseFiltered]);
  const filtered = useMemo(() => {
    const dimensionLimits = {
      widthCm: filterState.widthMaxCm
        ? Number(filterState.widthMaxCm.replace(",", "."))
        : undefined,
      heightCm: filterState.heightMaxCm
        ? Number(filterState.heightMaxCm.replace(",", "."))
        : undefined,
      depthClosedCm: filterState.depthClosedMaxCm
        ? Number(filterState.depthClosedMaxCm.replace(",", "."))
        : undefined,
      depthOpenCm: filterState.depthOpenMaxCm
        ? Number(filterState.depthOpenMaxCm.replace(",", "."))
        : undefined,
    };
    const result = baseFiltered.filter(
      (product) =>
        matchesCatalogMaterials(product, filterState.material) &&
        matchesCatalogColors(product, filterState.color) &&
        matchesCatalogFeatures(product, filterState.feature) &&
        matchesCatalogDimensions(product, filterState.dimension) &&
        matchesCatalogDimensionLimits(product, dimensionLimits),
    );
    if (filterState.sort === "low")
      result.sort(
        (a, b) => productDisplayPrice(a) - productDisplayPrice(b) || a.id.localeCompare(b.id),
      );
    if (filterState.sort === "high")
      result.sort(
        (a, b) => productDisplayPrice(b) - productDisplayPrice(a) || a.id.localeCompare(b.id),
      );
    if (filterState.sort === "new")
      result.sort(
        (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at) || a.id.localeCompare(b.id),
      );
    if (filterState.sort === "relevant")
      result.sort((a, b) => catalogSearchScore(b, query) - catalogSearchScore(a, query));
    if (filterState.sort === "recommended")
      result.sort(
        (a, b) =>
          Number(b.vitrine_semana_ordem != null) - Number(a.vitrine_semana_ordem != null) ||
          (a.ordem ?? 0) - (b.ordem ?? 0),
      );
    return result;
  }, [baseFiltered, filterState, query]);
  const reset = () => {
    const next: CatalogFilterState = {
      ...DEFAULT_CATALOG_FILTERS,
      sort: query.trim() ? "relevant" : "recommended",
    };
    setFilterState(next);
    setCount(24);
    onCatalogStateChange?.(next, 1);
    onPageChange?.(1);
    setFiltersOpen(false);
  };
  const activeFilterCount =
    Number(Boolean(filterState.minPrice || filterState.maxPrice)) +
    Number(filterState.material !== "all") +
    Number(filterState.color !== "all") +
    Number(filterState.feature !== "all") +
    Number(Boolean(filterState.dimension.trim())) +
    Number(Boolean(filterState.widthMaxCm)) +
    Number(Boolean(filterState.heightMaxCm)) +
    Number(Boolean(filterState.depthClosedMaxCm)) +
    Number(Boolean(filterState.depthOpenMaxCm));
  const invalidPriceRange = !isValidCatalogPriceRange(filterState);
  const hasCustomSort = filterState.sort !== (query.trim() ? "relevant" : "recommended");
  const priceSummary = [
    filterState.minPrice ? `De ${formatBRL(priceToCents(filterState.minPrice)! / 100)}` : "",
    filterState.maxPrice ? `até ${formatBRL(priceToCents(filterState.maxPrice)! / 100)}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const sharedQuery = serializeCatalogUrlState(
    filterState,
    requestedPage,
    query.trim() ? "relevant" : "recommended",
  );
  const sharedPageUrl = shareCategory
    ? `${shareCategory.url}${sharedQuery ? `${shareCategory.url.includes("?") ? "&" : "?"}${sharedQuery}` : ""}`
    : "";
  const shareHref = shareCategory
    ? `https://wa.me/?text=${encodeURIComponent(`Veja ${shareCategory.label} na Mobi: ${sharedPageUrl}`)}`
    : undefined;
  const dimensionFilterFields = [
    {
      key: "widthMaxCm",
      label: "Largura máxima",
      id: "mobi-catalog-width-max",
      coverageKey: "widthCm",
    },
    {
      key: "heightMaxCm",
      label: "Altura máxima",
      id: "mobi-catalog-height-max",
      coverageKey: "heightCm",
    },
    {
      key: "depthClosedMaxCm",
      label: "Profundidade fechada máxima",
      id: "mobi-catalog-depth-closed-max",
      coverageKey: "depthClosedCm",
    },
    {
      key: "depthOpenMaxCm",
      label: "Profundidade aberta máxima",
      id: "mobi-catalog-depth-open-max",
      coverageKey: "depthOpenCm",
    },
  ] as const;
  const renderFilterGroup = (group: FilterKey) => {
    if (group === "material" && materialOptions.length)
      return (
        <details className="mobi-filter-group" open key={group}>
          <summary>Material / tecido</summary>
          <div className="mobi-filter-group-content">
            <select
              id="mobi-catalog-material"
              aria-label="Filtrar por material"
              value={filterState.material}
              onChange={(event) => updateFilters({ material: event.target.value })}
            >
              <option value="all">Todos os materiais</option>
              {materialOptions.map(([value, total]) => (
                <option key={value} value={value}>
                  {value} ({total})
                </option>
              ))}
            </select>
          </div>
        </details>
      );
    if (group === "color" && colorOptions.length)
      return (
        <details className="mobi-filter-group" key={group}>
          <summary>Cor</summary>
          <div className="mobi-filter-group-content">
            <select
              id="mobi-catalog-color"
              aria-label="Filtrar por cor"
              value={filterState.color}
              onChange={(event) => updateFilters({ color: event.target.value })}
            >
              <option value="all">Todas as cores</option>
              {colorOptions.map(([value, total]) => (
                <option key={value} value={value}>
                  {value} ({total})
                </option>
              ))}
            </select>
          </div>
        </details>
      );
    if (
      group === "dimensions" &&
      dimensionFilterFields.some((field) => dimensionCoverage[field.coverageKey] > 0)
    )
      return (
        <details className="mobi-filter-group" key={group}>
          <summary>Medidas (cm)</summary>
          <div className="mobi-filter-group-content mobi-price-range">
            {dimensionFilterFields
              .filter((field) => dimensionCoverage[field.coverageKey] > 0)
              .map((field) => (
                <div key={field.key}>
                  <label htmlFor={field.id}>
                    {field.label} · {dimensionCoverage[field.coverageKey]}/{baseFiltered.length}
                  </label>
                  <div className="mobi-price-input">
                    <input
                      id={field.id}
                      type="text"
                      inputMode="decimal"
                      placeholder="Ex.: 210"
                      value={filterState[field.key]}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (/^(?:\d{0,5}(?:[.,]\d{0,2})?)?$/.test(value))
                          updateFilters({ [field.key]: value });
                      }}
                    />
                  </div>
                </div>
              ))}
            <small className="mobi-dimension-help">
              Usamos medidas identificadas no cadastro. Produtos sem esta medida não entram no
              resultado filtrado.
            </small>
          </div>
        </details>
      );
    if (group === "features" && featureOptions.length)
      return (
        <details className="mobi-filter-group" key={group}>
          <summary>Característica</summary>
          <div className="mobi-filter-group-content">
            <select
              id="mobi-catalog-feature"
              aria-label="Filtrar por característica"
              value={filterState.feature}
              onChange={(event) => updateFilters({ feature: event.target.value })}
            >
              <option value="all">Todas as características</option>
              {featureOptions.map(([value, total]) => (
                <option key={value} value={value}>
                  {value} ({total})
                </option>
              ))}
            </select>
          </div>
        </details>
      );
    return null;
  };
  const renderedFilterGroups = [...new Set(filterOrder)].map(renderFilterGroup);
  const filters = (
    <>
      <div className="mobi-filter-heading">
        <h3>Filtre os produtos</h3>
        <button
          type="button"
          className="mobi-text-link"
          onClick={reset}
          disabled={activeFilterCount === 0 && !hasCustomSort}
        >
          Limpar
        </button>
      </div>
      <details className="mobi-filter-group mobi-catalog-categories">
        <summary>Categorias</summary>
        <nav className="mobi-catalog-environments" aria-label="Navegar por ambiente">
          <Link
            to="/"
            search={{ all: true, page: 1 }}
            hash="catalogo"
            className={category === "all" ? "selected" : ""}
            aria-current={category === "all" ? "page" : undefined}
          >
            Todos os produtos
          </Link>
          {environments.map((item) => (
            <Link
              to="/categoria/$slug"
              params={{ slug: item.slug }}
              search={{ page: 1 }}
              key={item.slug}
              className={room?.slug === item.slug ? "selected" : ""}
              aria-current={category === item.slug ? "page" : undefined}
            >
              <FurnitureCategoryIcon category={item} />
              {categoryDisplayLabel(item)}
            </Link>
          ))}
        </nav>
      </details>
      {renderedFilterGroups}
      <details className="mobi-filter-group" open>
        <summary>Preço no Pix</summary>
        <div className="mobi-filter-group-content mobi-price-range">
          <label htmlFor="mobi-catalog-min-price">A partir de</label>
          <div className="mobi-price-input">
            <span aria-hidden="true">R$</span>
            <input
              id="mobi-catalog-min-price"
              type="text"
              inputMode="decimal"
              placeholder="Mínimo"
              value={filterState.minPrice}
              onChange={(event) => {
                const value = event.target.value;
                if (/^(?:\d{1,7}(?:[.,]\d{0,2})?)?$/.test(value))
                  updateFilters({ minPrice: value });
              }}
              aria-invalid={invalidPriceRange}
              aria-describedby="mobi-catalog-price-help"
            />
          </div>
          <label htmlFor="mobi-catalog-max-price">Até</label>
          <div className="mobi-price-input">
            <span aria-hidden="true">R$</span>
            <input
              id="mobi-catalog-max-price"
              type="text"
              inputMode="decimal"
              placeholder="Máximo"
              value={filterState.maxPrice}
              onChange={(event) => {
                const value = event.target.value;
                if (/^(?:\d{1,7}(?:[.,]\d{0,2})?)?$/.test(value))
                  updateFilters({ maxPrice: value });
              }}
              aria-invalid={invalidPriceRange}
              aria-describedby="mobi-catalog-price-help"
            />
          </div>
          <small id="mobi-catalog-price-help" className="mobi-dimension-help">
            Informe valores em reais, como 999,90.
          </small>
          {invalidPriceRange && (
            <small className="mobi-filter-error" role="alert">
              O valor mínimo não pode ser maior que o máximo.
            </small>
          )}
        </div>
      </details>
      {filtersOpen && (
        <button type="button" className="mobi-primary" onClick={() => setFiltersOpen(false)}>
          Mostrar {filtered.length} {filtered.length === 1 ? "produto" : "produtos"}
        </button>
      )}
    </>
  );
  return (
    <section className="mobi-catalog mobi-wrap" id="catalogo">
      <nav className="mobi-breadcrumb" aria-label="Você está em">
        <Link to="/" search={{}} className="mobi-text-link">
          Início
        </Link>
        <span aria-hidden="true">/</span>
        {category !== "all" && (
          <>
            <Link to="/" search={{ all: true, page: 1 }} hash="catalogo">
              Todos os produtos
            </Link>
            <span aria-hidden="true">/</span>
          </>
        )}
        {category === "all" ? (
          <span aria-current="page">Catálogo completo</span>
        ) : (
          <span aria-current="page">{getCategory(category)?.label ?? "Produtos"}</span>
        )}
      </nav>
      <div className="mobi-catalog-title">
        <div className="mobi-catalog-heading">
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
        <div className="mobi-results-toolbar">
          <button
            type="button"
            className="mobi-filter-toggle"
            aria-expanded={filtersOpen}
            aria-controls="mobi-catalog-filters"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <SlidersHorizontal size={17} aria-hidden="true" />
            {filtersOpen ? "Fechar filtros" : "Filtros"}
            {activeFilterCount > 0 && (
              <span className="mobi-filter-count">{activeFilterCount}</span>
            )}
          </button>
          <label className="mobi-sort">
            Ordenar por
            <select
              aria-label="Ordenar produtos"
              value={filterState.sort}
              onChange={(event) =>
                updateFilters({ sort: event.target.value as CatalogFilterState["sort"] })
              }
            >
              <option value="relevant">Mais relevantes</option>
              <option value="recommended">Recomendados</option>
              <option value="low">Menor preço</option>
              <option value="high">Maior preço</option>
              <option value="new">Novidades</option>
            </select>
          </label>
        </div>
        {shareHref && (
          <a
            href={shareHref}
            target="_blank"
            rel="noreferrer"
            className="mobi-catalog-share"
            aria-label="Compartilhar esta página no WhatsApp"
          >
            <WhatsAppIcon className="h-5 w-5" />
            <span>
              Compartilhar<span className="mobi-share-channel"> no WhatsApp</span>
            </span>
          </a>
        )}
      </div>
      {relatedTypes.length > 0 && (
        <nav
          className="mobi-product-types mobi-catalog-related"
          aria-label="Categorias relacionadas"
        >
          {relatedTypes.map((item) => (
            <Link
              to="/categoria/$slug"
              params={{ slug: item.slug }}
              search={{ page: 1 }}
              key={item.slug}
              aria-current={category === item.slug ? "page" : undefined}
              className={category === item.slug ? "selected" : ""}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
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
          <div className="mobi-applied">
            {(filterState.minPrice || filterState.maxPrice) && (
              <button type="button" onClick={() => updateFilters({ minPrice: "", maxPrice: "" })}>
                {priceSummary} · Remover
              </button>
            )}
            {filterState.material !== "all" && (
              <button type="button" onClick={() => updateFilters({ material: "all" })}>
                Material: {filterState.material} · Remover
              </button>
            )}
            {filterState.color !== "all" && (
              <button type="button" onClick={() => updateFilters({ color: "all" })}>
                Cor: {filterState.color} · Remover
              </button>
            )}
            {filterState.feature !== "all" && (
              <button type="button" onClick={() => updateFilters({ feature: "all" })}>
                {filterState.feature} · Remover
              </button>
            )}
            {filterState.dimension.trim() && (
              <button type="button" onClick={() => updateFilters({ dimension: "" })}>
                Medida: {filterState.dimension} · Remover
              </button>
            )}
            {dimensionFilterFields.map((field) => {
              const value = filterState[field.key];
              if (!value) return null;
              return (
                <button
                  key={field.key}
                  type="button"
                  onClick={() => updateFilters({ [field.key]: "" })}
                >
                  {field.label.replace(" máxima", "")} até {value} cm · Remover
                </button>
              );
            })}
            {query && (
              <Link to="/" search={{ all: true, page: 1 }} hash="catalogo">
                “{query}” · Remover
              </Link>
            )}
          </div>
          {filtered.length ? (
            <>
              <div
                className={`mobi-grid mobi-catalog-grid${filtered.length === 1 ? " is-single" : ""}`}
              >
                {filtered.slice(0, count).map((product) => (
                  <ProductCard
                    key={product.id}
                    produto={product}
                    badge={badges[product.id]}
                    returnPage={initialCategory !== "all" ? requestedPage : undefined}
                    returnCategory={initialCategory !== "all" ? initialCategory : undefined}
                    returnSearch={
                      initialCategory !== "all"
                        ? serializeCatalogUrlState(filterState, requestedPage)
                        : undefined
                    }
                  />
                ))}
              </div>
              {filtered.length > 24 && (
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
              )}
            </>
          ) : (
            <div className="mobi-empty">
              {query.trim() ? (
                <>
                  <h2>Nenhum móvel encontrado para “{query.trim()}”</h2>
                  <p>
                    Tente outro nome ou medida, ou abra o catálogo completo para continuar
                    procurando.
                  </p>
                  <div className="mobi-empty-actions">
                    <Link to="/" search={{ all: true, page: 1 }} hash="catalogo">
                      Ver todos os produtos
                    </Link>
                    {activeFilterCount > 0 && (
                      <button type="button" onClick={reset}>
                        Limpar filtros
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h2>Vamos tentar outra combinação?</h2>
                  <p>Nenhum produto corresponde aos filtros escolhidos.</p>
                  <button type="button" className="mobi-primary" onClick={reset}>
                    Limpar filtros
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
