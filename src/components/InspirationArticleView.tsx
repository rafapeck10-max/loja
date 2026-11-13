import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Share2 } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { ArticleBody } from "@/components/ArticleBody";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { produtosQueryOptions } from "@/lib/products.functions";

import { SITE_URL } from "@/lib/site-metadata";
import type { ContentArticle } from "@/lib/operational-config";

export function InspirationArticleView({
  article,
  revisionId,
}: {
  article: ContentArticle;
  revisionId: number | null;
}) {
  const productsQuery = useQuery(produtosQueryOptions());
  const related = useMemo(() => {
    const ids = new Set(article.relatedProductIds);
    return (productsQuery.data ?? []).filter((product) => ids.has(product.id));
  }, [article.relatedProductIds, productsQuery.data]);
  const shareText = `${article.title} · Mobi ${SITE_URL}/inspiracao/${article.slug}`;
  return (
    <main className="mobi-wrap py-7 sm:py-10">
      <div className="border-b border-gold/30 bg-[#f3f4ed] px-4 py-2 text-center text-xs text-deep-green">
        Prévia editorial local · revisão {revisionId} · não publicado
      </div>
      <nav className="mobi-breadcrumb mt-5" aria-label="Você está em">
        <Link to="/" search={{}} className="mobi-text-link">
          Início
        </Link>
        <span aria-hidden="true">/</span>
        <Link to="/inspiracao" className="mobi-text-link">
          Inspiração
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{article.title}</span>
      </nav>
      <article className="mx-auto mt-5 max-w-4xl">
        <header>
          <span className="mobi-eyebrow">{article.category || "IDEIAS DA MOBI"}</span>
          <h1 className="mt-2 max-w-3xl text-3xl leading-tight text-deep-green sm:text-5xl">
            {article.title}
          </h1>
          {article.excerpt && (
            <p className="mt-4 max-w-3xl text-base leading-7 text-text-light sm:text-lg">
              {article.excerpt}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-y border-cacau/15 py-3 text-xs text-text-light">
            <span>
              Revisado em{" "}
              {new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "long",
                timeZone: "America/Sao_Paulo",
              }).format(new Date(article.reviewedAt))}
            </span>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 font-semibold text-deep-green underline underline-offset-4"
            >
              <Share2 size={16} aria-hidden="true" /> Compartilhar no WhatsApp
            </a>
          </div>
        </header>
        {article.imageUrl && (
          <div className="mt-6 max-h-[560px] overflow-hidden rounded-xl bg-[#f1eee7]">
            <ImageWithFallback
              src={article.imageUrl}
              alt={article.imageAlt}
              className="max-h-[560px] w-full object-cover"
            />
          </div>
        )}
        <ArticleBody body={article.body} images={article.images} />
      </article>
      {!!related.length && (
        <section className="mobi-shelf mt-10" aria-labelledby="inspiration-related-title">
          <div className="mobi-section-title">
            <div>
              <span className="mobi-eyebrow">SELEÇÃO DA MOBI</span>
              <h2 id="inspiration-related-title">Móveis deste artigo</h2>
            </div>
          </div>
          <div className="mobi-grid">
            {related.map((product) => (
              <ProductCard key={product.id} produto={product} />
            ))}
          </div>
        </section>
      )}
      <div className="mt-9 border-t border-cacau/15 pt-5">
        <Link to="/inspiracao" className="mobi-text-link">
          Voltar para ideias da Mobi
        </Link>
      </div>
    </main>
  );
}
