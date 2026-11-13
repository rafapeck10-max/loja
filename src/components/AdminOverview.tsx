import { useState } from "react";
import { ArrowRight, Check, CircleAlert, Package, RefreshCw } from "lucide-react";
import {
  overviewImpact,
  summarizeOverview,
  type OverviewProduct,
  type OverviewSource,
} from "../lib/admin-overview";
import type { ProductStatus } from "../lib/admin-filters";
import "../admin-overview.css";
import "../admin-density.css";

export interface AdminOverviewProps<T extends OverviewProduct = OverviewProduct> {
  catalog: OverviewSource<T>;
  review: OverviewSource<{ id: string }>;
  refreshing: boolean;
  onRefresh: () => void;
  onProducts: (status: "all" | ProductStatus) => void;
  onEdit: (product: T) => void;
  onNavigate: (area: "vitrine" | "banners" | "revisao") => void;
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
  onNavigate,
  demonstration = false,
}: AdminOverviewProps<T>) {
  const [showAll, setShowAll] = useState(false);
  const { counts, issues, reviewLimitReached } = summarizeOverview(catalog, review);
  const ready = catalog.status === "success" && catalog.data !== undefined;
  const queueReady = review.status === "success" && review.data !== undefined;

  return (
    <section className="mobi-overview" aria-label="Visão geral do painel">
      <header className="ov-heading">
        <div>
          <p className="ov-eyebrow">OPERAÇÃO DA MOBI</p>
          <h1>Visão geral</h1>
          <p>Veja o que precisa de revisão antes de expor seus móveis.</p>
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

      <div className="ov-summary" aria-label="Resumo do catálogo">
        <div className="ov-summary-item">
          <span>No catálogo</span>
          <strong>{counts.total ?? "—"}</strong>
        </div>
        <span className="ov-summary-divider" aria-hidden="true" />
        <button
          type="button"
          className="ov-summary-item ov-summary-link"
          onClick={() => onProducts("published")}
          disabled={!ready}
        >
          <span>Aptos para exibição</span>
          <strong>{counts.published ?? "—"}</strong>
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>

      <section className="ov-panel ov-queue" aria-labelledby="ov-attention-title">
        <div className="ov-panel-heading">
          <div>
            <p className="ov-eyebrow">CADASTRO DE PRODUTOS</p>
            <h2 id="ov-attention-title">Precisa da sua atenção</h2>
            <p>Preço, custo do fornecedor ou imagem principal pendente.</p>
          </div>
          <span className="ov-count">
            {ready ? `${issues.length} ${issues.length === 1 ? "item" : "itens"}` : "Sem contagem"}
          </span>
        </div>

        {catalog.status === "error" ? (
          <div className="ov-message" role="alert">
            <CircleAlert />
            <div>
              <h3>Não foi possível consultar o catálogo</h3>
              <p>As pendências não puderam ser verificadas. Nenhum total foi presumido.</p>
              <button className="ov-text-button" onClick={onRefresh} disabled={refreshing}>
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
              <h3>{counts.total === 0 ? "Seu catálogo está vazio" : "Cadastros conferidos"}</h3>
              <p>
                {counts.total === 0
                  ? "Abra Produtos para começar um cadastro."
                  : "Nenhuma pendência de preço, custo do fornecedor ou imagem nos critérios consultados."}
              </p>
              <button className="ov-text-button" onClick={() => onProducts("all")}>
                {counts.total === 0 ? "Abrir produtos" : "Ver produtos"} <ArrowRight size={15} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <ul className="ov-issues">
              {(showAll ? issues : issues.slice(0, 5)).map(({ product, reasons }) => (
                <li key={product.id}>
                  <div className="ov-issue-type" aria-hidden="true">
                    <Package size={17} />
                  </div>
                  <div className="ov-issue-content">
                    <h3>{product.nome}</h3>
                    <p className="ov-supplier">
                      Fornecedor: {product.fornecedor?.trim() || "não cadastrado"}
                    </p>
                    <p className="ov-problem">{reasons.join(" · ")}</p>
                    <details className="ov-impact-detail">
                      <summary>Por que revisar</summary>
                      <p className="ov-impact">{overviewImpact(product)}</p>
                    </details>
                  </div>
                  <button
                    type="button"
                    className="ov-review-button"
                    aria-label={`Revisar ${product.nome}`}
                    onClick={() => {
                      const original = catalog.data?.find((item) => item.id === product.id);
                      if (original) onEdit(original);
                    }}
                  >
                    Corrigir <ArrowRight size={15} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="ov-list-footer">
              <span>
                {demonstration ? "Amostra local" : "Fonte: cadastro de produtos"} ·{" "}
                <SourceTime value={catalog.updatedAt} />
              </span>
              {issues.length > 5 && (
                <button className="ov-text-button" onClick={() => setShowAll(!showAll)}>
                  {showAll ? "Mostrar menos" : `Ver as ${issues.length} pendências`}
                </button>
              )}
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
            <button className="ov-text-button" onClick={onRefresh} disabled={refreshing}>
              Tentar novamente
            </button>
          </div>
        ) : queueReady && (counts.review ?? 0) > 0 ? (
          <div className="ov-review-note">
            <Package size={17} />
            <div>
              <strong>
                {counts.review}
                {reviewLimitReached ? "+" : ""} coletas aguardam conferência
              </strong>
              <p>
                {reviewLimitReached
                  ? "O limite da consulta foi alcançado; a fila pode conter mais itens."
                  : "Os itens só entram no catálogo depois da sua revisão."}
              </p>
              <small>
                Fila atualizada: <SourceTime value={review.updatedAt} />
              </small>
            </div>
            <button className="ov-text-button" onClick={() => onNavigate("revisao")}>
              Abrir coletas <ArrowRight size={15} />
            </button>
          </div>
        ) : review.status === "pending" ? (
          <p className="ov-review-status" role="status">
            Verificando coletas pendentes…
          </p>
        ) : null}
      </section>
    </section>
  );
}
