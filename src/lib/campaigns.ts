import type { EditorProduct } from "./homepage-curation";
import { cardQuote, moneyCents } from "./payment.ts";
import { hasRealReferencePrice } from "./price-reference.ts";
import { PAGE_SECTIONS } from "./pages-shelves.ts";
import { DEFAULT_HOMEPAGE_BANNERS } from "./homepage-banners.ts";

export const CAMPAIGN_SECTIONS = PAGE_SECTIONS.map(({ id, title }) => ({ id, title }));
export const CAMPAIGN_BANNERS = DEFAULT_HOMEPAGE_BANNERS.map(({ position }) => ({
  id: `hero-${position}`,
  title: `Banner principal ${position}`,
}));
export interface CampaignParticipant {
  productId: string;
  proposedPriceCents: number;
  referencePriceCents: number | null;
  referenceEvidence: string;
  basePriceCents: number;
  baseVersion: string;
}
export interface Campaign {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  rules: string;
  status: "draft" | "review";
  simulation: "off" | "enabled" | "disabled" | "ended";
  participants: CampaignParticipant[];
  sectionIds: string[];
  bannerIds: string[];
}
export interface CampaignData {
  version: 1;
  campaigns: Campaign[];
}
export interface CampaignConflict {
  productId: string;
  message: string;
}
export function initialCampaignData(): CampaignData {
  return { version: 1, campaigns: [] };
}
export function createCampaign(id: string): Campaign {
  return {
    id,
    name: "",
    startsAt: "",
    endsAt: "",
    rules: "Preço fixo à vista/Pix por produto. Cartão conforme cálculo vigente da Mobi.",
    status: "draft",
    simulation: "off",
    participants: [],
    sectionIds: [],
    bannerIds: [],
  };
}

