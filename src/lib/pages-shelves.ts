import type { Produto } from "./products.functions";
import {
  isCurationProduct,
  settingsFor,
  CURATION_MODES,
  type EditorProduct,
  type CurationDraft,
} from "./homepage-curation.ts";
import {
  weeklyHomepageProducts,
  newHomepageProducts,
  roomHomepageProducts,
  discoverHomepageProducts,
  isHomepageProduct,
} from "./home-curation.ts";
export const PAGE_SECTIONS = [
  {
    id: "intro",
    title: "Banner, apresentação e ambientes",
    type: "topo",
    locked: true,
    subtitle: "Estrutura existente da página inicial",
  },
  {
    id: "blackFriday",
    title: "Black Friday da Mobi",
    type: "vitrine",
    locked: false,
    subtitle: "Veja os produtos selecionados para a campanha.",
  },
  {
    id: "discovery",
    title: "Descubra algo novo",
    type: "vitrine",
    locked: false,
    subtitle: "Uma seleção diferente a cada visita. Encontre o que combina com você.",
  },
  {
    id: "weekly",
    title: "Escolhas da semana",
    type: "vitrine",
    locked: false,
    subtitle: "Uma seleção especial da Mobi para sua casa.",
  },
  {
    id: "inspiration",
    title: "Inspiração para sua sala",
    type: "editorial",
    locked: false,
    subtitle: "Um lugar para descansar, receber e viver bons momentos.",
  },
  {
    id: "new",
    title: "Novidades",
    type: "vitrine",
    locked: false,
    subtitle: "Novas possibilidades para renovar seus ambientes.",
  },
  {
    id: "room",
    title: "Para sua sala",
    type: "vitrine",
    locked: false,
    subtitle: "Conforto e detalhes que fazem a diferença.",
  },
  {
    id: "catalog",
    title: "Convite para o catálogo",
    type: "convite",
    locked: true,
    subtitle: "Móveis para Nova Iguaçu e Baixada Fluminense.",
  },
] as const;
export type PageSectionId = (typeof PAGE_SECTIONS)[number]["id"];
export interface PageSection {
  id: PageSectionId;
  title: string;
  subtitle: string;
  type: string;
  enabled: boolean;
}
export interface PageDraft {
  version: 1;
  page: "home";
  baseVersion: string;
  sections: PageSection[];
  curation: CurationDraft;
  shelves: {
    new: ProductShelfSelection;
    room: ProductShelfSelection;
  };
}
export type ProductShelfId = "weekly" | "new" | "room";
export type ProductShelfMode = "automatico" | "manual";
export interface ProductShelfSelection {
  mode: ProductShelfMode;
  productIds: string[];
}
export interface PublishedHomePage {
  version: 1;
  revisionId: number;
  appliedAt: string;
  sections: PageSection[];
  shelves: {
    weekly: { mode: "manual"; productIds: string[] };
    new: ProductShelfSelection;
    room: ProductShelfSelection;
  };
}
export function sourceVersion(products: EditorProduct[]) {
  return JSON.stringify(
    [...products]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((p) => [
        p.id,
        p.ordem ?? 0,
        p.preco_atual,
        p.preco_atacado,
        p.url_imagem,
        p.descricao ?? "",
        p.cores ?? [],
        p.categoria ?? "",
        p.created_at ?? "",
        p.variacoes_preco ?? [],
        p.vitrine_semana_ordem ?? null,
        p.vitrine_novidade ?? "automatico",
        p.vitrine_sala ?? "automatico",
        p.vitrine_descoberta ?? true,
      ]),
  );
}
export function initialPageDraft(products: EditorProduct[]): PageDraft {
  return {
    version: 1,
    page: "home",
    baseVersion: sourceVersion(products),
    sections: PAGE_SECTIONS.map(({ id, title, type, subtitle }) => ({
      id,
      title,
      type,
      subtitle,
      enabled: id !== "discovery" && id !== "inspiration" && id !== "blackFriday",
    })),
    curation: {
      weeklyIds: products
        .filter((p) => p.vitrine_semana_ordem != null)
        .sort((a, b) => (a.vitrine_semana_ordem ?? 99) - (b.vitrine_semana_ordem ?? 99))
        .map((p) => p.id),
      settings: Object.fromEntries(products.map((p) => [p.id, settingsFor(p)])),
    },
    shelves: {
      new: { mode: "automatico", productIds: [] },
      room: { mode: "automatico", productIds: [] },
    },
  };
}
export function movePageSection(draft: PageDraft, id: PageSectionId, delta: number): PageDraft {
  const index = draft.sections.findIndex((s) => s.id === id);
  const target = index + delta;
  if (
    index <= 0 ||
    index >= draft.sections.length - 1 ||
    target <= 0 ||
    target >= draft.sections.length - 1
  )
    return draft;
  const sections = [...draft.sections];
  const [section] = sections.splice(index, 1);
  sections.splice(target, 0, section);
  return { ...draft, sections };
}
export function chooseWeeklyProduct(
  draft: PageDraft,
  products: EditorProduct[],
  id: string,
): PageDraft {
  if (draft.curation.weeklyIds.includes(id)) throw new Error("Este produto já está na seleção.");
  if (draft.curation.weeklyIds.length >= 4) throw new Error("Escolha no máximo quatro produtos.");
  const product = products.find((p) => p.id === id);
  if (!product || !isCurationProduct(product))
    throw new Error("Produto sem condições válidas para a vitrine.");
  return {
    ...draft,
    curation: { ...draft.curation, weeklyIds: [...draft.curation.weeklyIds, id] },
  };
}
type ManualShelfId = Exclude<ProductShelfId, "weekly">;

