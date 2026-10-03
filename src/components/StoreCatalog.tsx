import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ProductCard, productDisplayPrice, type ProductBadge } from "@/components/ProductCard";
import { FurnitureCategoryIcon, categoryDisplayLabel } from "@/components/CategoryNavigation";
import { CATEGORIES, SUBCATEGORIES, categoryMatches, getCategory } from "@/lib/constants";
import type { Produto } from "@/lib/products.functions";

const ranges = [
  ["all", "Todos os preços"],
  ["500", "Até R$ 500"],
  ["1500", "De R$ 500 a R$ 1.500"],
  ["above", "Acima de R$ 1.500"],
] as const;
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
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
  const [range, setRange] = useState("all");
  const [sort, setSort] = useState("recommended");
  const [count, setCount] = useState(Math.max(1, requestedPage) * 24);
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => {
    setCategory(initialCategory);
    setCount(Math.max(1, requestedPage) * 24);
  }, [initialCategory, requestedPage]);
  const filtered = useMemo(() => {
    const result = products.filter(
      (product) =>
        (category === "all" || categoryMatches(product.categoria, category)) &&
        (!query ||
          normalize(
            [product.nome, product.descricao, product.medidas, ...(product.cores ?? [])]
              .filter(Boolean)
              .join(" "),
          ).includes(normalize(query.trim()))) &&
        (!offers || product.preco_antigo > productDisplayPrice(product)) &&
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
    setRange("all");
    setSort("recommended");
    setCount(24);
  };
  const selectCategory = (slug: string) => {
    setCategory(slug);
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
      <label htmlFor="mobi-catalog-category">Categoria</label>
      <select
        id="mobi-catalog-category"
        value={category}
        onChange={(event) => selectCategory(event.target.value)}
      >
        <option value="all">Todos</option>
        {CATEGORIES.map((item) => (
          <option key={item.slug} value={item.slug}>
            {categoryDisplayLabel(item)}
          </option>
        ))}
        <optgroup label="Tipos de produto">
          {SUBCATEGORIES.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.label}
            </option>
          ))}
        </optgroup>
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
      <Link to="/" search={{}} className="mobi-text-link mobi-breadcrumb">
        Início / Catálogo
      </Link>
      <div className="mobi-section-title mobi-catalog-title">
        <div>
          <span className="mobi-eyebrow">MÓVEIS PARA A SUA VIDA</span>
          <h1>{offers ? "Ofertas para sua casa." : "Encontre o seu favorito."}</h1>
          <p>{products.length} produtos no catálogo</p>
        </div>
      </div>
      <nav
        className="mobi-category-chips mobi-desktop-categories"
        aria-label="Atalhos de categoria"
      >
        <button
          type="button"
          className={category === "all" ? "selected" : ""}
          onClick={() => selectCategory("all")}
        >
          Todos
        </button>
        {CATEGORIES.map((item) => (
          <button
            type="button"
            key={item.slug}
            className={category === item.slug ? "selected" : ""}
            onClick={() => selectCategory(item.slug)}
          >
            <FurnitureCategoryIcon category={item} />
            {categoryDisplayLabel(item)}
          </button>
        ))}
      </nav>
      <nav className="mobi-mobile-environments" aria-label="Ambientes">
        {["sala-de-estar", "cozinha", "dormitorios"].map((slug) => {
          const item = getCategory(slug)!;
          return (
            <button
              type="button"
              key={slug}
              className={category === slug ? "selected" : ""}
              onClick={() => selectCategory(slug)}
            >
              <FurnitureCategoryIcon category={item} />
              <span>{categoryDisplayLabel(item, true)}</span>
            </button>
          );
        })}
      </nav>
      <div className="mobi-catalog-layout">
        <aside
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
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              Filtros
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
                    onClick={() => setCount(count + 24)}
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
