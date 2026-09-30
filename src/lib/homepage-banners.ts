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

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1400&q=80";

export const DEFAULT_HOMEPAGE_BANNERS: HomepageBanner[] = [
  {
    position: 1,
    image_url: DEFAULT_IMAGE,
    eyebrow: "COLEÇÃO MOBI",
    title: "Ambientes que fazem sentido.",
    subtitle: "Móveis que combinam com a sua vida.",
    cta_label: "Encontre seu próximo móvel",
    cta_href: "/?all=true#catalogo",
    active: true,
    updated_at: "",
  },
  {
    position: 2,
    image_url: DEFAULT_IMAGE,
    eyebrow: "COLEÇÃO MOBI",
    title: "Um novo jeito de morar.",
    subtitle: "Móveis que combinam com a sua vida.",
    cta_label: "Encontre seu próximo móvel",
    cta_href: "/?all=true#catalogo",
    active: true,
    updated_at: "",
  },
  {
    position: 3,
    image_url: DEFAULT_IMAGE,
    eyebrow: "COLEÇÃO MOBI",
    title: "Seu lar, com mais estilo.",
    subtitle: "Móveis que combinam com a sua vida.",
    cta_label: "Encontre seu próximo móvel",
    cta_href: "/?all=true#catalogo",
    active: true,
    updated_at: "",
  },
];

export const HOMEPAGE_BANNERS_QUERY_KEY = ["homepage-banners"] as const;