export function setShelfMode(
  draft: PageDraft,
  shelf: ManualShelfId,
  mode: ProductShelfMode,
): PageDraft {
  if (mode !== "automatico" && mode !== "manual") throw new Error("Modo de vitrine inválido.");
  return {
    ...draft,
    shelves: { ...draft.shelves, [shelf]: { ...draft.shelves[shelf], mode } },
  };
}

export function chooseShelfProduct(
  draft: PageDraft,
  products: EditorProduct[],
  shelf: ManualShelfId,
  id: string,
  replaceIndex?: number,
): PageDraft {
  const selection = draft.shelves[shelf];
  const currentIds = [...selection.productIds];
  const product = products.find((item) => item.id === id);
  if (!product || !isCurationProduct(product))
    throw new Error("Produto sem condições válidas para a vitrine.");
  if (replaceIndex == null) {
    if (currentIds.includes(id)) throw new Error("Este produto já está na seleção.");
    if (currentIds.length >= 4) throw new Error("Escolha no máximo quatro produtos.");
    currentIds.push(id);
  } else {
    if (!Number.isInteger(replaceIndex) || replaceIndex < 0 || replaceIndex >= currentIds.length)
      throw new Error("A posição do produto mudou. Reabra a seleção.");
    if (currentIds[replaceIndex] === id) return draft;
    if (currentIds.includes(id)) throw new Error("Este produto já está na seleção.");
    currentIds[replaceIndex] = id;
  }
  return {
    ...draft,
    shelves: {
      ...draft.shelves,
      [shelf]: { mode: "manual", productIds: currentIds },
    },
  };
}

export function removeShelfProduct(draft: PageDraft, shelf: ManualShelfId, id: string): PageDraft {
  return {
    ...draft,
    shelves: {
      ...draft.shelves,
      [shelf]: {
        ...draft.shelves[shelf],
        productIds: draft.shelves[shelf].productIds.filter((productId) => productId !== id),
      },
    },
  };
}

