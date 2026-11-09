import { useEffect, useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowUpRight,
  ChevronRight,
  CircleHelp,
  FileClock,
  Image,
  LayoutDashboard,
  Layers3,
  LogOut,
  Menu,
  Package,
  Search,
  Settings2,
  ShieldCheck,
  X,
} from "lucide-react";
import { MobiliLogo } from "./MobiliLogo";
import "../admin-overview.css";

const areas = [
  { id: "overview", title: "Visão geral", icon: LayoutDashboard },
  { id: "vitrine", title: "Páginas e vitrines", icon: Layers3 },
  { id: "banners", title: "Banners e mídias", icon: Image },
  { id: "produtos", title: "Produtos", icon: Package },
  { id: "revisao", title: "Coletados para revisão", icon: FileClock },
];

export function AdminWorkspace({
  area,
  onNavigate,
  onSearch,
  onLogout,
  demonstration = false,
  children,
}: {
  area: string;
  onNavigate: (area: string) => void;
  onSearch: (query: string) => void;
  onLogout?: () => void;
  demonstration?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const close = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", close);
    return () => desktop.removeEventListener("change", close);
  }, []);
  const navigate = (next: string) => {
    onNavigate(next);
    setOpen(false);
  };
  const navigation = (
    <>
      <a
        className="aw-brand"
        href="https://www.mobimb.com.br/"
        target="_blank"
        rel="noreferrer"
        aria-label="Mobi — abrir loja"
      >
        <MobiliLogo className="aw-logo" />
        <span>Painel de controle</span>
      </a>
      <p className="aw-nav-label">GESTÃO DO SITE</p>
      <nav aria-label="Navegação do painel">
        {areas.map(({ id, title, icon: Icon }) => (
          <button
            type="button"
            key={id}
            aria-current={area === id ? "page" : undefined}
            onClick={() => navigate(id)}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{title}</span>
            {area === id && <span className="aw-active-dot" />}
          </button>
        ))}
      </nav>
      <div className="aw-future">
        <p className="aw-nav-label">EM DESENVOLVIMENTO</p>
        <span>
          <Settings2 size={17} aria-hidden="true" />
          Preços e campanhas
        </span>
        <span>
          <Layers3 size={17} aria-hidden="true" />
          Evolução do site
        </span>
        <p>Novas áreas serão habilitadas conforme forem implementadas.</p>
      </div>
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
      <aside className="aw-sidebar">{navigation}</aside>
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
                {navigation}
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          <div className="aw-breadcrumb">
            <span>Painel Mobi</span>
            <ChevronRight size={14} aria-hidden="true" />
            <strong>{areas.find((item) => item.id === area)?.title ?? "Visão geral"}</strong>
          </div>
          <form
            className="aw-search"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              onSearch(query.trim());
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
          <a
            className="aw-store-link"
            href="https://www.mobimb.com.br/"
            target="_blank"
            rel="noreferrer"
          >
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
                  vitrines, banners ou a fila de revisão.
                </Dialog.Description>
                <p>
                  A busca do topo encontra produtos por nome ou SKU. “Não integrado” indica que a
                  capacidade ainda não fornece informações ao resumo.
                </p>
                <p>
                  {demonstration
                    ? "Esta prévia usa uma amostra fictícia. Os destinos demonstram a navegação, sem salvar alterações."
                    : "Os editores existentes mantêm suas próprias ações de salvamento. Abrir uma área não salva alterações."}
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
        <div className="aw-content">{children}</div>
      </div>
    </div>
  );
}
