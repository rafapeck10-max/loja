import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Check,
  ChevronRight,
  Eye,
  GripVertical,
  Image,
  Layers3,
  LockKeyhole,
  Monitor,
  Plus,
  RotateCcw,
  Save,
  Search,
  Smartphone,
  X,
} from "lucide-react";
import {
  initialPageDraft,
  movePageSection,
  validatePageDraft,
  chooseWeeklyProduct,
  restorePageDraft,
  sectionProducts,
  toStorefrontProducts,
  PAGE_SECTIONS,
  type PageDraft,
  type PageSectionId,
} from "../lib/pages-shelves";
import {
  activeBlackFridayProductIds,
  projectBlackFridayCampaigns,
} from "../lib/home-configuration";
import { type CampaignData } from "../lib/campaigns";
import { isCurationProduct, type EditorProduct } from "../lib/homepage-curation";
import { HomepageSectionOrder } from "./HomepageSectionOrder";
import { HomeProductSection } from "./HomeProductSection";
import { BlackFridayHomeSection } from "./BlackFridayHomeSection";
import { MobiliLogo } from "./MobiliLogo";
import { ImageWithFallback } from "./ImageWithFallback";
import { formatBRL } from "../lib/constants";
import "../pages-shelves.css";

const DRAFT_KEY = "mobi:pages-and-shelves:home:v1";
const labels = { automatico: "Automático", incluir: "Incluir", ocultar: "Ocultar" } as const;
export function PagesAndShelvesPanel({
  products,
  campaigns,
  ready = true,
  demonstration = false,
  managed,
  weeklyPublication,
}: {
  products: EditorProduct[];
  campaigns?: CampaignData;
  ready?: boolean;
  demonstration?: boolean;
  managed?: {
    value: PageDraft;
    saved?: PageDraft;
    onChange: (draft: PageDraft) => void;
    onSave: (draft: PageDraft) => void | Promise<void>;
  };
  weeklyPublication?: {
    available: boolean;
    canApply: boolean;
    weeklyIds: string[];
    sourceRevision: number | null;
    applying: boolean;
    message: string;
    onApply: () => void;
  };
}) {
  const storageKey = DRAFT_KEY + (demonstration ? ":demo" : ":admin");
  const baseline = useMemo(() => initialPageDraft(products), [products]);
  const [draft, setDraft] = useState<PageDraft | null>(null);
  const [sectionId, setSectionId] = useState<PageSectionId>("weekly");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(12);
  const [picker, setPicker] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [stored, setStored] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [now] = useState(() => new Date());
  const current = managed?.value ?? draft ?? baseline;
  const dirty =
    JSON.stringify(current) !==
    (managed ? JSON.stringify(managed.saved ?? baseline) : (lastSaved ?? JSON.stringify(baseline)));
  const changedFromSource = JSON.stringify(current) !== JSON.stringify(baseline);
  const conflict = current.baseVersion !== baseline.baseVersion;
  const section = current.sections.find((s) => s.id === sectionId)!;
  const definition = PAGE_SECTIONS.find((s) => s.id === sectionId)!;
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const publicProducts = useMemo(
    () => toStorefrontProducts(products, current.curation),
    [products, current.curation],
  );
  const previewProducts = sectionProducts(sectionId, publicProducts, now);
  let blackFridayCampaigns = [] as ReturnType<typeof projectBlackFridayCampaigns>;
  let blackFridayError = "";
  try {
    blackFridayCampaigns = projectBlackFridayCampaigns(campaigns, products, now);
  } catch (error) {
    blackFridayError = error instanceof Error ? error.message : "Revise os vínculos no PM-05.";
  }
  const blackFridayProductIds = activeBlackFridayProductIds({ blackFridayCampaigns }, now);
  const blackFridayProducts = blackFridayProductIds.flatMap(
    (id) => publicProducts.find((product) => product.id === id) ?? [],
  );
  const sourceLabel = demonstration
    ? "Amostra de apresentação · fotos e preços históricos, não são ofertas atuais"
    : "Catálogo administrativo · dados consultados";
  const isManaged = !!managed;
  useEffect(() => {
    if (isManaged) return;
    try {
      setStored(localStorage.getItem(storageKey));
    } catch {
      setMessage(
        "O navegador não permite acessar rascunhos locais. Suas alterações podem ser revisadas nesta sessão.",
      );
    }
  }, [storageKey, isManaged]);
  useEffect(() => {
    const leave = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [dirty]);
  const update = (next: PageDraft) => {
    if (managed) managed.onChange(next);
    else setDraft(next);
    setMessage("");
  };
  const patchSection = (change: Partial<typeof section>) =>
    update({
      ...current,
      sections: current.sections.map((s) => (s.id === sectionId ? { ...s, ...change } : s)),
    });
  const saveLocal = async () => {
    const errors = validatePageDraft(current, products);
    if (conflict || errors.length) {
      setMessage(
        conflict
          ? "O catálogo mudou. Preserve o rascunho e revise a nova base antes de salvar."
          : errors.join(" "),
      );
      return;
    }
    try {
      const raw = JSON.stringify(current);
      if (managed) {
        await managed.onSave(current);
        setMessage("Rascunho salvo no histórico. Nada foi aplicado à loja.");
        return;
      }
      localStorage.setItem(storageKey, raw);
      setStored(raw);
      setLastSaved(raw);
      setMessage("Rascunho salvo neste navegador. A loja publicada continua igual.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar. O rascunho continua aberto para revisão.",
      );
    }
  };
  const restore = () => {
    try {
      const next = restorePageDraft(stored ?? "", products);
      setDraft(next);
      setLastSaved(JSON.stringify(next));
      setMessage("Rascunho local reaberto. Nada foi aplicado à loja.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível reabrir.");
    }
  };
  const reset = () => {
    if (managed) {
      managed.onChange(baseline);
      setMessage(
        "Edição restaurada para os dados consultados. Salve para registrar uma nova versão local.",
      );
      return;
    }
    setDraft(null);
    setLastSaved(stored);
    setMessage(
      "Edição restaurada para os dados consultados. O arquivo local salvo foi preservado.",
    );
  };
  const move = (id: PageSectionId, delta: number) => {
    const from = current.sections.findIndex((section) => section.id === id);
    const next = current.sections[from + delta];
    const distance = Math.abs(delta) === 1 && next?.id === "discovery" ? delta * 2 : delta;
    update(movePageSection(current, id, distance));
  };
  const updateSettings = (id: string, value: Record<string, string | boolean>) =>
    update({
      ...current,
      curation: {
        ...current.curation,
        settings: {
          ...current.curation.settings,
          [id]: { ...current.curation.settings[id], ...value },
        },
      },
    });
  const choose = (id: string) => {
    try {
      const existing = picker == null ? undefined : current.curation.weeklyIds[picker];
      const base = existing
        ? {
            ...current,
            curation: {
              ...current.curation,
              weeklyIds: current.curation.weeklyIds.filter((x) => x !== existing),
            },
          }
        : current;
      let next = chooseWeeklyProduct(base, products, id);
      if (picker != null) {
        const ids = next.curation.weeklyIds.filter((x) => x !== id);
        ids.splice(picker, 0, id);
        next = { ...next, curation: { ...next.curation, weeklyIds: ids } };
      }
      update(next);
      setPickerOpen(false);
      setSearch("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Revise o produto.");
    }
  };
  const remove = (id: string) =>
    update({
      ...current,
      curation: {
        ...current.curation,
        weeklyIds: current.curation.weeklyIds.filter((x) => x !== id),
      },
    });
  const moveProduct = (index: number, delta: number) => {
    const ids = [...current.curation.weeklyIds];
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    update({ ...current, curation: { ...current.curation, weeklyIds: ids } });
  };
  const matches = (p: EditorProduct) =>
    [p.nome, p.sku, p.categoria]
      .join(" ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .includes(
        search
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase(),
      );
  const candidates = products.filter(
    (p) => isCurationProduct(p) && !current.curation.weeklyIds.includes(p.id) && matches(p),
  );
  const filtered = products.filter(matches);
  const identity = (p: EditorProduct) => (
    <>
      <ImageWithFallback src={p.url_imagem} alt={p.nome} />
      <span>
        <strong>{p.nome}</strong>
        <small>
          {p.sku ?? "Sem referência"} · {p.categoria ?? "Sem categoria"}
        </small>
        <small>
          {Number(p.preco_atual) > 0 ? formatBRL(Number(p.preco_atual)) : "Sem preço válido"}
        </small>
      </span>
    </>
  );
  if (!ready)
    return (
      <section className="ps-empty" role="status">
        O catálogo ainda não foi confirmado. Atualize os dados para abrir as vitrines com segurança.
      </section>
    );
  return (
    <section className="ps-panel" aria-label="Editor de páginas e vitrines">
      <header className="ps-heading">
        <div>
          <h1>Páginas e vitrines</h1>
          <p>Organize a página inicial e escolha os móveis de cada seleção.</p>
        </div>
        <div className="ps-save-actions">
          {!managed && (
            <span className={dirty ? "ps-dirty" : "ps-clean"}>
              {dirty ? "Alterações na edição" : "Edição em dia"}
            </span>
          )}
          <button
            className="aw-action"
            onClick={reset}
            disabled={!dirty && !conflict && !changedFromSource}
          >
            <RotateCcw size={15} /> Restaurar edição
          </button>
          {!managed && (
            <button
              className="aw-action ps-primary"
              onClick={saveLocal}
              disabled={!dirty || conflict}
            >
              <Save size={15} /> Salvar rascunho
            </button>
          )}
        </div>
      </header>
      <div className="ps-pagebar">
        <span className="ps-page-current">
          <strong>Página inicial</strong>
          <small>/</small>
        </span>
        {!managed && <span className="ps-draft-tag">Rascunho local</span>}
        <a href="https://www.mobimb.com.br/" target="_blank" rel="noreferrer">
          Ver loja atual <ArrowUpRight size={14} />
        </a>
        <div className="ps-modes" aria-label="Modo do editor">
          <button aria-pressed={mode === "edit"} onClick={() => setMode("edit")}>
            Editor
          </button>
          <button aria-pressed={mode === "preview"} onClick={() => setMode("preview")}>
            <Eye size={14} /> Prévia
          </button>
        </div>
      </div>
      <p className="ps-source">
        {sourceLabel}.{" "}
        {demonstration
          ? "A seleção não altera a loja."
          : managed
            ? "Trocas ficam no rascunho até serem revisadas e aplicadas à loja."
            : "Alterações são salvas somente neste navegador; a loja publicada permanece igual."}
      </p>
      {stored && stored !== lastSaved && (
        <div className="ps-notice">
          <span>Há um rascunho local salvo para esta página.</span>
          <button onClick={restore}>Reabrir rascunho</button>
        </div>
      )}
      {(message || conflict) && (
        <div className="ps-notice" role="status">
          {message || "O catálogo mudou durante a edição. O rascunho foi preservado para revisão."}
        </div>
      )}
      <div className="ps-board" data-mode={mode}>
        <aside className="ps-section-list">
          <div className="ps-box-title">
            <h2>Seções da página</h2>
            <span>{current.sections.filter((section) => section.id !== "discovery").length}</span>
          </div>
          <p>Mova pelas setas ou arraste uma seção.</p>
          <ol>
            {current.sections.map((s, index) => {
              if (s.id === "discovery") return null;
              const pinned = PAGE_SECTIONS.find((d) => d.id === s.id)?.locked;
              return (
                <li
                  key={s.id}
                  draggable={!pinned}
                  onDragStart={(event) => event.dataTransfer.setData("text/plain", s.id)}
                  onDragOver={(event) => {
                    if (!pinned) event.preventDefault();
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const id = event.dataTransfer.getData("text/plain") as PageSectionId;
                    const from = current.sections.findIndex((x) => x.id === id);
                    if (from > 0 && from < current.sections.length - 1) move(id, index - from);
                  }}
                  className={sectionId === s.id ? "ps-selected" : ""}
                >
                  <button
                    className="ps-section-select"
                    aria-pressed={sectionId === s.id}
                    onClick={() => {
                      setSectionId(s.id);
                      setSearch("");
                      setLimit(12);
                    }}
                  >
                    {pinned ? <LockKeyhole size={14} /> : <GripVertical size={14} />}
                    <span>
                      <strong>{s.title}</strong>
                      <small>
                        {s.type} · {s.enabled ? "No rascunho" : "Oculta"}
                      </small>
                    </span>
                  </button>
                  <div className="ps-order">
                    <button
                      aria-label={`Subir ${s.title}`}
                      onClick={() => move(s.id, -1)}
                      disabled={pinned || index <= 1}
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      aria-label={`Descer ${s.title}`}
                      onClick={() => move(s.id, 1)}
                      disabled={pinned || index >= current.sections.length - 2}
                    >
                      <ArrowDown size={13} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="ps-list-foot">
            Topo e convite final preservados. Tipos novos exigem um componente da loja.
          </p>
        </aside>
        <div className="ps-properties">
          <div className="ps-box-title">
            <div>
              <span className="ps-kicker">PROPRIEDADES · {section.type}</span>
              <h2>{section.title}</h2>
            </div>
            <label className="ps-switch">
              <input
                type="checkbox"
                aria-label={`Exibir ${section.title}`}
                checked={section.enabled}
                disabled={definition.locked}
                onChange={(event) => patchSection({ enabled: event.target.checked })}
              />
              Exibir
            </label>
          </div>
          {section.type === "vitrine" ? (
            <>
              <label className="ps-field">
                Título
                <input
                  maxLength={100}
                  value={section.title}
                  onChange={(e) => patchSection({ title: e.target.value })}
                />
              </label>
              <label className="ps-field">
                Texto de apoio
                <textarea
                  maxLength={240}
                  rows={2}
                  value={section.subtitle}
                  onChange={(e) => patchSection({ subtitle: e.target.value })}
                />
              </label>
              {sectionId === "blackFriday" ? (
                <div className="ps-rule ps-black-friday-guide">
                  <Layers3 size={16} />
                  <p>
                    Produtos, condições e vigência são definidos em{" "}
                    <strong>Preços e campanhas</strong>. Esta seção apenas referencia campanhas
                    Black Friday; não cria uma segunda lista nem aplica preço promocional ao
                    catálogo.
                  </p>
                </div>
              ) : (
                <>
                  <div className="ps-rule">
                    <Layers3 size={16} />
                    <p>
                      {sectionId === "weekly"
                        ? "Escolha até 4 produtos e defina a ordem."
                        : sectionId === "new"
                          ? "Até 4 produtos dos últimos 30 dias, com inclusões e exclusões manuais."
                          : sectionId === "room"
                            ? "Até 4 produtos da categoria Sala, com exceções manuais."
                            : "Até 4 produtos elegíveis, alternados pela regra atual e sem repetir as outras seleções."}
                    </p>
                  </div>
                  {sectionId === "weekly" ? (
                    <>
                      <div className="ps-subheading">
                        <h3>Produtos escolhidos</h3>
                        <span>{current.curation.weeklyIds.length}/4</span>
                      </div>
                      <ol className="ps-products">
                        {current.curation.weeklyIds.map((id, index) => {
                          const p = byId.get(id);
                          return (
                            <li key={id}>
                              <span className="ps-position">{index + 1}</span>
                              <div className="ps-product-identity">
                                {p ? identity(p) : <strong>Produto {id} não encontrado</strong>}
                              </div>
                              {(!p || !isCurationProduct(p)) && (
                                <p className="ps-warning">
                                  Preço, imagem, custo ou disponibilidade precisam de revisão.
                                </p>
                              )}
                              <div className="ps-product-actions">
                                <button
                                  onClick={() => {
                                    setPicker(index);
                                    setSearch("");
                                    setPickerOpen(true);
                                  }}
                                >
                                  Trocar
                                </button>
                                <button
                                  aria-label={`Remover ${p?.nome ?? id}`}
                                  onClick={() => remove(id)}
                                >
                                  Remover
                                </button>
                                <span />
                                <button
                                  aria-label={`Subir produto ${index + 1}`}
                                  disabled={index === 0}
                                  onClick={() => moveProduct(index, -1)}
                                >
                                  <ArrowUp size={14} />
                                </button>
                                <button
                                  aria-label={`Descer produto ${index + 1}`}
                                  disabled={index === current.curation.weeklyIds.length - 1}
                                  onClick={() => moveProduct(index, 1)}
                                >
                                  <ArrowDown size={14} />
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                      <div className="ps-publication" aria-label="Estado das escolhas da semana">
                        <div>
                          <strong>
                            {demonstration
                              ? "Seleção demonstrativa"
                              : weeklyPublication?.available
                                ? "Na loja agora"
                                : "Seleção atual da loja"}
                          </strong>
                          {weeklyPublication?.weeklyIds.length ? (
                            <p>
                              {weeklyPublication.weeklyIds
                                .map((id) => byId.get(id)?.nome ?? "Produto fora do catálogo")
                                .join(" · ")}
                              {weeklyPublication.available &&
                                weeklyPublication.sourceRevision != null &&
                                ` · revisão ${weeklyPublication.sourceRevision}`}
                            </p>
                          ) : weeklyPublication?.available ? (
                            <p>Nenhum produto selecionado.</p>
                          ) : (
                            <p>As escolhas atuais vêm da curadoria do catálogo.</p>
                          )}
                          <small>{weeklyPublication?.message ?? "Revise antes de aplicar."}</small>
                        </div>
                        <button
                          type="button"
                          className="aw-action"
                          disabled={!weeklyPublication?.canApply || weeklyPublication.applying}
                          onClick={weeklyPublication?.onApply}
                        >
                          {weeklyPublication?.applying ? "Aplicando…" : "Aplicar escolhas na loja"}
                        </button>
                      </div>
                      <button
                        className="aw-action ps-add"
                        disabled={current.curation.weeklyIds.length >= 4}
                        onClick={() => {
                          setPicker(null);
                          setSearch("");
                          setPickerOpen(true);
                        }}
                      >
                        <Plus size={15} /> Escolher produto
                      </button>
                    </>
                  ) : (
                    <>
                      <label className="ps-field">
                        Buscar nas exceções
                        <div className="ps-search">
                          <Search size={15} />
                          <input
                            value={search}
                            onChange={(e) => {
                              setSearch(e.target.value);
                              setLimit(12);
                            }}
                            placeholder="Nome, referência ou categoria"
                          />
                        </div>
                      </label>
                      <div className="ps-exceptions">
                        {filtered.slice(0, limit).map((p) => (
                          <div key={p.id}>
                            <div className="ps-product-identity">{identity(p)}</div>
                            {sectionId === "discovery" ? (
                              <label>
                                <input
                                  type="checkbox"
                                  checked={current.curation.settings[p.id]?.descoberta ?? true}
                                  onChange={(e) =>
                                    updateSettings(p.id, { descoberta: e.target.checked })
                                  }
                                />
                                Participa
                              </label>
                            ) : (
                              <select
                                aria-label={`Regra para ${p.nome}`}
                                value={
                                  current.curation.settings[p.id]?.[
                                    sectionId === "new" ? "novidade" : "sala"
                                  ] ?? "automatico"
                                }
                                onChange={(e) =>
                                  updateSettings(p.id, {
                                    [sectionId === "new" ? "novidade" : "sala"]: e.target.value,
                                  })
                                }
                              >
                                {Object.entries(labels).map(([value, label]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        ))}
                      </div>
                      {filtered.length > limit && (
                        <button className="aw-action" onClick={() => setLimit(limit + 12)}>
                          Mostrar mais produtos
                        </button>
                      )}
                    </>
                  )}
                  <div className="ps-result-note">
                    <Check size={15} />
                    {previewProducts.length} produtos elegíveis nesta seleção do rascunho. Imagens e
                    estoque físico não são confirmados pela regra.
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="ps-fixed-note">
              <LockKeyhole size={20} />
              <h3>{definition.locked ? "Estrutura preservada" : "Bloco editorial existente"}</h3>
              <p>
                {sectionId === "intro"
                  ? "Banner, apresentação, condições da loja e atalhos de ambientes continuam no topo. A edição das artes pertence a Banners e mídias."
                  : sectionId === "catalog"
                    ? "O convite para o catálogo encerra a página, preservando o destino atual."
                    : "O bloco de inspiração mantém seu conteúdo atual e pode ser movido ou ocultado no rascunho."}
              </p>
              <p>Nenhum formulário sem integração foi acrescentado a este tipo.</p>
            </div>
          )}
          <details className="ps-reference">
            <summary>Disposição e referência</summary>
            <p>
              MM-HOME-06 / MM-CMS-02: vitrines por IDs, ordem explícita e sem duplicatas. A
              sequência atual é da Mobi, não uma ordem universal da concorrente.
            </p>
            <p>
              Hubs e campanhas de HOME/DEPT/LANDING permanecem referências; não criam novas páginas
              automaticamente.
            </p>
          </details>
        </div>
        <div className="ps-preview">
          <div className="ps-box-title">
            <h2>Prévia da composição</h2>
            <div className="ps-devices">
              <button
                aria-label="Prévia computador"
                aria-pressed={device === "desktop"}
                onClick={() => setDevice("desktop")}
              >
                <Monitor size={16} />
              </button>
              <button
                aria-label="Prévia celular"
                aria-pressed={device === "mobile"}
                onClick={() => setDevice("mobile")}
              >
                <Smartphone size={16} />
              </button>
            </div>
          </div>
          <p className="ps-preview-caption">
            {device === "mobile" ? "Composição com duas colunas" : "Composição com quatro colunas"}{" "}
            · links desativados nesta representação
          </p>
          <div className="ps-preview-window" data-device={device}>
            <div className="ps-store-top">
              <MobiliLogo className="ps-store-logo" />
              <span>Móveis que combinam com a sua vida.</span>
            </div>
            <div inert>
              <HomepageSectionOrder
                sections={current.sections}
                renderSection={(s) => (
                  <div
                    data-preview-section={s.id}
                    className={s.id === sectionId ? "ps-preview-selected" : ""}
                  >
                    {s.id === "blackFriday" ? (
                      <BlackFridayHomeSection
                        title={s.title}
                        subtitle={s.subtitle}
                        products={blackFridayProducts}
                        demonstration
                      />
                    ) : s.type === "vitrine" ? (
                      <HomeProductSection
                        title={s.title}
                        subtitle={s.subtitle}
                        products={sectionProducts(s.id, publicProducts, now)}
                        badges={Object.fromEntries(
                          current.curation.weeklyIds.map((id) => [id, "week" as const]),
                        )}
                      />
                    ) : (
                      <div className="ps-layout-block">
                        <span>{s.id === "intro" ? "TOPO FIXO" : s.type.toUpperCase()}</span>
                        <h3>{s.title}</h3>
                        <p>{s.subtitle}</p>
                        {s.id === "intro" && (
                          <div className="ps-preview-categories">Sala · Cozinha · Quarto</div>
                        )}
                      </div>
                    )}
                    {s.type === "vitrine" &&
                      (s.id === "blackFriday"
                        ? blackFridayProducts.length === 0
                        : sectionProducts(s.id, publicProducts, now).length === 0) && (
                        <div className="ps-layout-block">
                          <h3>{s.title}</h3>
                          <p>
                            {s.id === "blackFriday"
                              ? blackFridayError ||
                                "Associe uma campanha revisada no PM-05, com produtos válidos e período vigente, para ver esta seção."
                              : "Sem produtos elegíveis. A loja omite vitrines vazias."}
                          </p>
                        </div>
                      )}
                  </div>
                )}
              />
            </div>
            <div className="ps-store-bottom">Mobi · atendimento e entrega pelo WhatsApp</div>
          </div>
          <p className="ps-preview-caption">
            Vitrines usam os cartões e as regras da loja. Blocos fixos estão resumidos; esta
            composição não substitui a homologação da página pública.
          </p>
        </div>
      </div>
      <Dialog.Root open={pickerOpen} onOpenChange={setPickerOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="aw-overlay" />
          <Dialog.Content className="ps-picker">
            <Dialog.Title>Escolher produto da semana</Dialog.Title>
            <Dialog.Description>
              Somente produtos com preço, imagem e custo válidos e sem indisponibilidade indicada.
            </Dialog.Description>
            <Dialog.Close className="ps-picker-close aw-icon-button" aria-label="Fechar seleção">
              <X size={19} />
            </Dialog.Close>
            <label className="ps-field">
              Buscar produto
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome, referência ou categoria"
              />
            </label>
            <div className="ps-picker-results">
              {candidates.slice(0, 24).map((p) => (
                <button key={p.id} onClick={() => choose(p.id)} className="ps-product-identity">
                  {identity(p)}
                  <Plus size={16} />
                </button>
              ))}
              {!candidates.length && (
                <p>Nenhum produto elegível encontrado. Revise o termo ou a seleção atual.</p>
              )}
            </div>
            <p>
              {candidates.length} elegíveis encontrados; exibindo até 24. Refine a busca para
              localizar outro móvel.
            </p>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
