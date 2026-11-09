import bundledManifest from "../../docs/referencias/madeira-manifesto-v1.1.json" with { type: "json" };

export const EVOLUTION_IMPORT_MAX_BYTES = 2_000_000;
export const EVOLUTION_OBSERVATIONS = {
  nao_avaliado: "Não avaliado",
  existente: "Existente",
  parcial: "Parcial",
  a_desenvolver: "A desenvolver",
} as const;
export const EVOLUTION_STATUSES = {
  nao_iniciado: "Não iniciado",
  em_andamento: "Em andamento",
  em_validacao: "Em validação",
  validado: "Validado",
  bloqueado: "Bloqueado",
} as const;
export const EVOLUTION_ACTIVATIONS = {
  nao_verificada: "Não verificada",
  ativo: "Ativo",
  inativo: "Inativo",
  nao_aplicavel: "Não se aplica",
} as const;
export const EVOLUTION_EVIDENCE = {
  V: "Visual observado na referência (consulte os limites da ficha)",
  T: "Texto ou DOM observado na referência",
  P: "Proposta para a Mobi; não é observação da concorrente",
  B: "Não verificado por barreira; investigar a lacuna",
} as const;
export const EVOLUTION_MODES = ["VISUAL", "FUNCIONAL", "COMPLETO", "INVESTIGAR"] as const;
export type EvolutionManifest = typeof bundledManifest;
export type EvolutionFeature = EvolutionManifest["features"][number];
export interface EvolutionTracking {
  observation: keyof typeof EVOLUTION_OBSERVATIONS;
  implementation: keyof typeof EVOLUTION_STATUSES;
  activation: keyof typeof EVOLUTION_ACTIVATIONS;
  owner: string;
  mobiTarget: string;
  branch: string;
  pr: string;
  preview: string;
  evidence: string;
  notes: string;
  desktopChecked: boolean;
  mobileChecked: boolean;
}
export interface EvolutionData {
  schemaVersion: 1;
  manifest: EvolutionManifest;
  tracking: Record<string, EvolutionTracking>;
  /** Pending form values, separate from registered status. Optional for v1 backups. */
  trackingDrafts?: Record<string, EvolutionTracking>;
  selectedIds: string[];
  request: {
    need: string;
    adaptation: string;
    excludedIds: string[];
    mode: (typeof EVOLUTION_MODES)[number];
    branch: string;
  };
}
// These mappings document actual editors, not completion of the reference requirement.
export const EVOLUTION_CAPABILITIES: Record<
  string,
  { label: string; area: string; files: string; limitation: string }
> = {
  "MM-CMS-01": {
    label: "Banners da home",
    area: "banners",
    files:
      "src/components/admin-studio/BannersPanel.tsx · src/components/BannerSlide.tsx · src/lib/homepage-banners.ts",
    limitation:
      "Editor existente de banners da home; não comprova biblioteca completa nem upload remoto.",
  },
  "MM-CMS-02": {
    label: "Páginas e vitrines",
    area: "vitrine",
    files: "src/components/PagesAndShelvesPanel.tsx · src/lib/pages-shelves.ts",
    limitation: "Editor existente de seções da home; não cria as 38 rotas da referência.",
  },
  "MM-CMS-03": {
    label: "Comparação de preços e 10x",
    area: "campaigns",
    files: "src/components/admin-studio/CampaignsPanel.tsx · src/lib/payment.ts",
    limitation:
      "Comparação e rascunhos locais de preço-base por produto. Sem aplicação remota nem overrides por variante.",
  },
  "MM-CMS-04": {
    label: "Campanhas em simulação",
    area: "campaigns",
    files: "src/lib/campaigns.ts · src/components/admin-studio/CampaignsPanel.tsx",
    limitation:
      "Vigência e reversão simuladas localmente. Sem agendamento real ou aplicação de ofertas à loja.",
  },
  "MM-CMS-05": {
    label: "Prévia de páginas",
    area: "vitrine",
    files:
      "src/components/admin-studio/HomeConnectionPanel.tsx · src/components/HomepageContent.tsx",
    limitation:
      "Home completa pelo renderer compartilhado; versões no servidor local. A demonstração usa catálogo histórico. Sem homologação do backend remoto ou publicação.",
  },
  "MM-CMS-06": {
    label: "Categorias e cobertura de filtros",
    area: "navigation",
    files: "src/components/admin-studio/OperationsPanels.tsx · src/lib/operational-config.ts",
    limitation:
      "Taxonomia e filtros na prévia; nomes, destinos e visibilidade chegam ao menu da home local por revisão. Filtros públicos e persistência remota permanecem pendentes.",
  },
  "MM-CMS-07": {
    label: "Conteúdo estruturado e ajuda",
    area: "content",
    files: "src/components/admin-studio/OperationsPanels.tsx · StructuredPage",
    limitation:
      "Editor e renderer locais de páginas e perguntas. Rotas públicas e revisão comercial permanecem pendentes.",
  },
  "MM-CMS-08": {
    label: "Histórico local de revisões",
    area: "history",
    files:
      "src/lib/admin-studio.ts · src/lib/home-local-store.server.ts · src/components/admin-studio/HomeConnectionPanel.tsx",
    limitation:
      "Histórico do navegador preservado; revisões da home também persistidas no servidor local, com conflito e restauração. Sem auditoria remota ou autoria individual.",
  },
};

