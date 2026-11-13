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

// Product photograph already used by the Mobi catalog; no invented room or promotional price.
const DEFAULT_IMAGE = "https://srmoveisatacadao.com.br/imagem/Jamile.Azul.305%20NOVO%20.jpg";
export const DEFAULT_HOMEPAGE_BANNERS: HomepageBanner[] = [
  {
    position: 1,
    image_url: DEFAULT_IMAGE,
    eyebrow: "ESCOLHAS MOBI",
    title: "Sua próxima poltrona.",
    subtitle: "Veja modelos, cores e medidas. Escolha com a ajuda da Mobi.",
    cta_label: "Escolher uma poltrona",
    cta_href: "/categoria/poltronas",
    active: true,
    updated_at: "",
  },
];

export const HOMEPAGE_BANNERS_QUERY_KEY = ["homepage-banners"] as const;
