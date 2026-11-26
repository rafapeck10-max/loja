import { ProductIdentity } from "./ProductThumbnail";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  Pencil,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type { PriceVariation, ProdutoAdmin } from "../../lib/admin.functions";
import { formatBRL } from "../../lib/constants";
import { cardInstallment } from "../../lib/payment";
import {
  buildCategoryCounts,
  filterAndSortPricingProducts,
  parsePriceFilter,
  parseQuickPriceInput,
  productStatus,
  type PricingSortOption,
  type PricingStatusFilter,
  type ProductStatus,
} from "../../lib/admin-filters";

export interface SupplierPricingSummary {
  key: string;
  label: string;
  total: number;
  missingCost: number;
  missingSitePrice: number;
  belowCost: number;
}

export type SupplierPricingProduct = Pick<
  ProdutoAdmin,
  "id" | "nome" | "preco_atacado" | "preco_atual" | "url_imagem"
> &
  Partial<
    Pick<
      ProdutoAdmin,
      | "sku"
      | "categoria"
      | "fornecedor"
      | "descricao"
      | "medidas"
      | "cores"
      | "url_fornecedor"
      | "fonte_preco"
      | "variacoes_preco"
    >
  >;

export interface SupplierPricingPanelProps<T extends SupplierPricingProduct = ProdutoAdmin> {
  summaries: readonly SupplierPricingSummary[];
  products: readonly T[];
  selectedSupplier: string;
  onSelectSupplier: (key: string) => void;
  onEdit: (product: T) => void;
  onQuickSavePrice?: (product: T, nextPrice: number) => Promise<void>;
}

const statusLabels: Record<ProductStatus, string> = {
  published: "Precificado",
  awaiting: "Aguardando preço",
  incomplete: "Incompleto",
};

const SORT_LABELS: ReadonlyArray<{ id: PricingSortOption; label: string }> = [
  { id: "cost-asc", label: "Menor custo primeiro" },
  { id: "cost-desc", label: "Maior custo primeiro" },
  { id: "price-asc", label: "Menor preço no site" },
  { id: "price-desc", label: "Maior preço no site" },
  { id: "margin-asc", label: "Menor diferença bruta" },
  { id: "margin-desc", label: "Maior diferença bruta" },
  { id: "name-asc", label: "Nome (A–Z)" },
];

function money(value: number | null | undefined): string {
  return value == null || Number(value) <= 0 ? "—" : formatBRL(Number(value));
}

function inputFormat(value: number | null | undefined): string {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "";
  return numeric.toFixed(2).replace(".", ",");
}

function difference(
  costValue: number | null | undefined,
  sitePriceValue: number | null | undefined,
) {
  const cost = Number(costValue ?? 0);
  const sitePrice = Number(sitePriceValue ?? 0);
  return cost > 0 && sitePrice > 0 ? sitePrice - cost : null;
}

function differenceLabel(
  costValue: number | null | undefined,
  sitePriceValue: number | null | undefined,
) {
  const amount = difference(costValue, sitePriceValue);
  if (amount == null) return "—";
  return (amount < 0 ? "−" : "+") + formatBRL(Math.abs(amount));
}

