import { useEffect, useRef, useState } from "react";
import type { EditorProduct } from "../../lib/homepage-curation";
import { formatBRL } from "../../lib/constants";
import {
  CAMPAIGN_BANNERS,
  CAMPAIGN_SECTIONS,
  campaignConflicts,
  campaignState,
  compareCampaignPrice,
  createCampaign,
  endCampaign,
  parsePriceCents,
  previewCampaignProducts,
  selectCampaignProduct,
  validateCampaignData,
  type Campaign,
  type CampaignData,
  type CampaignParticipant,
} from "../../lib/campaigns";

function brasiliaNow() {
  return new Date(Date.now() - 3 * 3600000).toISOString().slice(0, 16);
}
function localDate(value: string) {
  return value ? `${value}:00-03:00` : "";
}
function PriceInput({
  value,
  onChange,
  label,
  optional = false,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  label: string;
  optional?: boolean;
}) {
  const [text, setText] = useState(value ? (value / 100).toFixed(2).replace(".", ",") : "");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (document.activeElement !== input.current)
      setText(value ? (value / 100).toFixed(2).replace(".", ",") : "");
  }, [value]);
  return (
    <label className="pm-field">
      {label}
      <input
        ref={input}
        inputMode="decimal"
        value={text}
        placeholder={optional ? "Sem referência" : "Ex.: 999,90"}
        aria-invalid={!!text && parsePriceCents(text) === null}
        onChange={(e) => {
          const raw = e.target.value;
          setText(raw);
          onChange(optional && !raw.trim() ? null : (parsePriceCents(raw) ?? 0));
        }}
      />
    </label>
  );
}