export function moveShelfProduct(
  draft: PageDraft,
  shelf: ManualShelfId,
  index: number,
  delta: number,
): PageDraft {
  const ids = [...draft.shelves[shelf].productIds];
  const target = index + delta;
  if (
    !Number.isInteger(index) ||
    !Number.isInteger(delta) ||
    index < 0 ||
    index >= ids.length ||
    target < 0 ||
    target >= ids.length
  )
    return draft;
  [ids[index], ids[target]] = [ids[target], ids[index]];
  return {
    ...draft,
    shelves: { ...draft.shelves, [shelf]: { ...draft.shelves[shelf], productIds: ids } },
  };
}
export function validatePageDraft(draft: PageDraft, products: EditorProduct[]): string[] {
  const errors: string[] = [];
  if (
    draft?.version !== 1 ||
    draft.page !== "home" ||
    !Array.isArray(draft.sections) ||
    !draft.curation ||
    !Array.isArray(draft.curation.weeklyIds) ||
    !draft.curation.settings ||
    typeof draft.curation.settings !== "object" ||
    !draft.shelves ||
    typeof draft.shelves !== "object"
  )
    return ["Rascunho inválido."];
  if (
    draft.sections.length !== PAGE_SECTIONS.length ||
    new Set(draft.sections.map((s) => s?.id)).size !== PAGE_SECTIONS.length
  )
    errors.push("Revise a lista de seções.");
  if (draft.sections[0]?.id !== "intro" || draft.sections.at(-1)?.id !== "catalog")
    errors.push("Preserve o início e o encerramento da página.");
  for (const s of draft.sections) {
    const definition = PAGE_SECTIONS.find((x) => x.id === s?.id);
    if (
      !definition ||
      s.type !== definition.type ||
      typeof s.enabled !== "boolean" ||
      typeof s.title !== "string" ||
      !s.title.trim() ||
      s.title.length > 100 ||
      typeof s.subtitle !== "string" ||
      s.subtitle.length > 240 ||
      (definition.locked && !s.enabled)
    )
      errors.push("Seção inválida ou sem título.");
  }
  if (
    draft.curation.weeklyIds.length > 4 ||
    new Set(draft.curation.weeklyIds).size !== draft.curation.weeklyIds.length
  )
    errors.push("Escolha até quatro produtos diferentes para a semana.");
  for (const id of draft.curation.weeklyIds) {
    const p = products.find((p) => p.id === id);
    if (!p || !isCurationProduct(p))
      errors.push("Há produto sem condições válidas para a vitrine.");
  }
  for (const shelf of ["new", "room"] as const) {
    const selection = draft.shelves[shelf];
    if (
      !selection ||
      !["automatico", "manual"].includes(selection.mode) ||
      !Array.isArray(selection.productIds) ||
      selection.productIds.length > 4 ||
      selection.productIds.some((id) => typeof id !== "string" || !id.trim()) ||
      new Set(selection.productIds).size !== selection.productIds.length
    ) {
      errors.push("Revise a seleção das vitrines: escolha até quatro produtos diferentes.");
      continue;
    }
    if (selection.mode === "manual") {
      for (const id of selection.productIds) {
        const product = products.find((item) => item.id === id);
        if (!product || !isCurationProduct(product))
          errors.push("Há produto sem condições válidas para a vitrine.");
      }
    }
  }
  for (const [id, value] of Object.entries(draft.curation.settings)) {
    if (
      !products.some((p) => p.id === id) ||
      !value ||
      !CURATION_MODES.includes(value.novidade) ||
      !CURATION_MODES.includes(value.sala) ||
      typeof value.descoberta !== "boolean"
    )
      errors.push("Revise as regras dos produtos.");
  }
  return [...new Set(errors)];
}
/** Adds the new Black Friday section to valid legacy drafts without touching their saved copy. */
export function normalizePageDraft(value: unknown, products: EditorProduct[]): PageDraft {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Rascunho inválido.");
  const draft = value as PageDraft;
  if (!Array.isArray(draft.sections)) throw new Error("Revise a lista de seções.");
  const ids = draft.sections.map((section) => section?.id);
  if (
    ids.some((id) => !PAGE_SECTIONS.some((definition) => definition.id === id)) ||
    new Set(ids).size !== ids.length
  )
    throw new Error("Revise a lista de seções.");
  const hasBlackFriday = ids.includes("blackFriday");
  if (draft.sections.length !== (hasBlackFriday ? PAGE_SECTIONS.length : PAGE_SECTIONS.length - 1))
    throw new Error("Revise a lista de seções.");
  const sections = [...draft.sections];
  if (!hasBlackFriday) {
    const introIndex = sections.findIndex((section) => section.id === "intro");
    const definition = PAGE_SECTIONS.find((section) => section.id === "blackFriday")!;
    if (introIndex < 0) throw new Error("Preserve o início e o encerramento da página.");
    sections.splice(introIndex + 1, 0, {
      id: definition.id,
      title: definition.title,
      type: definition.type,
      subtitle: definition.subtitle,
      enabled: false,
    });
  }
  const normalized: PageDraft = {
    ...draft,
    sections: sections.map((section) =>
      section.id === "discovery" ? { ...section, enabled: false } : section,
    ),
    shelves: {
      new: normalizeShelfSelection(draft.shelves?.new),
      room: normalizeShelfSelection(draft.shelves?.room),
    },
  };
  const errors = validatePageDraft(normalized, products);
  if (errors.length) throw new Error(errors.join(" "));
  return normalized;
}

