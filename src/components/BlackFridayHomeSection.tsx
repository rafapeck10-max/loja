import { Link } from "@tanstack/react-router";
import { ArrowRight, CreditCard, ShieldCheck, Truck } from "lucide-react";
import { BLACK_FRIDAY_COPY, productBlackFridayDiscount } from "../lib/black-friday";
import { MAX_INSTALLMENTS } from "../lib/constants";
import type { Produto } from "../lib/products.functions";
import { ProductCard } from "./ProductCard";

export function BlackFridayHomeSection({
  title,
  subtitle,
  products,
  demonstration,
  ctaHref,
}: {
  title: string;
  subtitle: string;
  products: Produto[];
  demonstration: boolean;
  ctaHref?: string;
}) {
  if (!products.length) return null;

  return (
    <section
      id="black-friday"
      className="mobi-shelf mobi-wrap mobi-black-friday"
      aria-label={title}
    >
      <div className="mobi-bf-showcase">
        <div className="mobi-bf-showcase-head">
          <div className="mobi-bf-showcase-copy">
            <span className="mobi-black-friday-kicker">{BLACK_FRIDAY_COPY.kicker}</span>
            <h2>{title}</h2>
            {subtitle ? <p className="mobi-bf-showcase-subtitle">{subtitle}</p> : null}
            <ul className="mobi-bf-showcase-chips" aria-label="Condições da Black Friday Mobi">
              <li>
                <ShieldCheck size={14} aria-hidden="true" />
                <span>Pague somente na entrega</span>
              </li>
              <li>
                <Truck size={14} aria-hidden="true" />
                <span>Frete grátis · raio 30 km</span>
              </li>
              <li>
                <CreditCard size={14} aria-hidden="true" />
                <span>Pix com desconto ou até {MAX_INSTALLMENTS}x</span>
              </li>
            </ul>
          </div>
          {ctaHref === "/black-friday" ? (
            <Link to="/black-friday" search={{}} className="mobi-bf-showcase-cta">
              <span>Ver área Black Friday</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ) : null}
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
            <ProductCard
              key={produto.id}
              produto={produto}
              badge="blackFriday"
              theme="blackFriday"
              discountPercent={productBlackFridayDiscount(produto)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
