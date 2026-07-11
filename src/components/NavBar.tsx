import { Link, useRouterState } from "@tanstack/react-router";

const categories = ["Sofás", "Poltronas", "Salas de Jantar", "Dormitórios"];

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
        {categories.map((cat) => (
          <li key={cat}>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="nav-underline text-xs font-semibold uppercase tracking-[1.5px] text-deep-green no-underline transition-colors hover:text-gold"
            >
              {cat}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