/** Decimal input is parsed as text: rounding a third decimal would conceal a price error. */
export function parsePriceCents(input: string): number | null {
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(input.trim())) return null;
  const [whole, decimal = ""] = input.trim().split(/[.,]/);
  const value = Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
  return validCents(value) ? value : null;
}
function validCents(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}
/** Catalog lacks a price revision column. This content fingerprint detects changes in available base commercial fields. */
export function campaignBaseVersion(product: EditorProduct): string {
  return JSON.stringify([product.id, product.preco_atual, product.preco_antigo ?? null]);
}
export function selectCampaignProduct(
  campaign: Campaign,
  product: EditorProduct,
  selected: boolean,
): Campaign {
  const remaining = campaign.participants.filter((p) => p.productId !== product.id);
  if (!selected) return { ...campaign, participants: remaining };
  if (campaign.participants.some((p) => p.productId === product.id)) return campaign;
  const price = moneyCents(Number(product.preco_atual));
  return {
    ...campaign,
    participants: [
      ...remaining,
      {
        productId: product.id,
        proposedPriceCents: price,
        referencePriceCents: null,
        referenceEvidence: "",
        basePriceCents: price,
        baseVersion: campaignBaseVersion(product),
      },
    ],
  };
}
export function isBrasiliaDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-03:00$/.test(value))
    return false;
  const timestamp = Date.parse(value);
  return (
    Number.isFinite(timestamp) &&
    new Date(timestamp - 3 * 3600000).toISOString().slice(0, 19) === value.slice(0, 19)
  );
}
export function campaignState(campaign: Campaign, at: string = new Date().toISOString()) {
  if (campaign.simulation === "ended") return "encerrada";
  if (campaign.simulation === "disabled") return "desativada";
  if (campaign.simulation !== "enabled")
    return campaign.status === "review" ? "em revisão" : "rascunho";
  if (
    !isBrasiliaDate(campaign.startsAt) ||
    !isBrasiliaDate(campaign.endsAt) ||
    Date.parse(campaign.endsAt) <= Date.parse(campaign.startsAt) ||
    !Number.isFinite(Date.parse(at))
  )
    return "inválida";
  if (Date.parse(at) < Date.parse(campaign.startsAt)) return "programada";
  return Date.parse(at) < Date.parse(campaign.endsAt) ? "ativa" : "encerrada";
}
export function compareCampaignPrice(normalCents: number, proposedCents: number) {
  if (!validCents(normalCents) || !validCents(proposedCents))
    throw new RangeError("Preço deve ter centavos inteiros positivos");
  return {
    normal: cardQuote(normalCents / 100, 10),
    proposed: cardQuote(proposedCents / 100, 10),
    benefitCents: normalCents - proposedCents,
  };
}
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
export function validateCampaignData(data: CampaignData, products: EditorProduct[]): string[] {
  if (
    !record(data) ||
    data.version !== 1 ||
    !Array.isArray(data.campaigns) ||
    data.campaigns.length > 100
  )
    return ["Formato de campanhas locais inválido."];
  const errors: string[] = [];
  const ids = new Set<string>();
  const validCampaigns: Campaign[] = [];
  const byId = new Map(products.map((p) => [p.id, p]));
  for (const candidate of data.campaigns) {
    if (
      !record(candidate) ||
      typeof candidate.id !== "string" ||
      !candidate.id.trim() ||
      ids.has(candidate.id)
    ) {
      errors.push("Campanha com ID ausente ou duplicado.");
      continue;
    }
    ids.add(candidate.id);
    const prefix =
      typeof candidate.name === "string" && candidate.name.trim() ? candidate.name : candidate.id;
    if (typeof candidate.name !== "string" || !candidate.name.trim() || candidate.name.length > 120)
      errors.push(`${prefix}: informe um nome de até 120 caracteres.`);
    if (
      typeof candidate.rules !== "string" ||
      !candidate.rules.trim() ||
      candidate.rules.length > 3000
    )
      errors.push(`${prefix}: informe as regras comerciais (até 3000 caracteres).`);
    const datesValid =
      isBrasiliaDate(candidate.startsAt) &&
      isBrasiliaDate(candidate.endsAt) &&
      Date.parse(candidate.endsAt) > Date.parse(candidate.startsAt);
    if (!datesValid)
      errors.push(
        `${prefix}: início/fim devem ser datas reais, com offset -03:00 de Brasília e fim posterior ao início.`,
      );
    if (
      !["draft", "review"].includes(String(candidate.status)) ||
      !["off", "enabled", "disabled", "ended"].includes(String(candidate.simulation))
    )
      errors.push(`${prefix}: estado local inválido.`);
    if (candidate.simulation === "enabled" && candidate.status !== "review")
      errors.push(`${prefix}: revise antes de habilitar a simulação.`);
    for (const [key, known, label] of [
      ["sectionIds", CAMPAIGN_SECTIONS.map((s) => s.id), "seção"],
      ["bannerIds", CAMPAIGN_BANNERS.map((b) => b.id), "banner"],
    ] as const) {
      const values = candidate[key];
      if (
        !Array.isArray(values) ||
        values.some((id) => typeof id !== "string" || !(known as readonly string[]).includes(id)) ||
        new Set(values).size !== values.length
      )
        errors.push(`${prefix}: associação de ${label} desconhecida ou duplicada.`);
    }
    if (
      !Array.isArray(candidate.participants) ||
      !candidate.participants.length ||
      candidate.participants.length > 1000
    ) {
      errors.push(`${prefix}: selecione de 1 a 1000 produtos participantes.`);
      continue;
    }
    const participantIds = new Set<string>();
    let safe = datesValid;
    for (const p of candidate.participants) {
      if (!record(p) || typeof p.productId !== "string") {
        errors.push(`${prefix}: participante inválido.`);
        safe = false;
        continue;
      }
      const product = byId.get(p.productId);
      if (!product || participantIds.has(p.productId))
        errors.push(`${prefix}: produto ${p.productId} ausente do catálogo ou duplicado.`);
      participantIds.add(p.productId);
      if (!validCents(p.proposedPriceCents) || !validCents(p.basePriceCents))
        errors.push(
          `${prefix}: ${p.productId} exige preço e fotografia em centavos inteiros positivos.`,
        );
      else {
        try {
          compareCampaignPrice(p.basePriceCents, p.proposedPriceCents);
        } catch {
          errors.push(`${prefix}: ${p.productId} ultrapassa o limite do cálculo comercial.`);
        }
      }
      if (typeof p.baseVersion !== "string" || !p.baseVersion.length)
        errors.push(`${prefix}: ${p.productId} sem versão-base.`);
      if (
        product &&
        (!Number.isFinite(Number(product.preco_atual)) || Number(product.preco_atual) <= 0)
      )
        errors.push(`${prefix}: ${p.productId} sem preço-base válido.`);
      if (
        p.referencePriceCents !== null &&
        (!validCents(p.referencePriceCents) ||
          !validCents(p.proposedPriceCents) ||
          !hasRealReferencePrice(p.referencePriceCents / 100, p.proposedPriceCents / 100) ||
          typeof p.referenceEvidence !== "string" ||
          !p.referenceEvidence.trim())
      )
        errors.push(
          `${prefix}: referência de ${p.productId} precisa ser real, superior à proposta e acompanhada de origem; não gerar acréscimo artificial.`,
        );
      if (typeof p.referenceEvidence !== "string")
        errors.push(`${prefix}: origem da referência inválida.`);
    }
    if (safe) validCampaigns.push(candidate as unknown as Campaign);
  }
  for (let i = 0; i < validCampaigns.length; i++)
    for (let j = i + 1; j < validCampaigns.length; j++) {
      const a = validCampaigns[i],
        b = validCampaigns[j];
      if (
        a.simulation === "enabled" &&
        b.simulation === "enabled" &&
        Date.parse(a.startsAt) < Date.parse(b.endsAt) &&
        Date.parse(b.startsAt) < Date.parse(a.endsAt) &&
        a.participants.some((p) => b.participants.some((q) => p.productId === q.productId))
      )
        errors.push(`${a.name} / ${b.name}: sobreposição de simulações para o mesmo produto.`);
    }
  return errors;
}
export function campaignConflicts(
  campaign: Campaign,
  products: EditorProduct[],
): CampaignConflict[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  return campaign.participants.flatMap((p) => {
    const product = byId.get(p.productId);
    return !product || campaignBaseVersion(product) !== p.baseVersion
      ? [
          {
            productId: p.productId,
            message: `${product?.nome ?? p.productId}: base alterada ou produto ausente. Preserve a base atual; remova e selecione novamente para revisar uma nova proposta.`,
          },
        ]
      : [];
  });
}
export function previewCampaignProducts(
  campaign: Campaign,
  products: EditorProduct[],
  at?: string,
) {
  const conflicts = campaignConflicts(campaign, products);
  const invalid = validateCampaignData({ version: 1, campaigns: [campaign] }, products).length > 0;
  const blocked = new Set(conflicts.map((c) => c.productId));
  const overrides = new Map(
    campaignState(campaign, at) === "ativa" && !invalid
      ? campaign.participants.filter((p) => !blocked.has(p.productId)).map((p) => [p.productId, p])
      : [],
  );
  return {
    conflicts,
    overriddenIds: [...overrides.keys()],
    products: products.map((product) => {
      const p = overrides.get(product.id);
      return p
        ? {
            ...product,
            preco_atual: p.proposedPriceCents / 100,
            preco_antigo: p.referencePriceCents === null ? null : p.referencePriceCents / 100,
          }
        : { ...product };
    }),
  };
}
/** Closing only removes the applicability of local overrides. No historical product row is written back. */
export function endCampaign(data: CampaignData, id: string, products: EditorProduct[]) {
  const campaign = data.campaigns.find((c) => c.id === id);
  return {
    data: {
      ...data,
      campaigns: data.campaigns.map((c) =>
        c.id === id ? { ...c, simulation: "ended" as const } : c,
      ),
    },
    products: products.map((p) => ({ ...p })),
    conflicts: campaign ? campaignConflicts(campaign, products) : [],
  };
}