function emptyTracking(): EvolutionTracking {
  return {
    observation: "nao_avaliado",
    implementation: "nao_iniciado",
    activation: "nao_verificada",
    owner: "",
    mobiTarget: "",
    branch: "",
    pr: "",
    preview: "",
    evidence: "",
    notes: "",
    desktopChecked: false,
    mobileChecked: false,
  };
}
export function initialEvolutionData(): EvolutionData {
  const manifest = structuredClone(bundledManifest);
  return {
    schemaVersion: 1,
    manifest,
    tracking: Object.fromEntries(manifest.features.map((feature) => [feature.id, emptyTracking()])),
    trackingDrafts: {},
    selectedIds: [],
    request: {
      need: "",
      adaptation: "",
      excludedIds: [],
      mode: "COMPLETO",
      branch: "feature/pm01-pm10-painel",
    },
  };
}

type ObjectValue = Record<string, unknown>;
function record(value: unknown): value is ObjectValue {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function text(value: unknown, allowEmpty = false): value is string {
  return (
    typeof value === "string" && value.length <= 20_000 && (allowEmpty || value.trim().length > 0)
  );
}
function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => text(entry));
}
function oneOf(value: unknown, options: readonly string[]): boolean {
  return typeof value === "string" && options.includes(value);
}
function url(value: unknown): boolean {
  if (typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol) && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}
function exactKeys(value: ObjectValue, keys: readonly string[]): boolean {
  return (
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key))
  );
}
function referenceList(value: unknown, validIds: Set<string>): boolean {
  return (
    strings(value) && new Set(value).size === value.length && value.every((id) => validIds.has(id))
  );
}

