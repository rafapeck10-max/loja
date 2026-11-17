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
} from "lucide-react";
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
  onPrice?: (product: T) => void;
  onNavigate: (area: "vitrine" | "banners" | "revisao" | "fornecedores") => void;
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

      <div className="mobi-task-grid" aria-label="Tarefas da loja">
        <button
          onClick={() => onNavigate("fornecedores")}
          disabled={!ready}
          className="mobi-task is-featured"
        >
          <CircleDollarSign size={24} />
          <span>
            <strong>Precificar produtos</strong>
            <small>
              {ready ? `${counts.awaiting} aguardando seu preço` : "Consultando catálogo…"}
            </small>
          </span>
          <ArrowRight size={18} />
        </button>
        <button onClick={() => onNavigate("revisao")} disabled={!queueReady} className="mobi-task">
          <FileDown size={24} />
          <span>
            <strong>Conferir importações</strong>
            <small>
              {queueReady
                ? `${counts.review}${reviewLimitReached ? "+" : ""} para revisar`
                : "Fila não confirmada"}
            </small>
          </span>
          <ArrowRight size={18} />
        </button>
        <button onClick={() => onNavigate("vitrine")} className="mobi-task">
          <Images size={24} />
          <span>
            <strong>Organizar a vitrine</strong>
            <small>Escolha os destaques da loja</small>
          </span>
          <ArrowRight size={18} />
        </button>
      </div>
      <div className="mobi-queue-tabs" aria-label="Filas de trabalho">
        <button
          aria-pressed={queue === "pricing"}
          onClick={() => {
            setQueue("pricing");
            setShowAll(false);
          }}
        >
          Aguardando meu preço <b>{ready ? pricing.length : "—"}</b>
        </button>
        <button
          aria-pressed={queue === "repair"}
          onClick={() => {
            setQueue("repair");
            setShowAll(false);
          }}
        >
          Cadastros para conferir <b>{ready ? repairs.length : "—"}</b>
        </button>
      </div>
      <section className="ov-panel ov-queue" aria-labelledby="ov-attention-title">
        <div className="ov-panel-heading">
          <div>
            <p className="ov-eyebrow">CADASTRO DE PRODUTOS</p>
            <h2 id="ov-attention-title">
              {queue === "pricing" ? "Prontos para você precificar" : "Confira estes cadastros"}
            </h2>
            <p>
              {queue === "pricing"
                ? "Produtos sem preço de venda. Aguardam sua decisão comercial."
                : "Produtos com preço informado, mas sem custo ou endereço de foto válido."}
            </p>
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
              <h3>{counts.total === 0 ? "Seu catálogo está vazio" : "Nenhum item nesta fila"}</h3>
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
              {(showAll ? issues.slice(0, 25) : issues.slice(0, 5)).map(({ product, reasons }) => (
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
                    aria-label={`${queue === "pricing" ? "Precificar" : "Conferir"} ${product.nome}`}
                    onClick={() => {
                      const original = catalog.data?.find((item) => item.id === product.id);
                      if (queue === "pricing" && original && onPrice) onPrice(original);
                      else if (queue === "pricing") onNavigate("fornecedores");
                      else if (original) onEdit(original);
                    }}
                  >
                    {queue === "pricing" ? "Precificar" : "Conferir"} <ArrowRight size={15} />
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
                  {showAll ? "Mostrar menos" : `Ver mais (${issues.length} nesta fila)`}
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