export function CampaignsPanel({
  data,
  onChange,
  products,
}: {
  data: CampaignData;
  onChange: (data: CampaignData) => void;
  products: EditorProduct[];
}) {
  const [selectedId, setSelectedId] = useState(data.campaigns[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [onlySelected, setOnlySelected] = useState(false);
  const [limit, setLimit] = useState(12);
  const [mode, setMode] = useState<"edit" | "review">("edit");
  const [at, setAt] = useState(brasiliaNow);
  const [message, setMessage] = useState("");
  const campaign = data.campaigns.find((c) => c.id === selectedId) ?? data.campaigns[0];
  const errors = validateCampaignData(data, products);
  const conflicts = campaign ? campaignConflicts(campaign, products) : [];
  function update(next: Campaign) {
    onChange({ ...data, campaigns: data.campaigns.map((c) => (c.id === next.id ? next : c)) });
    setMessage("");
  }
  function patch(partial: Partial<Campaign>) {
    if (!campaign) return;
    // Editing invalidates review and any local simulation until reviewed again.
    update({ ...campaign, ...partial, status: "draft", simulation: "off" });
  }
  function participantChange(id: string, partial: Partial<CampaignParticipant>) {
    if (campaign)
      patch({
        participants: campaign.participants.map((p) =>
          p.productId === id ? { ...p, ...partial } : p,
        ),
      });
  }
  function create() {
    const next = createCampaign(`campaign-${globalThis.crypto.randomUUID()}`);
    onChange({ ...data, campaigns: [...data.campaigns, next] });
    setSelectedId(next.id);
    setMode("edit");
    setMessage("");
  }
  function review() {
    if (!campaign) return;
    if (errors.length || conflicts.length) {
      setMessage("Resolva as pendências e conflitos antes de revisar.");
      return;
    }
    update({ ...campaign, status: "review", simulation: "off" });
    setMode("review");
  }
  function enable() {
    if (!campaign) return;
    const next = { ...campaign, status: "review" as const, simulation: "enabled" as const };
    const nextData = {
      ...data,
      campaigns: data.campaigns.map((c) => (c.id === next.id ? next : c)),
    };
    const nextErrors = validateCampaignData(nextData, products);
    if (nextErrors.length || conflicts.length) {
      setMessage(nextErrors[0] ?? "Revise os conflitos de preço-base antes de simular.");
      return;
    }
    update(next);
    setMessage("Simulação local habilitada. Nenhuma oferta foi agendada ou aplicada à loja.");
  }
  const matching = products.filter((p) => {
    const selected = campaign?.participants.some((item) => item.productId === p.id);
    return (
      (!onlySelected || selected) &&
      `${p.nome} ${p.sku ?? ""} ${p.categoria ?? ""}`
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR"))
    );
  });
  const previewAt = localDate(at);
  const preview = campaign ? previewCampaignProducts(campaign, products, previewAt) : null;
  return (
    <section className="pm-panel" aria-label="Preços e campanhas">
      <div className="pm-heading">
        <div>
          <h1>Preços e campanhas</h1>
          <p className="pm-muted">Prepare uma condição Mobi e confira Pix, 10x e reversão.</p>
        </div>
        <button type="button" className="pm-button pm-primary" onClick={create}>
          Nova campanha
        </button>
      </div>
      <p className="pm-note">
        Rascunho e simulação locais · sem aplicação no catálogo, carrinho ou WhatsApp. Nenhuma
        campanha real é programada. Cupons dependem de motor comercial e não estão disponíveis.
      </p>
      {message && (
        <p role="status" className="pm-note">
          {message}
        </p>
      )}
      {data.campaigns.length > 0 && (
        <div className="pm-grid">
          <label className="pm-field">
            Campanha
            <select
              value={campaign?.id}
              onChange={(e) => {
                setSelectedId(e.target.value);
                setMessage("");
              }}
            >
              {data.campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || "Campanha sem nome"} · {campaignState(c)} local
                </option>
              ))}
            </select>
          </label>
          <div className="pm-actions">
            <span className="pm-badge">{campaign && campaignState(campaign)} · local</span>
            <span className="pm-muted">{campaign?.participants.length ?? 0} participantes</span>
          </div>
        </div>
      )}
      {!campaign ? (
        <div className="pm-card">
          <h3>Uma campanha começa pelos produtos</h3>
          <p>
            Crie o rascunho, defina a vigência e selecione os móveis participantes. O preço-base
            continuará preservado.
          </p>
        </div>
      ) : (
        <>
          <div className="pm-tabs" role="group" aria-label="Etapas da campanha">
            <button
              type="button"
              className={`pm-button ${mode === "edit" ? "pm-primary" : ""}`}
              onClick={() => setMode("edit")}
            >
              Editar condição
            </button>
            <button
              type="button"
              className={`pm-button ${mode === "review" ? "pm-primary" : ""}`}
              onClick={() => setMode("review")}
            >
              Conferir diferenças e prévia
            </button>
          </div>
          {mode === "edit" ? (
            <>
              <div className="pm-card pm-grid">
                <label className="pm-field">
                  Nome da campanha
                  <input
                    maxLength={120}
                    value={campaign.name}
                    onChange={(e) => patch({ name: e.target.value })}
                    placeholder="Ex.: Semana da sala Mobi"
                  />
                </label>
                <label className="pm-field">
                  Início · Brasília (UTC−03)
                  <input
                    type="datetime-local"
                    value={campaign.startsAt.slice(0, 16)}
                    onInput={(e) => patch({ startsAt: localDate(e.currentTarget.value) })}
                  />
                </label>
                <label className="pm-field">
                  Fim · Brasília (UTC−03)
                  <input
                    type="datetime-local"
                    value={campaign.endsAt.slice(0, 16)}
                    onInput={(e) => patch({ endsAt: localDate(e.currentTarget.value) })}
                  />
                </label>
                <label className="pm-field">
                  Condição e regras comerciais
                  <textarea
                    rows={3}
                    maxLength={3000}
                    value={campaign.rules}
                    onChange={(e) => patch({ rules: e.target.value })}
                  />
                </label>
              </div>
              <details className="pm-card">
                <summary>Associar seções e banners · referências locais</summary>
                <p className="pm-muted">
                  IDs da home existente. A associação registra o vínculo; não ativa nem altera a
                  aparência desses blocos.
                </p>
                <div className="pm-grid">
                  <fieldset>
                    <legend>Seções da home</legend>
                    {CAMPAIGN_SECTIONS.map((s) => (
                      <label className="pm-field" key={s.id}>
                        <span>
                          <input
                            type="checkbox"
                            checked={campaign.sectionIds.includes(s.id)}
                            onChange={(e) =>
                              patch({
                                sectionIds: e.target.checked
                                  ? [...campaign.sectionIds, s.id]
                                  : campaign.sectionIds.filter((id) => id !== s.id),
                              })
                            }
                          />{" "}
                          {s.title}
                        </span>
                      </label>
                    ))}
                  </fieldset>
                  <fieldset>
                    <legend>Banners principais</legend>
                    {CAMPAIGN_BANNERS.map((b) => (
                      <label className="pm-field" key={b.id}>
                        <span>
                          <input
                            type="checkbox"
                            checked={campaign.bannerIds.includes(b.id)}
                            onChange={(e) =>
                              patch({
                                bannerIds: e.target.checked
                                  ? [...campaign.bannerIds, b.id]
                                  : campaign.bannerIds.filter((id) => id !== b.id),
                              })
                            }
                          />{" "}
                          {b.title}
                        </span>
                      </label>
                    ))}
                  </fieldset>
                </div>
              </details>
              <div className="pm-heading">
                <h3>Escolher participantes</h3>
                <span className="pm-muted">{matching.length} produtos encontrados</span>
              </div>
              <div className="pm-actions">
                <label className="pm-field pm-search">
                  Buscar móvel, SKU ou categoria
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setLimit(12);
                    }}
                    placeholder="Sofá, guarda-roupa…"
                  />
                </label>
                <label className="pm-field">
                  <span>
                    <input
                      type="checkbox"
                      checked={onlySelected}
                      onChange={(e) => {
                        setOnlySelected(e.target.checked);
                        setLimit(12);
                      }}
                    />{" "}
                    Somente participantes
                  </span>
                </label>
              </div>
              <div className="pm-list">
                {matching.slice(0, limit).map((product) => {
                  const p = campaign.participants.find((item) => item.productId === product.id);
                  const validBase =
                    Number.isFinite(Number(product.preco_atual)) && Number(product.preco_atual) > 0;
                  return (
                    <article className="pm-card" key={product.id}>
                      <label className="pm-field">
                        <span>
                          <input
                            type="checkbox"
                            checked={!!p}
                            disabled={!validBase}
                            onChange={(e) => {
                              const next = selectCampaignProduct(
                                campaign,
                                product,
                                e.target.checked,
                              );
                              patch({ participants: next.participants });
                            }}
                          />{" "}
                          <strong>{product.nome}</strong> · base Pix{" "}
                          {validBase ? formatBRL(Number(product.preco_atual)) : "sem preço válido"}
                        </span>
                      </label>
                      {p && (
                        <>
                          <div className="pm-grid">
                            <PriceInput
                              key={`${product.id}-${p.baseVersion}-price`}
                              label="Proposto à vista/Pix (R$)"
                              value={p.proposedPriceCents}
                              onChange={(value) =>
                                participantChange(product.id, { proposedPriceCents: value ?? 0 })
                              }
                            />
                            <PriceInput
                              key={`${product.id}-${p.baseVersion}-reference`}
                              label="Referência real (R$), se houver"
                              optional
                              value={p.referencePriceCents}
                              onChange={(value) =>
                                participantChange(product.id, { referencePriceCents: value })
                              }
                            />
                            {p.referencePriceCents !== null && (
                              <label className="pm-field">
                                Origem verificável da referência
                                <input
                                  value={p.referenceEvidence}
                                  onChange={(e) =>
                                    participantChange(product.id, {
                                      referenceEvidence: e.target.value,
                                    })
                                  }
                                  placeholder="Registro/data do preço real"
                                />
                              </label>
                            )}
                          </div>
                          <p className="pm-muted">
                            Fotografia Pix: {formatBRL(p.basePriceCents / 100)}. Percentual é
                            derivado da diferença, sem regra percentual concorrente.
                          </p>
                        </>
                      )}
                    </article>
                  );
                })}
              </div>
              {!matching.length && (
                <p className="pm-muted">Nenhum produto encontrado. Ajuste a busca ou o filtro.</p>
              )}
              {matching.length > limit && (
                <button type="button" className="pm-button" onClick={() => setLimit(limit + 12)}>
                  Mostrar mais produtos
                </button>
              )}
            </>
          ) : (
            <div className="pm-card">
              <div className="pm-heading">
                <div>
                  <h3>Normal × proposta</h3>
                  <p>{campaign.name || "Campanha sem nome"}</p>
                </div>
                <span className="pm-badge">10x conforme regra vigente Mobi</span>
              </div>
              <p className="pm-muted">
                {campaign.startsAt || "Início pendente"} → {campaign.endsAt || "Fim pendente"} ·
                Brasília. {campaign.rules}
              </p>
              <div style={{ overflowX: "auto" }}>
                <table className="pm-table">
                  <caption>
                    Comparação dos participantes; proposta ainda não aplicada à loja.
                  </caption>
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Normal atual</th>
                      <th>Proposta</th>
                      <th>Benefício Pix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaign.participants.map((p) => {
                      const product = products.find((item) => item.id === p.productId);
                      let quote: ReturnType<typeof compareCampaignPrice> | null = null;
                      try {
                        if (product)
                          quote = compareCampaignPrice(
                            Math.round(Number(product.preco_atual) * 100),
                            p.proposedPriceCents,
                          );
                      } catch {
                        /* Validation lists invalid monetary input below. */
                      }
                      return (
                        <tr key={p.productId}>
                          <th scope="row">{product?.nome ?? p.productId}</th>
                          {quote ? (
                            <>
                              <td>
                                Pix {formatBRL(quote.normal.pixPrice)}
                                <br />
                                10x {formatBRL(quote.normal.approximateInstallment)}
                                <br />
                                Total {formatBRL(quote.normal.total)}
                              </td>
                              <td>
                                Pix {formatBRL(quote.proposed.pixPrice)}
                                <br />
                                10x {formatBRL(quote.proposed.approximateInstallment)}
                                <br />
                                Total {formatBRL(quote.proposed.total)}
                                {p.referencePriceCents !== null && (
                                  <>
                                    <br />
                                    Referência informada: {formatBRL(p.referencePriceCents / 100)}
                                  </>
                                )}
                              </td>
                              <td>
                                {quote.benefitCents >= 0
                                  ? formatBRL(quote.benefitCents / 100)
                                  : `Aumento de ${formatBRL(-quote.benefitCents / 100)}`}
                                <br />
                                {quote.benefitCents >= 0 &&
                                  `${((quote.benefitCents / (quote.normal.pixPrice * 100)) * 100).toFixed(2)}% da base atual`}
                              </td>
                            </>
                          ) : (
                            <td colSpan={3}>Revise os valores deste produto.</td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="pm-muted">
                O total do cartão é a autoridade; a parcela usa o arredondamento vigente. Taxa e
                número de parcelas permanecem os da loja.
              </p>
              <label className="pm-field">
                Instante para simular · Brasília
                <input
                  type="datetime-local"
                  value={at}
                  onInput={(e) => setAt(e.currentTarget.value)}
                />
              </label>
              <p className="pm-note">
                Estado nesse instante: {campaignState(campaign, previewAt)} · simulação local.{" "}
                {preview?.overriddenIds.length ?? 0} overrides aplicáveis na prévia. Habilite a
                simulação após revisar e escolha um instante dentro da vigência.
              </p>
              <div className="pm-grid">
                {preview?.products
                  .filter((p) => campaign.participants.some((item) => item.productId === p.id))
                  .map((product) => (
                    <article key={product.id} className="pm-card">
                      <strong>{product.nome}</strong>
                      <p>Pix na prévia: {formatBRL(Number(product.preco_atual))}</p>
                      <span className="pm-muted">
                        {preview.overriddenIds.includes(product.id)
                          ? "Override local"
                          : "Base atual preservada"}
                      </span>
                    </article>
                  ))}
              </div>
              <p className="pm-muted">
                Seções: {campaign.sectionIds.join(", ") || "nenhuma"} · Banners:{" "}
                {campaign.bannerIds.join(", ") || "nenhum"}. Vínculos registrados; sem ativação
                visual automática.
              </p>
            </div>
          )}
          {errors.length > 0 && (
            <details className="pm-error">
              <summary>{errors.length} pendência(s) de validação nos rascunhos</summary>
              <ul>
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </details>
          )}
          {conflicts.length > 0 && (
            <div className="pm-error" role="alert">
              <strong>Preço-base alterado: decisão necessária</strong>
              <ul>
                {conflicts.map((c) => (
                  <li key={c.productId}>{c.message}</li>
                ))}
              </ul>
              <p>
                O preço-base atual será preservado ao encerrar. Nenhum valor antigo será restaurado.
              </p>
            </div>
          )}
          <div className="pm-actions">
            <button type="button" className="pm-button" onClick={review}>
              Marcar em revisão local
            </button>
            <button
              type="button"
              className="pm-button pm-primary"
              disabled={campaign.status !== "review" || errors.length > 0 || conflicts.length > 0}
              onClick={enable}
            >
              Habilitar simulação local
            </button>
            <button
              type="button"
              className="pm-button"
              onClick={() => update({ ...campaign, simulation: "disabled" })}
            >
              Desativar simulação
            </button>
            <button
              type="button"
              className="pm-button"
              onClick={() => {
                const result = endCampaign(data, campaign.id, products);
                onChange(result.data);
                setMessage(
                  `Simulação encerrada. Overrides removidos; ${result.conflicts.length} conflito(s) indicado(s). Base atual preservada.`,
                );
              }}
            >
              Encerrar e remover overrides locais
            </button>
          </div>
          <details className="pm-muted">
            <summary>Limites e versão da base</summary>
            <p>
              A fotografia usa uma assinatura dos campos comerciais disponíveis, não uma versão
              transacional do servidor. Não detecta uma edição que voltou exatamente ao mesmo valor.
              A vigência é calculada ao abrir ou alterar esta prévia, sem tarefa de agendamento. Uma
              edição da condição exige nova revisão. Histórico e salvamento são controlados pelo
              painel principal.
            </p>
            <button
              type="button"
              className="pm-button"
              onClick={() => {
                onChange({
                  ...data,
                  campaigns: data.campaigns.filter((c) => c.id !== campaign.id),
                });
                setSelectedId("");
                setMessage(
                  "Campanha removida deste rascunho local. A base de produtos foi preservada.",
                );
              }}
            >
              Remover campanha deste rascunho
            </button>
          </details>
        </>
      )}
    </section>
  );
}
