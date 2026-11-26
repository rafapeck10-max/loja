import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CircleDollarSign,
  FileUp,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type { PriceVariation, ProdutoScrapImport } from "../../lib/admin.functions";
import { formatBRL } from "../../lib/constants";
import {
  buildCategoryCounts,
  filterAndSortScrapedProducts,
  parsePriceFilter,
  type ScrapedSortOption,
} from "../../lib/admin-filters";
import { ProductThumbnail } from "./ProductThumbnail";

export interface ScrapedImportsPanelProps {
  items: readonly ProdutoScrapImport[];
  importing: boolean;
  isFetching: boolean;
  isError: boolean;
  errorMessage?: string;
  onImportFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onRefresh: () => void;
  onReview: (product: ProdutoScrapImport) => void;
}

function moneyOrDash(value: number | null | undefined): string {
  return value == null || Number(value) <= 0 ? "—" : formatBRL(Number(value));
}

function parseVariations(value: unknown): PriceVariation[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    const name = String(item.name ?? "").trim();
    const sku = String(item.sku ?? "").trim();
    if (!name || !sku) return [];
    const supplierPrice = Number(item.supplier_price);
    const salePrice =
      item.sale_price == null || item.sale_price === "" ? null : Number(item.sale_price);
    return [
      {
        name,
        sku,
        supplier_price: Number.isFinite(supplierPrice) ? supplierPrice : null,
        sale_price: salePrice != null && Number.isFinite(salePrice) ? salePrice : null,
      },
    ];
  });
}

