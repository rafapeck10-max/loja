import { Link } from "@tanstack/react-router";
import { ProductCard, type ProductBadge } from "@/components/ProductCard";
import type { Produto } from "@/lib/products.functions";
export function HomeProductSection({
  title,
  subtitle,
  products,
  badges,
  category,
}: {
  title: string;
  subtitle: string;
  products: Produto[];
  badges: Record<string, ProductBadge>;
  category?: string;
}) {
  if (!products.length) return null;
  return (
    <section className="mobi-shelf mobi-wrap">
      <div className="mobi-section-title">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {category ? (
          <Link
            to="/categoria/$slug"
            params={{ slug: category }}
            search={{ page: 1 }}
            className="mobi-text-link"
          >
            Ver todos
          </Link>
        ) : (
          <Link to="/" search={{ all: true, page: 1 }} hash="catalogo" className="mobi-text-link">
            Ver todos
          </Link>
        )}
      </div>
      <div className="mobi-grid">
        {products.map((produto) => (
          <ProductCard key={produto.id} produto={produto} badge={badges[produto.id]} />
        ))}
      </div>
    </section>
  );
}
