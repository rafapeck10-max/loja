import { categoryMatches, type Category } from "../lib/constants";
import type { Produto } from "../lib/products.functions";
import { categoryDisplayLabel } from "./CategoryNavigation";
import { ImageWithFallback } from "./ImageWithFallback";
export function HomepageCategories({
  categories,
  products,
  destinations,
}: {
  categories: readonly Category[];
  products: Produto[];
  destinations?: readonly { id: string; href: string }[];
}) {
  const available = categories
    .filter((c) => c.slug !== "sala-de-estar")
    .flatMap((category) => {
      const product = products.find((p) => categoryMatches(p.categoria, category.slug));
      return product ? [{ category, product }] : [];
    });
  if (!available.length) return null;
  return (
    <section className="mobi-shop-categories mobi-wrap">
      <div className="mobi-shop-heading">
        <h2>Encontre por categoria</h2>
        <span>Escolha onde começar</span>
      </div>
      <nav className="mobi-photo-categories" aria-label="Comprar por categoria">
        {available.map(({ category: c, product }) => {
          return (
            <a
              key={c.slug}
              href={destinations?.find((d) => d.id === c.slug)?.href ?? `/categoria/${c.slug}`}
            >
              <span className="mobi-category-photo">
                <ImageWithFallback src={product.imagem_url} alt="" loading="lazy" />
              </span>
              <span>{categoryDisplayLabel(c, true)}</span>
              <small>Ver modelos →</small>
            </a>
          );
        })}
      </nav>
    </section>
  );
}
