import { useState, useEffect } from "react";
import { productStatus, type ProductStatus } from "../../lib/admin-filters";
import { ArrowUp, ArrowDown, Plus, Trash2 } from "lucide-react";
import { categoryMatches, formatBRL } from "../../lib/constants";
import {
  getCatalogMaterials,
  getCatalogColors,
  getCatalogFeatures,
  getCatalogDimensions,
} from "../../lib/catalog-search";
import {
  FILTER_LABELS,
  filterCoverage,
  navigationChildren,
  safeMobiLink,
  serviceLink,
  type NavigationData,
  type NavigationItem,
  type ContentData,
  type ContentArticle,
  type ContentArticleImage,
  type ContentPage,
  type ServiceData,
  type ProductDraftData,
  type FilterKey,
} from "../../lib/operational-config";
import { isCurationProduct, type EditorProduct } from "../../lib/homepage-curation";
import { ImageWithFallback } from "../ImageWithFallback";
import { ArticleBody } from "../ArticleBody";
import { cardQuote } from "../../lib/payment";
import { isEligibleBundleProduct } from "../../lib/product-bundles.ts";

export function NavigationPanel({
  data,
  onChange,
  products,
}: {
  data: NavigationData;
  onChange: (d: NavigationData) => void;
  products: EditorProduct[];
}) {
  const [id, setId] = useState(data.items[0].id),
    [filter, setFilter] = useState("");
  const item = data.items.find((x) => x.id === id) ?? data.items[0];
  const selected = products.filter((p) => categoryMatches(p.categoria ?? "", item.slug));
  const normalized = selected.map((p) => ({
    ...p,
    categoria: p.categoria ?? "",
    variacoes_preco: [],
  }));
  const coverage = filterCoverage(normalized);
  const patch = (p: Partial<NavigationItem>) =>
    onChange({ items: data.items.map((x) => (x.id === id ? { ...x, ...p } : x)) });
  const move = (from: number, delta: number) => {
    const items = [...data.items],
      target = from + delta;
    if (target < 0 || target >= items.length) return;
    [items[from], items[target]] = [items[target], items[from]];
    onChange({ items });
  };
  const getters = {
    material: getCatalogMaterials,
    color: getCatalogColors,
    features: getCatalogFeatures,
    dimensions: (p: (typeof normalized)[number]) => {
      const dimensions = getCatalogDimensions(p);
      return [
        dimensions.widthCm !== undefined ? "Largura" : "",
        dimensions.heightCm !== undefined ? "Altura" : "",
        dimensions.depthClosedCm !== undefined ? "Profundidade fechada" : "",
        dimensions.depthOpenCm !== undefined ? "Profundidade aberta" : "",
      ].filter(Boolean);
    },
  };
  const [facet, setFacet] = useState<FilterKey>("material");
  const activeFacet =
    item.filters.includes(facet) && coverage[facet].covered
      ? facet
      : item.filters.find((k) => coverage[k].covered > 0);
  const matching = filter
    ? normalized.filter((p) => activeFacet && getters[activeFacet](p).includes(filter))
    : normalized;
  return (
    <>
      <header className="pm-heading">
        <div>
          <h1>Navegação e filtros</h1>
          <p>Organize as categorias da Mobi e confira os atributos disponíveis no catálogo.</p>
        </div>
        <span className="pm-badge">MENU · LIST · SEARCH</span>
      </header>
      <div className="pm-split">
        <section className="pm-card">
          <h2>Árvore de categorias</h2>
          <ul className="pm-list">
            {data.items.map((x, i) => (
              <li key={x.id}>
                <button
                  className="pm-item-button"
                  aria-pressed={x.id === id}
                  onClick={() => {
                    setId(x.id);
                    setFilter("");
                  }}
                >
                  <strong>{x.label}</strong>
                  <small>
                    {x.href} · {x.visible ? "Visível" : "Oculta"}
                  </small>
                </button>
                <div className="pm-actions">
                  <button
                    className="pm-button"
                    aria-label={`Subir ${x.label}`}
                    disabled={!i}
                    onClick={() => move(i, -1)}
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    className="pm-button"
                    aria-label={`Descer ${x.label}`}
                    disabled={i === data.items.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <ArrowDown size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="pm-card">
          <h2>{item.label}</h2>
          <label className="pm-field">
            Nome público
            <input
              value={item.label}
              maxLength={80}
              onChange={(e) => patch({ label: e.target.value })}
            />
          </label>
          <label className="pm-field">
            Destino
            <input value={item.href} onChange={(e) => patch({ href: e.target.value })} />
          </label>
          <label className="pm-check">
            <input
              type="checkbox"
              checked={item.visible}
              onChange={(e) => patch({ visible: e.target.checked })}
            />{" "}
            Exibir no menu da prévia
          </label>
          <details>
            <summary>Subcategorias da taxonomia atual</summary>
            <ul>
              {navigationChildren(item.slug).map((c) => (
                <li key={c.slug}>
                  {c.label} · /categoria/{c.slug}
                </li>
              ))}
            </ul>
          </details>
          <h3>Filtros e cobertura</h3>
          <p className="pm-muted">
            A contagem usa a normalização já executada pela loja. Sem dados, o filtro fica como
            pendência nesta prévia.
          </p>
          {(Object.keys(FILTER_LABELS) as FilterKey[]).map((k) => (
            <div className="pm-coverage" key={k}>
              <label className="pm-check">
                <input
                  type="checkbox"
                  checked={item.filters.includes(k)}
                  onChange={(e) =>
                    patch({
                      filters: e.target.checked
                        ? [...item.filters, k]
                        : item.filters.filter((x) => x !== k),
                    })
                  }
                />
                {FILTER_LABELS[k]}
              </label>
              <span>
                {coverage[k].covered}/{coverage[k].total} preenchidos · {coverage[k].missing} para
                revisar
              </span>
              {item.filters.includes(k) && !coverage[k].covered && (
                <small className="pm-error">
                  Pendente: sem valores normalizados nesta seleção.
                </small>
              )}
              <div className="pm-actions">
                <button
                  className="pm-button"
                  disabled={item.filters.indexOf(k) <= 0}
                  onClick={() => {
                    const fs = [...item.filters],
                      i = fs.indexOf(k);
                    [fs[i - 1], fs[i]] = [fs[i], fs[i - 1]];
                    patch({ filters: fs });
                  }}
                >
                  Subir filtro
                </button>
              </div>
            </div>
          ))}
        </section>
      </div>
      <section className="pm-card pm-preview">
        <h2>Prévia de navegação</h2>
        <nav className="pm-category-preview" aria-label="Categorias do rascunho">
          {data.items
            .filter((i) => i.visible)
            .map((i) => (
              <button
                className="pm-button"
                key={i.id}
                onClick={() => {
                  setId(i.id);
                  setFilter("");
                }}
              >
                {i.label}
              </button>
            ))}
        </nav>
        <div className="pm-grid">
          <label className="pm-field">
            Filtro disponível
            <select
              value={activeFacet ?? ""}
              disabled={!activeFacet}
              onChange={(e) => {
                setFacet(e.target.value as FilterKey);
                setFilter("");
              }}
            >
              {item.filters
                .filter((k) => coverage[k].covered > 0)
                .map((k) => (
                  <option key={k} value={k}>
                    {FILTER_LABELS[k]}
                  </option>
                ))}
            </select>
          </label>
          <label className="pm-field">
            Valor
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">Todos</option>
              {activeFacet &&
                coverage[activeFacet].values.map(([v, n]) => (
                  <option key={v} value={v}>
                    {v} ({n})
                  </option>
                ))}
            </select>
          </label>
        </div>
        <p>
          {matching.length} móveis na seleção · {item.label}
        </p>
        <div className="pm-mini-products">
          {matching.slice(0, 8).map((p) => (
            <article key={p.id}>
              <ImageWithFallback src={p.url_imagem} alt={p.nome} />
              <strong>{p.nome}</strong>
              <span>{formatBRL(Number(p.preco_atual))}</span>
            </article>
          ))}
        </div>
        {!matching.length && (
          <p className="pm-note">
            Nenhum móvel corresponde a esta categoria na fonte consultada. O catálogo geral não foi
            alterado.
          </p>
        )}
      </section>
    </>
  );
}

export function StructuredPage({ page }: { page: ContentPage }) {
  return (
    <article className="pm-content-preview">
      <small>PRÉVIA · /ajuda/{page.slug}</small>
      <h2>{page.title}</h2>
      <p style={{ whiteSpace: "pre-line" }}>{page.body}</p>
      {page.faqs.map((f, i) => (
        <details key={i}>
          <summary>{f.question}</summary>
          <p>{f.answer}</p>
        </details>
      ))}
      <div className="pm-actions">
        {page.links
          .filter((l) => safeMobiLink(l.href))
          .map((l, i) => (
            <a className="pm-button" href={l.href} target="_blank" rel="noreferrer" key={i}>
              {l.label}
            </a>
          ))}
      </div>
    </article>
  );
}
export function ContentPanel({
  data,
  onChange,
  products,
}: {
  data: ContentData;
  onChange: (d: ContentData) => void;
  products: EditorProduct[];
}) {
  const [id, setId] = useState(data.pages[0]?.id);
  const [mode, setMode] = useState<"help" | "editorial">("help");
  const [mobilePane, setMobilePane] = useState<"editor" | "preview">("editor");
  const [articleId, setArticleId] = useState<string | null>(null);
  const page = data.pages.find((p) => p.id === id) ?? data.pages[0];
  const articles = data.articles ?? [];
  const relatedProductCandidates = products.filter(isCurationProduct);
  const article = articles.find((candidate) => candidate.id === articleId) ?? articles[0];
  const articleParagraphCount = article?.body.split(/\n\s*\n/).filter(Boolean).length ?? 0;
  const articleImages = article?.images ?? [];
  const editorPreviewTabs = (
    <nav className="pm-content-preview-tabs" aria-label="Alternar entre edição e prévia">
      <button
        type="button"
        className="pm-button"
        aria-pressed={mobilePane === "editor"}
        onClick={() => setMobilePane("editor")}
      >
        Editar
      </button>
      <button
        type="button"
        className="pm-button"
        aria-pressed={mobilePane === "preview"}
        onClick={() => setMobilePane("preview")}
      >
        Prévia
      </button>
    </nav>
  );
  const patch = (next: Partial<ContentPage>) =>
    onChange({ ...data, pages: data.pages.map((p) => (p.id === page.id ? { ...p, ...next } : p)) });
  const add = () => {
    const next: ContentPage = {
      id: crypto.randomUUID(),
      title: "Nova página",
      slug: `pagina-${data.pages.length + 1}`,
      body: "",
      status: "draft",
      reviewedAt: "",
      faqs: [],
      links: [],
    };
    onChange({ ...data, pages: [...data.pages, next] });
    setId(next.id);
  };
  const patchArticle = (next: Partial<ContentArticle>) => {
    if (!article) return;
    onChange({
      ...data,
      articles: articles.map((candidate) =>
        candidate.id === article.id ? { ...candidate, ...next } : candidate,
      ),
    });
  };
  const patchArticleImage = (index: number, next: Partial<ContentArticleImage>) => {
    if (!article) return;
    patchArticle({
      images: articleImages.map((image, imageIndex) =>
        imageIndex === index ? { ...image, ...next } : image,
      ),
    });
  };
  const addArticle = () => {
    const next: ContentArticle = {
      id: crypto.randomUUID(),
      title: "Novo artigo",
      slug: `artigo-${articles.length + 1}`,
      category: "",
      excerpt: "",
      imageUrl: "",
      imageAlt: "",
      images: [],
      body: "",
      status: "draft",
      reviewedAt: "",
      featured: false,
      relatedProductIds: [],
    };
    onChange({ ...data, articles: [...articles, next] });
    setArticleId(next.id);
  };
  if (mode === "editorial")
    return (
      <>
        <header className="pm-heading">
          <div>
            <h1>Conteúdo editorial</h1>
            <p>Rascunhos originais da Mobi, com destaque, imagem e produtos relacionados.</p>
          </div>
          <button className="pm-button" disabled={articles.length >= 100} onClick={addArticle}>
            <Plus size={16} /> Novo artigo
          </button>
        </header>
        <nav className="pm-tabs" aria-label="Tipo de conteúdo">
          <button className="pm-button" aria-pressed={false} onClick={() => setMode("help")}>
            Ajuda e FAQ
          </button>
          <button className="pm-button" aria-pressed={true}>
            Editorial
          </button>
        </nav>
        <ContentWorkflow />
        <p className="pm-note">
          Antes de marcar para revisão, confira os dados comerciais e selecione capas e produtos
          reais. O rascunho não é publicado.
        </p>
        <section className="pm-card pm-content-picker">
          <h2>
            Artigos da Mobi <span className="pm-count">{articles.length}</span>
          </h2>
          {articles.length ? (
            <ul className="pm-list pm-content-picker-list">
              {articles.map((candidate) => (
                <li key={candidate.id}>
                  <button
                    className="pm-item-button pm-content-choice"
                    onClick={() => setArticleId(candidate.id)}
                    aria-current={article?.id === candidate.id ? "true" : undefined}
                  >
                    <span>
                      <strong>{candidate.title}</strong>
                      <small>
                        /inspiracao/{candidate.slug} ·{" "}
                        {candidate.status === "review" ? "Em revisão" : "Rascunho"}
                      </small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="pm-muted">Nenhum conteúdo editorial cadastrado.</p>
          )}
        </section>
        {editorPreviewTabs}
        <div
          className="pm-content-layout pm-content-layout--editorial"
          data-mobile-pane={mobilePane}
        >
          <section className="pm-card pm-content-editor">
            {article ? (
              <>
                <label className="pm-field">
                  Título
                  <input
                    value={article.title}
                    maxLength={120}
                    onChange={(event) => patchArticle({ title: event.target.value })}
                  />
                </label>
                <div className="pm-grid">
                  <label className="pm-field">
                    Endereço do artigo
                    <input
                      value={article.slug}
                      maxLength={100}
                      onChange={(event) => patchArticle({ slug: event.target.value })}
                    />
                  </label>
                  <label className="pm-field">
                    Tema
                    <input
                      value={article.category}
                      maxLength={60}
                      onChange={(event) => patchArticle({ category: event.target.value })}
                    />
                  </label>
                </div>
                <label className="pm-field">
                  Resumo
                  <textarea
                    rows={2}
                    maxLength={360}
                    value={article.excerpt}
                    onChange={(event) => patchArticle({ excerpt: event.target.value })}
                  />
                </label>
                <div className="pm-grid">
                  <label className="pm-field">
                    Imagem de capa · URL HTTPS
                    <input
                      type="url"
                      value={article.imageUrl}
                      onChange={(event) => patchArticle({ imageUrl: event.target.value })}
                    />
                  </label>
                  <label className="pm-field">
                    Texto alternativo da imagem
                    <input
                      value={article.imageAlt}
                      maxLength={160}
                      onChange={(event) => patchArticle({ imageAlt: event.target.value })}
                    />
                  </label>
                </div>
                <label className="pm-field">
                  Texto do artigo · parágrafos separados por linha em branco
                  <textarea
                    rows={10}
                    maxLength={30000}
                    value={article.body}
                    onChange={(event) => {
                      const body = event.target.value;
                      const paragraphCount = body.split(/\n\s*\n/).filter(Boolean).length;
                      patchArticle({
                        body,
                        images: articleImages.map((image) => ({
                          ...image,
                          afterParagraph: Math.min(
                            image.afterParagraph,
                            Math.max(1, paragraphCount),
                          ),
                        })),
                      });
                    }}
                  />
                </label>
                <fieldset className="pm-field pm-content-media">
                  <legend>Imagens dentro do artigo · até 6</legend>
                  <p className="pm-muted">
                    Use uma URL HTTPS e descreva a imagem. A prévia local não hospeda nem envia
                    arquivos.
                  </p>
                  {articleImages.map((image, index) => (
                    <div className="pm-content-media-item" key={`${article.id}-image-${index}`}>
                      <label className="pm-field">
                        URL da imagem · HTTPS
                        <input
                          type="url"
                          maxLength={2000}
                          value={image.url}
                          onChange={(event) =>
                            patchArticleImage(index, { url: event.target.value })
                          }
                        />
                      </label>
                      <label className="pm-field">
                        Texto alternativo
                        <input
                          maxLength={160}
                          value={image.alt}
                          onChange={(event) =>
                            patchArticleImage(index, { alt: event.target.value })
                          }
                        />
                      </label>
                      <label className="pm-field">
                        Posição no texto
                        <select
                          value={image.afterParagraph}
                          disabled={!articleParagraphCount}
                          onChange={(event) =>
                            patchArticleImage(index, { afterParagraph: Number(event.target.value) })
                          }
                        >
                          {Array.from({ length: Math.max(1, articleParagraphCount) }, (_, i) => (
                            <option value={i + 1} key={i}>
                              Após o parágrafo {i + 1}
                            </option>
                          ))}
                        </select>
                        {!articleParagraphCount && (
                          <small>Escreva o texto antes de escolher onde inserir a imagem.</small>
                        )}
                      </label>
                      <button
                        type="button"
                        className="pm-button pm-danger"
                        onClick={() =>
                          patchArticle({
                            images: articleImages.filter((_, imageIndex) => imageIndex !== index),
                          })
                        }
                      >
                        <Trash2 size={15} aria-hidden="true" /> Remover imagem
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="pm-button"
                    disabled={articleImages.length >= 6 || !articleParagraphCount}
                    onClick={() =>
                      patchArticle({
                        images: [
                          ...articleImages,
                          { url: "", alt: "", afterParagraph: Math.max(articleParagraphCount, 1) },
                        ],
                      })
                    }
                  >
                    <Plus size={15} aria-hidden="true" /> Adicionar imagem no texto
                  </button>
                </fieldset>
                <div className="pm-grid">
                  <label className="pm-field">
                    Estado
                    <select
                      value={article.status}
                      onChange={(event) =>
                        patchArticle({ status: event.target.value as ContentArticle["status"] })
                      }
                    >
                      <option value="draft">Rascunho</option>
                      <option value="review">Em revisão</option>
                    </select>
                    <small>
                      Em revisão sinaliza que o artigo aguarda conferência; não publica.
                    </small>
                  </label>
                  <label className="pm-field">
                    Data da revisão
                    <input
                      type="date"
                      value={article.reviewedAt.slice(0, 10)}
                      onInput={(event) =>
                        patchArticle({
                          reviewedAt: event.currentTarget.value
                            ? `${event.currentTarget.value}T12:00:00-03:00`
                            : "",
                        })
                      }
                    />
                  </label>
                </div>
                <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={article.featured}
                    onChange={(event) =>
                      onChange({
                        ...data,
                        articles: articles.map((candidate) =>
                          candidate.id === article.id
                            ? { ...candidate, featured: event.target.checked }
                            : event.target.checked
                              ? { ...candidate, featured: false }
                              : candidate,
                        ),
                      })
                    }
                  />
                  Destacar na página de inspiração
                </label>
                <fieldset className="pm-field">
                  <legend>Produtos relacionados · até 6</legend>
                  <div className="max-h-48 divide-y overflow-y-auto border border-cacau/10">
                    {relatedProductCandidates.map((product) => {
                      const checked = article.relatedProductIds.includes(product.id);
                      return (
                        <label
                          key={product.id}
                          className="pm-check min-h-11 gap-2 border-b border-cacau/10 px-3 text-sm last:border-0"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!checked && article.relatedProductIds.length >= 6}
                            onChange={(event) =>
                              patchArticle({
                                relatedProductIds: event.target.checked
                                  ? [...article.relatedProductIds, product.id]
                                  : article.relatedProductIds.filter((id) => id !== product.id),
                              })
                            }
                          />
                          <span>{product.nome}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </>
            ) : (
              <p className="pm-muted">Crie um rascunho para editar e revisar o primeiro artigo.</p>
            )}
          </section>
          <section className="pm-card pm-content-live-preview">
            <h2>Como ficará o artigo</h2>
            {article ? (
              <>
                {article.imageUrl && (
                  <ImageWithFallback
                    src={article.imageUrl}
                    alt={article.imageAlt}
                    className="pm-product-photo"
                  />
                )}
                <span className="pm-badge">{article.category || "Tema"}</span>
                <h3 className="mt-2">{article.title}</h3>
                <p className="pm-muted">{article.excerpt}</p>
                <ArticleBody body={article.body} images={article.images} variant="admin" />
              </>
            ) : (
              <p className="pm-muted">Selecione ou crie um artigo para ver a prévia.</p>
            )}
          </section>
        </div>
      </>
    );
  return (
    <>
      <header className="pm-heading">
        <div>
          <h1>Conteúdo e ajuda</h1>
          <p>Páginas de compra, entrega, pagamento e contato, com respostas da operação Mobi.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="pm-button" aria-pressed={true}>
            Ajuda e FAQ
          </button>
          <button className="pm-button" aria-pressed={false} onClick={() => setMode("editorial")}>
            Editorial
          </button>
          <button className="pm-button" disabled={data.pages.length >= 40} onClick={add}>
            <Plus size={16} /> Nova página
          </button>
        </div>
      </header>
      <ContentWorkflow />
      <section className="pm-card pm-content-picker">
        <h2>
          Páginas de ajuda <span className="pm-count">{data.pages.length}</span>
        </h2>
        <ul className="pm-list pm-content-picker-list">
          {data.pages.map((p) => (
            <li key={p.id}>
              <button
                className="pm-item-button pm-content-choice"
                onClick={() => setId(p.id)}
                aria-current={page?.id === p.id ? "true" : undefined}
              >
                <strong>{p.title}</strong>
                <small>
                  /ajuda/{p.slug} · {p.status === "review" ? "Em revisão" : "Rascunho"}
                </small>
              </button>
            </li>
          ))}
        </ul>
      </section>
      {editorPreviewTabs}
      <div className="pm-content-layout pm-content-layout--help" data-mobile-pane={mobilePane}>
        <section className="pm-card pm-content-editor">
          {page && (
            <>
              <h2>Editar página</h2>
              <label className="pm-field">
                Título
                <input
                  value={page.title}
                  maxLength={100}
                  onChange={(e) => patch({ title: e.target.value })}
                />
              </label>
              <label className="pm-field">
                Slug
                <input value={page.slug} onChange={(e) => patch({ slug: e.target.value })} />
              </label>
              <label className="pm-field">
                Texto da página
                <textarea
                  rows={6}
                  maxLength={15000}
                  value={page.body}
                  onChange={(e) => patch({ body: e.target.value })}
                />
              </label>
              <div className="pm-grid">
                <label className="pm-field">
                  Estado
                  <select
                    value={page.status}
                    onChange={(e) => patch({ status: e.target.value as ContentPage["status"] })}
                  >
                    <option value="draft">Rascunho</option>
                    <option value="review">Em revisão</option>
                  </select>
                  <small>Em revisão sinaliza que a página aguarda conferência; não publica.</small>
                </label>
                <label className="pm-field">
                  Data de revisão comercial
                  <input
                    type="date"
                    value={page.reviewedAt.slice(0, 10)}
                    onInput={(e) =>
                      patch({
                        reviewedAt: e.currentTarget.value
                          ? `${e.currentTarget.value}T12:00:00-03:00`
                          : "",
                      })
                    }
                  />
                </label>
              </div>
              <h3>
                Perguntas frequentes <span className="pm-count">{page.faqs.length}</span>
              </h3>
              {page.faqs.map((f, i) => (
                <div className="pm-inset" key={i}>
                  <label className="pm-field">
                    Pergunta {i + 1}
                    <input
                      value={f.question}
                      maxLength={200}
                      onChange={(e) =>
                        patch({
                          faqs: page.faqs.map((q, j) =>
                            j === i ? { ...q, question: e.target.value } : q,
                          ),
                        })
                      }
                    />
                  </label>
                  <label className="pm-field">
                    Resposta
                    <textarea
                      value={f.answer}
                      maxLength={2000}
                      onChange={(e) =>
                        patch({
                          faqs: page.faqs.map((q, j) =>
                            j === i ? { ...q, answer: e.target.value } : q,
                          ),
                        })
                      }
                    />
                  </label>
                  <button
                    className="pm-button"
                    onClick={() => patch({ faqs: page.faqs.filter((_, j) => j !== i) })}
                  >
                    Remover pergunta {i + 1}
                  </button>
                </div>
              ))}
              <button
                className="pm-button"
                disabled={page.faqs.length >= 30}
                onClick={() =>
                  patch({
                    faqs: [
                      ...page.faqs,
                      { question: "Nova pergunta", answer: "Resposta a revisar com a Mobi." },
                    ],
                  })
                }
              >
                Adicionar pergunta
              </button>
              <h3>
                Links úteis <span className="pm-count">{page.links.length}</span>
              </h3>
              {page.links.map((l, i) => (
                <div className="pm-grid" key={i}>
                  <label className="pm-field">
                    Rótulo
                    <input
                      value={l.label}
                      onChange={(e) =>
                        patch({
                          links: page.links.map((x, j) =>
                            j === i ? { ...x, label: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </label>
                  <label className="pm-field">
                    Destino
                    <input
                      value={l.href}
                      onChange={(e) =>
                        patch({
                          links: page.links.map((x, j) =>
                            j === i ? { ...x, href: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </label>
                  <button
                    className="pm-button"
                    onClick={() => patch({ links: page.links.filter((_, j) => j !== i) })}
                  >
                    Remover link
                  </button>
                </div>
              ))}
              <button
                className="pm-button"
                disabled={page.links.length >= 20}
                onClick={() =>
                  patch({
                    links: [...page.links, { label: "Ver catálogo", href: "/?all=true#catalogo" }],
                  })
                }
              >
                Adicionar link
              </button>
            </>
          )}
        </section>
        <section className="pm-card pm-content-live-preview">
          <h2>Como ficará a página</h2>
          {page ? (
            <StructuredPage page={page} />
          ) : (
            <p className="pm-muted">Selecione uma página para ver a prévia.</p>
          )}
        </section>
      </div>
    </>
  );
}

function ContentWorkflow() {
  const [previewHint, setPreviewHint] = useState("");
  return (
    <div className="pm-content-flow" aria-label="Como editar e revisar conteúdo">
      <span>Editar página ou artigo</span>
      <span aria-hidden="true">›</span>
      <span>Salvar rascunho no topo</span>
      <span aria-hidden="true">›</span>
      <span>Conferir na prévia local</span>
      <button
        type="button"
        className="pm-button pm-content-preview-link"
        onClick={() => {
          const panel = document.getElementById("pm-local-home-preview");
          if (!(panel instanceof HTMLDetailsElement)) {
            setPreviewHint("A prévia local não está disponível nesta sessão.");
            return;
          }
          setPreviewHint("");
          panel.open = true;
          panel.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      >
        Abrir prévia
      </button>
      {previewHint && (
        <span className="pm-content-workflow-hint" role="status">
          {previewHint}
        </span>
      )}
    </div>
  );
}

export function ServicePanel({
  data,
  onChange,
  products,
}: {
  data: ServiceData;
  onChange: (d: ServiceData) => void;
  products: EditorProduct[];
}) {
  const [id, setId] = useState(products[0]?.id ?? ""),
    [quantity, setQuantity] = useState(1),
    [variant, setVariant] = useState(""),
    [confirmed, setConfirmed] = useState(false);
  const activeId = products.some((product) => product.id === id) ? id : (products[0]?.id ?? "");
  const p = products.find((product) => product.id === activeId);
  let href = "";
  try {
    if (p)
      href = serviceLink(data, { name: p.nome, variant, quantity, price: Number(p.preco_atual) });
  } catch {
    /* invalid input is shown by the central validator */
  }
  return (
    <>
      <header className="pm-heading">
        <div>
          <h1>Entrega e atendimento</h1>
          <p>Orientação para o cliente e encaminhamento ao WhatsApp da loja.</p>
        </div>
        <span className="pm-badge">Consulta no atendimento</span>
      </header>
      <div className="pm-grid">
        <section className="pm-card">
          <h2>Mensagens operacionais</h2>
          <label className="pm-field">
            WhatsApp público
            <input readOnly value={data.number} />
            <small>
              Fonte: número já usado na loja. A troca depende de conferência operacional.
            </small>
          </label>
          {(
            [
              ["regionMessage", "Região atendida"],
              ["deliveryMessage", "Frete e prazo"],
              ["assemblyMessage", "Montagem"],
              ["template", "Modelo da mensagem"],
            ] as const
          ).map(([key, label]) => (
            <label className="pm-field" key={key}>
              {label}
              <textarea
                rows={key === "template" ? 5 : 2}
                maxLength={2000}
                value={data[key]}
                onChange={(e) => {
                  setConfirmed(false);
                  onChange({ ...data, [key]: e.target.value });
                }}
              />
            </label>
          ))}
          <p className="pm-muted">Variáveis: {"{produto} · {variante} · {quantidade} · {valor}"}</p>
          <p className="pm-note">
            Tabela de CEP, custo e prazo não integrada. Ausência de valor nunca significa entrega
            gratuita ou prazo confirmado.
          </p>
        </section>
        <section className="pm-card pm-preview">
          <h2>Mensagem pronta para WhatsApp</h2>
          <details className="pm-service-copy">
            <summary>Orientações mostradas ao cliente</summary>
            <p>{data.regionMessage}</p>
            <p>{data.deliveryMessage}</p>
            <p>{data.assemblyMessage}</p>
          </details>
          <label className="pm-field">
            Produto
            <select
              value={activeId}
              onChange={(e) => {
                setId(e.target.value);
                setConfirmed(false);
              }}
            >
              {!products.length && (
                <option value="" disabled>
                  Nenhum produto disponível no catálogo
                </option>
              )}
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </label>
          <div className="pm-grid">
            <label className="pm-field">
              Variante
              <input
                value={variant}
                placeholder="Cor / modelo a confirmar"
                onChange={(e) => {
                  setVariant(e.target.value);
                  setConfirmed(false);
                }}
              />
            </label>
            <label className="pm-field">
              Quantidade
              <input
                type="number"
                min={1}
                max={99}
                value={quantity}
                onChange={(e) => {
                  setQuantity(Number(e.target.value));
                  setConfirmed(false);
                }}
              />
            </label>
          </div>
          {href ? (
            <pre className="pm-message">{decodeURIComponent(href.split("?text=")[1])}</pre>
          ) : (
            <p className="pm-muted">Selecione um produto válido para montar a mensagem.</p>
          )}
          <label className="pm-check">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />{" "}
            Conferi produto, variante, quantidade e valor desta consulta.
          </label>
          {confirmed && href ? (
            <a className="pm-button pm-primary" href={href} target="_blank" rel="noreferrer">
              Abrir consulta no WhatsApp
            </a>
          ) : (
            <button className="pm-button" disabled>
              Aguardando conferência
            </button>
          )}
          <p className="pm-muted">
            Abrir a conversa não envia a mensagem, confirma venda ou aprova pagamento.
          </p>
        </section>
      </div>
    </>
  );
}

export function ProductDraftPanel({
  data,
  onChange,
  products,
  query = "",
  initialFilter = "all",
}: {
  data: ProductDraftData;
  onChange: (d: ProductDraftData) => void;
  products: EditorProduct[];
  query?: string;
  initialFilter?: "all" | ProductStatus;
}) {
  const [search, setSearch] = useState(query),
    [bundleSearch, setBundleSearch] = useState(""),
    [statusFilter, setStatusFilter] = useState(initialFilter),
    [id, setId] = useState<string | null>(null),
    [section, setSection] = useState("identificacao");
  useEffect(() => setSearch(query), [query]);
  useEffect(() => setStatusFilter(initialFilter), [initialFilter]);
  const base = products.find((p) => p.id === id),
    p = base ? (data.changes[base.id]?.product ?? base) : null;
  const patch = (next: Partial<EditorProduct>) => {
    if (base && p)
      onChange({
        changes: {
          ...data.changes,
          [base.id]: {
            basePrice: data.changes[base.id]?.basePrice ?? Number(base.preco_atual),
            product: { ...p, ...next },
          },
        },
      });
  };
  const rows = products.filter(
    (p) =>
      (statusFilter === "all" || productStatus(p) === statusFilter) &&
      [p.nome, p.sku, p.categoria, p.fornecedor]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const quote = p && Number(p.preco_atual) > 0 ? cardQuote(Number(p.preco_atual), 10) : null;
  return (
    <>
      <header className="pm-heading">
        <div>
          <h1>Produtos</h1>
          <p>Cadastro demonstrativo sobre o contrato atual. Alterações ficam em rascunho local.</p>
        </div>
        <span className="pm-badge">{products.length} móveis na amostra</span>
      </header>
      <div className="pm-split">
        <section className="pm-card">
          <label className="pm-field">
            Buscar móvel ou referência
            <input value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <label className="pm-field">
            Filtrar por status
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            >
              <option value="all">Todos os cadastros</option>
              <option value="published">Prontos para exibição</option>
              <option value="awaiting">Aguardando preço</option>
              <option value="incomplete">Incompletos</option>
            </select>
          </label>
          <ul className="pm-list pm-product-list">
            {rows.slice(0, 40).map((x) => (
              <li key={x.id}>
                <button
                  className="pm-item-button"
                  onClick={() => setId(x.id)}
                  aria-pressed={id === x.id}
                >
                  <ImageWithFallback src={x.url_imagem} alt={x.nome} />
                  <span>
                    <strong>{x.nome}</strong>
                    <small>
                      {x.sku} ·{" "}
                      {formatBRL(Number(data.changes[x.id]?.product.preco_atual ?? x.preco_atual))}
                    </small>
                    {data.changes[x.id] && <small>Rascunho alterado</small>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="pm-card">
          {p ? (
            <>
              <h2>{p.nome}</h2>
              <div className="pm-tabs">
                {[
                  "identificacao",
                  "fotos",
                  "variantes",
                  "medidas",
                  "atributos",
                  "compre",
                  "comercial",
                  "visibilidade",
                ].map((k) => (
                  <button
                    className="pm-button"
                    aria-pressed={section === k}
                    onClick={() => setSection(k)}
                    key={k}
                  >
                    {
                      (
                        {
                          identificacao: "Identificação",
                          fotos: "Fotos",
                          variantes: "Variantes",
                          medidas: "Medidas",
                          atributos: "Atributos",
                          compre: "Compre junto",
                          comercial: "Comercial",
                          visibilidade: "Visibilidade",
                        } as Record<string, string>
                      )[k]
                    }
                  </button>
                ))}
              </div>
              {section === "identificacao" && (
                <>
                  {(["nome", "sku", "categoria", "fornecedor"] as const).map((k) => (
                    <label className="pm-field" key={k}>
                      {
                        {
                          nome: "Nome",
                          sku: "Referência",
                          categoria: "Categoria",
                          fornecedor: "Fornecedor interno",
                        }[k]
                      }
                      <input
                        value={String(p[k] ?? "")}
                        onChange={(e) => patch({ [k]: e.target.value })}
                      />
                    </label>
                  ))}
                  <label className="pm-field">
                    Descrição
                    <textarea
                      value={p.descricao ?? ""}
                      onChange={(e) => patch({ descricao: e.target.value })}
                    />
                  </label>
                </>
              )}
              {section === "fotos" && (
                <>
                  <ImageWithFallback src={p.url_imagem} alt={p.nome} className="pm-product-photo" />
                  <label className="pm-field">
                    Imagem principal HTTPS
                    <input
                      value={p.url_imagem ?? ""}
                      onChange={(e) => patch({ url_imagem: e.target.value })}
                    />
                  </label>
                  <label className="pm-field">
                    Galeria · uma URL por linha
                    <textarea
                      value={(p.imagens ?? []).join("\n")}
                      onChange={(e) =>
                        patch({ imagens: e.target.value.split("\n").filter(Boolean) })
                      }
                    />
                  </label>
                </>
              )}
              {section === "variantes" && (
                <>
                  <label className="pm-field">
                    Cores · uma por linha
                    <textarea
                      value={(p.cores ?? []).join("\n")}
                      onChange={(e) => patch({ cores: e.target.value.split("\n").filter(Boolean) })}
                    />
                  </label>
                  <p className="pm-note">
                    As variações comerciais existentes são preservadas. Edição por variante e
                    importação permanecem no editor administrativo atual.
                  </p>
                </>
              )}
              {section === "medidas" && (
                <div className="space-y-3">
                  <p className="pm-note">
                    Informe apenas os valores confirmados pelo fornecedor. Campos estruturados
                    alimentam os filtros; medida ausente continua sem valor.
                  </p>
                  <div className="pm-grid">
                    {(
                      [
                        ["width_cm", "Largura (cm)"],
                        ["height_cm", "Altura (cm)"],
                        ["depth_closed_cm", "Profundidade fechada (cm)"],
                        ["depth_open_cm", "Profundidade aberta (cm)"],
                      ] as const
                    ).map(([key, label]) => (
                      <label className="pm-field" key={key}>
                        {label}
                        <input
                          type="number"
                          min="0.1"
                          max="10000"
                          step="0.1"
                          inputMode="decimal"
                          value={p[key] ?? ""}
                          onChange={(event) => {
                            const value = event.target.value ? Number(event.target.value) : null;
                            if (key === "width_cm") patch({ width_cm: value });
                            else if (key === "height_cm") patch({ height_cm: value });
                            else if (key === "depth_closed_cm") patch({ depth_closed_cm: value });
                            else patch({ depth_open_cm: value });
                          }}
                        />
                      </label>
                    ))}
                  </div>
                  <label className="pm-field">
                    Medidas legadas do cadastro
                    <textarea
                      placeholder="Largura: 200 cm; Altura: 90 cm"
                      value={p.medidas ?? ""}
                      onChange={(e) => patch({ medidas: e.target.value })}
                    />
                    <small className="pm-muted">
                      Mantido para compatibilidade. Os campos estruturados acima têm precedência.
                    </small>
                  </label>
                </div>
              )}
              {section === "atributos" && (
                <div className="space-y-3">
                  <p className="pm-note">
                    Atributos são informados no cadastro, nunca deduzidos da descrição. São
                    rascunhos locais até a integração do esquema de catálogo.
                  </p>
                  <label className="pm-field">
                    Materiais / tecidos · um por linha
                    <textarea
                      rows={3}
                      value={(p.materiais ?? []).join("\n")}
                      onChange={(event) =>
                        patch({
                          materiais: event.target.value
                            .split(/\r?\n/)
                            .map((value) => value.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="Linho\nMadeira maciça"
                    />
                  </label>
                  <label className="pm-field">
                    Características · uma por linha
                    <textarea
                      rows={3}
                      value={(p.caracteristicas ?? []).join("\n")}
                      onChange={(event) =>
                        patch({
                          caracteristicas: event.target.value
                            .split(/\r?\n/)
                            .map((value) => value.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="Retrátil\nReclinável"
                    />
                  </label>
                </div>
              )}
              {section === "compre" &&
                (() => {
                  const selectedIds = p.compre_junto_ids ?? [];
                  const eligibleCandidates = products
                    .map((candidate) => data.changes[candidate.id]?.product ?? candidate)
                    .filter(
                      (candidate) => candidate.id !== p.id && isEligibleBundleProduct(candidate),
                    );
                  const candidates = eligibleCandidates.filter((candidate) =>
                    `${candidate.nome} ${candidate.categoria ?? ""}`
                      .toLowerCase()
                      .includes(bundleSearch.toLowerCase()),
                  );
                  const invalidIds = selectedIds.filter(
                    (relatedId) =>
                      !eligibleCandidates.some((candidate) => candidate.id === relatedId),
                  );
                  return (
                    <div>
                      <p className="pm-note">
                        Escolha manualmente até 3 móveis que combinem com este produto. A associação
                        salva no rascunho local aparece na prévia da amostra de produto pelo mesmo
                        componente da loja; isso não altera dados publicados.
                      </p>
                      <label className="pm-field">
                        Buscar complemento
                        <input
                          value={bundleSearch}
                          onChange={(event) => setBundleSearch(event.target.value)}
                          placeholder="Nome ou categoria"
                        />
                      </label>
                      {invalidIds.map((relatedId) => (
                        <div
                          key={relatedId}
                          className="flex items-center justify-between gap-3 border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-cacau"
                        >
                          <span>
                            {products.find((item) => item.id === relatedId)?.nome ?? relatedId}:
                            complemento indisponível para exibição.
                          </span>
                          <button
                            type="button"
                            className="min-h-11 font-semibold underline"
                            onClick={() =>
                              patch({
                                compre_junto_ids: selectedIds.filter((item) => item !== relatedId),
                              })
                            }
                          >
                            Remover vínculo
                          </button>
                        </div>
                      ))}
                      <div className="max-h-[420px] divide-y divide-cacau/10 overflow-y-auto border border-cacau/10 bg-white">
                        {candidates.slice(0, 40).map((candidate) => {
                          const checked = selectedIds.includes(candidate.id);
                          return (
                            <label
                              key={candidate.id}
                              className="flex min-h-14 items-center gap-3 px-3 py-2 text-sm text-cacau"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={!checked && selectedIds.length >= 3}
                                onChange={(event) =>
                                  patch({
                                    compre_junto_ids: event.target.checked
                                      ? [...selectedIds, candidate.id]
                                      : selectedIds.filter(
                                          (relatedId) => relatedId !== candidate.id,
                                        ),
                                  })
                                }
                                className="h-4 w-4 shrink-0 accent-[#304a32]"
                              />
                              <ImageWithFallback
                                src={candidate.url_imagem}
                                alt=""
                                className="h-10 w-10 shrink-0 object-contain"
                              />
                              <span className="min-w-0 flex-1">
                                <strong className="block truncate">{candidate.nome}</strong>
                                <small className="text-text-light">
                                  {candidate.categoria} · {formatBRL(Number(candidate.preco_atual))}
                                </small>
                              </span>
                            </label>
                          );
                        })}
                        {candidates.length === 0 && (
                          <p className="p-3 text-xs text-text-light">
                            Nenhum complemento elegível corresponde à busca.
                          </p>
                        )}
                      </div>
                      <p className="pm-muted mt-2">
                        {selectedIds.length}/3 selecionados. Custo, preço, foto HTTPS e
                        disponibilidade informada seguem os critérios do catálogo público.
                      </p>
                    </div>
                  );
                })()}
              {section === "comercial" && (
                <>
                  <div className="pm-grid">
                    <label className="pm-field">
                      Preço à vista (R$)
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={p.preco_atual ?? 0}
                        onChange={(e) => patch({ preco_atual: Number(e.target.value) })}
                      />
                    </label>
                    <label className="pm-field">
                      Custo interno (R$)
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={p.preco_atacado ?? 0}
                        onChange={(e) => patch({ preco_atacado: Number(e.target.value) })}
                      />
                    </label>
                  </div>
                  {quote && (
                    <p className="pm-note">
                      Prévia: 10x de {formatBRL(quote.approximateInstallment)} · total{" "}
                      {formatBRL(quote.total)}. Regra comercial vigente, sem alteração de taxa.
                    </p>
                  )}
                </>
              )}
              {section === "visibilidade" && (
                <p className="pm-note">
                  A elegibilidade continua baseada em preço, custo, endereço de imagem e
                  disponibilidade informada. Não há quantidade física de estoque integrada. Este
                  rascunho não publica o cadastro.
                </p>
              )}
              <button
                className="pm-button"
                disabled={!data.changes[p.id]}
                onClick={() => {
                  const changes = { ...data.changes };
                  delete changes[p.id];
                  onChange({ changes });
                }}
              >
                <Trash2 size={15} /> Restaurar cadastro consultado
              </button>
            </>
          ) : (
            <p>Escolha um móvel para conferir o cadastro.</p>
          )}
        </section>
      </div>
    </>
  );
}
