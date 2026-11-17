import { ProductIdentity } from "./ProductThumbnail";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Pencil } from "lucide-react";
import type { ProdutoAdmin } from "../../lib/admin.functions";
import { formatBRL } from "../../lib/constants";
import { productStatus, type ProductStatus } from "../../lib/admin-filters";

export interface SupplierPricingSummary {
  key: string;
  label: string;
  total: number;
  missingCost: number;
  missingSitePrice: number;
  belowCost: number;
}

type SupplierPricingProduct = Pick<
  ProdutoAdmin,
  "id" | "nome" | "preco_atacado" | "preco_atual" | "url_imagem"
> &
  Partial<Pick<ProdutoAdmin, "sku">>;

export interface SupplierPricingPanelProps<T extends SupplierPricingProduct = ProdutoAdmin> {
  summaries: readonly SupplierPricingSummary[];
  products: readonly T[];
  selectedSupplier: string;
  onSelectSupplier: (key: string) => void;
  onEdit: (product: T) => void;
}

const statusLabels: Record<ProductStatus, string> = {
  published: "Pronto",
  awaiting: "Aguardando preço",
  incomplete: "Incompleto",
};

function price(value: number | null | undefined) {
  return value == null || Number(value) <= 0 ? "—" : formatBRL(Number(value));
}

function difference(product: SupplierPricingProduct): number | null {
  const cost = Number(product.preco_atacado ?? 0);
  const sitePrice = Number(product.preco_atual ?? 0);
  return cost > 0 && sitePrice > 0 ? sitePrice - cost : null;
}

function differenceLabel(product: SupplierPricingProduct): string {
  const amount = difference(product);
  if (amount == null) return "—";
  return (amount < 0 ? "−" : "+") + formatBRL(Math.abs(amount));
}

export function SupplierPricingPanel<T extends SupplierPricingProduct>({
  summaries,
  products,
  selectedSupplier,
  onSelectSupplier,
  onEdit,
}: SupplierPricingPanelProps<T>) {
  const [query, setQuery] = useState("");
  const [onlyAwaiting, setOnlyAwaiting] = useState(true);
  const filtered = products.filter(
    (product) =>
      (!onlyAwaiting || !(Number(product.preco_atual) > 0)) &&
      (product.nome + " " + (product.sku ?? ""))
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .includes(
          query
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase(),
        ),
  );
  const [page, setPage] = useState(1);
  const pageSize = 32;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleProducts = filtered.slice((page - 1) * pageSize, page * pageSize);
  const selected = summaries.find((summary) => summary.key === selectedSupplier) ?? summaries[0];

  useEffect(() => {
    setPage(1);
  }, [filtered.length, selectedSupplier, query, onlyAwaiting]);

  return (
    <section className="supplier-pricing" aria-labelledby="supplier-pricing-title">
      <header className="supplier-pricing-header">
        <div>
          <p className="supplier-pricing-eyebrow">CATÁLOGO MOBI</p>
          <h1 id="supplier-pricing-title">Precificar produtos</h1>
          <p>Escolha o fornecedor, confira o custo e defina seu preço de venda.</p>
        </div>
        <p className="supplier-pricing-caveat">
          Diferença bruta = preço no site menos custo informado. Não representa lucro e não inclui
          taxas ou frete.
        </p>
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
                <b>{summary.total}</b>
              </span>
              <span className="supplier-pricing-group-meta">
                {summary.missingCost} sem custo · {summary.missingSitePrice} sem preço ·{" "}
                {summary.belowCost} abaixo do custo
              </span>
            </button>
          );
        })}
      </div>

      <div className="pricing-search">
        <label>
          Buscar nesta seleção
          <input
            type="search"
            placeholder="Nome ou referência do produto"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label className="pricing-toggle">
          <input
            type="checkbox"
            checked={onlyAwaiting}
            onChange={(event) => setOnlyAwaiting(event.target.checked)}
          />{" "}
          Só aguardando preço
        </label>
      </div>
      <section className="supplier-pricing-results" aria-labelledby="supplier-selected-title">
        <header className="supplier-pricing-results-header">
          <div>
            <h2 id="supplier-selected-title">{selected?.label ?? "Produtos"}</h2>
            <p>
              {filtered.length} {filtered.length === 1 ? "produto" : "produtos"} nesta seleção
            </p>
          </div>
          {selected && (
            <div className="supplier-pricing-selected-summary">
              <span>{selected.missingCost} sem custo</span>
              <span>{selected.missingSitePrice} sem preço no site</span>
              <span>{selected.belowCost} abaixo do custo</span>
            </div>
          )}
        </header>

        {filtered.length === 0 ? (
          <p className="supplier-pricing-empty">
            Nenhum produto nesta seleção. Tente outra busca ou desmarque “Só aguardando preço”.
          </p>
        ) : (
          <>
            <div className="supplier-pricing-table" role="table" aria-label="Preços por produto">
              <div className="supplier-pricing-row supplier-pricing-table-head" role="row">
                <span role="columnheader">Produto / SKU</span>
                <span role="columnheader">Custo fornecedor</span>
                <span role="columnheader">Preço à vista no site</span>
                <span role="columnheader">Diferença bruta</span>
                <span role="columnheader">Situação</span>
                <span role="columnheader">
                  <span className="aw-sr-only">Ação</span>
                </span>
              </div>
              {visibleProducts.map((product) => {
                const delta = difference(product);
                const status = productStatus(product);
                return (
                  <div className="supplier-pricing-row" role="row" key={product.id}>
                    <div className="supplier-pricing-product" role="cell">
                      <ProductIdentity product={product}>
                        <small>{product.sku || "Sem SKU cadastrado"}</small>
                      </ProductIdentity>
                    </div>
                    <span
                      className="supplier-pricing-value"
                      role="cell"
                      data-label="Custo fornecedor"
                    >
                      {price(product.preco_atacado)}
                    </span>
                    <span
                      className="supplier-pricing-value"
                      role="cell"
                      data-label="Preço à vista no site"
                    >
                      {price(product.preco_atual)}
                    </span>
                    <span
                      className={
                        "supplier-pricing-value " +
                        (delta == null ? "is-muted" : delta < 0 ? "is-negative" : "is-positive")
                      }
                      role="cell"
                      data-label="Diferença bruta"
                    >
                      {differenceLabel(product)}
                    </span>
                    <span
                      className={"supplier-pricing-status status-" + status}
                      role="cell"
                      data-label="Situação"
                    >
                      {statusLabels[status]}
                    </span>
                    <span className="supplier-pricing-action" role="cell">
                      <button
                        type="button"
                        aria-label={"Precificar " + product.nome}
                        onClick={() => onEdit(product)}
                      >
                        <Pencil size={15} /> <span>Precificar</span>
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
                  disabled={page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ArrowLeft size={15} /> Anterior
                </button>
                <span>
                  Página {page} de {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  Próxima <ArrowRight size={15} />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </section>
  );
}