function normalizeShelfSelection(value: unknown): ProductShelfSelection {
  if (value == null) return { mode: "automatico", productIds: [] };
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Revise a seleção das vitrines.");
  const selection = value as Partial<ProductShelfSelection>;
  if (
    !["automatico", "manual"].includes(selection.mode as string) ||
    !Array.isArray(selection.productIds)
  )
    throw new Error("Revise a seleção das vitrines.");
  return { mode: selection.mode as ProductShelfMode, productIds: [...selection.productIds] };
}
export function restorePageDraft(raw: string, products: EditorProduct[]): PageDraft {
  const parsed = normalizePageDraft(JSON.parse(raw), products);
  if (parsed.baseVersion !== sourceVersion(products))
    throw new Error(
      "O catálogo mudou desde este rascunho. Preserve a versão atual e revise os conflitos.",
    );
  return parsed;
}
export function toStorefrontProducts(
  products: EditorProduct[],
  curation: CurationDraft,
): Produto[] {
  return products.filter(isCurationProduct).map((p) => ({
    id: p.id,
    nome: p.nome,
    slug: p.slug ?? p.id,
    preco_antigo: Number(p.preco_antigo ?? 0),
    preco_novo: Number(p.preco_atual),
    imagem_url: p.url_imagem ?? "",
    categoria: p.categoria ?? "",
    descricao: p.descricao ?? "",
    imagens: p.imagens ?? [],
    sku: p.sku ?? null,
    fornecedor: p.fornecedor ?? null,
    medidas: p.medidas ?? null,
    cores: p.cores ?? null,
    compre_junto_ids: p.compre_junto_ids ?? [],
    parcelas_sem_juros: p.parcelas_sem_juros ?? 10,
    variacoes_preco: (Array.isArray(p.variacoes_preco)
      ? p.variacoes_preco.filter((v) => v && typeof v === "object" && !Array.isArray(v))
      : []) as unknown as Produto["variacoes_preco"],
    created_at: p.created_at ?? "",
    vitrine_semana_ordem: curation.weeklyIds.includes(p.id)
      ? curation.weeklyIds.indexOf(p.id) + 1
      : null,
    vitrine_novidade: curation.settings[p.id]?.novidade ?? "automatico",
    vitrine_sala: curation.settings[p.id]?.sala ?? "automatico",
    vitrine_descoberta: curation.settings[p.id]?.descoberta ?? true,
    curadoriaDisponivel: true,
  }));
}
export function sectionProducts(
  id: PageSectionId,
  products: Produto[],
  date: Date,
  selection?: ProductShelfSelection,
): Produto[] {
  const weekly = weeklyHomepageProducts(products),
    fresh = newHomepageProducts(products, date),
    room = roomHomepageProducts(products);
  if (id === "weekly") return weekly;
  if (id === "new") return selectedShelfProducts(fresh, products, selection);
  if (id === "room") return selectedShelfProducts(room, products, selection);
  if (id === "discovery")
    return discoverHomepageProducts(
      products,
      new Set([...weekly, ...fresh, ...room].map((p) => p.id)),
      date,
    );
  return [];
}

function selectedShelfProducts(
  automatic: Produto[],
  products: Produto[],
  selection?: ProductShelfSelection,
): Produto[] {
  if (selection?.mode !== "manual") return automatic;
  const byId = new Map(products.map((product) => [product.id, product]));
  const seen = new Set<string>();
  return selection.productIds
    .flatMap((id) => {
      const product = byId.get(id);
      if (!product || seen.has(id) || !isHomepageProduct(product)) return [];
      seen.add(id);
      return [product];
    })
    .slice(0, 4);
}

