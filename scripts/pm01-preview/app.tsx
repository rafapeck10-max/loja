import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UIProvider } from "../../src/lib/ui-context";
import { CartProvider } from "../../src/lib/cart-context";
import { MenuDrawer } from "../../src/components/MenuDrawer";
import { CartDrawer } from "../../src/components/CartDrawer";
import { LocalStorefront } from "./StorefrontPreview";
import { previewSearch, type PreviewSearch } from "./navigation-state";
import type { HomeTransport } from "../../src/lib/home-transport";
import previewToken from "virtual:mobi-preview-token";
import { useState } from "react";
import { Toaster } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import {
  createRootRoute,
  createRoute,
  createRouter,
  createBrowserHistory,
  Outlet,
  RouterProvider,
  useRouterState,
} from "@tanstack/react-router";
import { overlayPreviewProducts, readPreviewProductDrafts } from "./product-drafts";
import {
  SupplierPricingPanel,
  type SupplierPricingSummary,
} from "../../src/components/admin/SupplierPricingPanel";
import { AdminStudio } from "../../src/components/admin-studio/AdminStudio";
import { remoteStudioFixture } from "./remote-studio-fixture";

import { pageProducts } from "./data";
import { createRoot } from "react-dom/client";
import { ArrowLeft, Check, Image, Layers3, Package, X } from "lucide-react";
import { AdminOverview } from "../../src/components/AdminOverview";
import { AdminWorkspace } from "../../src/components/AdminWorkspace";
import { productStatus, type ProductStatus } from "../../src/lib/admin-filters";
import type { OverviewProduct } from "../../src/lib/admin-overview";
import "../../src/styles.css";
import "./preview.css";

const supplierKey = (product: (typeof pageProducts)[number]) =>
  product.fornecedor?.trim() || "__missing_supplier__";
const summarizeSupplier = (
  key: string,
  label: string,
  items: typeof pageProducts,
): SupplierPricingSummary => ({
  key,
  label,
  total: items.length,
  missingCost: items.filter((item) => !(Number(item.preco_atacado) > 0)).length,
  missingSitePrice: items.filter((item) => !(Number(item.preco_atual) > 0)).length,
  belowCost: items.filter(
    (item) =>
      Number(item.preco_atacado) > 0 &&
      Number(item.preco_atual) > 0 &&
      Number(item.preco_atual) < Number(item.preco_atacado),
  ).length,
});
const previewSupplierSummaries = (items: typeof pageProducts) => [
  summarizeSupplier("all", "Todos os fornecedores", items),
  ...[...new Set(items.map(supplierKey))].map((key) =>
    summarizeSupplier(
      key,
      key === "__missing_supplier__" ? "Sem fornecedor cadastrado" : key,
      items.filter((product) => supplierKey(product) === key),
    ),
  ),
];
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
  let supplierProducts = pageProducts;
  let supplierError = "";
  try {
    supplierProducts = overlayPreviewProducts(
      pageProducts,
      readPreviewProductDrafts(localStorage.getItem("mobi:admin-studio:v1:demo"), pageProducts),
    );
  } catch (error) {
    supplierError =
      error instanceof Error ? error.message : "Não foi possível ler os rascunhos de produtos.";
  }
  const [supplier, setSupplier] = useState("all");
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
        storefrontHref="/"
        area={tab}
        demonstration
        onNavigate={setTab}
        onSearch={(query) => {
          openProducts("all");
          setSearch(query);
        }}
      >
        {new URLSearchParams(window.location.search).get("view") === "remote-drafts" && (
          <p role="status">
            Teste isolado da interface assíncrona. Dados de demonstração em memória; sem conexão ao
            Supabase.
          </p>
        )}
        <AdminStudio
          workspaceTransport={
            new URLSearchParams(window.location.search).get("view") === "remote-drafts"
              ? remoteStudioFixture
              : undefined
          }
          area={tab}
          homeTransport={localHomeTransport}
          demonstration
          products={pageProducts}
          onNavigate={setTab}
          productQuery={search}
          productFilter={filter}
        />
        {tab === "fornecedores" && supplierError && (
          <p className="pm-note" role="alert">
            {supplierError}
          </p>
        )}
        {tab === "fornecedores" && !supplierError && (
          <SupplierPricingPanel
            summaries={previewSupplierSummaries(supplierProducts)}
            products={supplierProducts.filter(
              (product) => supplier === "all" || supplierKey(product) === supplier,
            )}
            selectedSupplier={supplier}
            onSelectSupplier={setSupplier}
            onEdit={(product) => {
              setSearch(product.sku || product.nome);
              setFilter("all");
              setTab("produtos");
            }}
          />
        )}
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
            <h1>{tabs.find(([value]) => value === tab)?.[1]}</h1>
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
function PreviewShell() {
  return (
    <QueryClientProvider client={localQueryClient}>
      <UIProvider>
        <CartProvider>
          <Outlet />
          <Toaster richColors position="top-center" />
        </CartProvider>
      </UIProvider>
    </QueryClientProvider>
  );
}
function LegacyEntry() {
  const search = useRouterState({ select: (state) => state.location.search }) as PreviewSearch;
  return search.view === "home" || search.all || search.q || search.ofertas ? (
    <LocalStorefront />
  ) : (
    <>
      <Preview />
      <MenuDrawer />
      <CartDrawer />
    </>
  );
}
const previewRoot = createRootRoute({ component: PreviewShell, validateSearch: previewSearch });
const indexRoute = createRoute({
  getParentRoute: () => previewRoot,
  path: "/",
  component: () => <LocalStorefront />,
});
const categoryRoute = createRoute({
  getParentRoute: () => previewRoot,
  path: "/categoria/$slug",
  component: () => <LocalStorefront page="category" />,
});
const productRoute = createRoute({
  getParentRoute: () => previewRoot,
  path: "/produto/$id",
  component: () => <LocalStorefront page="product" />,
});
const serviceRoute = createRoute({
  getParentRoute: () => previewRoot,
  path: "/moveis-nova-iguacu",
  component: () => <LocalStorefront page="service" />,
});
const helpRoute = createRoute({
  getParentRoute: () => previewRoot,
  path: "/ajuda/$slug",
  component: () => <LocalStorefront page="help" />,
});
const helpIndexRoute = createRoute({
  getParentRoute: () => previewRoot,
  path: "/ajuda",
  component: () => <LocalStorefront page="help-index" />,
});
const inspirationRoute = createRoute({
  getParentRoute: () => previewRoot,
  path: "/inspiracao",
  component: () => <LocalStorefront page="inspiration" />,
});
const articleRoute = createRoute({
  getParentRoute: () => previewRoot,
  path: "/inspiracao/$slug",
  component: () => <LocalStorefront page="article" />,
});
const legacyRoute = createRoute({
  getParentRoute: () => previewRoot,
  path: "/scripts/pm01-preview/index.html",
  component: LegacyEntry,
});
const previewRouter = createRouter({
  routeTree: previewRoot.addChildren([
    indexRoute,
    categoryRoute,
    productRoute,
    serviceRoute,
    helpRoute,
    helpIndexRoute,
    inspirationRoute,
    articleRoute,
    legacyRoute,
  ]),
  history: createBrowserHistory(),
  scrollRestoration: true,
});
const root = createRoot(document.getElementById("root")!);
root.render(<RouterProvider router={previewRouter} />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
