export type AdminViewId =
  | "overview"
  | "produtos"
  | "fornecedores"
  | "revisao"
  | "shopping"
  | "navigation"
  | "vitrine"
  | "banners"
  | "content"
  | "campaigns"
  | "service"
  | "pedidos"
  | "history"
  | "evolution";

export interface AdminNavView {
  id: AdminViewId;
  label: string;
}

export interface AdminNavGroup {
  id: "start" | "pricing" | "catalog" | "imports" | "orders" | "storeContent" | "channels" | "more";
  section: "operacao" | "loja";
  label: string;
  defaultView: AdminViewId;
  views: readonly AdminNavView[];
}

export const ADMIN_NAV_GROUPS = [
  {
    id: "start",
    section: "operacao",
    label: "Início",
    defaultView: "overview",
    views: [{ id: "overview", label: "Início" }],
  },
  {
    id: "pricing",
    section: "operacao",
    label: "Precificar",
    defaultView: "fornecedores",
    views: [{ id: "fornecedores", label: "Precificar" }],
  },
  {
    id: "catalog",
    section: "operacao",
    label: "Produtos",
    defaultView: "produtos",
    views: [{ id: "produtos", label: "Produtos" }],
  },
  {
    id: "imports",
    section: "operacao",
    label: "Importações",
    defaultView: "revisao",
    views: [{ id: "revisao", label: "Importações" }],
  },
  {
    id: "orders",
    section: "operacao",
    label: "Pedidos do site",
    defaultView: "pedidos",
    views: [{ id: "pedidos", label: "Pedidos do site" }],
  },
  {
    id: "storeContent",
    section: "loja",
    label: "Vitrine e banners",
    defaultView: "vitrine",
    views: [
      { id: "vitrine", label: "Páginas e vitrines" },
      { id: "banners", label: "Banners e mídias" },
      { id: "content", label: "Ajuda e conteúdo" },
    ],
  },
  {
    id: "channels",
    section: "loja",
    label: "Canais e catálogo",
    defaultView: "shopping",
    views: [
      { id: "shopping", label: "Google Shopping" },
      { id: "navigation", label: "Categorias e filtros" },
      { id: "service", label: "Atendimento online" },
    ],
  },
  {
    id: "more",
    section: "loja",
    label: "Ferramentas e histórico",
    defaultView: "campaigns",
    views: [
      { id: "campaigns", label: "Simulador de ofertas" },
      { id: "history", label: "Histórico do painel" },
      { id: "evolution", label: "Evolução do site" },
    ],
  },
] as const satisfies readonly AdminNavGroup[];

export function getAdminNavGroup(view: AdminViewId): AdminNavGroup {
  const group = ADMIN_NAV_GROUPS.find((candidate) =>
    candidate.views.some((item) => item.id === view),
  );
  if (!group) throw new Error(`Área administrativa sem grupo: ${view}`);
  return group;
}

export function getAdminViewLabel(view: AdminViewId): string {
  for (const group of ADMIN_NAV_GROUPS) {
    const item = group.views.find((candidate) => candidate.id === view);
    if (item) return item.label;
  }
  return view;
}
