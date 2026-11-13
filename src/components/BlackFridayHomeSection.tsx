import { ProductCard } from "./ProductCard";
import type { Produto } from "../lib/products.functions";

export function BlackFridayHomeSection({
  title,
  subtitle,
  products,
  demonstration,
}: {
  title: string;
  subtitle: string;
  products: Produto[];
  demonstration: boolean;
}) {
  if (!products.length) return null;

  return (
    <section className="mobi-shelf mobi-wrap mobi-black-friday" aria-label={title}>
      <div className="mobi-section-title">
        <div>
          <span className="mobi-black-friday-kicker">SELEÇÃO ESPECIAL MOBI</span>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {demonstration && (
        <p className="mobi-black-friday-notice" role="note">
          Prévia local · campanha demonstrativa; nenhuma oferta foi aplicada à loja.
        </p>
      )}
      <div
        className={`mobi-grid mobi-home-product-grid${products.length === 1 ? " is-single" : ""}`}
      >
        {products.map((produto) => (
          <ProductCard key={produto.id} produto={produto} />
        ))}
      </div>
    </section>
  );
}
