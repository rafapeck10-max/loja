import { ProductThumbnail } from "./admin/ProductThumbnail";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  CircleAlert,
  Package,
  RefreshCw,
  CircleDollarSign,
  Images,
  FileDown,
  ShoppingBag,
  Tag,
} from "lucide-react";
import {
  overviewImpact,
  summarizeOverview,
  type OverviewProduct,
  type OverviewSource,
} from "../lib/admin-overview";
import { formatBRL } from "../lib/constants";
import type { ProductStatus } from "../lib/admin-filters";
import "../admin-overview.css";
import "../admin-density.css";
import "../admin-theme.css";

export interface AdminOverviewProps<T extends OverviewProduct = OverviewProduct> {
  catalog: OverviewSource<T>;
  review: OverviewSource<{ id: string }>;
  refreshing: boolean;
  onRefresh: () => void;
  onProducts: (status: "all" | ProductStatus) => void;
  onEdit: (product: T) => void;
  onPrice?: (product: T) => void;
  onNavigate: (
    area: "produtos" | "vitrine" | "banners" | "revisao" | "fornecedores" | "campaigns" | "pedidos",
  ) => void;
  demonstration?: boolean;
}

function SourceTime({ value }: { value?: number }) {
  return value ? (
    <time dateTime={new Date(value).toISOString()}>
      {new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(value)}{" "}
      · Brasília
    </time>
  ) : (
    <>Sem consulta concluída</>
  );
}

