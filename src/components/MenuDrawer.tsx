import { useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronRight, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useUI } from "@/lib/ui-context";
import { catalogEnvironments as rooms } from "@/lib/catalog-navigation";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import {
  WHATSAPP_URL,
  WHATSAPP_DISPLAY,
  getCategory,
  getSubcategories,
  type Category,
} from "@/lib/constants";

function CategoryLinks({ category, closeMenu }: { category: Category; closeMenu: () => void }) {
  const children = getSubcategories(category.slug);
  const link = (
    <Link
      to="/categoria/$slug"
      params={{ slug: category.slug }}
      search={{ page: 1 }}
      onClick={closeMenu}
      className="mobi-menu-link"
    >
      {children.length ? `Ver todos em ${category.label}` : category.label}
      <ChevronRight size={16} aria-hidden="true" />
    </Link>
  );
  return children.length ? (
    <details className="mobi-menu-group">
      <summary>{category.label}</summary>
      {link}
      <div className="mobi-menu-children">
        {children.map((child) => (
          <CategoryLinks key={child.slug} category={child} closeMenu={closeMenu} />
        ))}
      </div>
    </details>
  ) : (
    link
  );
}
export function MenuDrawer() {
  const { menuOpen, closeMenu } = useUI();
  const opener = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root
      open={menuOpen}
      onOpenChange={(open) => {
        if (!open) closeMenu();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[1001] bg-black/50" />
        <Dialog.Content
          id="mobi-navigation-menu"
          aria-describedby="mobi-menu-description"
          className="mobi-navigation-drawer"
          onOpenAutoFocus={() => {
            opener.current = document.activeElement as HTMLElement;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            opener.current?.focus();
          }}
        >
          <div className="mobi-menu-heading">
            <Dialog.Title>Categorias</Dialog.Title>
            <Dialog.Close className="mobi-menu-close" aria-label="Fechar menu">
              <X size={22} />
            </Dialog.Close>
          </div>
          <Dialog.Description id="mobi-menu-description" className="mobi-menu-description">
            Encontre por tipo de móvel ou ambiente.
          </Dialog.Description>
          <nav aria-label="Catálogo por ambiente" className="mobi-menu-scroll">
            <Link
              to="/"
              search={{ all: true, page: 1 }}
              hash="catalogo"
              onClick={closeMenu}
              className="mobi-menu-link mobi-menu-all"
            >
              Ver catálogo completo
              <ChevronRight size={16} aria-hidden="true" />
            </Link>
            <div className="mobi-menu-shortcuts">
              <Link
                to="/categoria/$slug"
                params={{ slug: "sofas" }}
                search={{ page: 1 }}
                onClick={closeMenu}
              >
                Sofás
              </Link>
              <Link
                to="/categoria/$slug"
                params={{ slug: "roupeiros" }}
                search={{ page: 1 }}
                onClick={closeMenu}
              >
                Guarda-roupas
              </Link>
              <details>
                <summary>Camas</summary>
                {[
                  "camas-casal",
                  "camas-solteiro",
                  "camas-com-bau",
                  "beliches",
                  "bicamas",
                  "cama-box",
                ].map((slug) => (
                  <CategoryLinks key={slug} category={getCategory(slug)!} closeMenu={closeMenu} />
                ))}
              </details>
            </div>
            <p className="mobi-menu-label">Por ambiente</p>
            {rooms.map((room) => (
              <CategoryLinks key={room.slug} category={room} closeMenu={closeMenu} />
            ))}
            <Link to="/" search={{}} onClick={closeMenu} className="mobi-menu-link">
              Voltar aos destaques
            </Link>
          </nav>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mobi-menu-whatsapp"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Compre via WhatsApp {WHATSAPP_DISPLAY}
          </a>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
