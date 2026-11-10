import type { StudioScope } from "./admin-studio.ts";
import type { EditorProduct } from "./homepage-curation.ts";
import { normalizePageDraft, sourceVersion } from "./pages-shelves.ts";
import { validateBannerData, type BannerData } from "./banner-drafts.ts";
import { validateCampaignData, type CampaignData } from "./campaigns.ts";
import { validateEvolutionData } from "./evolution.ts";
import {
  validateNavigation,
  validateContent,
  validateService,
  validateProductDrafts,
  type NavigationData,
  type ContentData,
  type ServiceData,
  type ProductDraftData,
} from "./operational-config.ts";
export const shouldLoadWorkspace = (loadedKey: string | null, nextKey: string, ready: boolean) =>
  ready && loadedKey !== nextKey;
export function validateStudioResource(
  scope: StudioScope,
  value: unknown,
  products: EditorProduct[],
  resources: Partial<Record<StudioScope, unknown>>,
): string[] {
  try {
    const productDraft = resources.products as ProductDraftData | undefined;
    const working = products.map((p) => productDraft?.changes?.[p.id]?.product ?? p);
    switch (scope) {
      case "pages": {
        const d = normalizePageDraft(value, working);
        const errors: string[] = [];
        if (d?.baseVersion !== sourceVersion(working))
          errors.push(
            "O catálogo mudou desde a base desta página. Restaure os dados consultados e revise antes de salvar, revisar ou restaurar.",
          );
        return errors;
      }
      case "banners": {
        const errors = validateBannerData(value);
        const ids = new Set((value as BannerData)?.banners?.map((b) => b.id) ?? []);
        const campaigns = resources.campaigns as CampaignData | undefined;
        if (campaigns?.campaigns?.some((c) => c.bannerIds.some((id) => !ids.has(id))))
          errors.push(
            "Um banner está associado a uma campanha. Remova o vínculo antes de excluir a mídia.",
          );
        return errors;
      }
      case "products":
        return validateProductDrafts(value as ProductDraftData, products);
      case "campaigns": {
        const errors = validateCampaignData(value as CampaignData, working);
        const banners = resources.banners as BannerData | undefined;
        const ids = banners
          ? new Set(banners.banners.map((b) => b.id))
          : new Set(["hero-1", "hero-2", "hero-3"]);
        if ((value as CampaignData)?.campaigns?.some((c) => c.bannerIds.some((id) => !ids.has(id))))
          errors.push("Há banner associado que não existe na biblioteca atual.");
        return errors;
      }
      case "navigation":
        return validateNavigation(value as NavigationData);
      case "content":
        return validateContent(value as ContentData);
      case "service":
        return validateService(value as ServiceData);
      case "evolution":
        return validateEvolutionData(value);
    }
  } catch {
    return ["Configuração inválida. Preserve a cópia e revise os campos."];
  }
}