export function AdminOverview<T extends OverviewProduct>({
  catalog,
  review,
  refreshing,
  onRefresh,
  onProducts,
  onEdit,
  onPrice,
  onNavigate,
  demonstration = false,
}: AdminOverviewProps<T>) {
  const [showAll, setShowAll] = useState(false);
  const [queue, setQueue] = useState<"pricing" | "repair">("pricing");
  const { counts, issues: allIssues, reviewLimitReached } = summarizeOverview(catalog, review);
  const pricing = allIssues.filter(({ product }) => !(Number(product.preco_atual) > 0));
  const repairs = allIssues.filter(({ product }) => Number(product.preco_atual) > 0);
  const issues = queue === "pricing" ? pricing : repairs;
  const ready = catalog.status === "success" && catalog.data !== undefined;
  const queueReady = review.status === "success" && review.data !== undefined;

  return (
    <section className="mobi-overview" aria-label="Visão geral do painel">
      <header className="ov-heading">
        <div>
          <p className="ov-eyebrow">OPERAÇÃO DA MOBI</p>
          <h1>Vamos cuidar da sua loja?</h1>
          <p>Escolha uma tarefa e continue de onde parou.</p>
        </div>
        <div className="ov-heading-actions">
          <span className="ov-source-note">
            {demonstration ? "Amostra local" : "Catálogo administrativo"} ·{" "}
            {ready ? <SourceTime value={catalog.updatedAt} /> : "consulta não confirmada"}
          </span>
          <button type="button" className="aw-action" onClick={onRefresh} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? "ov-spin" : ""} />
            {refreshing ? "Atualizando…" : "Atualizar"}
          </button>
        </div>
      </header>

      <div className="admin-kpi-grid" aria-label="Resumo do catálogo">
        <button
          type="button"
          className="admin-kpi-card is-forest"
          onClick={() => onProducts("all")}
          disabled={!ready}
        >
          <span className="admin-kpi-top">
            <span className="admin-kpi-label-wrap">
              <span className="admin-kpi-icon" aria-hidden="true">
                <Package size={15} />
              </span>
              <span className="admin-kpi-label">No catálogo</span>
            </span>
            <ArrowRight size={14} className="admin-kpi-arrow" aria-hidden="true" />
          </span>
          <span className="admin-kpi-value-row">
            <strong>{counts.total != null ? counts.total.toLocaleString("pt-BR") : "—"}</strong>
            <span className="admin-kpi-hint">Ver todos</span>
          </span>
        </button>

        <button
          type="button"
          className="admin-kpi-card is-emerald"
          onClick={() => onProducts("published")}
          disabled={!ready}
        >
          <span className="admin-kpi-top">
            <span className="admin-kpi-label-wrap">
              <span className="admin-kpi-icon" aria-hidden="true">
                <Check size={15} />
              </span>
              <span className="admin-kpi-label">Aptos na loja</span>
            </span>
            <ArrowRight size={14} className="admin-kpi-arrow" aria-hidden="true" />
          </span>
          <span className="admin-kpi-value-row">
            <strong>
              {counts.published != null ? counts.published.toLocaleString("pt-BR") : "—"}
            </strong>
            <span className="admin-kpi-hint">Publicados</span>
          </span>
        </button>

        <button
          type="button"
          className="admin-kpi-card is-amber"
          onClick={() => onNavigate("fornecedores")}
          disabled={!ready}
        >
          <span className="admin-kpi-top">
            <span className="admin-kpi-label-wrap">
              <span className="admin-kpi-icon" aria-hidden="true">
                <CircleDollarSign size={15} />
              </span>
              <span className="admin-kpi-label">Aguardando preço</span>
            </span>
            <ArrowRight size={14} className="admin-kpi-arrow" aria-hidden="true" />
          </span>
          <span className="admin-kpi-value-row">
            <strong>
              {counts.awaiting != null ? counts.awaiting.toLocaleString("pt-BR") : "—"}
            </strong>
            <span className="admin-kpi-hint">Precificar</span>
          </span>
        </button>

        <button
          type="button"
          className="admin-kpi-card is-forest"
          onClick={() => onNavigate("revisao")}
          disabled={!queueReady}
        >
          <span className="admin-kpi-top">
            <span className="admin-kpi-label-wrap">
              <span className="admin-kpi-icon" aria-hidden="true">
                <FileDown size={15} />
              </span>
              <span className="admin-kpi-label">Importações</span>
            </span>
            <ArrowRight size={14} className="admin-kpi-arrow" aria-hidden="true" />
          </span>
          <span className="admin-kpi-value-row">
            <strong>
              {counts.review != null ? counts.review.toLocaleString("pt-BR") : "—"}
              {reviewLimitReached ? "+" : ""}
            </strong>
            <span className="admin-kpi-hint">Revisar fila</span>
          </span>
        </button>
      </div>

      <div className="ov-workspace-grid">
        <section className="ov-panel ov-queue" aria-labelledby="ov-attention-title">
          <div className="ov-queue-header">
            <div className="ov-queue-title-block">
              <p className="ov-eyebrow">FILA PRIORITÁRIA</p>
              <h2 id="ov-attention-title">
                {queue === "pricing"
                  ? "Prontos para você precificar"
                  : "Cadastros com dados pendentes"}
              </h2>
              <p>
                {queue === "pricing"
                  ? "Produtos sem preço de venda. Aguardam sua decisão comercial."
                  : "Produtos com preço informado, mas sem custo ou foto válida."}
              </p>
            </div>
            <div className="ov-queue-controls">
              <div className="mobi-queue-tabs" role="group" aria-label="Filas de trabalho">
                <button
                  type="button"
                  aria-pressed={queue === "pricing"}
                  onClick={() => {
                    setQueue("pricing");
                    setShowAll(false);
                  }}
                >
                  Sem preço <b>{ready ? pricing.length.toLocaleString("pt-BR") : "—"}</b>
                </button>
                <button
                  type="button"
                  aria-pressed={queue === "repair"}
                  onClick={() => {
                    setQueue("repair");
                    setShowAll(false);
                  }}
                >
                  Conferência <b>{ready ? repairs.length.toLocaleString("pt-BR") : "—"}</b>
                </button>
              </div>
            </div>
          </div>

          {catalog.status === "error" ? (
            <div className="ov-message" role="alert">
              <CircleAlert />
              <div>
                <h3>Não foi possível consultar o catálogo</h3>
                <p>As pendências não puderam ser verificadas. Nenhum total foi presumido.</p>
                <button
                  type="button"
                  className="ov-text-button"
                  onClick={onRefresh}
                  disabled={refreshing}
                >
                  Tentar novamente <ArrowRight size={15} />
                </button>
              </div>
            </div>
          ) : !ready ? (
            <div className="ov-loading" role="status">
              <RefreshCw className="ov-spin" size={18} />
              Verificando os cadastros…
            </div>
          ) : issues.length === 0 ? (
            <div className="ov-message ov-good">
              <Check />
              <div>
                <h3>{counts.total === 0 ? "Seu catálogo está vazio" : "Nenhum item nesta fila"}</h3>
                <p>
                  {counts.total === 0
                    ? "Abra Produtos para começar um cadastro."
                    : "Nenhuma pendência de preço, custo do fornecedor ou imagem nos critérios consultados."}
                </p>
                <button type="button" className="ov-text-button" onClick={() => onProducts("all")}>
                  {counts.total === 0 ? "Abrir produtos" : "Ver produtos"} <ArrowRight size={15} />
                </button>
              </div>
            </div>
          ) : (
            <>
              <ul className="ov-issues">
                {(showAll ? issues.slice(0, 25) : issues.slice(0, 6)).map(
                  ({ product, reasons }) => {
                    const cost = Number(product.preco_atacado ?? 0);
                    const sale = Number(product.preco_atual ?? 0);
                    const metaParts = [
                      product.fornecedor?.trim() || "Sem fornecedor",
                      product.sku ? `Ref.: ${product.sku}` : "",
                      cost > 0 ? `Custo ${formatBRL(cost)}` : "",
                      sale > 0 ? `Site ${formatBRL(sale)}` : "",
                    ].filter(Boolean);
                    return (
                      <li key={product.id}>
                        <ProductThumbnail product={product} />
                        <div className="ov-issue-content">
                          <h3>{product.nome}</h3>
                          <p className="ov-supplier">{metaParts.join(" · ")}</p>
                          <div className="ov-issue-badges">
                            <span className="ov-problem-pill">{reasons.join(" · ")}</span>
                            <details className="ov-impact-detail">
                              <summary>Por que revisar</summary>
                              <p className="ov-impact">{overviewImpact(product)}</p>
                            </details>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="ov-review-button"
                          aria-label={`${queue === "pricing" ? "Precificar" : "Conferir"} ${product.nome}`}
                          onClick={() => {
                            const original = catalog.data?.find((item) => item.id === product.id);
                            if (queue === "pricing" && original && onPrice) onPrice(original);
                            else if (queue === "pricing") onNavigate("fornecedores");
                            else if (original) onEdit(original);
                          }}
                        >
                          {queue === "pricing" ? "Precificar" : "Conferir"} <ArrowRight size={14} />
                        </button>
                      </li>
                    );
                  },
                )}
              </ul>
              <div className="ov-list-footer">
                <span>
                  {issues.length.toLocaleString("pt-BR")}{" "}
                  {issues.length === 1 ? "item nesta fila" : "itens nesta fila"} ·{" "}
                  <SourceTime value={catalog.updatedAt} />
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {queue === "pricing" && (
                    <button
                      type="button"
                      className="ov-text-button"
                      onClick={() => onNavigate("fornecedores")}
                    >
                      Abrir fila completa com filtros <ArrowRight size={14} />
                    </button>
                  )}
                  {issues.length > 6 && (
                    <button
                      type="button"
                      className="ov-text-button"
                      onClick={() => setShowAll(!showAll)}
                    >
                      {showAll ? "Mostrar menos" : `Ver mais (${Math.min(25, issues.length)})`}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {review.status === "error" ? (
            <div className="ov-review-note" role="alert">
              <CircleAlert size={17} />
              <div>
                <strong>Coletas para revisão sem confirmação</strong>
                <p>A fila está indisponível; não foi presumida como vazia.</p>
              </div>
              <button
                type="button"
                className="ov-text-button"
                onClick={onRefresh}
                disabled={refreshing}
              >
                Tentar novamente
              </button>
            </div>
          ) : queueReady && (counts.review ?? 0) > 0 ? (
            <div className="ov-review-note">
              <FileDown size={17} />
              <div className="min-w-0 flex-1">
                <strong>
                  {(counts.review ?? 0).toLocaleString("pt-BR")}
                  {reviewLimitReached ? "+" : ""} importações aguardam conferência
                </strong>
                <p>Revise custos e fotos antes de publicar no catálogo.</p>
              </div>
              <button
                type="button"
                className="ov-text-button"
                onClick={() => onNavigate("revisao")}
              >
                Abrir importações <ArrowRight size={14} />
              </button>
            </div>
          ) : review.status === "pending" ? (
            <p className="ov-review-status" role="status">
              Verificando coletas pendentes…
            </p>
          ) : null}
        </section>

        <aside className="ov-rail" aria-label="Atalhos operacionais">
          <div className="ov-rail-card">
            <h2 className="ov-rail-title">Ações rápidas</h2>
            <div className="ov-rail-primary">
              <button
                type="button"
                onClick={() => onNavigate("fornecedores")}
                disabled={!ready}
                className="ov-rail-task is-featured"
              >
                <span className="ov-rail-task-icon" aria-hidden="true">
                  <CircleDollarSign size={18} />
                </span>
                <span className="ov-rail-task-text">
                  <strong>Precificar produtos</strong>
                  <small>
                    {ready
                      ? `${(counts.awaiting ?? 0).toLocaleString("pt-BR")} aguardando preço`
                      : "Consultando catálogo…"}
                  </small>
                </span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate("revisao")}
                disabled={!queueReady}
                className="ov-rail-task"
              >
                <span className="ov-rail-task-icon" aria-hidden="true">
                  <FileDown size={18} />
                </span>
                <span className="ov-rail-task-text">
                  <strong>Conferir importações</strong>
                  <small>
                    {queueReady
                      ? `${(counts.review ?? 0).toLocaleString("pt-BR")}${reviewLimitReached ? "+" : ""} para revisar`
                      : "Fila não confirmada"}
                  </small>
                </span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>

              <button type="button" onClick={() => onNavigate("vitrine")} className="ov-rail-task">
                <span className="ov-rail-task-icon" aria-hidden="true">
                  <Images size={18} />
                </span>
                <span className="ov-rail-task-text">
                  <strong>Organizar a vitrine</strong>
                  <small>Destaques da página inicial</small>
                </span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="ov-rail-divider" aria-hidden="true" />

            <div className="ov-rail-secondary" aria-label="Outras áreas">
              <button type="button" className="ov-rail-shortcut" onClick={() => onProducts("all")}>
                <Package size={15} aria-hidden="true" />
                <span>Catálogo</span>
              </button>
              <button
                type="button"
                className="ov-rail-shortcut"
                onClick={() => onNavigate("pedidos")}
              >
                <ShoppingBag size={15} aria-hidden="true" />
                <span>Pedidos</span>
              </button>
              <button
                type="button"
                className="ov-rail-shortcut"
                onClick={() => onNavigate("banners")}
              >
                <Images size={15} aria-hidden="true" />
                <span>Banners</span>
              </button>
              <button
                type="button"
                className="ov-rail-shortcut"
                onClick={() => onNavigate("campaigns")}
              >
                <Tag size={15} aria-hidden="true" />
                <span>Ofertas</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
