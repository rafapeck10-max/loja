export const STUDIO_SCOPES = [
  "pages",
  "banners",
  "products",
  "campaigns",
  "navigation",
  "content",
  "service",
  "evolution",
] as const;
export type StudioScope = (typeof STUDIO_SCOPES)[number];
export interface StudioRevision {
  id: number;
  scope: StudioScope;
  date: string;
  status: "draft" | "reviewed";
  before: unknown;
  after: unknown;
  restoredFrom?: number;
}
export interface StudioWorkspace {
  schema: 1;
  revision: number;
  entries: Partial<Record<StudioScope, unknown>>;
  history: StudioRevision[];
}
export const MAX_WORKSPACE_BYTES = 3_500_000;
const byteLength = (value: string): number => new TextEncoder().encode(value).byteLength;
export const emptyWorkspace = (): StudioWorkspace => ({
  schema: 1,
  revision: 0,
  entries: {},
  history: [],
});
const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data));
const known = (scope: unknown): scope is StudioScope =>
  STUDIO_SCOPES.includes(scope as StudioScope);
export function parseWorkspace(raw: string): StudioWorkspace {
  try {
    if (byteLength(raw) > MAX_WORKSPACE_BYTES) throw new Error();
    const w = JSON.parse(raw) as StudioWorkspace;
    if (
      w?.schema !== 1 ||
      !Number.isSafeInteger(w.revision) ||
      w.revision < 0 ||
      !w.entries ||
      Array.isArray(w.entries) ||
      typeof w.entries !== "object" ||
      !Array.isArray(w.history) ||
      Object.keys(w.entries).some((x) => !known(x))
    )
      throw new Error();
    if (
      w.history.length !== w.revision ||
      w.history.some(
        (r, i) =>
          r?.id !== i + 1 ||
          !known(r.scope) ||
          !["draft", "reviewed"].includes(r.status) ||
          !Number.isFinite(Date.parse(r.date)) ||
          !Object.hasOwn(r, "after") ||
          !Object.hasOwn(r, "before"),
      )
    )
      throw new Error();
    for (const scope of Object.keys(w.entries) as StudioScope[]) {
      const last = [...w.history].reverse().find((r) => r.scope === scope);
      if (!last || JSON.stringify(last.after) !== JSON.stringify(w.entries[scope]))
        throw new Error();
    }
    return w;
  } catch {
    throw new Error("Arquivo local inválido. A versão aberta foi preservada.");
  }
}
export function reviseWorkspace(
  w: StudioWorkspace,
  expected: number,
  scope: StudioScope,
  data: unknown,
  date: string,
  baseline: unknown = null,
): StudioWorkspace {
  if (w.revision !== expected)
    throw new Error(
      "Conflito: uma revisão mais recente existe. Reabra a versão salva antes de continuar.",
    );
  if (!known(scope)) throw new Error("Escopo inválido.");
  if (!Number.isFinite(Date.parse(date))) throw new Error("Data inválida.");
  const next: StudioWorkspace = {
    schema: 1,
    revision: w.revision + 1,
    entries: { ...w.entries, [scope]: clone(data) },
    history: [
      ...w.history,
      {
        id: w.revision + 1,
        scope,
        date,
        status: "draft",
        before: clone(w.entries[scope] ?? baseline),
        after: clone(data),
      },
    ],
  };
  if (byteLength(JSON.stringify(next)) > MAX_WORKSPACE_BYTES)
    throw new Error(
      "O histórico atingiu o limite local. Exporte uma cópia; a versão salva foi preservada.",
    );
  return next;
}
export function reviewRevision(
  w: StudioWorkspace,
  expected: number,
  scope: StudioScope,
  date: string,
): StudioWorkspace {
  if (!Object.hasOwn(w.entries, scope)) throw new Error("Salve o rascunho antes de revisar.");
  const next = reviseWorkspace(w, expected, scope, w.entries[scope], date);
  next.history.at(-1)!.status = "reviewed";
  return next;
}
export function restoreRevision(
  w: StudioWorkspace,
  expected: number,
  id: number,
  date: string,
): StudioWorkspace {
  const previous = w.history.find((r) => r.id === id);
  if (!previous) throw new Error("Versão não encontrada.");
  const next = reviseWorkspace(w, expected, previous.scope, previous.after, date);
  next.history.at(-1)!.restoredFrom = id;
  return next;
}
export interface ValueDifference {
  path: string;
  before: unknown;
  after: unknown;
}
export function diffValues(a: unknown, b: unknown, path = ""): ValueDifference[] {
  if (JSON.stringify(a) === JSON.stringify(b)) return [];
  if (Array.isArray(a) && Array.isArray(b)) {
    return Array.from({ length: Math.max(a.length, b.length) }, (_, i) =>
      diffValues(a[i], b[i], `${path}.${i + 1}`),
    ).flat();
  }
  if (
    a &&
    b &&
    typeof a === "object" &&
    typeof b === "object" &&
    !Array.isArray(a) &&
    !Array.isArray(b)
  ) {
    const left = a as Record<string, unknown>,
      right = b as Record<string, unknown>;
    return [...new Set([...Object.keys(left), ...Object.keys(right)])].flatMap((k) =>
      diffValues(left[k], right[k], path ? `${path}.${k}` : k),
    );
  }
  return [{ path: path || "configuração", before: a ?? null, after: b ?? null }];
}
const fieldLabels: Record<string, string> = {
  selectedIds: "Requisitos selecionados",
  request: "Pedido",
  need: "Necessidade",
  adaptation: "Adaptação Mobi",
  excludedIds: "Exclusões",
  mode: "Modo",
  branch: "Branch",
  sections: "Seções",
  title: "Título",
  subtitle: "Texto de apoio",
  enabled: "Visibilidade",
  type: "Tipo",
  id: "Identificação",
  curation: "Curadoria",
  weeklyIds: "Escolhas da semana",
  settings: "Regras por móvel",
  novidade: "Novidades",
  sala: "Sala",
  descoberta: "Descoberta",
  banners: "Banners",
  position: "Ordem",
  image_url: "Arte de computador",
  mobile_image_url: "Arte de celular",
  alt: "Texto alternativo",
  name: "Nome",
  active: "Ativo",
  show_text: "Exibir texto",
  starts_at: "Início",
  ends_at: "Fim",
  startsAt: "Início",
  endsAt: "Fim",
  campaigns: "Campanhas",
  participants: "Participantes",
  productId: "Móvel",
  proposedPriceCents: "Preço proposto em centavos",
  basePriceCents: "Preço-base em centavos",
  referencePriceCents: "Referência em centavos",
  items: "Categorias",
  label: "Nome público",
  href: "Destino",
  visible: "Visibilidade",
  filters: "Filtros",
  pages: "Páginas",
  slug: "Endereço",
  body: "Conteúdo",
  faqs: "Perguntas",
  question: "Pergunta",
  answer: "Resposta",
  links: "Links",
  reviewedAt: "Revisão comercial",
  status: "Estado",
  changes: "Cadastros",
  product: "Produto",
  preco_atual: "Preço à vista",
  preco_atacado: "Custo interno",
  nome: "Nome",
  categoria: "Categoria",
  fornecedor: "Fornecedor interno",
  url_imagem: "Foto principal",
  descricao: "Descrição",
  medidas: "Medidas",
  cores: "Cores",
  number: "WhatsApp",
  regionMessage: "Região atendida",
  deliveryMessage: "Frete e prazo",
  assemblyMessage: "Montagem",
  template: "Modelo da mensagem",
  tracking: "Acompanhamento",
  observation: "Situação observada",
  implementation: "Implementação",
  activation: "Ativação observada",
  evidence: "Evidência",
  notes: "Resultado e limites",
  desktopChecked: "Computador conferido",
  mobileChecked: "Celular conferido",
};
export function describeDifferencePath(path: string, names: Record<string, string> = {}) {
  return path
    .split(".")
    .map((k) => names[k] ?? fieldLabels[k] ?? k)
    .join(" › ");
}
