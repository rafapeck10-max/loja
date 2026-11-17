import { useEffect, useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowUpRight,
  ChevronRight,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Menu,
  MoreHorizontal,
  Package,
  PanelsTopLeft,
  Search,
  Tag,
  ShieldCheck,
  X,
} from "lucide-react";
import { MobiliLogo } from "./MobiliLogo";
import {
  ADMIN_NAV_GROUPS,
  getAdminNavGroup,
  getAdminViewLabel,
  type AdminViewId,
} from "../lib/admin-navigation";
import "../admin-overview.css";
import "../admin-density.css";
import "../admin-usability.css";

const groupIcons = {
  start: LayoutDashboard,
  catalog: Package,
  storeContent: PanelsTopLeft,
  offers: Tag,
  service: MessageCircle,
  more: MoreHorizontal,
};

export function AdminWorkspace({
  area,
  onNavigate,
  onSearch,
  onLogout,
  demonstration = false,
  storefrontHref = "https://www.mobimb.com.br/",
  children,
}: {
  area: AdminViewId;
  onNavigate: (area: AdminViewId) => void;
  onSearch: (query: string) => void;
  onLogout?: () => void;
  demonstration?: boolean;
  storefrontHref?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const activeGroup = getAdminNavGroup(area);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [area]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const close = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", close);
    return () => desktop.removeEventListener("change", close);
  }, []);
  const navigate = (next: AdminViewId) => {
    onNavigate(next);
    setOpen(false);
  };
  const renderNavigation = (variant: "desktop" | "mobile") => (
    <>
      <a
        className="aw-brand"
        href={storefrontHref}
        target="_blank"
        rel="noreferrer"
        aria-label="Mobi — abrir loja"
      >
        <MobiliLogo className="aw-logo" />
        <span>mobimb.com.br</span>
      </a>
      <p className="aw-nav-label">OPERAÇÃO DA MOBI</p>
      <nav aria-label={variant === "mobile" ? "Navegação mobile do painel" : "Navegação do painel"}>
        {ADMIN_NAV_GROUPS.map((group) => {
          const Icon = groupIcons[group.id];
          const active = activeGroup.id === group.id;
          const showSubviews = group.views.length > 1 && (variant === "mobile" || active);
          return (
            <div className="aw-nav-group" key={group.id}>
              <button
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => navigate(group.defaultView)}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{group.label}</span>
                {active && <span className="aw-active-dot" />}
              </button>
              {showSubviews && (
                <div
                  className="aw-nav-sublist"
                  role="group"
                  aria-label={`Subáreas de ${group.label}`}
                >
                  {group.views.map((view) => (
                    <button
                      type="button"
                      key={view.id}
                      aria-current={area === view.id ? "page" : undefined}
                      onClick={() => navigate(view.id)}
                    >
                      {view.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="aw-sidebar-bottom">
        <ShieldCheck size={18} aria-hidden="true" />
        <div>
          <strong>{demonstration ? "Prévia local" : "Área administrativa"}</strong>
          <span>{demonstration ? "Dados de demonstração" : "Acesso restrito"}</span>
        </div>
        {onLogout && (
          <button type="button" aria-label="Sair do painel" onClick={onLogout}>
            <LogOut size={17} />
          </button>
        )}
      </div>
    </>
  );
  return (
    <div className="aw-layout">
      <aside className="aw-sidebar">{renderNavigation("desktop")}</aside>
      <div className="aw-main">
        <header className="aw-topbar">
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="aw-mobile-menu aw-icon-button"
                aria-label="Abrir navegação"
              >
                <Menu size={22} />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="aw-overlay" />
              <Dialog.Content className="aw-drawer">
                <Dialog.Title className="aw-sr-only">Navegação do painel</Dialog.Title>
                <Dialog.Description className="aw-sr-only">
                  Escolha uma área da administração Mobi.
                </Dialog.Description>
                <Dialog.Close
                  className="aw-drawer-close aw-icon-button"
                  aria-label="Fechar navegação"
                >
                  <X size={20} />
                </Dialog.Close>
                {renderNavigation("mobile")}
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          <a
            className="aw-mobile-brand"
            href={storefrontHref}
            target="_blank"
            rel="noreferrer"
            aria-label="Mobi — abrir loja"
          >
            <MobiliLogo className="aw-mobile-logo" />
          </a>
          <div className="aw-breadcrumb">
            <span>Painel Mobi</span>
            <ChevronRight size={14} aria-hidden="true" />
            <strong>{activeGroup.label}</strong>
            {getAdminViewLabel(area) !== activeGroup.label && (
              <>
                <ChevronRight size={14} aria-hidden="true" />
                <strong>{getAdminViewLabel(area)}</strong>
              </>
            )}
          </div>
          {area !== "produtos" && area !== "fornecedores" && (
            <form
              className="aw-search"
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                const term = query.trim();
                onSearch(term);
                if (term) setQuery("");
              }}
            >
              <Search size={17} aria-hidden="true" />
              <input
                aria-label="Buscar produtos pelo nome ou SKU"
                placeholder="Buscar produto ou SKU…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button type="submit" aria-label="Buscar produtos">
                <ArrowUpRight size={16} />
              </button>
            </form>
          )}
          <a className="aw-store-link" href={storefrontHref} target="_blank" rel="noreferrer">
            Ver loja <ArrowUpRight size={15} />
          </a>
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <button type="button" className="aw-icon-button" aria-label="Ajuda do painel">
                <CircleHelp size={20} />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="aw-overlay" />
              <Dialog.Content className="aw-help">
                <Dialog.Title>Como usar o Painel Mobi</Dialog.Title>
                <Dialog.Description>
                  Comece pela Visão geral para encontrar pendências. Use o menu para abrir produtos,
                  vitrines, banners, campanhas ou a evolução do site.
                </Dialog.Description>
                <p>
                  Use Produtos para buscar, filtrar e editar. Em Precificar, confira os custos e
                  defina seus preços. “Não integrado” indica que a capacidade ainda não fornece
                  informações ao resumo.
                </p>
                <p>
                  {demonstration
                    ? "Esta prévia usa dados demonstrativos e salva rascunhos somente neste navegador. Revise as diferenças no histórico; a loja publicada permanece preservada."
                    : "O status de cada área editorial informa se o rascunho está neste navegador ou no servidor. O cadastro e a importação de produtos mantêm as operações administrativas existentes. Abrir uma área não salva alterações."}
                </p>
                <Dialog.Close className="aw-action">Entendi</Dialog.Close>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </header>
        {demonstration && (
          <div className="aw-demo-strip">
            <span className="aw-status-dot" />
            Prévia em revisão <span>•</span> Dados demonstrativos. Nenhuma alteração na loja.
          </div>
        )}
        {activeGroup.views.length > 1 && (
          <nav className="aw-subnav" aria-label={`Abas de ${activeGroup.label}`}>
            {activeGroup.views.map((view) => (
              <button
                type="button"
                key={view.id}
                aria-current={area === view.id ? "page" : undefined}
                onClick={() => navigate(view.id)}
              >
                {view.label}
              </button>
            ))}
          </nav>
        )}
        <div className="aw-content">{children}</div>
      </div>
    </div>
  );
}
