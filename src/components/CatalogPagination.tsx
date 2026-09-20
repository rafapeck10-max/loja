import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const PAGE_SIZE = 12;
export function parsePage(value: unknown) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : 1;
}

export function CatalogPagination({
  page,
  total,
  category,
  search = {},
}: {
  page: number;
  total: number;
  category?: string;
  search?: { q?: string; ofertas?: boolean; all?: boolean };
}) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages <= 1) return null;
  const start = Math.max(1, Math.min(page - 1, pages - 3));
  const numbers = Array.from({ length: Math.min(4, pages) }, (_, i) => start + i);
  const link = (n: number, label: string, content: ReactNode) => {
    const style = `flex h-11 min-w-11 items-center justify-center rounded-lg px-2 text-sm font-bold no-underline ${n === page ? "bg-deep-green text-white" : "bg-sand text-deep-green hover:bg-gold/30"}`;
    return category ? (
      <Link
        key={label}
        to="/categoria/$slug"
        params={{ slug: category }}
        search={{ page: n }}
        hash="catalogo"
        className={style}
        aria-label={label}
        aria-current={n === page ? "page" : undefined}
      >
        {content}
      </Link>
    ) : (
      <Link
        key={label}
        to="/"
        search={{ ...search, all: true, page: n }}
        hash="catalogo"
        className={style}
        aria-label={label}
        aria-current={n === page ? "page" : undefined}
      >
        {content}
      </Link>
    );
  };
  return (
    <nav aria-label="Paginação de produtos" className="mt-6 flex flex-col items-center gap-3">
      <div className="flex items-center gap-1.5">
        {page > 1 ? (
          link(page - 1, "Página anterior", <ChevronLeft size={18} />)
        ) : (
          <button
            disabled
            aria-label="Página anterior"
            className="h-11 w-11 rounded-lg bg-sand text-cacau/25"
          >
            <ChevronLeft size={18} className="mx-auto" />
          </button>
        )}
        {numbers.map((n) => link(n, `Página ${n}`, n))}
        {page < pages ? (
          link(page + 1, "Próxima página", <ChevronRight size={18} />)
        ) : (
          <button
            disabled
            aria-label="Próxima página"
            className="h-11 w-11 rounded-lg bg-sand text-cacau/25"
          >
            <ChevronRight size={18} className="mx-auto" />
          </button>
        )}
      </div>
      <p className="text-xs text-text-light" aria-live="polite">
        Página {page} de {pages} · {total} produtos
      </p>
    </nav>
  );
}
