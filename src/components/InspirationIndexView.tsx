import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, ArrowRight } from "lucide-react";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { useHomeConfiguration } from "@/components/HomeConfigurationContext";
import { normalizeCategory } from "@/lib/constants";

export function InspirationIndexView({ revisionId = null }: { revisionId?: number | null }) {
  const configuration = useHomeConfiguration();
  const articles = configuration?.content?.articles;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const categories = [
    ...new Set((articles ?? []).map((article) => article.category.trim()).filter(Boolean)),
  ];
  const normalizedQuery = normalizeCategory(query);
  const filtered = useMemo(
    () =>
      (articles ?? []).filter((article) => {
        if (
          category !== "all" &&
          normalizeCategory(article.category) !== normalizeCategory(category)
        )
          return false;
        if (!normalizedQuery) return true;
        const text = normalizeCategory(
          `${article.title} ${article.excerpt} ${article.body} ${article.category}`,
        );
        return normalizedQuery
          .split(" ")
          .filter(Boolean)
          .every((term) => text.includes(term));
      }),
    [articles, category, normalizedQuery],
  );
  const featured = filtered.find((article) => article.featured);
  const list = filtered.filter((article) => article.id !== featured?.id);

  return (
    <main className="mobi-wrap py-8 sm:py-12">
      {revisionId !== null && (
        <div className="mb-5 border-b border-gold/30 bg-[#f3f4ed] px-4 py-2 text-center text-xs text-deep-green">
          Prévia editorial local · revisão {revisionId} · não publicada
        </div>
      )}
      <nav className="mobi-breadcrumb" aria-label="Você está em">
        <Link to="/" search={{}} className="mobi-text-link">
          Início
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Inspiração</span>
      </nav>
      <div className="flex flex-col justify-between gap-5 border-b border-cacau/15 pb-5 sm:flex-row sm:items-end">
        <div>
          <span className="mobi-eyebrow">CASA COM A CARA DA MOBI</span>
          <h1 className="mt-1 text-3xl text-deep-green sm:text-4xl">Ideias para sua casa</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-text-light">
            Dicas e conteúdos da Mobi para inspirar sua casa. Confirme informações comerciais com a
            equipe.
          </p>
        </div>
        <label className="flex min-h-12 w-full items-center gap-2 rounded-lg border border-cacau/20 bg-white px-3 sm:max-w-sm">
          <Search size={17} className="shrink-0 text-text-light" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar nos artigos"
            aria-label="Buscar artigos de inspiração"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </label>
      </div>
      <div className="mt-5 flex gap-2 overflow-x-auto pb-2" aria-label="Temas editoriais">
        {["all", ...categories].map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
            className={`min-h-11 shrink-0 rounded-full border px-4 text-sm ${category === item ? "border-deep-green bg-deep-green text-white" : "border-cacau/20 bg-white text-cacau"}`}
          >
            {item === "all" ? "Todos os temas" : item}
          </button>
        ))}
      </div>

      {featured && (
        <Link
          to="/inspiracao/$slug"
          params={{ slug: featured.slug }}
          className={`mt-5 grid overflow-hidden rounded-2xl border border-cacau/15 bg-white ${featured.imageUrl ? "md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]" : "border-l-4 border-l-gold bg-[#f6f4ed]"}`}
        >
          <div
            className={`flex flex-col justify-center p-5 sm:p-8 ${featured.imageUrl ? "order-2 md:order-1" : "max-w-3xl"}`}
          >
            <span className="mobi-eyebrow">{featured.category || "DESTAQUE MOBI"}</span>
            <h2 className="mt-2 text-2xl text-deep-green sm:text-3xl">{featured.title}</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-text-light">{featured.excerpt}</p>
            <span className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-deep-green">
              Ler artigo <ArrowRight size={17} aria-hidden="true" />
            </span>
          </div>
          {featured.imageUrl && (
            <div className="order-1 min-h-52 bg-[#f1eee7] md:order-2 md:min-h-80">
              <ImageWithFallback
                src={featured.imageUrl}
                alt={featured.imageAlt}
                className="h-full min-h-52 w-full object-cover md:min-h-80"
              />
            </div>
          )}
        </Link>
      )}

      <section className="mt-7" aria-labelledby="inspiration-results-title">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="inspiration-results-title" className="text-xl text-deep-green">
            {normalizedQuery || category !== "all" ? "Resultados" : "Mais ideias"}
          </h2>
          <span className="text-xs text-text-light" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "artigo" : "artigos"}
          </span>
        </div>
        {list.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((article) => (
              <Link
                key={article.id}
                to="/inspiracao/$slug"
                params={{ slug: article.slug }}
                className="overflow-hidden rounded-xl border border-cacau/15 bg-white transition-colors hover:border-gold"
              >
                {article.imageUrl && (
                  <div className="aspect-[4/3] bg-[#f1eee7]">
                    <ImageWithFallback
                      src={article.imageUrl}
                      alt={article.imageAlt}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <span className="mobi-eyebrow">{article.category || "MOBI"}</span>
                  <h3 className="mt-1 text-lg text-deep-green">{article.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-text-light">
                    {article.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : featured ? null : (
          <div className="rounded-xl border border-dashed border-cacau/20 bg-white p-7 text-center">
            <h3 className="text-lg font-semibold text-deep-green">
              {articles?.length
                ? "Nenhum artigo corresponde a essa busca."
                : "Os primeiros artigos estão em preparação."}
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-text-light">
              {(articles?.length ?? 0) > 0
                ? "Tente outro termo ou tema, ou veja os móveis disponíveis na Mobi."
                : "A Mobi ainda não publicou conteúdo editorial nesta prévia. Enquanto isso, você pode explorar o catálogo online."}
            </p>
            <Link
              to="/"
              search={{ all: true, page: 1 }}
              hash="catalogo"
              className="mobi-primary mt-4 inline-flex items-center"
            >
              Explorar móveis
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