function marginPercentLabel(
  costValue: number | null | undefined,
  sitePriceValue: number | null | undefined,
): string | null {
  const cost = Number(costValue ?? 0);
  const sitePrice = Number(sitePriceValue ?? 0);
  if (cost <= 0 || sitePrice <= 0) return null;
  const pct = Math.round(((sitePrice - cost) / cost) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}%`;
}

function countPriceVariations(value: unknown): number {
  if (!Array.isArray(value)) return 0;
  return value.filter(
    (entry) => entry && typeof entry === "object" && (entry as PriceVariation).sku,
  ).length;
}

export function SupplierPricingPanel<T extends SupplierPricingProduct>({
  summaries,
  products,
  selectedSupplier,
  onSelectSupplier,
  onEdit,
  onQuickSavePrice,
}: SupplierPricingPanelProps<T>) {
  const [query, setQuery] = useState("");
  const [categoryKey, setCategoryKey] = useState("all");
  const [statusFilter, setStatusFilter] = useState<PricingStatusFilter>("awaiting");
  const [minCost, setMinCost] = useState("");
  const [maxCost, setMaxCost] = useState("");
  const [sort, setSort] = useState<PricingSortOption>("cost-asc");
  const [page, setPage] = useState(1);
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  const parsedMinCost = parsePriceFilter(minCost);
  const parsedMaxCost = parsePriceFilter(maxCost);
  const invalidCostRange =
    Number.isNaN(parsedMinCost) ||
    Number.isNaN(parsedMaxCost) ||
    (parsedMinCost != null && parsedMaxCost != null && parsedMinCost > parsedMaxCost);

  const counts = useMemo(() => {
    const base = filterAndSortPricingProducts(products, {
      query,
      categoryKey,
      status: "all",
      minCost,
      maxCost,
      sort: "name-asc",
    });
    return {
      awaiting: base.filter((p) => !(Number(p.preco_atual) > 0)).length,
      published: base.filter((p) => Number(p.preco_atual) > 0).length,
      "below-cost": base.filter((p) => {
        const d = difference(p.preco_atacado, p.preco_atual);
        return d !== null && d < 0;
      }).length,
      "missing-cost": base.filter((p) => !(Number(p.preco_atacado) > 0)).length,
      all: base.length,
    };
  }, [products, query, categoryKey, minCost, maxCost]);

  const categoryOptions = useMemo(() => {
    const baseForCategories = filterAndSortPricingProducts(products, {
      query,
      categoryKey: "all",
      status: statusFilter,
      minCost,
      maxCost,
      sort: "name-asc",
    });
    return buildCategoryCounts(baseForCategories);
  }, [products, query, statusFilter, minCost, maxCost]);

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
      filterAndSortPricingProducts(products, {
        query,
        categoryKey,
        status: statusFilter,
        minCost,
        maxCost,
        sort,
      }),
    [products, query, categoryKey, statusFilter, minCost, maxCost, sort],
  );

  const pageSize = 32;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleProducts = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, filtered.length);
  const selected = summaries.find((summary) => summary.key === selectedSupplier) ?? summaries[0];

  useEffect(() => {
    setPage(1);
  }, [selectedSupplier, query, categoryKey, statusFilter, minCost, maxCost, sort]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const hasCustomFilters =
    query.trim() !== "" ||
    categoryKey !== "all" ||
    minCost.trim() !== "" ||
    maxCost.trim() !== "" ||
    statusFilter !== "awaiting" ||
    sort !== "cost-asc";

  const clearFilters = () => {
    setQuery("");
    setCategoryKey("all");
    setMinCost("");
    setMaxCost("");
    setStatusFilter("awaiting");
    setSort("cost-asc");
  };

  const selectedCategoryLabel =
    categoryOptions.find((option) => option.key === categoryKey)?.label ?? null;

  const filterPills: ReadonlyArray<{
    id: PricingStatusFilter;
    label: string;
    count: number;
    hideWhenZero?: boolean;
  }> = [
    { id: "awaiting", label: "Aguardando preço", count: counts.awaiting },
    { id: "published", label: "Já precificados", count: counts.published },
    {
      id: "below-cost",
      label: "Abaixo do custo",
      count: counts["below-cost"],
      hideWhenZero: true,
    },
    { id: "missing-cost", label: "Sem custo", count: counts["missing-cost"], hideWhenZero: true },
    { id: "all", label: "Todos", count: counts.all },
  ];

  const handleQuickSave = async (product: T) => {
    if (!onQuickSavePrice) return;
    const currentInput = draftPrices[product.id] ?? inputFormat(product.preco_atual);
    const parsed = parseQuickPriceInput(currentInput);
    if (parsed == null || Number.isNaN(parsed) || parsed <= 0) {
      setRowErrors((prev) => ({
        ...prev,
        [product.id]: "Informe um preço de venda maior que zero.",
      }));
      return;
    }

    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[product.id];
      return next;
    });
    setSavingIds((prev) => ({ ...prev, [product.id]: true }));
    try {
      await onQuickSavePrice(product, parsed);
      setDraftPrices((prev) => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
      setSavedIds((prev) => ({ ...prev, [product.id]: true }));
      window.setTimeout(() => {
        setSavedIds((prev) => {
          const next = { ...prev };
          delete next[product.id];
          return next;
        });
      }, 2500);
    } catch (error) {
      setRowErrors((prev) => ({
        ...prev,
        [product.id]: error instanceof Error ? error.message : "Não foi possível salvar o preço.",
      }));
    } finally {
      setSavingIds((prev) => ({ ...prev, [product.id]: false }));
    }
  };

  return (
    <section className="supplier-pricing" aria-labelledby="supplier-pricing-title">
      <header className="supplier-pricing-header">
        <div>
          <h1 id="supplier-pricing-title">Precificar produtos</h1>
          <p>
            Filtre por fornecedor, categoria ou faixa de custo e salve o preço à vista direto na
            linha.
          </p>
        </div>
        <details className="pricing-formula-note">
          <summary>Como a margem é calculada</summary>
          <p>
            Diferença bruta = preço à vista no site menos custo informado. Não representa lucro e
            não inclui taxas de cartão, frete ou montagem.
          </p>
        </details>
      </header>

      <div className="supplier-pricing-groups" role="group" aria-label="Selecionar fornecedor">
        {summaries.map((summary) => {
          const active = summary.key === selectedSupplier;
          return (
            <button
              type="button"
              key={summary.key}
              aria-pressed={active}
              onClick={() => onSelectSupplier(summary.key)}
              className="supplier-pricing-group"
            >
              <span className="supplier-pricing-group-top">
                <strong>{summary.label}</strong>
                <b>{summary.total.toLocaleString("pt-BR")}</b>
              </span>
              <span className="supplier-pricing-group-meta">
                {summary.missingSitePrice > 0 ? (
                  <span className="pricing-meta-pending">
                    {summary.missingSitePrice.toLocaleString("pt-BR")} aguardando preço
                  </span>
                ) : (
                  <span className="pricing-meta-done">Tudo precificado</span>
                )}
                {summary.missingCost > 0 && ` · ${summary.missingCost} sem custo`}
                {summary.belowCost > 0 && ` · ${summary.belowCost} abaixo do custo`}
              </span>
            </button>
          );
        })}
      </div>

      <div className="admin-workbench">
        <section className="admin-workbench-filters" aria-label="Filtros da precificação">
          <div className="admin-filter-row-main">
            <label className="admin-filter-field admin-filter-search">
              <span>Buscar móvel</span>
              <div className="admin-input-with-icon">
                <Search size={16} aria-hidden="true" />
                <input
                  type="search"
                  aria-label="Buscar na precificação"
                  placeholder="Nome, SKU, categoria ou cor…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
            </label>

            <label className="admin-filter-field">
              <span>Categoria</span>
              <select
                aria-label="Filtrar por categoria na precificação"
                value={categoryKey}
                onChange={(event) => setCategoryKey(event.target.value)}
              >
                <option value="all">
                  Todas as categorias ({categoryOptions.reduce((sum, item) => sum + item.count, 0)})
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
                aria-label="Ordenar fila de precificação"
                value={sort}
                onChange={(event) => setSort(event.target.value as PricingSortOption)}
              >
                {SORT_LABELS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="admin-filter-row-secondary">
            <div
              className="pricing-filter-pills"
              role="group"
              aria-label="Filtrar fila de precificação"
            >
              {filterPills
                .filter((pill) => !pill.hideWhenZero || pill.count > 0 || statusFilter === pill.id)
                .map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    className="pricing-filter-pill"
                    aria-pressed={statusFilter === pill.id}
                    onClick={() => setStatusFilter(pill.id)}
                  >
                    <span>{pill.label}</span>
                    <b>{pill.count.toLocaleString("pt-BR")}</b>
                  </button>
                ))}
            </div>

            <div className="admin-filter-toolbar-right">
              <div className="admin-cost-range" aria-label="Filtrar por faixa de custo">
                <SlidersHorizontal size={14} aria-hidden="true" />
                <label>
                  <span className="aw-sr-only">Custo mínimo (R$)</span>
                  <input
                    inputMode="decimal"
                    placeholder="Custo mín."
                    aria-label="Custo mínimo em reais"
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
                    aria-label="Custo máximo em reais"
                    aria-invalid={invalidCostRange}
                    value={maxCost}
                    onChange={(event) => setMaxCost(event.target.value)}
                  />
                </label>
              </div>
              <span className="admin-workbench-meta-pill">
                {filtered.length === 0
                  ? "0 itens"
                  : `${rangeStart}–${rangeEnd} de ${filtered.length.toLocaleString("pt-BR")}`}
              </span>
            </div>
          </div>

          {invalidCostRange && (
            <p role="alert" className="admin-filter-error">
              Informe valores válidos de custo; o mínimo não pode ser maior que o máximo.
            </p>
          )}

          {(selectedCategoryLabel ||
            query.trim() ||
            minCost.trim() ||
            maxCost.trim() ||
            hasCustomFilters) && (
            <div className="admin-active-chips">
              {query.trim() && (
                <button type="button" className="admin-chip" onClick={() => setQuery("")}>
                  Busca: “{query.trim()}” <X size={13} aria-hidden="true" />
                </button>
              )}
              {selectedCategoryLabel && (
                <button type="button" className="admin-chip" onClick={() => setCategoryKey("all")}>
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
              {hasCustomFilters && (
                <button type="button" className="admin-reset-filters" onClick={clearFilters}>
                  <RotateCcw size={13} aria-hidden="true" /> Restaurar padrão
                </button>
              )}
            </div>
          )}
        </section>

        <section className="supplier-pricing-results" aria-labelledby="supplier-selected-title">
          <h2 id="supplier-selected-title" className="aw-sr-only">
            {selected?.label ?? "Produtos"}
            {selectedCategoryLabel ? ` — ${selectedCategoryLabel}` : ""}
          </h2>

          {filtered.length === 0 ? (
            <div className="supplier-pricing-empty">
              <p>
                Nenhum produto encontrado com estes filtros.
                {products.length > 0 && statusFilter !== "all"
                  ? " Você pode exibir todos os produtos desta seleção ou restaurar os filtros."
                  : ""}
              </p>
              <div className="supplier-pricing-empty-actions">
                {statusFilter !== "all" && (
                  <button type="button" onClick={() => setStatusFilter("all")}>
                    Ver todos ({counts.all})
                  </button>
                )}
                {hasCustomFilters && (
                  <button type="button" onClick={clearFilters}>
                    Restaurar filtros padrão
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div
                className={`supplier-pricing-table${onQuickSavePrice ? " has-inline-pricing" : ""}`}
                role="table"
                aria-label="Preços por produto"
              >
                <div className="supplier-pricing-row supplier-pricing-table-head" role="row">
                  <span role="columnheader">Produto / Categoria / SKU</span>
                  <span role="columnheader">Custo fornecedor</span>
                  <span role="columnheader">Preço à vista (site)</span>
                  <span role="columnheader">Diferença bruta</span>
                  <span role="columnheader">Situação</span>
                  <span role="columnheader">
                    <span className="aw-sr-only">Ações</span>
                  </span>
                </div>
                {visibleProducts.map((product) => {
                  const variationCount = countPriceVariations(product.variacoes_preco);
                  const multiVariation = variationCount > 1;
                  const savedSitePrice = Number(product.preco_atual ?? 0);
                  const draftString = draftPrices[product.id];
                  const inputValue = draftString ?? inputFormat(product.preco_atual);
                  const parsedDraft =
                    draftString !== undefined ? parseQuickPriceInput(draftString) : null;
                  const effectiveSitePrice =
                    draftString !== undefined
                      ? parsedDraft != null && !Number.isNaN(parsedDraft) && parsedDraft > 0
                        ? parsedDraft
                        : 0
                      : savedSitePrice;
                  const delta = difference(product.preco_atacado, effectiveSitePrice);
                  const pct = marginPercentLabel(product.preco_atacado, effectiveSitePrice);
                  const status = productStatus(product);
                  const source = product.url_fornecedor || product.fonte_preco || null;
                  const isDirty =
                    draftString !== undefined &&
                    parsedDraft != null &&
                    !Number.isNaN(parsedDraft) &&
                    parsedDraft > 0 &&
                    Math.abs(parsedDraft - savedSitePrice) >= 0.005;
                  const isSaving = Boolean(savingIds[product.id]);
                  const isSaved = Boolean(savedIds[product.id]);
                  const rowError = rowErrors[product.id];
                  const metaParts = [
                    product.categoria || "Sem categoria",
                    product.sku || "Sem SKU",
                    product.fornecedor || null,
                  ].filter(Boolean);

                  return (
                    <div className="supplier-pricing-row" role="row" key={product.id}>
                      <div className="supplier-pricing-product" role="cell">
                        <ProductIdentity product={product}>
                          <small>{metaParts.join(" · ")}</small>
                          {source && (
                            <a
                              href={source}
                              target="_blank"
                              rel="noreferrer"
                              className="pricing-source-link"
                            >
                              Ver no fornecedor <ExternalLink size={11} aria-hidden="true" />
                            </a>
                          )}
                        </ProductIdentity>
                      </div>

                      <span
                        className="supplier-pricing-value"
                        role="cell"
                        data-label="Custo fornecedor"
                      >
                        {money(product.preco_atacado)}
                      </span>

                      <div
                        className="supplier-pricing-value supplier-pricing-site-price"
                        role="cell"
                        data-label="Preço à vista (site)"
                      >
                        {onQuickSavePrice && !multiVariation ? (
                          <div className="pricing-inline-field">
                            <div className="pricing-inline-input-group">
                              <span aria-hidden="true">R$</span>
                              <input
                                type="text"
                                inputMode="decimal"
                                aria-label={`Preço à vista para ${product.nome}`}
                                placeholder="0,00"
                                value={inputValue}
                                disabled={isSaving}
                                onChange={(event) => {
                                  const val = event.target.value;
                                  setDraftPrices((prev) => ({ ...prev, [product.id]: val }));
                                  if (rowErrors[product.id]) {
                                    setRowErrors((prev) => {
                                      const next = { ...prev };
                                      delete next[product.id];
                                      return next;
                                    });
                                  }
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.preventDefault();
                                    void handleQuickSave(product);
                                  }
                                }}
                              />
                            </div>
                            <small>
                              {effectiveSitePrice > 0
                                ? `10x de ${formatBRL(cardInstallment(effectiveSitePrice, 10))}`
                                : "Digite para calcular 10x"}
                            </small>
                            {rowError && (
                              <small role="alert" className="pricing-inline-error">
                                {rowError}
                              </small>
                            )}
                          </div>
                        ) : (
                          <>
                            <strong>{money(product.preco_atual)}</strong>
                            {savedSitePrice > 0 && (
                              <small>10x de {formatBRL(cardInstallment(savedSitePrice, 10))}</small>
                            )}
                            {multiVariation && (
                              <small className="pricing-variation-tag">
                                {variationCount} variações de preço
                              </small>
                            )}
                          </>
                        )}
                      </div>

                      <span
                        className={
                          "supplier-pricing-value " +
                          (delta == null ? "is-muted" : delta < 0 ? "is-negative" : "is-positive")
                        }
                        role="cell"
                        data-label="Diferença bruta"
                      >
                        <span>{differenceLabel(product.preco_atacado, effectiveSitePrice)}</span>
                        {pct && <small className="pricing-margin-pct">{pct}</small>}
                      </span>

                      <span
                        className={"supplier-pricing-status status-" + status}
                        role="cell"
                        data-label="Situação"
                      >
                        {statusLabels[status]}
                      </span>

                      <span className="supplier-pricing-action" role="cell">
                        {onQuickSavePrice && !multiVariation && (
                          <button
                            type="button"
                            className={`pricing-save-btn${isDirty ? " is-dirty" : ""}${isSaved ? " is-saved" : ""}`}
                            disabled={isSaving || (!isDirty && draftString === undefined)}
                            onClick={() => void handleQuickSave(product)}
                          >
                            {isSaved ? (
                              <>
                                <Check size={14} aria-hidden="true" /> Salvo
                              </>
                            ) : isSaving ? (
                              "Salvando…"
                            ) : (
                              "Salvar"
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          className="pricing-details-btn"
                          aria-label={`Abrir detalhes de ${product.nome}`}
                          onClick={() => onEdit(product)}
                        >
                          <Pencil size={14} aria-hidden="true" />
                          <span>{multiVariation ? "Opções" : "Detalhes"}</span>
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
              {totalPages > 1 && (
                <div className="supplier-pricing-pagination" aria-label="Paginação dos produtos">
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
        </section>
      </div>
    </section>
  );
}
