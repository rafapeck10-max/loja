import {
  initialPageDraft,
  normalizePageDraft,
  validatePageDraft,
  sourceVersion,
  sectionProducts,
  toStorefrontProducts,
  type PageDraft,
  type PageSection,
} from "./pages-shelves.ts";
import { validateBannerData, type BannerData, type BannerDraft } from "./banner-drafts.ts";
import {
  validateNavigation,
  validateService,
  type NavigationData,
  type ServiceData,
} from "./operational-config.ts";
import { isCurationProduct, type EditorProduct, type CurationDraft } from "./homepage-curation.ts";
import {
  campaignConflicts,
  campaignState,
  isBrasiliaDate,
  validateCampaignData,
  type CampaignData,
} from "./campaigns.ts";
import type { Produto } from "./products.functions";

export interface HomeDraftInput {
  pages: PageDraft;
  banners: BannerData;
  navigation: NavigationData;
  service: ServiceData;
  campaigns?: CampaignData;
}
export type HomeBanner = Pick<
  BannerDraft,
  | "id"
  | "position"
  | "image_url"
  | "mobile_image_url"
  | "alt"
  | "show_text"
  | "eyebrow"
  | "title"
  | "subtitle"
  | "cta_label"
  | "cta_href"
  | "active"
  | "starts_at"
  | "ends_at"
>;
export interface HomeConfiguration {
  schemaVersion: 1;
  sections: PageSection[];
  sectionIds: Record<"weekly" | "discovery" | "new" | "room", string[]>;
  blackFridayCampaigns?: HomeCampaignPreview[];
  curation?: CurationDraft;
  banners: HomeBanner[];
  navigation: { id: string; label: string; href: string; visible: boolean }[];
  service: Pick<ServiceData, "regionMessage" | "deliveryMessage" | "assemblyMessage">;
}
export interface HomeCampaignPreview {
  id: string;
  startsAt: string;
  endsAt: string;
  productIds: string[];
  source: "local-preview";
}
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

/** Reduces reviewed PM-05 entries to the fields needed by the local home preview. */
export function projectBlackFridayCampaigns(
  data: CampaignData | undefined,
  products: EditorProduct[],
  at = new Date(),
): HomeCampaignPreview[] {
  if (!data || !Array.isArray(data.campaigns)) return [];
  const publicIds = new Set(products.filter(isCurationProduct).map((product) => product.id));
  const campaignIds = new Set<string>();
  for (const campaign of data.campaigns) {
    if (!campaign || typeof campaign.id !== "string" || !campaign.id.trim()) continue;
    if (campaignIds.has(campaign.id))
      throw new Error(`O ID ${campaign.id} aparece mais de uma vez no PM-05.`);
    campaignIds.add(campaign.id);
  }
  const validSimulations = data.campaigns.filter(
    (campaign) =>
      campaign?.status === "review" &&
      campaign.simulation === "enabled" &&
      !validateCampaignData({ version: 1, campaigns: [campaign] }, products).length &&
      !campaignConflicts(campaign, products).length,
  );
  const eligible = validSimulations.filter(
    (campaign) =>
      campaign.sectionIds.includes("blackFriday") &&
      ["programada", "ativa"].includes(campaignState(campaign, at.toISOString())) &&
      campaign.participants.some((participant) => publicIds.has(participant.productId)),
  );
  for (const campaign of eligible) {
    for (const other of validSimulations) {
      if (
        campaign.id === other.id ||
        Date.parse(campaign.startsAt) >= Date.parse(other.endsAt) ||
        Date.parse(other.startsAt) >= Date.parse(campaign.endsAt)
      )
        continue;
      const conflictingProduct = campaign.participants.find(
        (participant) =>
          publicIds.has(participant.productId) &&
          other.participants.some((candidate) => candidate.productId === participant.productId),
      );
      if (conflictingProduct)
        throw new Error(
          `A campanha ${campaign.id} conflita com ${other.id} para o produto ${conflictingProduct.productId}. Revise as simulações no PM-05.`,
        );
    }
  }
  const owners = new Map<string, string>();
  for (const campaign of eligible) {
    for (const participant of campaign.participants) {
      if (!publicIds.has(participant.productId)) continue;
      const owner = owners.get(participant.productId);
      if (owner)
        throw new Error(
          `O produto ${participant.productId} está em mais de uma campanha Black Friday (${owner} e ${campaign.id}). Revise os vínculos no PM-05.`,
        );
      owners.set(participant.productId, campaign.id);
    }
  }
  return eligible.flatMap((campaign) => {
    const productIds = campaign.participants
      .map((participant) => participant.productId)
      .filter((id) => publicIds.has(id));
    return productIds.length
      ? [
          {
            id: campaign.id,
            startsAt: campaign.startsAt,
            endsAt: campaign.endsAt,
            productIds,
            source: "local-preview" as const,
          },
        ]
      : [];
  });
}