export function validateEvolutionManifest(value: unknown): string[] {
  if (!record(value)) return ["Manifesto deve ser um objeto JSON."];
  const errors: string[] = [];
  if (!exactKeys(value, Object.keys(bundledManifest)))
    errors.push("Campos do manifesto incompletos ou desconhecidos.");
  for (const field of ["spec_version", "date", "timezone", "purpose"])
    if (!text(value[field])) errors.push(`Manifesto: ${field} inválido.`);
  if (value.spec_version !== "1.1") errors.push("Versão de especificação suportada: 1.1.");
  if (
    !text(value.date) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value.date) ||
    Number.isNaN(Date.parse(value.date)) ||
    new Date(value.date).toISOString().slice(0, 10) !== value.date
  )
    errors.push("Data do manifesto inválida.");
  if (
    value.timezone !== "America/Sao_Paulo" ||
    !url(value.source_site) ||
    value.purpose !== "catalogo_de_aplicacao_mobi"
  )
    errors.push("Origem, propósito ou fuso do manifesto inválido.");
  if (
    typeof value.implementation_done !== "boolean" ||
    value.publish_authorized !== false ||
    value.application_policy !== "ADAPTAR_MOBI" ||
    value.production_requires_explicit_version_approval !== true ||
    value.production_data_changes_during_preview_authorized !== false
  )
    errors.push("Política de adaptação e aprovação de produção inválida.");
  if (
    !strings(value.development_environments) ||
    value.development_environments.length !== 2 ||
    !value.development_environments.includes("local") ||
    !value.development_environments.includes("github_isolated_branch")
  )
    errors.push("Ambientes devem ser local e branch GitHub isolada.");
  if (
    !record(value.evidence_codes) ||
    !exactKeys(value.evidence_codes, ["V", "T", "P", "B"]) ||
    !Object.values(value.evidence_codes).every((entry) => text(entry))
  )
    errors.push("Códigos de evidência inválidos.");
  if (
    !Array.isArray(value.viewports_observed) ||
    value.viewports_observed.length < 2 ||
    !value.viewports_observed.every(
      (viewport) =>
        record(viewport) &&
        exactKeys(viewport, ["width", "height"]) &&
        Number.isInteger(viewport.width) &&
        Number(viewport.width) > 0 &&
        Number.isInteger(viewport.height) &&
        Number(viewport.height) > 0,
    )
  )
    errors.push("Viewports observados inválidos.");
  const features = Array.isArray(value.features) ? value.features : [];
  const pages = Array.isArray(value.pages) ? value.pages : [];
  if (features.length !== 141 || pages.length !== 38)
    errors.push("Manifesto exige exatamente 141 requisitos e 38 fichas.");
  const featureIds = new Set<string>();
  const knownFeatureIds = new Set(bundledManifest.features.map((feature) => feature.id));
  const pageIds = new Set<string>();
  const groups = new Set<string>();
  for (const feature of features) {
    if (!record(feature)) {
      errors.push("Requisito inválido.");
      continue;
    }
    if (typeof feature.group === "string") groups.add(feature.group);
    if (
      typeof feature.id !== "string" ||
      !/^MM-[A-Z]+-\d{2}$/.test(feature.id) ||
      !knownFeatureIds.has(feature.id) ||
      featureIds.has(feature.id)
    )
      errors.push("ID de requisito inválido ou duplicado.");
    else featureIds.add(feature.id);
  }
  for (const page of pages) {
    if (!record(page)) {
      errors.push("Ficha de página inválida.");
      continue;
    }
    if (
      typeof page.id !== "string" ||
      !/^MM-P(0[1-9]|[12]\d|3[0-8])$/.test(page.id) ||
      pageIds.has(page.id)
    )
      errors.push("ID de página inválido ou duplicado.");
    else pageIds.add(page.id);
    const pageSource =
      url(page.source) || (text(page.source) && /^P(0[1-9]|[12]\d|3[0-8]):\s+\S/.test(page.source));
    if (
      !exactKeys(page, Object.keys(bundledManifest.pages[0])) ||
      !["title", "coverage", "sequence", "desktop", "mobile", "limits"].every((key) =>
        text(page[key]),
      ) ||
      !pageSource ||
      !referenceList(page.groups, groups)
    )
      errors.push(`Ficha ${String(page.id)}: campos ou grupos inválidos.`);
  }
  for (const feature of features) {
    if (!record(feature)) continue;
    if (!exactKeys(feature, Object.keys(bundledManifest.features[0])))
      errors.push(`${String(feature.id)}: esquema incompleto ou desconhecido.`);
    if (
      !["title", "group", "desktop", "mobile", "behavior", "data", "acceptance", "rollback"].every(
        (key) => text(feature[key]),
      )
    )
      errors.push(`${String(feature.id)}: descrição obrigatória ausente ou inválida.`);
    if (
      typeof feature.id === "string" &&
      typeof feature.group === "string" &&
      !feature.id.startsWith(`MM-${feature.group}-`)
    )
      errors.push(`${feature.id}: grupo não corresponde ao código.`);
    if (
      !oneOf(feature.evidence, Object.keys(EVOLUTION_EVIDENCE)) ||
      !oneOf(feature.priority, ["alta", "media", "conforme_negocio"]) ||
      !oneOf(feature.implementation_status, [
        "nao_iniciado",
        "planejado",
        "implementado",
        ...Object.keys(EVOLUTION_STATUSES),
      ]) ||
      typeof feature.selected !== "boolean" ||
      feature.application_policy !== "ADAPTAR_MOBI"
    )
      errors.push(`${String(feature.id)}: prioridade, evidência ou estado da referência inválido.`);
    if (!referenceList(feature.sources, pageIds))
      errors.push(`${String(feature.id)}: referência de página inválida.`);
    if (
      !strings(feature.dependencies) ||
      new Set(feature.dependencies).size !== feature.dependencies.length ||
      !feature.dependencies.every((dependency) =>
        dependency.startsWith("MM-")
          ? featureIds.has(dependency)
          : /^[a-z][a-z0-9_]*$/.test(dependency),
      )
    )
      errors.push(`${String(feature.id)}: dependência inválida.`);
  }
  return [...new Set(errors)];
}

