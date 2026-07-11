import { Link, useRouterState } from "@tanstack/react-router";
import { CATEGORIES } from "@/lib/constants";

export function NavBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";

  return (
    <nav className="sticky z-[999] border-b border-cacau/8 bg-white" style={{ top: "auto" }}>
      <ul className="scrollbar-none mx-auto flex max-w-[1300px] gap-9 overflow-x-auto whitespace-nowrap px-[5%] py-[18px]">
        <li>
          <Link
            to="/"
            search={{}}
            data-active={isHome}
            className={`nav-underline text-xs font-semibold uppercase tracking-[1.5px] no-underline transition-colors hover:text-gold ${
              isHome ? "text-gold" : "text-deep-green"
            }`}
          >
            Destaques
          </Link>
        </li>
        {CATEGORIES.map((cat) => {
          const active = pathname === `/categoria/${cat.slug}`;
          return (
            <li key={cat.slug}>
              <Link
                to="/categoria/$slug"
                params={{ slug: cat.slug }}
                data-active={active}
                className={`nav-underline text-xs font-semibold uppercase tracking-[1.5px] no-underline transition-colors hover:text-gold ${
                  active ? "text-gold" : "text-deep-green"
                }`}
              >
                {cat.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