/** Allowlist projection for the storefront. Product details remain hydrated from the live catalog. */
export function publishedHomePageFromDraft(
  draft: PageDraft,
  products: EditorProduct[],
  revisionId: number,
  appliedAt: string,
): PublishedHomePage {
  if (
    !Number.isSafeInteger(revisionId) ||
    revisionId < 1 ||
    !Number.isFinite(Date.parse(appliedAt))
  )
    throw new Error("Revisão aplicada inválida.");
  const errors = validatePageDraft(draft, products);
  if (errors.length) throw new Error(errors.join(" "));
  return {
    version: 1,
    revisionId,
    appliedAt,
    sections: draft.sections
      .filter((section) => section.id !== "discovery")
      .map(({ id, title, subtitle, type, enabled }) => ({ id, title, subtitle, type, enabled })),
    shelves: {
      weekly: { mode: "manual", productIds: [...draft.curation.weeklyIds] },
      new: {
        mode: draft.shelves.new.mode,
        productIds: [...draft.shelves.new.productIds],
      },
      room: {
        mode: draft.shelves.room.mode,
        productIds: [...draft.shelves.room.productIds],
      },
    },
  };
}

/** Validates the stored public projection and rebuilds it from allowlisted fields. */
export function parsePublishedHomePage(value: unknown): PublishedHomePage {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Configuração pública da página inicial inválida.");
  const input = value as Record<string, unknown>;
  if (
    input.version !== 1 ||
    !Number.isSafeInteger(input.revisionId) ||
    (input.revisionId as number) < 1 ||
    typeof input.appliedAt !== "string" ||
    !Number.isFinite(Date.parse(input.appliedAt)) ||
    !Array.isArray(input.sections) ||
    input.sections.length !== PAGE_SECTIONS.length - 1 ||
    !input.shelves ||
    typeof input.shelves !== "object" ||
    Array.isArray(input.shelves)
  )
    throw new Error("Configuração pública da página inicial inválida.");

  const sections = input.sections.map((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error("Configuração pública da página inicial inválida.");
    const section = value as Record<string, unknown>;
    const definition = PAGE_SECTIONS.find((candidate) => candidate.id === section.id);
    if (
      !definition ||
      definition.id === "discovery" ||
      section.type !== definition.type ||
      typeof section.title !== "string" ||
      !section.title.trim() ||
      section.title.length > 100 ||
      typeof section.subtitle !== "string" ||
      section.subtitle.length > 240 ||
      typeof section.enabled !== "boolean"
    )
      throw new Error("Configuração pública da página inicial inválida.");
    return {
      id: definition.id,
      title: section.title,
      subtitle: section.subtitle,
      type: definition.type,
      enabled: section.enabled,
    };
  });
  const sectionIds = sections.map((section) => section.id);
  if (
    new Set(sectionIds).size !== sectionIds.length ||
    sectionIds[0] !== "intro" ||
    sectionIds.at(-1) !== "catalog" ||
    sections.some((section) => {
      const definition = PAGE_SECTIONS.find((candidate) => candidate.id === section.id);
      return definition?.locked && !section.enabled;
    }) ||
    PAGE_SECTIONS.some((section) => section.id !== "discovery" && !sectionIds.includes(section.id))
  )
    throw new Error("Configuração pública da página inicial inválida.");

  const shelves = input.shelves as Record<string, unknown>;
  const selection = (value: unknown, weekly = false): ProductShelfSelection => {
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error("Configuração pública da página inicial inválida.");
    const item = value as Record<string, unknown>;
    if (
      !Array.isArray(item.productIds) ||
      item.productIds.length > 4 ||
      item.productIds.some((id) => typeof id !== "string" || !id.trim()) ||
      new Set(item.productIds).size !== item.productIds.length ||
      (weekly ? item.mode !== "manual" : !["manual", "automatico"].includes(item.mode as string))
    )
      throw new Error("Configuração pública da página inicial inválida.");
    return {
      mode: weekly ? "manual" : (item.mode as ProductShelfMode),
      productIds: [...(item.productIds as string[])],
    };
  };
  if (
    !Object.hasOwn(shelves, "weekly") ||
    !Object.hasOwn(shelves, "new") ||
    !Object.hasOwn(shelves, "room")
  )
    throw new Error("Configuração pública da página inicial inválida.");
  return {
    version: 1,
    revisionId: input.revisionId as number,
    appliedAt: input.appliedAt,
    sections,
    shelves: {
      weekly: selection(shelves.weekly, true) as PublishedHomePage["shelves"]["weekly"],
      new: selection(shelves.new),
      room: selection(shelves.room),
    },
  };
}
