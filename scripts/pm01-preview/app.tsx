import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UIProvider } from "../../src/lib/ui-context";
import { CartProvider } from "../../src/lib/cart-context";
import { Header } from "../../src/components/Header";
import { Footer } from "../../src/components/Footer";
import { MenuDrawer } from "../../src/components/MenuDrawer";
import { CartDrawer } from "../../src/components/CartDrawer";
import { MobileBottomBar } from "../../src/components/MobileBottomBar";
import { WhatsAppFloat } from "../../src/components/WhatsAppFloat";
import { HomeConfigurationProvider } from "../../src/components/HomeConfigurationContext";
import { HomepageContent } from "../../src/components/HomepageContent";
import {
  toStorefrontProducts,
  initialPageDraft,
  sectionProducts,
} from "../../src/lib/pages-shelves";
import { applyHomeCuration, type HomeConfiguration } from "../../src/lib/home-configuration";
import type { HomeTransport } from "../../src/lib/home-transport";
import previewToken from "virtual:mobi-preview-token";
import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  createRootRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from "@tanstack/react-router";
import { AdminStudio } from "../../src/components/admin-studio/AdminStudio";

import { pageProducts } from "./data";
import { createRoot } from "react-dom/client";
import { ArrowLeft, Check, Image, Layers3, Package, X } from "lucide-react";
import { AdminOverview } from "../../src/components/AdminOverview";
import { AdminWorkspace } from "../../src/components/AdminWorkspace";
import { productStatus, type ProductStatus } from "../../src/lib/admin-filters";
import type { OverviewProduct } from "../../src/lib/admin-overview";
import "../../src/styles.css";
import "./preview.css";

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
  const [tab, setTab] = useState(
    new URLSearchParams(window.location.search).get("area") ?? "overview",
  );
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
          homeTransport={localHomeTransport}
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

const previewRoot = createRootRoute({ component: PreviewShell });
const previewRouter = createRouter({
  routeTree: previewRoot,
  history: createMemoryHistory({ initialEntries: ["/"] }),
});

const localQueryClient = new QueryClient();
const requestHome = async (path: string, options: RequestInit = {}) => {
  const r = await fetch("/__mobi-local-home" + path, {
    ...options,
    headers: {
      "content-type": "application/json",
      "x-mobi-preview-token": previewToken,
      ...options.headers,
    },
  });
  const body = await r.json();
  if (!r.ok) throw new Error(body.error ?? "Falha na conexão local");
  return body;
};
const localHomeTransport: HomeTransport = {
  publicPreviewHref: "/scripts/pm01-preview/index.html?view=home",
  read: () => requestHome("/admin"),
  change: (command, draft) =>
    requestHome("/admin", { method: "POST", body: JSON.stringify({ command, draft }) }),
};
function LocalStorefront() {
  const [config, setConfig] = useState<HomeConfiguration | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    requestHome("")
      .then((d) => setConfig(d?.config ?? null))
      .catch((e) => setError(e.message));
  }, []);
  const products = applyHomeCuration(
    toStorefrontProducts(pageProducts, initialPageDraft(pageProducts).curation),
    config?.curation,
  );
  const sectionIds = Object.fromEntries(
    ["weekly", "discovery", "new", "room"].map((id) => [
      id,
      sectionProducts(id as "weekly", products, new Date()).map((p) => p.id),
    ]),
  ) as HomeConfiguration["sectionIds"];
  return (
    <HomeConfigurationProvider configuration={config}>
      <div className="store-shell">
        <div className="mobi-local-review-label">
          Prévia local · catálogo de amostra histórico · nenhuma oferta atual ·{" "}
          <a href="?area=vitrine">Voltar ao painel</a>
        </div>
        <Header />
        {error ? (
          <p role="alert">{error}</p>
        ) : config ? (
          <HomepageContent products={products} sectionIds={sectionIds} />
        ) : (
          <p className="mobi-wrap py-8">
            Nenhuma revisão aplicada. Abra Páginas e vitrines no painel e revise uma versão da home.
          </p>
        )}
        <Footer />
        <MenuDrawer />
        <CartDrawer />
        <MobileBottomBar />
        <WhatsAppFloat />
      </div>
    </HomeConfigurationProvider>
  );
}
function PreviewShell() {
  return (
    <QueryClientProvider client={localQueryClient}>
      <UIProvider>
        <CartProvider>
          {new URLSearchParams(window.location.search).get("view") === "home" ? (
            <LocalStorefront />
          ) : (
            <>
              <Preview />
              <MenuDrawer />
              <CartDrawer />
            </>
          )}
        </CartProvider>
      </UIProvider>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById("root")!).render(<RouterProvider router={previewRouter} />);
