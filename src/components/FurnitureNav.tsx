import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { FURNITURE_MENU_COLUMNS } from "@/lib/furniture-menu";

const FURNITURE_MENU_IMAGE =
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1000&q=80";

export function FurnitureNav() {
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  return (
    <div
      ref={navRef}
      className="relative hidden border-t border-gold/20 bg-white md:block"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) closeMenu();
      }}
    >
      <nav aria-label="Navegação por móveis" className="mx-auto max-w-[1300px] px-[5%]">
        <div className="flex justify-center">
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls="furniture-mega-menu"
            onClick={() => setIsOpen((open) => !open)}
            className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-5 text-xs font-bold uppercase tracking-[1.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${
              isOpen || pathname.startsWith("/categoria/")
                ? "border-gold text-gold"
                : "border-transparent text-deep-green hover:border-gold hover:text-gold"
            }`}
          >
            Móveis
            <ChevronDown
              aria-hidden="true"
              className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </nav>

      <div
        id="furniture-mega-menu"
        hidden={!isOpen}
        aria-hidden={!isOpen}
        className="absolute inset-x-0 top-full z-50 max-h-[78vh] overflow-y-auto border-t border-gold/30 bg-sand shadow-[0_18px_35px_rgba(35,31,26,0.18)]"
      >
        <div className="mx-auto grid max-w-[1300px] grid-cols-1 gap-5 px-5 py-5 md:px-8 md:py-6 xl:grid-cols-[minmax(230px,0.8fr)_2.2fr] xl:gap-8 xl:px-0 xl:py-8">
          <Link
            to="/categoria/$slug"
            params={{ slug: "sala-de-estar" }}
            search={{ page: 1 }}
            onClick={closeMenu}
            aria-label="Explorar sala de estar"
            className="hidden overflow-hidden rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold xl:block"
          >
            <img
              src={FURNITURE_MENU_IMAGE}
              alt="Sala de estar aconchegante com móveis de madeira"
              loading="lazy"
              decoding="async"
              className="h-full min-h-[390px] max-h-[520px] w-full object-cover"
            />
          </Link>

          <div className="grid grid-cols-2 gap-x-5 gap-y-7 lg:grid-cols-4 lg:gap-x-6">
            {FURNITURE_MENU_COLUMNS.map((column) => (
              <section
                key={column.title}
                aria-labelledby={`furniture-column-${column.slug ?? "mais-ambientes"}`}
              >
                <h2
                  id={`furniture-column-${column.slug ?? "mais-ambientes"}`}
                  className="mb-3 border-b border-gold/40 pb-2 text-[11px] font-bold uppercase tracking-[1.2px] text-deep-green"
                >
                  {column.slug ? (
                    <Link
                      to="/categoria/$slug"
                      params={{ slug: column.slug }}
                      search={{ page: 1 }}
                      onClick={closeMenu}
                      className="text-inherit no-underline transition-colors hover:text-gold"
                    >
                      {column.title}
                    </Link>
                  ) : (
                    column.title
                  )}
                </h2>

                <div className="space-y-4">
                  {column.sections.map((section, index) => (
                    <div key={section.slug ?? section.title ?? index}>
                      {section.title && (
                        <Link
                          to="/categoria/$slug"
                          params={{ slug: section.slug! }}
                          search={{ page: 1 }}
                          onClick={closeMenu}
                          className="mb-1.5 inline-flex py-1 text-[11px] font-semibold text-cacau no-underline transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                        >
                          {section.title}
                        </Link>
                      )}
                      <ul className="space-y-0.5">
                        {section.links.map((item) => (
                          <li key={item.slug}>
                            <Link
                              to="/categoria/$slug"
                              params={{ slug: item.slug }}
                              search={{ page: 1 }}
                              onClick={closeMenu}
                              className="inline-flex py-1 text-xs leading-snug text-cacau no-underline transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                            >
                              {item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="border-t border-gold/20 pt-3 xl:col-start-2">
            <Link
              to="/"
              search={{ all: true, page: 1 }}
              hash="catalogo"
              onClick={closeMenu}
              className="inline-flex py-1 text-xs font-semibold text-deep-green no-underline transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              Ver todos os móveis <span aria-hidden="true" className="ml-1">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
