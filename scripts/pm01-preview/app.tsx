import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowLeft, Check, Image, Layers3, Package, X } from "lucide-react";
import { AdminOverview } from "../../src/components/AdminOverview";
import { MobiliLogo } from "../../src/components/MobiliLogo";
import { productStatus, type ProductStatus } from "../../src/lib/admin-filters";
import type { OverviewProduct } from "../../src/lib/admin-overview";
import "../../src/styles.css";
import "./preview.css";

const names = [
  "Sofá Areia",
  "Poltrona Clara",
  "Mesa Serena",
  "Cômoda Brisa",
  "Roupeiro Horizonte",
  "Rack Essência",
  "Cadeira Aurora",
  "Cabeceira Aconchego",
  "Sofá Nuvem",
  "Mesa de cabeceira Raiz",
  "Cozinha Jardim",
  "Painel Amparo",
];
const products: OverviewProduct[] = names.map((nome, index) => ({
  id: `demo-${index + 1}`,
  nome: `${nome} · demonstração`,
  preco_atual: index === 8 || index === 9 ? 0 : 500,
  preco_atacado: index === 11 ? null : 300,
  url_imagem: index === 10 ? "" : "https://example.com/demonstracao.jpg",
}));
const imports = [{ id: "demo-import-1" }, { id: "demo-import-2" }, { id: "demo-import-3" }];
const tabs = [
  ["overview", "Visão geral"],
  ["vitrine", "Vitrine da página inicial"],
  ["banners", "Banner da página inicial"],
  ["revisao", "Produtos coletados para revisão"],
  ["produtos", "Encontrar produtos"],
];