export function validateEvolutionData(value: unknown): string[] {
  if (!record(value)) return ["Evolução deve ser um objeto."];
  const errors = validateEvolutionManifest(value.manifest);
  if (
    value.schemaVersion !== 1 ||
    !exactKeys(value, [
      "schemaVersion",
      "manifest",
      "tracking",
      "selectedIds",
      "request",
      ...(Object.hasOwn(value, "trackingDrafts") ? ["trackingDrafts"] : []),
    ])
  )
    errors.push("Esquema de acompanhamento inválido.");
  if (errors.length) return errors;
  const data = value as unknown as EvolutionData;
  const ids = new Set(data.manifest.features.map((feature) => feature.id));
  if (!referenceList(data.selectedIds, ids))
    errors.push("Seleção contém IDs inválidos ou duplicados.");
  if (
    !record(data.request) ||
    !exactKeys(data.request, ["need", "adaptation", "excludedIds", "mode", "branch"]) ||
    !text(data.request.need, true) ||
    !text(data.request.adaptation, true) ||
    !text(data.request.branch, true) ||
    !oneOf(data.request.mode, EVOLUTION_MODES) ||
    !referenceList(data.request.excludedIds, ids)
  )
    errors.push("Pedido contém campos, exclusões ou modo inválidos.");
  if (!record(data.tracking) || !exactKeys(data.tracking, [...ids]))
    return [...errors, "Acompanhamento deve conter exatamente os 141 IDs."];
  const entries: Array<[string, unknown, boolean]> = Object.entries(data.tracking).map(
    ([id, entry]) => [id, entry, false],
  );
  if (Object.hasOwn(data, "trackingDrafts")) {
    if (!record(data.trackingDrafts)) errors.push("Rascunhos de acompanhamento inválidos.");
    else
      for (const [id, entry] of Object.entries(data.trackingDrafts)) {
        if (!ids.has(id)) errors.push("Rascunho contém ID de requisito desconhecido.");
        else entries.push([id, entry, true]);
      }
  }
  for (const [id, entry, isDraft] of entries) {
    if (!record(entry) || !exactKeys(entry, Object.keys(emptyTracking()))) {
      errors.push(`${id}: acompanhamento inválido.`);
      continue;
    }
    if (
      !oneOf(entry.observation, Object.keys(EVOLUTION_OBSERVATIONS)) ||
      !oneOf(entry.implementation, Object.keys(EVOLUTION_STATUSES)) ||
      !oneOf(entry.activation, Object.keys(EVOLUTION_ACTIVATIONS))
    )
      errors.push(`${id}: estado de acompanhamento inválido.`);
    if (
      !["owner", "mobiTarget", "branch", "pr", "preview", "evidence", "notes"].every((key) =>
        text(entry[key], true),
      ) ||
      typeof entry.desktopChecked !== "boolean" ||
      typeof entry.mobileChecked !== "boolean"
    )
      errors.push(`${id}: campos de acompanhamento inválidos.`);
    for (const key of isDraft ? [] : (["branch", "pr", "preview"] as const))
      if (entry[key] && !url(entry[key]))
        errors.push(`${id}: ${key} deve ser link HTTP(S) sem credenciais.`);
    if (
      !isDraft &&
      entry.implementation === "validado" &&
      (!text(entry.evidence) || entry.desktopChecked !== true || entry.mobileChecked !== true)
    )
      errors.push(`${id}: validado exige evidência e verificação desktop e celular.`);
    if (oneOf(entry.activation, ["ativo", "inativo"]) && !EVOLUTION_CAPABILITIES[id])
      errors.push(`${id}: ativação operacional indisponível; capacidade não mapeada.`);
  }
  return [...new Set(errors)];
}

