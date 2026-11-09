import { useState, useEffect } from "react";
import { productStatus, type ProductStatus } from "../../lib/admin-filters";
import { ArrowUp, ArrowDown, Plus, Trash2 } from "lucide-react";
import { categoryMatches, formatBRL } from "../../lib/constants";
import {
  getCatalogMaterials,
  getCatalogColors,
  getCatalogFeatures,
  getCatalogDimensionLabel,
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
  type ContentPage,
  type ServiceData,
  type ProductDraftData,
  type FilterKey,
} from "../../lib/operational-config";
import type { EditorProduct } from "../../lib/homepage-curation";
import { ImageWithFallback } from "../ImageWithFallback";
import { cardQuote } from "../../lib/payment";

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
    dimensions: (p: (typeof normalized)[number]) =>
      getCatalogDimensionLabel(p) ? [getCatalogDimensionLabel(p)] : [],
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
}: {
  data: ContentData;
  onChange: (d: ContentData) => void;
}) {
  const [id, setId] = useState(data.pages[0]?.id);
  const page = data.pages.find((p) => p.id === id) ?? data.pages[0];
  const patch = (next: Partial<ContentPage>) =>
    onChange({ pages: data.pages.map((p) => (p.id === page.id ? { ...p, ...next } : p)) });
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
    onChange({ pages: [...data.pages, next] });
    setId(next.id);
  };
  return (
    <>
      <header className="pm-heading">
        <div>
          <h1>Conteúdo e ajuda</h1>
          <p>Informações próprias da Mobi, com texto estruturado e perguntas por tema.</p>
        </div>
        <button className="pm-button" disabled={data.pages.length >= 40} onClick={add}>
          <Plus size={16} /> Nova página
        </button>
      </header>
      <p className="pm-note">
        As páginas aparecem nesta prévia. As rotas públicas de ajuda serão integradas após revisão;
        artigos da referência continuam em Evolução.
      </p>
      <div className="pm-split">
        <section className="pm-card">
          <h2>Páginas</h2>
          <ul className="pm-list">
            {data.pages.map((p) => (
              <li key={p.id}>
                <button
                  className="pm-item-button"
                  onClick={() => setId(p.id)}
                  aria-pressed={page?.id === p.id}
                >
                  <strong>{p.title}</strong>
                  <small>
                    /ajuda/{p.slug} · {p.status === "review" ? "Revisão solicitada" : "Rascunho"}
                  </small>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="pm-card">
          {page && (
            <>
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
              <h3>Perguntas frequentes</h3>
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
              <h3>Links</h3>
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
      </div>
      {page && (
        <section className="pm-card pm-preview">
          <StructuredPage page={page} />
        </section>
      )}
    </>
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
  const p = products.find((p) => p.id === id);
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
          <h2>Prévia do atendimento</h2>
          <p>{data.regionMessage}</p>
          <p>{data.deliveryMessage}</p>
          <p>{data.assemblyMessage}</p>
          <label className="pm-field">
            Produto
            <select
              value={id}
              onChange={(e) => {
                setId(e.target.value);
                setConfirmed(false);
              }}
            >
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
          {href && <pre className="pm-message">{decodeURIComponent(href.split("?text=")[1])}</pre>}
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
                <label className="pm-field">
                  Medidas em centímetros
                  <textarea
                    placeholder="Largura 200 cm · Altura 90 cm · Profundidade 100 cm"
                    value={p.medidas ?? ""}
                    onChange={(e) => patch({ medidas: e.target.value })}
                  />
                </label>
              )}
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
