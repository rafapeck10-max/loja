import { Link } from "@tanstack/react-router";
import { Tag } from "lucide-react";

export function BlackFridayBadge({ detail = false }: { detail?: boolean }) {
  return (
    <div className={`mobi-black-product-label${detail ? " is-detail" : ""}`}>
      <Link to="/black-friday" aria-label="Produto na Black Friday Mobi. Ver seleção">
        <Tag size={13} aria-hidden="true" />
        <span>
          BLACK <strong>FRIDAY</strong>
        </span>
      </Link>
      {detail && <span>Este produto está na seleção Black Friday Mobi.</span>}
    </div>
  );
}