/** Only currently active local campaign projections can supply home cards. */
export function activeBlackFridayProductIds(
  config: Pick<HomeConfiguration, "blackFridayCampaigns"> | null | undefined,
  at = new Date(),
): string[] {
  const timestamp = at.getTime();
  if (!Number.isFinite(timestamp)) return [];
  const seen = new Set<string>();
  return (config?.blackFridayCampaigns ?? []).flatMap((campaign) => {
    if (
      !campaign ||
      campaign.source !== "local-preview" ||
      !isBrasiliaDate(campaign.startsAt) ||
      !isBrasiliaDate(campaign.endsAt) ||
      !Array.isArray(campaign.productIds) ||
      Date.parse(campaign.endsAt) <= Date.parse(campaign.startsAt) ||
      timestamp < Date.parse(campaign.startsAt) ||
      timestamp >= Date.parse(campaign.endsAt)
    )
      return [];
    return campaign.productIds.filter((id) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  });
}

/** Preloads active and scheduled campaign products so a page open before the start can update in place. */
export function blackFridayProductIdsToLoad(
  config: Pick<HomeConfiguration, "blackFridayCampaigns"> | null | undefined,
  at = new Date(),
): string[] {
  const timestamp = at.getTime();
  if (!Number.isFinite(timestamp)) return [];
  const seen = new Set<string>();
  return (config?.blackFridayCampaigns ?? []).flatMap((campaign) => {
    if (
      !campaign ||
      campaign.source !== "local-preview" ||
      !isBrasiliaDate(campaign.startsAt) ||
      !isBrasiliaDate(campaign.endsAt) ||
      !Array.isArray(campaign.productIds) ||
      Date.parse(campaign.endsAt) <= Date.parse(campaign.startsAt) ||
      Date.parse(campaign.endsAt) <= timestamp
    )
      return [];
    return campaign.productIds.filter((id) => {
      if (typeof id !== "string" || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  });
}

/** Explicit public projection. Never serialize the admin workspace or catalog baseVersion. */
export function homeConfigurationFromDraft(
  d: HomeDraftInput,
  products: EditorProduct[],
  now = new Date(),
): HomeConfiguration {
  if (!d?.pages || d.pages.baseVersion !== sourceVersion(products))
    throw new Error("O catálogo mudou. Reabra a fonte e revise os conflitos.");
  const errors = [
    ...validatePageDraft(d.pages, products),
    ...validateBannerData(d.banners),
    ...validateNavigation(d.navigation),
    ...validateService(d.service),
  ];
  if (errors.length) throw new Error(errors.join(" "));
  const publicProducts = toStorefrontProducts(products, d.pages.curation);
  const publicIds = new Set(publicProducts.map((p) => p.id));
  const blackFridayCampaigns = projectBlackFridayCampaigns(d.campaigns, products, now)
    .map((campaign) => ({
      ...campaign,
      productIds: campaign.productIds.filter((id) => publicIds.has(id)),
    }))
    .filter((campaign) => campaign.productIds.length > 0);
  return {
    schemaVersion: 1,
    curation: {
      weeklyIds: [...d.pages.curation.weeklyIds],
      settings: Object.fromEntries(
        Object.entries(d.pages.curation.settings)
          .filter(([id]) => publicIds.has(id))
          .map(([id, s]) => [id, { novidade: s.novidade, sala: s.sala, descoberta: s.descoberta }]),
      ),
    },
    sections: d.pages.sections.map(({ id, title, subtitle, type, enabled }) => ({
      id,
      title,
      subtitle,
      type,
      enabled,
    })),
    sectionIds: Object.fromEntries(
      ["weekly", "discovery", "new", "room"].map((id) => [
        id,
        sectionProducts(id as PageSection["id"], publicProducts, now).map((p) => p.id),
      ]),
    ) as HomeConfiguration["sectionIds"],
    ...(blackFridayCampaigns.length ? { blackFridayCampaigns } : {}),
    banners: d.banners.banners.map((b) => ({
      id: b.id,
      position: b.position,
      image_url: b.image_url,
      mobile_image_url: b.mobile_image_url,
      alt: b.alt,
      show_text: b.show_text,
      eyebrow: b.eyebrow,
      title: b.title,
      subtitle: b.subtitle,
      cta_label: b.cta_label,
      cta_href: b.cta_href,
      active: b.active,
      starts_at: b.starts_at,
      ends_at: b.ends_at,
    })),
    navigation: d.navigation.items.map(({ id, label, href, visible }) => ({
      id,
      label,
      href,
      visible,
    })),
    service: {
      regionMessage: d.service.regionMessage,
      deliveryMessage: d.service.deliveryMessage,
      assemblyMessage: d.service.assemblyMessage,
    },
  };
}
export const defaultHomeSections = () => initialPageDraft([]).sections;
export function reopenHomeDraft(
  config: HomeConfiguration,
  products: EditorProduct[],
  current: HomeDraftInput,
): HomeDraftInput {
  const base = initialPageDraft(products);
  const next: HomeDraftInput = {
    pages: {
      ...base,
      sections: clone(config.sections),
      curation: config.curation
        ? {
            weeklyIds: [...config.curation.weeklyIds],
            settings: { ...base.curation.settings, ...clone(config.curation.settings) },
          }
        : base.curation,
    },
    banners: {
      banners: config.banners.map((b) => ({ ...clone(b), name: b.title || b.id, updated_at: "" })),
    },
    navigation: {
      items: config.navigation.map((n) => ({
        ...clone(current.navigation.items.find((i) => i.id === n.id)!),
        ...clone(n),
      })),
    },
    service: { ...clone(current.service), ...clone(config.service) },
    ...(current.campaigns ? { campaigns: clone(current.campaigns) } : {}),
  };
  next.pages = normalizePageDraft(next.pages, products);
  homeConfigurationFromDraft(next, products);
  return next;
}
export function applyHomeCuration(products: Produto[], curation?: CurationDraft): Produto[] {
  if (!curation) return products;
  return products.map((p) => ({
    ...p,
    curadoriaDisponivel: true,
    vitrine_semana_ordem: curation.weeklyIds.includes(p.id)
      ? curation.weeklyIds.indexOf(p.id) + 1
      : null,
    vitrine_novidade: curation.settings[p.id]?.novidade ?? p.vitrine_novidade,
    vitrine_sala: curation.settings[p.id]?.sala ?? p.vitrine_sala,
    vitrine_descoberta: curation.settings[p.id]?.descoberta ?? p.vitrine_descoberta,
  }));
}
export function homeProductSelections(
  products: Produto[],
  config?: Pick<HomeConfiguration, "curation"> | null,
  date = new Date(),
) {
  const current = applyHomeCuration(products, config?.curation);
  return {
    weekly: sectionProducts("weekly", current, date),
    discovery: sectionProducts("discovery", current, date),
    new: sectionProducts("new", current, date),
    room: sectionProducts("room", current, date),
  };
}
/** Exact comparison stored privately, never included in the public DTO. */
export function sourceFingerprint(products: EditorProduct[]) {
  return sourceVersion(products);
}
export interface HomeRevision {
  id: number;
  baseVersion: number | null;
  sourceVersion: string;
  createdAt: string;
  status: "draft" | "reviewed" | "applied";
  config: HomeConfiguration;
  restoredFrom?: number;
}
export interface HomeDocument {
  schemaVersion: 1;
  sequence: number;
  publishedId: number | null;
  revisions: HomeRevision[];
}
export type HomeCommand = { expected: number; sourceVersion: string } & (
  | { action: "save"; config: HomeConfiguration }
  | { action: "review" | "apply" | "restore"; id: number }
);
export const newHomeDocument = (): HomeDocument => ({
  schemaVersion: 1,
  sequence: 0,
  publishedId: null,
  revisions: [],
});
export function changeHomeDocument(
  document: HomeDocument,
  command: HomeCommand,
  date = new Date().toISOString(),
): HomeDocument {
  if (!Number.isSafeInteger(command.expected) || command.expected !== document.sequence)
    throw new Error("Conflito: há uma versão mais recente no servidor. Reabra antes de continuar.");
  const d = clone(document);
  if (command.action === "save") {
    if (command.config.schemaVersion !== 1) throw new Error("Configuração incompatível.");
    d.revisions.push({
      id: d.sequence + 1,
      baseVersion: d.publishedId,
      sourceVersion: command.sourceVersion,
      createdAt: date,
      status: "draft",
      config: clone(command.config),
    });
  } else {
    const r = d.revisions.find((r) => r.id === command.id);
    if (!r) throw new Error("Revisão não encontrada.");
    if (r.sourceVersion !== command.sourceVersion)
      throw new Error("O catálogo mudou desde esta revisão. Compare antes de continuar.");
    if (command.action === "restore") {
      d.revisions.push({
        id: d.sequence + 1,
        baseVersion: d.publishedId,
        sourceVersion: command.sourceVersion,
        createdAt: date,
        status: "draft",
        config: clone(r.config),
        restoredFrom: r.id,
      });
    } else {
      if (r.baseVersion !== d.publishedId)
        throw new Error("Conflito: a versão aplicada mudou desde este rascunho.");
      if (command.action === "apply") {
        if (r.status !== "reviewed") throw new Error("Revise esta versão antes de aplicar.");
        r.status = "applied";
        d.publishedId = r.id;
      } else {
        if (r.status !== "draft") throw new Error("Somente rascunhos podem ser revisados.");
        r.status = "reviewed";
      }
    }
  }
  d.sequence++;
  if (JSON.stringify(d).length > 12_000_000)
    throw new Error("Limite do histórico local atingido. Exporte antes de continuar.");
  return d;
}
export function publicHomeConfiguration(d: HomeDocument) {
  const r = d.revisions.find((r) => r.id === d.publishedId && r.status === "applied");
  return r ? { revisionId: r.id, config: clone(r.config) } : null;
}
