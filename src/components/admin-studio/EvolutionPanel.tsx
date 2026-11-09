import { useEffect, useId, useRef, useState } from "react";
import {
  EVOLUTION_ACTIVATIONS,
  EVOLUTION_CAPABILITIES,
  EVOLUTION_EVIDENCE,
  EVOLUTION_IMPORT_MAX_BYTES,
  EVOLUTION_MODES,
  EVOLUTION_OBSERVATIONS,
  EVOLUTION_STATUSES,
  buildEvolutionRequest,
  exportEvolutionMarkdown,
  importEvolutionJson,
  searchEvolution,
  updateEvolutionTracking,
  updateEvolutionTrackingDraft,
  validateEvolutionData,
  type EvolutionData,
  type EvolutionFeature,
  type EvolutionFilters,
  type EvolutionTracking,
} from "../../lib/evolution.ts";

export interface EvolutionPanelProps {
  data: EvolutionData;
  onChange: (next: EvolutionData) => void;
  onNavigate?: (area: string) => void;
}
const controlStyle = { minHeight: 44, width: "100%", minWidth: 0 };
const columns = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
  gap: 12,
};

function TrackingForm({
  data,
  feature,
  onChange,
}: {
  data: EvolutionData;
  feature: EvolutionFeature;
  onChange: (data: EvolutionData) => void;
}) {
  const value = data.tracking[feature.id];
  const draft = data.trackingDrafts?.[feature.id] ?? value;
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const prefix = useId();
  const change = <K extends keyof EvolutionTracking>(key: K, next: EvolutionTracking[K]) => {
    const result = updateEvolutionTrackingDraft(data, feature.id, { [key]: next });
    setErrors(result.errors);
    if (!result.errors.length) onChange(result.data);
    setSaved(false);
  };
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    const result = updateEvolutionTracking(data, feature.id, draft);
    setErrors(result.errors);
    if (!result.errors.length) {
      onChange(result.data);
      setSaved(true);
    }
  };
  return (
    <form onSubmit={save} className="pm-card">
      <h4>Acompanhamento Mobi</h4>
      <p className="pm-muted">
        Registro manual de verificação. A evidência da referência não comprova implementação na
        Mobi.
      </p>
      <div style={columns}>
        <label className="pm-field">
          Situação observada
          <select
            style={controlStyle}
            value={draft.observation}
            onChange={(event) =>
              change("observation", event.target.value as EvolutionTracking["observation"])
            }
          >
            {Object.entries(EVOLUTION_OBSERVATIONS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="pm-field">
          Implementação
          <select
            style={controlStyle}
            value={draft.implementation}
            onChange={(event) =>
              change("implementation", event.target.value as EvolutionTracking["implementation"])
            }
          >
            {Object.entries(EVOLUTION_STATUSES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="pm-field">
          Ativação observada
          <select
            style={controlStyle}
            value={draft.activation}
            onChange={(event) =>
              change("activation", event.target.value as EvolutionTracking["activation"])
            }
          >
            {Object.entries(EVOLUTION_ACTIVATIONS)
              .filter(
                ([key]) =>
                  EVOLUTION_CAPABILITIES[feature.id] || !["ativo", "inativo"].includes(key),
              )
              .map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
          </select>
        </label>
        <label className="pm-field">
          Responsável
          <input
            style={controlStyle}
            maxLength={200}
            value={draft.owner}
            onChange={(event) => change("owner", event.target.value)}
          />
        </label>
        <label className="pm-field">
          Destino Mobi conhecido
          <input
            style={controlStyle}
            maxLength={2000}
            placeholder="Página ou área inspecionada"
            value={draft.mobiTarget}
            onChange={(event) => change("mobiTarget", event.target.value)}
          />
        </label>
        {(
          [
            ["branch", "Link da branch"],
            ["pr", "Link do PR"],
            ["preview", "Link da prévia"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="pm-field">
            {label}
            <input
              style={controlStyle}
              type="url"
              maxLength={2000}
              placeholder="https://…"
              value={draft[key]}
              onChange={(event) => change(key, event.target.value)}
            />
          </label>
        ))}
      </div>
      <label className="pm-field" htmlFor={`${prefix}-evidence`}>
        Evidência Mobi (links, arquivos ou relato verificável)
      </label>
      <textarea
        id={`${prefix}-evidence`}
        style={controlStyle}
        rows={2}
        maxLength={20000}
        value={draft.evidence}
        onChange={(event) => change("evidence", event.target.value)}
      />
      <div className="pm-actions">
        <label style={{ minHeight: 44, display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={draft.desktopChecked}
            onChange={(event) => change("desktopChecked", event.target.checked)}
          />
          Desktop conferido
        </label>
        <label style={{ minHeight: 44, display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={draft.mobileChecked}
            onChange={(event) => change("mobileChecked", event.target.checked)}
          />
          Celular conferido
        </label>
      </div>
      <label className="pm-field">
        Resultado, limitações e reversão
        <textarea
          style={controlStyle}
          rows={2}
          maxLength={20000}
          value={draft.notes}
          onChange={(event) => change("notes", event.target.value)}
        />
      </label>
      <p className="pm-note">
        Validado exige evidência e as duas conferências. Registrar ativação não liga ou desliga
        componentes. Os campos em edição permanecem no rascunho ao navegar; o estado registrado só
        muda em Registrar acompanhamento.
      </p>
      {data.trackingDrafts?.[feature.id] && (
        <p className="pm-muted" role="status">
          Edição preservada no rascunho; acompanhamento ainda não registrado.
        </p>
      )}
      {errors.length > 0 && (
        <div className="pm-error" role="alert">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}
      <button type="submit" className="pm-button pm-primary">
        Registrar acompanhamento
      </button>
      {saved && (
        <span className="pm-muted" role="status">
          {" "}
          Acompanhamento enviado ao rascunho local.
        </span>
      )}
    </form>
  );
}

function FeatureDetails({
  data,
  feature,
  onChange,
  onNavigate,
}: EvolutionPanelProps & { feature: EvolutionFeature }) {
  const capability = EVOLUTION_CAPABILITIES[feature.id];
  const sources = data.manifest.pages.filter((page) => feature.sources.includes(page.id));
  return (
    <article className="pm-card" style={{ minWidth: 0, overflowWrap: "anywhere" }}>
      <h3>{feature.title}</h3>
      <p className="pm-muted">
        {feature.id} · {feature.group} · prioridade {feature.priority.replaceAll("_", " ")}
      </p>
      <p className="pm-note">
        {EVOLUTION_EVIDENCE[feature.evidence as keyof typeof EVOLUTION_EVIDENCE]}
      </p>
      <dl className="pm-list">
        {(
          [
            ["desktop", "Desktop"],
            ["mobile", "Celular"],
            ["behavior", "Interação"],
            ["data", "Dados"],
            ["acceptance", "Aceite"],
            ["rollback", "Reversão"],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <dt>
              <strong>{label}</strong>
            </dt>
            <dd style={{ margin: "4px 0 12px" }}>{feature[key]}</dd>
          </div>
        ))}
        <dt>
          <strong>Dependências</strong>
        </dt>
        <dd style={{ margin: "4px 0 12px" }}>
          {feature.dependencies.join(", ") || "Nenhuma declarada; inspecionar os contratos atuais."}
        </dd>
      </dl>
      <details>
        <summary style={{ minHeight: 44, cursor: "pointer" }}>
          Fontes e páginas da referência ({sources.length})
        </summary>
        {sources.length ? (
          sources.map((page) => (
            <div key={page.id} className="pm-card">
              <strong>
                {page.id} · {page.title}
              </strong>
              <p>{page.sequence}</p>
              <p>Desktop: {page.desktop}</p>
              <p>Celular: {page.mobile}</p>
              <p className="pm-muted">Limites: {page.limits}</p>
              <p className="pm-muted">Origem: {page.source}</p>
            </div>
          ))
        ) : (
          <p className="pm-muted">Proposta Mobi sem página observada associada.</p>
        )}
      </details>
      {capability ? (
        <div className="pm-note">
          <strong>Capacidade mapeada: {capability.label}</strong>
          <p>{capability.limitation}</p>
          <details>
            <summary style={{ minHeight: 44, cursor: "pointer" }}>Arquivos reais</summary>
            <p>{capability.files}</p>
          </details>
          {onNavigate && (
            <button type="button" className="pm-button" onClick={() => onNavigate(capability.area)}>
              Abrir {capability.label.toLowerCase()}
            </button>
          )}
        </div>
      ) : (
        <p className="pm-muted">
          Sem configuração operacional mapeada. Selecione para investigar ou solicitar
          desenvolvimento.
        </p>
      )}
      <TrackingForm key={feature.id} data={data} feature={feature} onChange={onChange} />
    </article>
  );
}

export function EvolutionPanel({ data, onChange, onNavigate }: EvolutionPanelProps) {
  const [tab, setTab] = useState("catalog");
  const [filters, setFilters] = useState<EvolutionFilters>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [format, setFormat] = useState<"markdown" | "json">("markdown");
  const [notice, setNotice] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [importText, setImportText] = useState("");
  const [excludedText, setExcludedText] = useState(data.request.excludedIds.join(", "));
  const exclusionsPending = excludedText !== data.request.excludedIds.join(", ");
  const inputRef = useRef<HTMLInputElement>(null);
  const latestData = useRef(data);
  const latestOnChange = useRef(onChange);
  const importAttempt = useRef(0);
  latestData.current = data;
  latestOnChange.current = onChange;
  useEffect(
    () => () => {
      importAttempt.current += 1;
    },
    [],
  );
  useEffect(() => setExcludedText(data.request.excludedIds.join(", ")), [data.request.excludedIds]);
  const results = searchEvolution(data, filters);
  const active = data.manifest.features.find((feature) => feature.id === activeId);
  const field = (key: keyof EvolutionFilters, value: string) =>
    setFilters((previous) => ({ ...previous, [key]: value }));
  function publish(next: EvolutionData) {
    latestData.current = next;
    latestOnChange.current(next);
  }
  function apply(next: EvolutionData) {
    const invalid = validateEvolutionData(next);
    setErrors(invalid);
    setNotice("");
    if (!invalid.length) publish(next);
  }
  function toggle(id: string) {
    apply({
      ...data,
      selectedIds: data.selectedIds.includes(id)
        ? data.selectedIds.filter((value) => value !== id)
        : [...data.selectedIds, id],
    });
  }
  function requestChange(changes: Partial<EvolutionData["request"]>) {
    apply({ ...data, request: { ...data.request, ...changes } });
  }
  let exported = "",
    exportError = "";
  try {
    exported =
      format === "markdown"
        ? exportEvolutionMarkdown(data)
        : JSON.stringify(buildEvolutionRequest(data), null, 2);
  } catch (error) {
    exportError = error instanceof Error ? error.message : "Pedido inválido.";
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(exported);
      setNotice("Pedido copiado. Leve ao projeto de código para revisão.");
      setErrors([]);
    } catch {
      setErrors(["Não foi possível copiar. Selecione o texto do pedido ou use Baixar."]);
    }
  }
  function download(content: string, name: string, type: string) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Arquivo preparado para download.");
  }
  function acceptImport(text: string, expected?: EvolutionData) {
    importAttempt.current += 1;
    const result = importEvolutionJson(text, latestData.current, expected);
    setErrors(result.errors);
    setNotice("");
    if (!result.errors.length) {
      publish(result.data);
      setNotice("Importação validada e enviada ao rascunho. Nenhuma alteração na loja.");
      setImportText("");
    }
  }
  return (
    <section className="pm-panel" aria-label="Evolução do site">
      <div className="pm-heading">
        <div>
          <h1>Evolução do site</h1>
          <p className="pm-muted">
            Escolha melhorias, registre evidências e prepare pedidos para o projeto de código.
          </p>
        </div>
        <span className="pm-badge">
          {data.manifest.features.length} requisitos · {data.manifest.pages.length} fichas · v
          {data.manifest.spec_version}
        </span>
      </div>
      <div className="pm-tabs pm-actions" aria-label="Áreas de evolução">
        {[
          ["catalog", "Explorar requisitos"],
          ["request", `Pedido (${data.selectedIds.length})`],
          ["import", "Manifesto e cópia local"],
        ].map(([key, label]) => (
          <button
            type="button"
            className={`pm-button ${tab === key ? "pm-primary" : ""}`}
            key={key}
            aria-pressed={tab === key}
            onClick={() => {
              setTab(key);
              setErrors([]);
              setNotice("");
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {notice && (
        <p className="pm-note" role="status">
          {notice}
        </p>
      )}
      {errors.length > 0 && (
        <div className="pm-error" role="alert">
          {errors.slice(0, 12).map((error) => (
            <p key={error}>{error}</p>
          ))}
          {errors.length > 12 && (
            <p>Mais {errors.length - 12} inconsistências. Nenhum dado anterior foi substituído.</p>
          )}
        </div>
      )}
      {tab === "catalog" && (
        <>
          <div>
            <label className="pm-field">
              Buscar requisito
              <input
                type="search"
                className="pm-search"
                style={controlStyle}
                value={filters.query ?? ""}
                placeholder="Nome, código, página ou grupo"
                onChange={(event) => field("query", event.target.value)}
              />
            </label>
            <details className="pm-evolution-filters">
              <summary>
                Filtros de prioridade, evidência e situação{" "}
                <span className="pm-badge">
                  {
                    Object.entries(filters).filter(([key, value]) => key !== "query" && value)
                      .length
                  }{" "}
                  ativos
                </span>
              </summary>
              <div style={columns}>
                <label className="pm-field">
                  Prioridade
                  <select
                    style={controlStyle}
                    value={filters.priority ?? ""}
                    onChange={(event) => field("priority", event.target.value)}
                  >
                    <option value="">Todas</option>
                    <option value="alta">Alta</option>
                    <option value="media">Média</option>
                    <option value="conforme_negocio">Conforme negócio</option>
                  </select>
                </label>
                <label className="pm-field">
                  Evidência da referência
                  <select
                    style={controlStyle}
                    value={filters.evidence ?? ""}
                    onChange={(event) => field("evidence", event.target.value)}
                  >
                    <option value="">Todas</option>
                    {Object.entries(EVOLUTION_EVIDENCE).map(([key, label]) => (
                      <option key={key} value={key}>
                        {key} — {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="pm-field">
                  Situação observada
                  <select
                    style={controlStyle}
                    value={filters.observation ?? ""}
                    onChange={(event) => field("observation", event.target.value)}
                  >
                    <option value="">Todas as situações</option>
                    {Object.entries(EVOLUTION_OBSERVATIONS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="pm-field">
                  Implementação Mobi
                  <select
                    style={controlStyle}
                    value={filters.implementation ?? ""}
                    onChange={(event) => field("implementation", event.target.value)}
                  >
                    <option value="">Todos os estados</option>
                    {Object.entries(EVOLUTION_STATUSES).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="pm-field">
                  Capacidade mapeada
                  <select
                    style={controlStyle}
                    value={filters.capability ?? ""}
                    onChange={(event) => field("capability", event.target.value)}
                  >
                    <option value="">Todas</option>
                    <option value="disponivel">Com editor existente (parcial)</option>
                    <option value="a_desenvolver">Sem configuração mapeada</option>
                  </select>
                </label>
              </div>
            </details>
          </div>
          <p className="pm-muted">
            {results.length} encontrados · {data.selectedIds.length} selecionados. A seleção não
            altera o site.
          </p>
          <div className="pm-requirement-layout">
            <div
              className="pm-list"
              style={{ maxHeight: 580, overflowY: "auto", minWidth: 0 }}
              aria-label="Requisitos encontrados"
            >
              {results.length ? (
                results.map((feature) => (
                  <div
                    key={feature.id}
                    className="pm-card"
                    style={{ display: "flex", alignItems: "start", gap: 10, marginBottom: 8 }}
                  >
                    <label
                      style={{
                        display: "flex",
                        minWidth: 44,
                        minHeight: 44,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Selecionar ${feature.title}`}
                        checked={data.selectedIds.includes(feature.id)}
                        onChange={() => toggle(feature.id)}
                      />
                    </label>
                    <button
                      type="button"
                      className="pm-button"
                      style={{
                        textAlign: "left",
                        flex: 1,
                        whiteSpace: "normal",
                        overflowWrap: "anywhere",
                        minHeight: 44,
                      }}
                      aria-expanded={activeId === feature.id}
                      onClick={() => setActiveId(activeId === feature.id ? null : feature.id)}
                    >
                      <strong>{feature.title}</strong>
                      <span style={{ display: "block" }} className="pm-muted">
                        {EVOLUTION_STATUSES[data.tracking[feature.id].implementation]} ·{" "}
                        {EVOLUTION_OBSERVATIONS[data.tracking[feature.id].observation]}
                      </span>
                    </button>
                  </div>
                ))
              ) : (
                <p className="pm-note">
                  Nenhum requisito corresponde aos filtros. Tente outro nome, código ou página.
                </p>
              )}
            </div>
            {active ? (
              <FeatureDetails
                data={data}
                feature={active}
                onChange={publish}
                onNavigate={onNavigate}
              />
            ) : (
              <div className="pm-note">
                <strong>Abra um requisito para conferir o escopo.</strong>
                <p>
                  As fichas mostram desktop, celular, dados, dependências, aceite e reversão. Não é
                  necessário selecionar a ficha para consultá-la.
                </p>
              </div>
            )}
          </div>
        </>
      )}
      {tab === "request" && (
        <div className="pm-card">
          <h3>Preparar pedido de desenvolvimento</h3>
          <label className="pm-field">
            Necessidade da loja
            <textarea
              style={controlStyle}
              rows={2}
              maxLength={20000}
              value={data.request.need}
              onChange={(event) => requestChange({ need: event.target.value })}
              placeholder="O que precisa melhorar para a Mobi? Você também pode começar sem IDs."
            />
          </label>
          <label className="pm-field">
            Adaptação Mobi
            <textarea
              style={controlStyle}
              rows={2}
              maxLength={20000}
              value={data.request.adaptation}
              onChange={(event) => requestChange({ adaptation: event.target.value })}
              placeholder="Ativos oficiais, dados existentes e regras comerciais a preservar"
            />
          </label>
          <div style={columns}>
            <label className="pm-field">
              Modo
              <select
                style={controlStyle}
                value={data.request.mode}
                onChange={(event) =>
                  requestChange({ mode: event.target.value as EvolutionData["request"]["mode"] })
                }
              >
                {EVOLUTION_MODES.map((mode) => (
                  <option key={mode}>{mode}</option>
                ))}
              </select>
            </label>
            <label className="pm-field">
              Branch de desenvolvimento
              <input
                style={controlStyle}
                maxLength={2000}
                value={data.request.branch}
                onChange={(event) => requestChange({ branch: event.target.value })}
              />
            </label>
          </div>
          <p className="pm-muted">
            {
              {
                VISUAL: "Composição e hierarquia; preservar fluxos reais.",
                FUNCIONAL: "Comportamentos e estados; preservar identidade Mobi.",
                COMPLETO: "Composição e comportamento adaptados à Mobi.",
                INVESTIGAR: "Resolver lacunas sem transformar hipóteses em fatos.",
              }[data.request.mode]
            }
          </p>
          <details open={data.selectedIds.length > 0}>
            <summary style={{ minHeight: 44, cursor: "pointer" }}>
              Revisar seleção ({data.selectedIds.length})
            </summary>
            {data.selectedIds.map((id) => (
              <label
                key={id}
                style={{ display: "flex", minHeight: 44, gap: 8, alignItems: "center" }}
              >
                <input type="checkbox" checked onChange={() => toggle(id)} />
                {id} · {data.manifest.features.find((feature) => feature.id === id)?.title}
                {data.request.excludedIds.includes(id) ? " — excluído do pedido" : ""}
              </label>
            ))}
          </details>
          <label className="pm-field">
            Excluir IDs (separe por vírgula ou espaço)
            <input
              style={controlStyle}
              maxLength={20000}
              value={excludedText}
              onChange={(event) => setExcludedText(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="pm-button"
            onClick={() =>
              requestChange({
                excludedIds: [
                  ...new Set(
                    excludedText
                      .trim()
                      .split(/[\s,;]+/)
                      .filter(Boolean),
                  ),
                ],
              })
            }
          >
            Validar exclusões
          </button>
          <p className="pm-note">
            Exclusões prevalecem sobre a seleção. Dependências constam no pedido e não ampliam o
            escopo automaticamente.
          </p>
          <label className="pm-field">
            Formato do pedido
            <select
              style={controlStyle}
              value={format}
              onChange={(event) => setFormat(event.target.value as "markdown" | "json")}
            >
              <option value="markdown">Markdown</option>
              <option value="json">JSON</option>
            </select>
          </label>
          {exclusionsPending ? (
            <p className="pm-note">
              Valide as exclusões editadas para atualizar e exportar o pedido.
            </p>
          ) : exportError ? (
            <p className="pm-note">{exportError}</p>
          ) : (
            <>
              <label className="pm-field">
                Prévia do pedido
                <textarea
                  style={{ ...controlStyle, fontFamily: "monospace" }}
                  readOnly
                  rows={12}
                  value={exported}
                />
              </label>
              <div className="pm-actions">
                <button type="button" className="pm-button pm-primary" onClick={copy}>
                  Copiar pedido
                </button>
                <button
                  type="button"
                  className="pm-button"
                  onClick={() =>
                    download(
                      exported,
                      `mobi-pedido-v${data.manifest.spec_version}.${format === "markdown" ? "md" : "json"}`,
                      format === "markdown" ? "text/markdown;charset=utf-8" : "application/json",
                    )
                  }
                >
                  Baixar pedido
                </button>
              </div>
            </>
          )}
          <p className="pm-muted">
            ADAPTAR_MOBI · local/branch isolada · publicação exige aprovação explícita de Rafael
            para a versão apresentada.
          </p>
        </div>
      )}
      {tab === "import" && (
        <div className="pm-card">
          <h3>Manifesto versionado e cópia do acompanhamento</h3>
          <p>
            Importe o manifesto completo v1.1 (141 requisitos/38 fichas) ou uma cópia local deste
            acompanhamento. Pedidos de desenvolvimento exportados têm outro formato.
          </p>
          <p className="pm-note">
            Manifesto importa somente a referência e preserva seleção/acompanhamento. Cópia local
            restaura os registros explícitos após validar todo o conteúdo. Erros preservam os dados
            anteriores.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            aria-label="Arquivo JSON para importação"
            style={{ ...controlStyle, marginBottom: 12 }}
            onChange={async (event) => {
              const attempt = ++importAttempt.current;
              const file = event.target.files?.[0];
              if (!file) return;
              if (file.size > EVOLUTION_IMPORT_MAX_BYTES) {
                setErrors(["Arquivo excede o limite de 2 MB."]);
                event.target.value = "";
                return;
              }
              const expected = structuredClone(latestData.current);
              try {
                const content = await file.text();
                if (attempt !== importAttempt.current) return;
                acceptImport(content, expected);
              } catch {
                if (attempt !== importAttempt.current) return;
                setErrors([
                  "Não foi possível ler o arquivo. Os dados anteriores foram preservados.",
                ]);
              }
              if (inputRef.current) inputRef.current.value = "";
            }}
          />
          <label className="pm-field">
            Ou cole o JSON (limite de 2 MB)
            <textarea
              style={{ ...controlStyle, fontFamily: "monospace" }}
              rows={7}
              maxLength={EVOLUTION_IMPORT_MAX_BYTES}
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
            />
          </label>
          <div className="pm-actions">
            <button
              type="button"
              className="pm-button pm-primary"
              disabled={!importText.trim()}
              onClick={() => acceptImport(importText)}
            >
              Validar e importar JSON
            </button>
            <button
              type="button"
              className="pm-button"
              onClick={() =>
                download(
                  JSON.stringify(data, null, 2),
                  "mobi-evolucao-acompanhamento-v1.json",
                  "application/json",
                )
              }
            >
              Baixar cópia local completa
            </button>
            <button
              type="button"
              className="pm-button"
              onClick={() =>
                download(
                  JSON.stringify(data.manifest, null, 2),
                  `mobi-manifesto-v${data.manifest.spec_version}.json`,
                  "application/json",
                )
              }
            >
              Baixar manifesto de referência
            </button>
          </div>
          <p className="pm-muted">
            Origem: engenharia reversa v{data.manifest.spec_version}, {data.manifest.date}.
            Evidências V/T/P/B pertencem à referência, não são status Mobi. Os registros deste
            painel são rascunhos locais.
          </p>
        </div>
      )}
    </section>
  );
}
