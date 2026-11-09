import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  CircleAlert,
  Clock3,
  FileCheck2,
  Image,
  Layers3,
  Package,
  RefreshCw,
  Wrench,
} from "lucide-react";
import {
  overviewImpact,
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
  const pendingModules = [
    {
      name: "Rascunhos em revisão",
      icon: FileCheck2,
      source: "Revisões editoriais",
      reason: "Depende de rascunhos persistentes e do fluxo de revisão.",
    },
    {
      name: "Campanhas vigentes",
      icon: Layers3,
      source: "Campanhas",
      reason: "Depende do cadastro de campanhas e de suas datas de vigência.",
    },
    {
      name: "Campanhas terminando",
      icon: Clock3,
      source: "Vigência das campanhas",
      reason: "Depende das datas da campanha e da definição da janela de encerramento.",
    },
    {
      name: "Desenvolvimento",
      icon: Wrench,
      source: "Evolução do site",
      reason: "Depende do acompanhamento real de solicitações e validações.",
    },
  ];
  return (
    <section className="mobi-overview" aria-label="Visão geral do painel">
      <header className="ov-heading">
        <div>
          <p className="ov-eyebrow">GESTÃO DO SITE</p>
          <h1>Visão geral</h1>
          <p>O que está acontecendo e o que precisa da sua atenção.</p>
        </div>
        <button type="button" className="aw-action" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? "ov-spin" : ""} />
          {refreshing ? "Atualizando…" : "Atualizar dados"}
        </button>
      </header>
      <div className="ov-metrics">
        <article className="ov-metric ov-metric-live">
          <div className="ov-metric-top">
            <span className="ov-icon">
              <CircleAlert size={18} />
            </span>
            <span className="ov-live-tag">
              {ready ? "Consultado" : catalog.status === "error" ? "Indisponível" : "Consultando"}
            </span>
          </div>
          <h2>Cadastros para revisar</h2>
          <strong>{ready ? issues.length : "—"}</strong>
          <p>
            {ready
              ? "Produtos com pendências de cadastro"
              : catalog.status === "error"
                ? "Não foi possível confirmar a contagem"
                : "Aguardando o catálogo"}
          </p>
          <details>
            <summary>Origem e atualização</summary>
            <span>
              {demonstration
                ? "Amostra local · catálogo demonstrativo"
                : "Consulta administrativa do catálogo"}
            </span>
            <SourceTime value={ready ? catalog.updatedAt : undefined} />
            <span>Critérios: preço de venda, endereço de imagem e custo do fornecedor.</span>
          </details>
        </article>
        {pendingModules.map(({ name, icon: Icon, source, reason }) => (
          <article className="ov-metric" key={name}>
            <div className="ov-metric-top">
              <span className="ov-icon">
                <Icon size={18} />
              </span>
              <span className="ov-unavailable">Não integrado</span>
            </div>
            <h2>{name}</h2>
            <strong>—</strong>
            <p>
              {name === "Desenvolvimento"
                ? "Solicitações e validações do site"
                : "Aguardando fonte de dados"}
            </p>
            <details>
              <summary>O que falta integrar</summary>
              <span>Fonte prevista: {source}.</span>
              <span>{reason}</span>
              <span>Sem consulta disponível; não representa zero.</span>
            </details>
          </article>
        ))}
      </div>
      <div className="ov-catalog-strip">
        <span>
          <Package size={17} />
          <strong>{counts.total ?? "—"}</strong> no catálogo
        </span>
        <button type="button" onClick={() => onProducts("published")} disabled={!ready}>
          <span className="ov-small-dot" />
          {counts.published ?? "—"} elegíveis <ArrowRight size={13} />
        </button>
        <button type="button" onClick={() => onProducts("awaiting")} disabled={!ready}>
          {counts.awaiting ?? "—"} aguardando preço <ArrowRight size={13} />
        </button>
        <button type="button" onClick={() => onNavigate("revisao")} disabled={!queueReady}>
          <ArrowDownToLine size={15} />
          {counts.review == null ? "—" : `${counts.review}${reviewLimitReached ? "+" : ""}`}{" "}
          coletados para revisão <ArrowRight size={13} />
        </button>
      </div>
      <div className="ov-columns">
        <section className="ov-panel ov-attention" aria-labelledby="ov-attention-title">
          <div className="ov-panel-heading">
            <div>
              <h2 id="ov-attention-title">Precisa da sua atenção</h2>
              <p>Pendências identificadas nos dados consultados.</p>
            </div>
            <span className="ov-count">
              {ready
                ? `${issues.length} ${issues.length === 1 ? "produto" : "produtos"}`
                : "Sem contagem"}
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
                <h3>
                  {counts.total === 0
                    ? "Seu catálogo está vazio"
                    : "Nenhuma pendência nas regras consultadas"}
                </h3>
                <p>
                  {counts.total === 0
                    ? "Abra Produtos para começar o cadastro."
                    : "Preço, endereço de imagem e custo conferidos. Estoque físico e carregamento das fotos não foram verificados."}
                </p>
                <button className="ov-text-button" onClick={() => onProducts("all")}>
                  Abrir produtos <ArrowRight size={15} />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="ov-list-head">
                <span>ITEM E PENDÊNCIA</span>
                <span>AÇÃO</span>
              </div>
              <ul className="ov-issues">
                {(showAll ? issues : issues.slice(0, 5)).map(({ product, reasons }) => (
                  <li key={product.id}>
                    <div className="ov-issue-type">
                      <Package size={17} />
                    </div>
                    <div className="ov-issue-content">
                      <span className="ov-type-label">CADASTRO</span>
                      <h3>{product.nome}</h3>
                      <p className="ov-problem">{reasons.join(" · ")}</p>
                      <p className="ov-impact">{overviewImpact(product)}</p>
                    </div>
                    <button
                      className="ov-review-button"
                      aria-label={`Revisar ${product.nome}`}
                      onClick={() => {
                        const original = catalog.data?.find((p) => p.id === product.id);
                        if (original) onEdit(original);
                      }}
                    >
                      Revisar <ArrowRight size={15} />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="ov-list-footer">
                <span>
                  Fonte: {demonstration ? "amostra local" : "cadastro de produtos"} ·{" "}
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
              <p>Fila de revisão indisponível. A contagem não foi confirmada.</p>
              <button className="ov-text-button" onClick={onRefresh} disabled={refreshing}>
                Tentar novamente
              </button>
            </div>
          ) : (
            queueReady &&
            (counts.review ?? 0) > 0 && (
              <div className="ov-review-note">
                <ArrowDownToLine size={17} />
                <div>
                  <strong>
                    {counts.review}
                    {reviewLimitReached ? "+" : ""} produtos coletados para revisão
                  </strong>
                  <p>
                    {reviewLimitReached
                      ? "O limite da consulta foi atingido; a fila pode conter mais itens."
                      : "Precisam ser conferidos antes de entrar no catálogo."}
                  </p>
                </div>
                <button className="ov-text-button" onClick={() => onNavigate("revisao")}>
                  Abrir fila <ArrowRight size={15} />
                </button>
              </div>
            )
          )}
        </section>
        <aside className="ov-side">
          <section className="ov-panel ov-shortcuts">
            <h2>Ações rápidas</h2>
            {[
              {
                title: "Gerenciar produtos",
                detail: "Consultar e revisar cadastros",
                icon: Package,
                action: () => onProducts("all"),
              },
              {
                title: "Escolher produtos da vitrine",
                detail: "Seleções da página inicial",
                icon: Layers3,
                action: () => onNavigate("vitrine"),
              },
              {
                title: "Trocar banners",
                detail: "Imagens e conteúdo da página inicial",
                icon: Image,
                action: () => onNavigate("banners"),
              },
            ].map(({ title, detail, icon: Icon, action }) => (
              <button type="button" className="ov-shortcut" key={title} onClick={action}>
                <Icon size={18} />
                <span>
                  <strong>{title}</strong>
                  <small>{detail}</small>
                </span>
                <ArrowRight size={16} />
              </button>
            ))}
          </section>
          <section className="ov-panel ov-coverage">
            <h2>Sobre este resumo</h2>
            <div>
              <span className="ov-small-dot" />
              <strong>Cadastro e fila de revisão</strong>
              <small>
                Consultas {demonstration ? "demonstrativas" : "administrativas"} com atualização
                independente.
              </small>
            </div>
            <div>
              <Clock3 size={15} />
              <strong>Outras áreas em integração</strong>
              <small>Campanhas, rascunhos e solicitações ainda não fornecem dados ao resumo.</small>
            </div>
            <details>
              <summary>Ver limites da conferência</summary>
              <p>
                Elegibilidade segue os critérios existentes de preço, custo e endereço de imagem.
                Não confirma estoque físico nem carregamento da foto.
              </p>
              <p>
                Banner mobile, campanhas sem prazo e requisitos aguardando validação exigem fontes
                que ainda não estão integradas.
              </p>
            </details>
          </section>
        </aside>
      </div>
      <footer className="ov-sources">
        <span>
          <span className="ov-small-dot" />
          Atualização por fonte
        </span>
        <span>
          Catálogo: {ready ? <SourceTime value={catalog.updatedAt} /> : "consulta não concluída"}
        </span>
        <span>
          Fila: {queueReady ? <SourceTime value={review.updatedAt} /> : "consulta não concluída"}
        </span>
      </footer>
    </section>
  );
}
