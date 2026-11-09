import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  createRootRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from "@tanstack/react-router";
import { AdminStudio } from "../../src/components/admin-studio/AdminStudio";
import type { EditorProduct } from "../../src/lib/homepage-curation";
import pageSample from "./page-products.json";
import { createRoot } from "react-dom/client";
import { ArrowLeft, Check, Image, Layers3, Package, X } from "lucide-react";
import { AdminOverview } from "../../src/components/AdminOverview";
import { AdminWorkspace } from "../../src/components/AdminWorkspace";
import { productStatus, type ProductStatus } from "../../src/lib/admin-filters";
import type { OverviewProduct } from "../../src/lib/admin-overview";
import "../../src/styles.css";
import "./preview.css";

const pageProducts: EditorProduct[] = pageSample.map((p, index) => ({
  id: `page-demo-${p.id}`,
  nome: p.name,
  slug: `page-demo-${p.id}`,
  categoria: p.category,
  preco_atual: index === 8 || index === 9 ? 0 : p.price,
  preco_atacado: index === 11 ? null : p.price / 2,
  url_imagem: index === 10 ? "" : p.img,
  descricao: p.detail,
  sku: `AMOSTRA-${p.id}`,
  created_at: "2026-09-27T12:00:00Z",
  vitrine_semana_ordem: index < 4 ? index + 1 : null,
  vitrine_novidade: index === 4 ? "incluir" : "automatico",
  vitrine_sala: "automatico",
  vitrine_descoberta: true,
}));
const products: OverviewProduct[] = pageProducts;
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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | ProductStatus>("all");
  const [editing, setEditing] = useState<OverviewProduct | null>(null);
  const [scenario, setScenario] = useState("success");
  const [updatedAt, setUpdatedAt] = useState(Date.now());
  const [refreshing, setRefreshing] = useState(false);
  const status = scenario === "loading" ? "pending" : scenario === "error" ? "error" : "success";
  const sample = scenario === "empty" ? [] : products;
  const queue = scenario === "empty" ? [] : imports;
  const openProducts = (next: "all" | ProductStatus) => {
    setSearch("");
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
      <AdminWorkspace
        area={tab}
        demonstration
        onNavigate={setTab}
        onSearch={(query) => {
          openProducts("all");
          setSearch(query);
        }}
      >
        <AdminStudio
          area={tab}
          demonstration
          products={pageProducts}
          onNavigate={setTab}
          productQuery={search}
          productFilter={filter}
        />
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
        ) : tab !== "revisao" ? null : (
          <section className="preview-destination">
            <button className="aw-action" onClick={() => setTab("overview")}>
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
                    .filter(
                      (p) =>
                        (filter === "all" || productStatus(p) === filter) &&
                        p.nome
                          .toLocaleLowerCase("pt-BR")
                          .includes(search.toLocaleLowerCase("pt-BR")),
                    )
                    .map((p) => (
                      <li key={p.id}>
                        <Package size={20} />
                        <span>{p.nome}</span>
                        <button className="aw-action" onClick={() => setEditing(p)}>
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
      </AdminWorkspace>
      {editing && (
        <Dialog.Root
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="aw-overlay" />
            <Dialog.Content className="aw-help preview-dialog">
              <button
                className="preview-close aw-action"
                aria-label="Fechar cadastro"
                onClick={() => setEditing(null)}
              >
                <X size={18} />
              </button>
              <p className="ov-eyebrow">Cadastro de demonstração</p>
              <Dialog.Title>{editing.nome}</Dialog.Title>
              <Dialog.Description>
                Este é o produto indicado pela pendência. No painel integrado, o botão Revisar abre
                o formulário já existente.
              </Dialog.Description>
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
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </>
  );
}

const previewRoot = createRootRoute({ component: Preview });
const previewRouter = createRouter({
  routeTree: previewRoot,
  history: createMemoryHistory({ initialEntries: ["/"] }),
});
createRoot(document.getElementById("root")!).render(<RouterProvider router={previewRouter} />);
