export interface HomepageBanner {
  position: number;
  image_url: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta_label: string;
  cta_href: string;
  active: boolean;
  updated_at: string;
}

export type HomepageBannerInput = Omit<HomepageBanner, "updated_at">;

// Approved artwork pair: one independent composition per viewport.
const bannerImage = (name: string, format: string) =>
  `https://www.mobimb.com.br/banners/mobi-20261117-${name}-${format}.webp`;
export const DEFAULT_HOMEPAGE_BANNERS: HomepageBanner[] = [
  {
    position: 1,
    image_url: bannerImage("black", "desktop"),
    eyebrow: "",
    title: "Black Friday Mobi — confira os modelos",
    subtitle: "",
    cta_label: "Confira os modelos",
    cta_href: "/categoria/sofas",
    active: true,
    updated_at: "",
  },
  {
    position: 2,
    image_url: bannerImage("genova", "desktop"),
    eyebrow: "",
    title: "Sofá Genova retrátil e reclinável — 2,30 m",
    subtitle: "",
    cta_label: "Conheça o Genova",
    cta_href:
      "/produto/estofado-retratil-reclinavel-genova-230-2x90-molas-ensacadas-veludo-in-6750-6769-230",
    active: true,
    updated_at: "",
  },
  {
    position: 3,
    image_url: bannerImage("sara", "desktop"),
    eyebrow: "",
    title: "Sofá Sara com baú — 1,98 m",
    subtitle: "",
    cta_label: "Conheça o Sara",
    cta_href: "/produto/alpoim-9602",
    active: true,
    updated_at: "",
  },
];

/** Retains mobile pairing for the existing single-image database contract. */
export function approvedBannerArtwork(imageUrl: string) {
  const banner = DEFAULT_HOMEPAGE_BANNERS.find((item) => item.image_url === imageUrl);
  return banner
    ? {
        mobile: imageUrl.replace("-desktop.webp", "-mobile.webp"),
        background: banner.position === 1 ? "#0b0b0b" : "#252f27",
      }
    : undefined;
}

export const HOMEPAGE_BANNERS_QUERY_KEY = ["homepage-banners"] as const;