export function updateEvolutionTracking(
  data: EvolutionData,
  id: string,
  changes: Partial<EvolutionTracking>,
): { data: EvolutionData; errors: string[] } {
  if (!Object.hasOwn(data.tracking, id)) return { data, errors: ["Requisito não encontrado."] };
  const next = {
    ...data,
    tracking: { ...data.tracking, [id]: { ...data.tracking[id], ...changes } },
    trackingDrafts: { ...data.trackingDrafts },
  };
  delete next.trackingDrafts[id];
  const errors = validateEvolutionData(next);
  return { data: errors.length ? data : next, errors };
}

export function updateEvolutionTrackingDraft(
  data: EvolutionData,
  id: string,
  changes: Partial<EvolutionTracking>,
): { data: EvolutionData; errors: string[] } {
  if (!Object.hasOwn(data.tracking, id)) return { data, errors: ["Requisito não encontrado."] };
  const next: EvolutionData = {
    ...data,
    trackingDrafts: {
      ...data.trackingDrafts,
      [id]: { ...(data.trackingDrafts?.[id] ?? data.tracking[id]), ...changes },
    },
  };
  const errors = validateEvolutionData(next);
  return { data: errors.length ? data : next, errors };
}

export function importEvolutionJson(
  json: string,
  previous: EvolutionData,
  expected?: EvolutionData,
): { data: EvolutionData; errors: string[] } {
  if (expected && JSON.stringify(expected) !== JSON.stringify(previous))
    return {
      data: previous,
      errors: [
        "O rascunho mudou durante a leitura do arquivo. Importação cancelada por conflito; selecione o arquivo novamente após revisar as alterações.",
      ],
    };
  if (new TextEncoder().encode(json).length > EVOLUTION_IMPORT_MAX_BYTES)
    return { data: previous, errors: ["Arquivo excede o limite de 2 MB."] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { data: previous, errors: ["JSON inválido. O acompanhamento anterior foi preservado."] };
  }
  if (record(parsed) && Object.hasOwn(parsed, "schemaVersion")) {
    const errors = validateEvolutionData(parsed);
    return { data: errors.length ? previous : (parsed as unknown as EvolutionData), errors };
  }
  const errors = validateEvolutionManifest(parsed);
  if (errors.length) return { data: previous, errors };
  const manifest = parsed as EvolutionManifest;
  // Catalog import is never a command to change selection, Mobi status or activation.
  const next = { ...previous, manifest };
  const nextErrors = validateEvolutionData(next);
  return { data: nextErrors.length ? previous : next, errors: nextErrors };
}

export interface EvolutionFilters {
  query?: string;
  priority?: string;
  evidence?: string;
  observation?: string;
  implementation?: string;
  capability?: string;
}
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
export function searchEvolution(
  data: EvolutionData,
  filters: EvolutionFilters = {},
): EvolutionFeature[] {
  const query = normalize(filters.query?.trim() ?? "");
  const pages = new Map(data.manifest.pages.map((page) => [page.id, page]));
  return data.manifest.features.filter((feature) => {
    const haystack = [
      feature.id,
      feature.title,
      feature.group,
      ...feature.sources.flatMap((id) => [id, pages.get(id)?.title ?? ""]),
    ].join(" ");
    return (
      (!query || normalize(haystack).includes(query)) &&
      (!filters.priority || feature.priority === filters.priority) &&
      (!filters.evidence || feature.evidence === filters.evidence) &&
      (!filters.observation || data.tracking[feature.id].observation === filters.observation) &&
      (!filters.implementation ||
        data.tracking[feature.id].implementation === filters.implementation) &&
      (!filters.capability ||
        (filters.capability === "disponivel"
          ? !!EVOLUTION_CAPABILITIES[feature.id]
          : !EVOLUTION_CAPABILITIES[feature.id]))
    );
  });
}

