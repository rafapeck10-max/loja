import { initialPageDraft } from "./pages-shelves";
import { initialBannerData } from "./banner-drafts";
import { initialCampaignData } from "./campaigns";
import {
  initialNavigation,
  initialContent,
  initialService,
  initialProductDrafts,
} from "./operational-config";
import { initialEvolutionData } from "./evolution";
import type { EditorProduct } from "./homepage-curation";
import type { HomepageBanner } from "./homepage-banners";

export function currentStudioSources(products: EditorProduct[], banners?: HomepageBanner[]) {
  return {
    pages: initialPageDraft(products),
    banners: initialBannerData(banners),
    products: initialProductDrafts(),
    campaigns: initialCampaignData(),
    navigation: initialNavigation(),
    content: initialContent(),
    service: initialService(),
    evolution: initialEvolutionData(),
  };
}
