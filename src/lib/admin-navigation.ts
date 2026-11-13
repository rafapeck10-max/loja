export type AdminViewId =
  | "overview"
  | "produtos"
  | "fornecedores"
  | "revisao"
  | "navigation"
  | "vitrine"
  | "banners"
  | "content"
  | "campaigns"
  | "service"
  | "history"
  | "evolution";

export interface AdminNavView {
  id: AdminViewId;
  label: string;
}

export interface AdminNavGroup {
  id: "start" | "catalog" | "storeContent" | "offers" | "service" | "more";
  label: string;
  defaultView: AdminViewId;
  views: readonly AdminNavView[];
}

export const ADMIN_NAV_GROUPS = [
  {
    id: "start",
    label: "Início",
    defaultView: "overview",
    views: [{ id: "overview", label: "Início" }],
  },
  {
    id: "catalog",
    label: "Catálogo",
    defaultView: "produtos",
    views: [
      { id: "produtos", label: "Produtos" },
      { id: "fornecedores", label: "Fornecedores e preços" },
      { id: "revisao", label: "Coletas para revisar" },
      { id: "navigation", label: "Categorias e filtros" },
    ],
  },
  {
    id: "storeContent",
    label: "Conteúdo da loja",
    defaultView: "vitrine",
    views: [
      { id: "vitrine", label: "Páginas e vitrines" },
      { id: "banners", label: "Banners e mídias" },
      { id: "content", label: "Ajuda e conteúdo" },
    ],
  },
  {
    id: "offers",
    label: "Ofertas",
    defaultView: "campaigns",
    views: [{ id: "campaigns", label: "Ofertas e campanhas" }],
  },
  {
    id: "service",
    label: "Atendimento",
    defaultView: "service",
    views: [{ id: "service", label: "Atendimento online" }],
  },
  {
    id: "more",
    label: "Mais",
    defaultView: "history",
    views: [
      { id: "history", label: "Histórico e estado do painel" },
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