export function ScrapedImportsPanel({
  items,
  importing,
  isFetching,
  isError,
  errorMessage,
  onImportFile,
  onRefresh,
  onReview,
}: ScrapedImportsPanelProps) {
  const [query, setQuery] = useState("");
  const [supplier, setSupplier] = useState("all");
  const [categoryKey, setCategoryKey] = useState("all");
  const [minCost, setMinCost] = useState("");
  const [maxCost, setMaxCost] = useState("");
  const [sort, setSort] = useState<ScrapedSortOption>("newest");
  const [page, setPage] = useState(1);

  const parsedMinCost = parsePriceFilter(minCost);
  const parsedMaxCost = parsePriceFilter(maxCost);
  const invalidCostRange =
    Number.isNaN(parsedMinCost) ||
    Number.isNaN(parsedMaxCost) ||
    (parsedMinCost != null && parsedMaxCost != null && parsedMinCost > parsedMaxCost);

  const supplierOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      const name = item.supplier.trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
      .map(([name, count]) => ({ name, count }));
  }, [items]);

  const categoryOptions = useMemo(() => {
    const base = filterAndSortScrapedProducts(items, {
      query,
      supplier,
      categoryKey: "all",
      minCost,
      maxCost,
      sort: "newest",
    });
    return buildCategoryCounts(base);
  }, [items, query, supplier, minCost, maxCost]);

  useEffect(() => {
    if (
      categoryKey !== "all" &&
      categoryOptions.length > 0 &&
      !categoryOptions.some((option) => option.key === categoryKey)
    ) {
      setCategoryKey("all");
    }
  }, [categoryKey, categoryOptions]);

  const filtered = useMemo(
    () =>
      filterAndSortScrapedProducts(items, {
        query,
        supplier,
        categoryKey,
        minCost,
        maxCost,
        sort,
      }),
    [items, query, supplier, categoryKey, minCost, maxCost, sort],
  );

  const pageSize = 24;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, filtered.length);

  useEffect(() => {
    setPage(1);
  }, [query, supplier, categoryKey, minCost, maxCost, sort]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const hasFilters =
    query.trim() !== "" ||
    supplier !== "all" ||
    categoryKey !== "all" ||
    minCost.trim() !== "" ||
    maxCost.trim() !== "" ||
    sort !== "newest";

  const clearFilters = () => {
    setQuery("");
    setSupplier("all");
    setCategoryKey("all");
    setMinCost("");
    setMaxCost("");
    setSort("newest");
  };

  const selectedCategoryLabel =
    categoryOptions.find((option) => option.key === categoryKey)?.label ?? null;

  return (
    <section className="scraped-imports" aria-labelledby="scraped-imports-title">
      <header className="scraped-imports-header">
        <div>
          <h1 id="scraped-imports-title">Importações pendentes</h1>
          <p>
            {items.length > 0
              ? `${items.length.toLocaleString("pt-BR")} produto(s) coletado(s) aguardando definição de preço para entrar no catálogo.`
              : "Importe um JSONL do worker. O custo fica salvo como referência; o produto só vai para o catálogo após você definir o preço."}
          </p>
        </div>
        <div className="scraped-imports-actions">
          <button type="button" className="aw-action" onClick={onRefresh} disabled={isFetching}>
            <RefreshCw size={15} className={isFetching ? "ov-spin" : ""} aria-hidden="true" />
            {isFetching ? "Atualizando…" : "Atualizar"}
          </button>
          <label className="scraped-upload-btn">
            <FileUp size={15} aria-hidden="true" />
            <span>{importing ? "Importando…" : "Importar JSONL"}</span>
            <input
              type="file"
              accept=".jsonl,.ndjson,.json,application/json,text/plain"
              onChange={onImportFile}
              disabled={importing}
              className="hidden"
            />
          </label>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="supplier-pricing-results scraped-empty-box">
          <p>
            {isError
              ? `A fila de importação ainda não está disponível: ${errorMessage || "verifique a migração do banco."}`
              : isFetching
                ? "Carregando importações…"
                : "Nenhum produto aguardando revisão."}
          </p>
        </div>
      ) : (
        <div className="admin-workbench">
          <section className="admin-workbench-filters" aria-label="Filtros das importações">
            <div className="admin-filter-row-main admin-filter-row-imports">
              <label className="admin-filter-field admin-filter-search">
                <span>Buscar importação</span>
                <div className="admin-input-with-icon">
                  <Search size={16} aria-hidden="true" />
                  <input
                    type="search"
                    aria-label="Buscar nas importações"
                    placeholder="Nome, SKU, referência ou categoria…"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
              </label>

              <label className="admin-filter-field">
                <span>Fornecedor</span>
                <select
                  aria-label="Filtrar fornecedor nas importações"
                  value={supplier}
                  onChange={(event) => setSupplier(event.target.value)}
                >
                  <option value="all">Todos ({items.length})</option>
                  {supplierOptions.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name} ({item.count})
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-filter-field">
                <span>Categoria</span>
                <select
                  aria-label="Filtrar categoria nas importações"
                  value={categoryKey}
                  onChange={(event) => setCategoryKey(event.target.value)}
                >
                  <option value="all">
                    Todas as categorias (
                    {categoryOptions.reduce((sum, item) => sum + item.count, 0)})
                  </option>
                  {categoryOptions.map((category) => (
                    <option key={category.key} value={category.key}>
                      {category.label} ({category.count})
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-filter-field">
                <span>Ordenar por</span>
                <select
                  aria-label="Ordenar importações"
                  value={sort}
                  onChange={(event) => setSort(event.target.value as ScrapedSortOption)}
                >
                  <option value="newest">Mais recentes</option>
                  <option value="cost-asc">Menor custo</option>
                  <option value="cost-desc">Maior custo</option>
                  <option value="name-asc">Nome (A–Z)</option>
                </select>
              </label>
            </div>

            <div className="admin-filter-row-secondary">
              <div className="admin-cost-range" aria-label="Filtrar importações por custo">
                <SlidersHorizontal size={14} aria-hidden="true" />
                <label>
                  <span className="aw-sr-only">Custo mínimo (R$)</span>
                  <input
                    inputMode="decimal"
                    placeholder="Custo mín."
                    aria-label="Custo mínimo na importação"
                    aria-invalid={invalidCostRange}
                    value={minCost}
                    onChange={(event) => setMinCost(event.target.value)}
                  />
                </label>
                <span className="admin-cost-sep">até</span>
                <label>
                  <span className="aw-sr-only">Custo máximo (R$)</span>
                  <input
                    inputMode="decimal"
                    placeholder="Custo máx."
                    aria-label="Custo máximo na importação"
                    aria-invalid={invalidCostRange}
                    value={maxCost}
                    onChange={(event) => setMaxCost(event.target.value)}
                  />
                </label>
              </div>

              <span className="scraped-results-counter">
                {filtered.length === 0
                  ? "0 importações encontradas"
                  : `Mostrando ${rangeStart}–${rangeEnd} de ${filtered.length.toLocaleString("pt-BR")} importação(ões)`}
              </span>
            </div>

            {invalidCostRange && (
              <p role="alert" className="admin-filter-error">
                Informe valores válidos de custo; o mínimo não pode ser maior que o máximo.
              </p>
            )}

            {hasFilters && (
              <div className="admin-active-chips">
                {query.trim() && (
                  <button type="button" className="admin-chip" onClick={() => setQuery("")}>
                    Busca: “{query.trim()}” <X size={13} aria-hidden="true" />
                  </button>
                )}
                {supplier !== "all" && (
                  <button type="button" className="admin-chip" onClick={() => setSupplier("all")}>
                    Fornecedor: {supplier} <X size={13} aria-hidden="true" />
                  </button>
                )}
                {selectedCategoryLabel && (
                  <button
                    type="button"
                    className="admin-chip"
                    onClick={() => setCategoryKey("all")}
                  >
                    Categoria: {selectedCategoryLabel} <X size={13} aria-hidden="true" />
                  </button>
                )}
                {(minCost.trim() || maxCost.trim()) && (
                  <button
                    type="button"
                    className="admin-chip"
                    onClick={() => {
                      setMinCost("");
                      setMaxCost("");
                    }}
                  >
                    Custo: {minCost.trim() || "0"} – {maxCost.trim() || "sem máx."}{" "}
                    <X size={13} aria-hidden="true" />
                  </button>
                )}
                <button type="button" className="admin-reset-filters" onClick={clearFilters}>
                  <RotateCcw size={13} aria-hidden="true" /> Limpar filtros
                </button>
              </div>
            )}
          </section>

          {visibleItems.length === 0 ? (
            <div className="supplier-pricing-results scraped-empty-box">
              <p>Nenhuma importação corresponde aos filtros atuais.</p>
              <button type="button" className="aw-action mt-3" onClick={clearFilters}>
                Limpar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="scraped-grid">
                {visibleItems.map((product) => {
                  const variations = parseVariations(product.price_variations);
                  return (
                    <article key={product.id} className="scraped-card">
                      <div className="scraped-card-top">
                        <ProductThumbnail
                          product={{
                            nome: product.name,
                            url_imagem: product.image_urls[0],
                            imagens: product.image_urls.slice(1),
                          }}
                        />
                        <div className="scraped-card-body">
                          <div className="scraped-card-title-row">
                            <h3>{product.name}</h3>
                            <span className="scraped-cost-pill">
                              {moneyOrDash(product.supplier_price)} custo
                            </span>
                          </div>
                          <p className="scraped-card-meta">
                            {[product.supplier, product.category, product.sku || product.reference]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                          {variations.length > 1 && (
                            <p className="scraped-card-variations">
                              {variations
                                .map(
                                  (variation) =>
                                    `${variation.name}: ${moneyOrDash(variation.supplier_price)}`,
                                )
                                .join(" · ")}
                            </p>
                          )}
                          {product.measurements && (
                            <p className="scraped-card-line line-clamp-2">{product.measurements}</p>
                          )}
                          {product.description && (
                            <p className="scraped-card-desc line-clamp-2">{product.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="scraped-card-footer">
                        <span className="scraped-photo-count">
                          {product.image_urls.length} foto(s)
                        </span>
                        <button
                          type="button"
                          onClick={() => onReview(product)}
                          className="scraped-review-btn"
                        >
                          <CircleDollarSign size={15} aria-hidden="true" /> Precificar e publicar
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div
                  className="supplier-pricing-pagination mt-4"
                  aria-label="Paginação das importações"
                >
                  <button
                    type="button"
                    disabled={safePage === 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    <ArrowLeft size={15} /> Anterior
                  </button>
                  <span>
                    Página {safePage} de {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={safePage === totalPages}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  >
                    Próxima <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
