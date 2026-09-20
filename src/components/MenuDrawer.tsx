import { ChevronRight, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useUI } from "@/lib/ui-context";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { WHATSAPP_URL, WHATSAPP_DISPLAY, CATEGORIES, getSubcategories } from "@/lib/constants";

export function MenuDrawer() {
  const { menuOpen, closeMenu } = useUI();

  return (
    <>
      <div
        onClick={closeMenu}
        aria-hidden="true"
        className={`fixed inset-0 z-[1001] bg-black/50 transition-opacity duration-400 ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        aria-hidden={!menuOpen}
        inert={!menuOpen}
        aria-label="Menu de navegação"
        className={`fixed left-0 top-0 z-[1002] flex h-full w-[86%] max-w-[340px] flex-col bg-sand shadow-drawer transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Faixa WhatsApp */}
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 border-b border-cacau/10 bg-white px-5 py-3 text-xs font-semibold text-price-green transition-colors hover:bg-gold/10"
        >
          <WhatsAppIcon className="h-4 w-4 text-price-green" />
          Compre via WhatsApp {WHATSAPP_DISPLAY}
        </a>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-cacau/10 px-5 py-4">
          <span className="text-xs font-bold uppercase tracking-[2px] text-gold">Menu</span>
          <button
            onClick={closeMenu}
            aria-label="Fechar menu"
            className="text-cacau transition-colors hover:text-gold"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Lista de categorias */}
        <nav className="flex-1 overflow-y-auto">
          <ul>
            <li>
              <Link
                to="/"
                search={{}}
                onClick={closeMenu}
                className="flex items-center justify-between border-b border-cacau/10 px-6 py-5 font-sans text-sm font-medium text-cacau transition-colors hover:bg-white hover:text-gold"
              >
                <span>Destaques</span>
                <ChevronRight className="h-4 w-4 text-text-light" />
              </Link>
            </li>
            {CATEGORIES.map((cat) => (
              <li key={cat.slug}>
                <details className="border-b border-cacau/10">
                  <summary className="cursor-pointer px-6 py-4 text-sm font-semibold text-deep-green">
                    {cat.label}
                  </summary>
                  <Link
                    to="/categoria/$slug"
                    params={{ slug: cat.slug }}
                    search={{ page: 1 }}
                    onClick={closeMenu}
                    className="flex items-center justify-between border-b border-cacau/10 px-6 py-5 font-sans text-sm font-medium text-cacau transition-colors hover:bg-white hover:text-gold"
                  >
                    <span>Ver todos em {cat.label}</span>
                    <ChevronRight className="h-4 w-4 text-text-light" />
                  </Link>
                  {getSubcategories(cat.slug).map((child) => (
                    <Link
                      key={child.slug}
                      to="/categoria/$slug"
                      params={{ slug: child.slug }}
                      search={{ page: 1 }}
                      onClick={closeMenu}
                      className="block px-8 py-3 text-sm text-cacau hover:bg-white hover:text-gold"
                    >
                      {child.label}
                    </Link>
                  ))}
                </details>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