export function Preview() {
  const [tab, setTab] = useState("overview");
  const [filter, setFilter] = useState<"all" | ProductStatus>("all");
  const [editing, setEditing] = useState<OverviewProduct | null>(null);
  const [scenario, setScenario] = useState("success");
  const [updatedAt, setUpdatedAt] = useState(Date.now());
  const [refreshing, setRefreshing] = useState(false);
  const status = scenario === "loading" ? "pending" : scenario === "error" ? "error" : "success";
  const sample = scenario === "empty" ? [] : products;
  const queue = scenario === "empty" ? [] : imports;
  const openProducts = (next: "all" | ProductStatus) => {
    setFilter(next);
    setTab("produtos");
  };
  const refresh = () => {
    setRefreshing(true);
    window.setTimeout(() => {
      setScenario("success");
      setUpdatedAt(Date.now());
      setRefreshing(false);
    }, 450);
  };
  return (
    <>
      <header className="preview-brand">
        <div>
          <MobiliLogo className="preview-logo" />
          <span>Painel da loja</span>
        </div>
        <span className="preview-private">Ambiente de demonstração</span>
      </header>
      <main className="preview-main">
        <div className="preview-title">
          <p>Administração da loja</p>
          <h1>Painel Mobi</h1>
          <span>
            Catálogo, vitrine e banners em um só lugar. Veja o que precisa de atenção e continue de
            onde parou.
          </span>
        </div>
        <nav className="admin-workspace admin-workspace--overview" aria-label="Áreas da prévia">
          <div className="admin-workspace-tabs">
            {tabs.map(([value, label]) => (
              <button
                className="admin-workspace-tab"
                data-state={tab === value ? "active" : "inactive"}
                key={value}
                onClick={() => setTab(value)}
                aria-current={tab === value ? "page" : undefined}
              >
                {label}
              </button>
            ))}
          </div>
        </nav>
        {tab === "overview" ? (
          <AdminOverview
            demonstration
            catalog={{ status, data: sample, updatedAt }}
            review={{
              status: scenario === "queue-error" ? "error" : status,
              data: queue,
              updatedAt,
              limit: scenario === "queue-limit" ? 3 : undefined,
            }}
            refreshing={refreshing}
            onRefresh={refresh}
            onProducts={openProducts}
            onEdit={setEditing}
            onNavigate={setTab}
          />
        ) : (
          <section className="preview-destination">
            <button className="ov-button" onClick={() => setTab("overview")}>
              <ArrowLeft size={16} /> Voltar à Visão geral
            </button>
            <h2>{tabs.find(([value]) => value === tab)?.[1]}</h2>
            <p>
              Destino do atalho na demonstração. No painel integrado, abre a área existente. Esta
              prévia não salva dados.
            </p>
            {tab === "produtos" && (
              <>
                <label className="preview-select">
                  Filtrar por status{" "}
                  <select
                    value={filter}
                    onChange={(event) => setFilter(event.target.value as "all" | ProductStatus)}
                  >
                    <option value="all">Todos</option>
                    <option value="published">Publicados</option>
                    <option value="awaiting">Aguardando preço</option>
                    <option value="incomplete">Incompletos</option>
                  </select>
                </label>
                <ul className="preview-products">
                  {sample
                    .filter((p) => filter === "all" || productStatus(p) === filter)
                    .map((p) => (
                      <li key={p.id}>
                        <Package size={20} />
                        <span>{p.nome}</span>
                        <button className="ov-button" onClick={() => setEditing(p)}>
                          Ver cadastro
                        </button>
                      </li>
                    ))}
                </ul>
              </>
            )}
            {tab === "revisao" && (
              <ul className="preview-products">
                {queue.map((p, i) => (
                  <li key={p.id}>
                    <Package size={20} />
                    <span>Produto coletado {i + 1} · demonstração</span>
                  </li>
                ))}
              </ul>
            )}
            {(tab === "vitrine" || tab === "banners") && (
              <div className="preview-area">
                {tab === "banners" ? <Image size={40} /> : <Layers3 size={40} />}
                <strong>
                  {tab === "banners"
                    ? "Editor de banners existente"
                    : "Curadoria da vitrine existente"}
                </strong>
                <p>Atalho conferido. O desenvolvimento do PM-01 preserva os editores atuais.</p>
              </div>
            )}
          </section>
        )}
        <details className="preview-controls">
          <summary>Conferir estados da prévia</summary>
          <label className="preview-select">
            Cenário{" "}
            <select
              aria-label="Cenário da prévia"
              value={scenario}
              onChange={(event) => setScenario(event.target.value)}
            >
              <option value="success">Dados carregados</option>
              <option value="loading">Carregando</option>
              <option value="error">Falha nas consultas</option>
              <option value="queue-error">Falha somente na fila de revisão</option>
              <option value="queue-limit">Limite da consulta de revisão atingido</option>
              <option value="empty">Catálogo vazio</option>
            </select>
          </label>
          <p>Dados fictícios para revisar o comportamento. Não há acesso ao banco da loja.</p>
        </details>
      </main>
      {editing && (
        <div className="preview-backdrop" onClick={() => setEditing(null)}>
          <section
            className="preview-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="preview-dialog-title"
            ref={(element) => element?.focus()}
            tabIndex={-1}
            onKeyDown={(event) => {
              if (event.key === "Escape") setEditing(null);
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="preview-close ov-button"
              aria-label="Fechar cadastro"
              onClick={() => setEditing(null)}
            >
              <X size={18} />
            </button>
            <p className="ov-eyebrow">Cadastro de demonstração</p>
            <h2 id="preview-dialog-title">{editing.nome}</h2>
            <p>
              Este é o produto indicado pela pendência. No painel integrado, o botão Revisar abre o
              formulário já existente.
            </p>
            <dl>
              <dt>Preço de venda</dt>
              <dd>{editing.preco_atual ? "Informado" : "Pendente"}</dd>
              <dt>Imagem principal</dt>
              <dd>{editing.url_imagem ? "Endereço informado" : "Pendente"}</dd>
              <dt>Custo do fornecedor</dt>
              <dd>{editing.preco_atacado ? "Informado" : "Pendente"}</dd>
            </dl>
            <p className="preview-safe">
              <Check size={16} /> Nenhum dado real foi alterado.
            </p>
          </section>
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById("root")!).render(<Preview />);