export function buildEvolutionRequest(data: EvolutionData) {
  const errors = validateEvolutionData(data);
  if (errors.length) throw new Error(errors.join("\n"));
  const selectedIds = data.selectedIds.filter((id) => !data.request.excludedIds.includes(id));
  if (!selectedIds.length && !data.request.need.trim())
    throw new Error("Selecione requisitos ou descreva a necessidade.");
  const features = data.manifest.features.filter((feature) => selectedIds.includes(feature.id));
  return {
    request_schema_version: 1,
    reference_spec: "MOBI_ENGENHARIA_REVERSA_MADEIRAMADEIRA.md",
    panel_spec_version: "0.2",
    spec_version: data.manifest.spec_version,
    need: data.request.need.trim(),
    adaptation: data.request.adaptation.trim(),
    selected_ids: selectedIds,
    excluded_ids: data.request.excludedIds,
    mode: data.request.mode,
    target: "site Mobi existente",
    branding: "ativos e tokens oficiais do repositorio Mobi",
    preview: "local",
    branch: data.request.branch,
    dependencies: [...new Set(features.flatMap((feature) => feature.dependencies))],
    dependency_policy:
      "Dependências não ampliam a seleção nem autorizam mudança comercial. Exclusões prevalecem.",
    requirements: features.map((feature) => ({
      id: feature.id,
      title: feature.title,
      sources: feature.sources,
      dependencies: feature.dependencies,
      desktop: feature.desktop,
      mobile: feature.mobile,
      behavior: feature.behavior,
      data: feature.data,
      acceptance: feature.acceptance,
      rollback: feature.rollback,
      reference_evidence: feature.evidence,
      mobi_tracking: data.tracking[feature.id],
    })),
    publish: false,
    reversible_campaign: true,
    application_policy: "ADAPTAR_MOBI",
    production_requires_explicit_version_approval: true,
    development_environments: ["local", "github_isolated_branch"],
    production_data_changes_during_preview_authorized: false,
    delivery:
      "Entregar prévia local, mapa ID → arquivos reais → dependências → aceite → evidências desktop/celular → reversão. Publicar somente após aprovação explícita da versão por Rafael.",
  };
}

export function exportEvolutionMarkdown(data: EvolutionData): string {
  const request = buildEvolutionRequest(data);
  return [
    "# Pedido de evolução Mobi",
    `Especificação: ${request.reference_spec} v${request.spec_version} · Painel v${request.panel_spec_version}`,
    `Política: ${request.application_policy}`,
    `Modo: ${request.mode}`,
    `Necessidade: ${request.need || "Conforme seleção abaixo."}`,
    `Adaptação Mobi: ${request.adaptation || "Preservar identidade, dados e fluxos reais Mobi; detalhar antes de implementar."}`,
    `Ambientes: local e branch GitHub isolada (${request.branch || "definir no projeto"})`,
    "Publicação: NÃO autorizada. Exige aprovação explícita da versão por Rafael antes de produção.",
    "Dados de produção: nenhuma mudança autorizada durante a prévia.",
    `IDs selecionados: ${request.selected_ids.join(", ") || "Relacionar IDs após investigação da necessidade."}`,
    `Exclusões (prevalecem): ${request.excluded_ids.join(", ") || "Nenhuma"}`,
    `Dependências: ${request.dependencies.join(", ") || "Conferir contratos existentes"}`,
    request.dependency_policy,
    ...request.requirements.map((feature) =>
      [
        `\n## ${feature.id} — ${feature.title}`,
        `Fontes: ${feature.sources.join(", ")} · Evidência da referência: ${feature.reference_evidence}`,
        `Desktop: ${feature.desktop}`,
        `Celular: ${feature.mobile}`,
        `Interação: ${feature.behavior}`,
        `Dados: ${feature.data}`,
        `Dependências: ${feature.dependencies.join(", ") || "Nenhuma declarada"}`,
        `Aceite: ${feature.acceptance}`,
        `Reversão: ${feature.rollback}`,
        `Acompanhamento Mobi: ${EVOLUTION_STATUSES[feature.mobi_tracking.implementation]} · ativação ${EVOLUTION_ACTIVATIONS[feature.mobi_tracking.activation]}`,
        `Evidência Mobi: ${feature.mobi_tracking.evidence || "Pendente"}`,
      ].join("\n"),
    ),
    "\n" + request.delivery,
  ].join("\n\n");
}
