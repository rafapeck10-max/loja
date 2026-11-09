import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  CircleAlert,
  Clock3,
  Image,
  Layers3,
  LayoutDashboard,
  Package,
  RefreshCw,
  Sparkles,
  Wallet,
} from "lucide-react";
import {
  summarizeOverview,
  type OverviewProduct,
  type OverviewSource,
} from "../lib/admin-overview";
import type { ProductStatus } from "../lib/admin-filters";
import "../admin-overview.css";

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
    <>Ainda sem atualização concluída</>
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
  const { counts, issues, reviewLimitReached } = summarizeOverview(catalog, review);
  const catalogReady = catalog.status === "success" && catalog.data !== undefined;
  const reviewReady = review.status === "success" && review.data !== undefined;
  const metrics = [
    {
      label: "Publicados",
      value: counts.published,
      hint: "Pelos critérios do painel",
      icon: Package,
      action: () => onProducts("published"),
      ready: catalogReady,
      kind: "green",
    },
    {
      label: "Aguardando preço",
      value: counts.awaiting,
      hint: "Precisam de preço de venda",
      icon: Wallet,
      action: () => onProducts("awaiting"),
      ready: catalogReady,
      kind: "gold",
    },
    {
      label: "Incompletos",
      value: counts.incomplete,
      hint: "Revisar imagem ou custo",
      icon: CircleAlert,
      action: () => onProducts("incomplete"),
      ready: catalogReady,
      kind: "clay",
    },
    {
      label: "Para revisão",
      value: counts.review,
      hint: reviewLimitReached ? "Limite da consulta atingido" : "Coletados de fornecedores",
      icon: ArrowDownToLine,
      action: () => onNavigate("revisao"),
      ready: reviewReady,
      kind: "neutral",
    },
  ];
  return (
    <section className="mobi-overview" aria-label="Visão geral do painel">
      {demonstration && (
        <div className="ov-demo">
          <Sparkles size={16} aria-hidden="true" />
          <span>Prévia local · dados de demonstração · nenhuma alteração na loja</span>
        </div>
      )}
      <header className="ov-heading">
        <div>
          <p className="ov-eyebrow">O essencial da sua operação</p>
          <h2>Visão geral</h2>
          <p>Acompanhe o catálogo e encontre o próximo cuidado com a sua loja.</p>
        </div>
        <button className="ov-button" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? "ov-spin" : ""} aria-hidden="true" />
          {refreshing ? "Atualizando…" : "Atualizar dados"}
        </button>
      </header>
      <div className="ov-metrics">
        {metrics.map(({ label, value, hint, icon: Icon, action, ready, kind }) => (
          <button key={label} className={`ov-metric ov-${kind}`} onClick={action} disabled={!ready}>
            <span className="ov-metric-top">
              <span className="ov-icon">
                <Icon size={19} aria-hidden="true" />
              </span>
              <ArrowRight size={17} aria-hidden="true" />
            </span>
            <span className="ov-metric-label">{label}</span>
            <strong>
              {value == null
                ? "—"
                : `${value.toLocaleString("pt-BR")}${label === "Para revisão" && reviewLimitReached ? "+" : ""}`}
            </strong>
            <span className="ov-metric-hint">
              {ready
                ? hint
                : (label === "Para revisão" ? review.status : catalog.status) === "error"
                  ? "Consulta indisponível"
                  : "Consultando dados…"}
            </span>
          </button>
        ))}
      </div>
      <div className="ov-columns">
        <section className="ov-panel ov-attention" aria-labelledby="ov-attention-title">
          <div className="ov-panel-heading">
            <div>
              <p className="ov-eyebrow">Próximos passos</p>
              <h3 id="ov-attention-title">Precisa da sua atenção</h3>
            </div>
            {catalogReady && (
              <span className="ov-count">
                {issues.length} {issues.length === 1 ? "produto" : "produtos"}
              </span>
            )}
          </div>
          {catalog.status === "error" ? (
            <div className="ov-message" role="alert">
              <CircleAlert aria-hidden="true" />
              <div>
                <h4>Não foi possível consultar o catálogo</h4>
                <p>As pendências não puderam ser verificadas. Tente atualizar os dados.</p>
                <button className="ov-text-button" onClick={onRefresh} disabled={refreshing}>
                  Tentar novamente <ArrowRight size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : !catalogReady ? (
            <p className="ov-loading" role="status">
              Verificando os cadastros…
            </p>
          ) : issues.length === 0 ? (
            <div className="ov-message ov-good">
              <Check aria-hidden="true" />
              <div>
                <h4>
                  {counts.total === 0 ? "Seu catálogo está vazio" : "Cadastros em dia por aqui"}
                </h4>
                <p>
                  {counts.total === 0
                    ? "Abra Produtos para começar o cadastro."
                    : "Nenhuma pendência de preço, imagem ou custo nos cadastros consultados. Estoque físico não é verificado."}
                </p>
                <button className="ov-text-button" onClick={() => onProducts("all")}>
                  Abrir produtos <ArrowRight size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <ul className="ov-issues">
                {issues.slice(0, 5).map(({ product, reasons }) => (
                  <li key={product.id}>
                    <span className="ov-issue-icon">
                      <CircleAlert size={17} aria-hidden="true" />
                    </span>
                    <div>
                      <h4>{product.nome}</h4>
                      <p>{reasons.join(" · ")}</p>
                    </div>
                    <button
                      className="ov-text-button"
                      aria-label={`Revisar ${product.nome}`}
                      onClick={() => {
                        const original = catalog.data?.find((item) => item.id === product.id);
                        if (original) onEdit(original);
                      }}
                    >
                      Revisar <ArrowRight size={15} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="ov-list-footer">
                <span>
                  {issues.length > 5
                    ? `Mostrando 5 de ${issues.length} produtos com pendências`
                    : "Cada produto aparece uma vez, com suas pendências."}
                </span>
                <button className="ov-text-button" onClick={() => onProducts("all")}>
                  Ver catálogo <ArrowRight size={15} aria-hidden="true" />
                </button>
              </div>
            </>
          )}
          {review.status === "error" ? (
            <div className="ov-review-note" role="alert">
              <CircleAlert size={18} aria-hidden="true" />
              <p>A fila de revisão está indisponível. Sua contagem não foi confirmada.</p>
              <button className="ov-text-button" onClick={onRefresh} disabled={refreshing}>
                Tentar novamente
              </button>
            </div>
          ) : (
            reviewReady &&
            (counts.review ?? 0) > 0 && (
              <div className="ov-review-note">
                <ArrowDownToLine size={18} aria-hidden="true" />
                <p>
                  <strong>
                    {counts.review}{" "}
                    {counts.review === 1 ? "produto coletado" : "produtos coletados"}
                  </strong>{" "}
                  {reviewLimitReached
                    ? "retornados pela consulta. A fila pode conter mais itens."
                    : "aguardando sua revisão."}
                </p>
                <button className="ov-text-button" onClick={() => onNavigate("revisao")}>
                  Abrir fila <ArrowRight size={15} aria-hidden="true" />
                </button>
              </div>
            )
          )}
        </section>
        <aside className="ov-panel ov-shortcuts" aria-labelledby="ov-shortcuts-title">
          <p className="ov-eyebrow">À mão</p>
          <h3 id="ov-shortcuts-title">Cuide da sua loja</h3>
          {[
            {
              title: "Gerenciar produtos",
              detail: "Consultar e revisar cadastros",
              icon: Package,
              action: () => onProducts("all"),
            },
            {
              title: "Escolher produtos da vitrine",
              detail: "Organizar as seleções da página inicial",
              icon: Layers3,
              action: () => onNavigate("vitrine"),
            },
            {
              title: "Trocar banners",
              detail: "Abrir o editor da página inicial",
              icon: Image,
              action: () => onNavigate("banners"),
            },
          ].map(({ title, detail, icon: Icon, action }) => (
            <button key={title} className="ov-shortcut" onClick={action}>
              <span className="ov-icon">
                <Icon size={19} aria-hidden="true" />
              </span>
              <span>
                <strong>{title}</strong>
                <small>{detail}</small>
              </span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          ))}
          <button
            className="ov-catalog-total"
            onClick={() => onProducts("all")}
            disabled={!catalogReady}
          >
            <LayoutDashboard size={16} aria-hidden="true" />
            <span>
              {counts.total == null
                ? "Total do catálogo não confirmado"
                : `${counts.total.toLocaleString("pt-BR")} produtos no catálogo`}
            </span>
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </aside>
      </div>
      <section className="ov-panel ov-planned" aria-labelledby="ov-planned-title">
        <div>
          <p className="ov-eyebrow">Evolução do painel</p>
          <h3 id="ov-planned-title">O que vem depois</h3>
          <p>Estas áreas precisam de integração para aparecer no resumo.</p>
        </div>
        <div className="ov-planned-items">
          {["Rascunhos e revisões", "Campanhas e vigência", "Solicitações de desenvolvimento"].map(
            (name) => (
              <span key={name}>
                <Clock3 size={15} aria-hidden="true" />
                <span>
                  {name}
                  <small>Pendente de integração</small>
                </span>
              </span>
            ),
          )}
        </div>
      </section>
      <footer className="ov-sources">
        <div>
          <strong>Origem dos dados</strong>
          <p>
            {demonstration
              ? "Amostra local identificada; não representa o catálogo real."
              : "Consultas administrativas do catálogo e da fila de produtos coletados."}
          </p>
          <p>
            “Publicados” segue os critérios atuais do painel: preço de venda, custo e endereço de
            imagem. Não confirma estoque físico nem carregamento da foto.
          </p>
        </div>
        <div>
          <p>
            <strong>Catálogo:</strong>{" "}
            {catalogReady ? (
              <SourceTime value={catalog.updatedAt} />
            ) : catalog.status === "error" ? (
              "Consulta indisponível"
            ) : (
              "Aguardando consulta"
            )}
          </p>
          <p>
            <strong>Fila de revisão:</strong>{" "}
            {reviewReady ? (
              <SourceTime value={review.updatedAt} />
            ) : review.status === "error" ? (
              "Consulta indisponível"
            ) : (
              "Aguardando consulta"
            )}
          </p>
        </div>
      </footer>
    </section>
  );
}
