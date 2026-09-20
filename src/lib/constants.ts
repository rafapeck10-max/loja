export const WHATSAPP_NUMBER = "5521984324338";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
export const WHATSAPP_DISPLAY = "(21) 98432-4338";
export const MAX_INSTALLMENTS = 12;
export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
type Icon = "armchair" | "sofa" | "tv" | "bed" | "cooking-pot" | "table" | "mattress";
export interface Category {
  slug: string;
  label: string;
  shortLabel: string;
  icon: Icon;
  description: string;
  dbLabels: readonly string[];
  children: readonly string[];
}
const definitions: [string, string, Icon, [string, string, string[]][]][] = [
  ["poltronas", "Poltronas", "armchair", [["poltronas-decorativas", "Poltronas", ["Poltronas"]]]],
  [
    "sofas",
    "Sofás",
    "sofa",
    [
      ["sofas-individuais", "Sofás individuais", ["Sofá", "Sofás"]],
      ["sofas-cama", "Sofás-cama", ["Sofás Cama"]],
      ["conjuntos-estofados", "Sofás fixos e conjuntos", ["Conjuntos Estofados"]],
      ["sofas-de-canto", "Sofás de canto", ["Conjuntos Estofados de Canto"]],
    ],
  ],
  [
    "paineis",
    "Painéis e racks",
    "tv",
    [
      ["paineis-para-tvs", "Painéis para TV", ["Painéis para TVs"]],
      ["racks-bancadas", "Racks e bancadas", ["Bancadas e Racks", "Rack,Painel e Bancada"]],
      ["homes", "Homes e estantes para TV", ["Homes", "Home theater"]],
      [
        "bancadas-suspensas",
        "Bancadas e painéis suspensos",
        ["Bancadas Suspensas", "Painel suspenso"],
      ],
      ["conjuntos-paineis-racks", "Conjuntos de painel e rack", ["Conjuntos de Painéis + Racks"]],
    ],
  ],
  [
    "dormitorios",
    "Quartos",
    "bed",
    [
      ["cabeceiras", "Cabeceiras", ["Cabeceiras"]],
      ["comodas", "Cômodas e sapateiras", ["Cômodas", "Cômodas e Sapateiras"]],
      ["mesas-de-cabeceira", "Mesas de cabeceira", ["Mesas de Cabeceira", "Mesas de cabeceira"]],
      ["penteadeiras", "Penteadeiras e camarins", ["Penteadeiras"]],
      ["roupeiros", "Guarda-roupas", ["Roupeiros"]],
      ["modulados-quarto", "Modulados para quarto", ["Modulados"]],
      ["livreiros-multiusos", "Livreiros e multiusos", ["Livreiros e Multiusos"]],
      ["camas-casal", "Camas de casal", ["Camas Casal"]],
      ["camas-solteiro", "Camas de solteiro", ["Camas Solteiro"]],
      ["camas-com-bau", "Camas com baú", ["Camas com Baú"]],
      ["beliches", "Beliches e camas auxiliares", ["Beliches e Camas Auxiliares"]],
      ["bicamas", "Bicamas", ["Bicamas com Cama Auxiliar"]],
      ["travesseiros-enxoval", "Travesseiros", ["Travesseiros"]],
    ],
  ],
  [
    "cozinha",
    "Cozinha",
    "cooking-pot",
    [
      [
        "cozinhas-completas",
        "Cozinhas completas",
        ["Cozinhas Completas", "Cozinhas Completas de MDF/MDP"],
      ],
      ["cozinhas-compactas", "Cozinhas compactas", ["Cozinhas Compactas de MDF/MDP"]],
      ["kits-cozinha", "Kits de cozinha", ["Kits de Cozinha", "Kits Cozinhas MDF/MDP"]],
      ["armarios-cozinha", "Armários e cozinhas moduladas", ["Armários de Cozinha"]],
      ["balcoes-aereos", "Balcões, aéreos e nichos", ["Balcões e Aéreos", "Balcões e Nichos"]],
      ["fruteiras", "Fruteiras", ["Fruteiras"]],
    ],
  ],
  [
    "salas-de-jantar",
    "Sala de jantar",
    "table",
    [
      ["mesas-de-jantar", "Mesas de jantar", ["Mesas de jantar", "Mesas de Jantar"]],
      [
        "conjuntos-mesa-cadeiras",
        "Mesas com cadeiras",
        ["Conjuntos ( Mesa C/ Cadeira )", "Conjuntos de Mesa e Cadeiras"],
      ],
      ["cadeiras", "Cadeiras", ["Cadeiras"]],
      ["banquetas", "Banquetas", ["Banqueta", "Banquetas"]],
      ["aparadores", "Aparadores e buffets", ["Aparadores"]],
      ["cristaleiras", "Cristaleiras", ["Cristaleiras"]],
    ],
  ],
  [
    "colchoes-e-bases",
    "Colchões e bases",
    "mattress",
    [
      [
        "colchoes",
        "Colchões",
        ["Colchões", "Colchões Casal", "Colchões Queen", "Colchões Solteiro"],
      ],
      ["bases", "Bases e baús", ["Bases", "Baús"]],
      ["cama-box", "Camas box", ["Colchobox e Cama Box"]],
      ["colchoes-caixas", "Colchões e caixas avulsos", ["Conjuntos"]],
    ],
  ],
  [
    "decoracao",
    "Decoração e complementos",
    "tv",
    [
      ["decoracao-acessorios", "Decoração", ["Decoração"]],
      ["complementos", "Complementos", ["Complementos"]],
      ["mesas-laterais", "Mesas laterais", ["Mesas Laterais"]],
    ],
  ],
];
export const SUBCATEGORIES: Category[] = definitions.flatMap(([, , icon, children]) =>
  children.map(([slug, label, dbLabels]) => ({
    slug,
    label,
    shortLabel: label,
    icon,
    dbLabels,
    children: [],
    description: "Explore os produtos desta seleção.",
  })),
);
export const CATEGORIES: Category[] = definitions.map(([slug, label, icon, children]) => ({
  slug,
  label,
  shortLabel: label,
  icon,
  children: children.map(([slug]) => slug),
  dbLabels: [...new Set(children.flatMap(([, , labels]) => labels))],
  description: "Escolha um tipo de produto ou explore toda a seleção.",
}));
const livingChildren = [
  "sofas",
  "poltronas",
  "paineis",
  "aparadores",
  "cristaleiras",
  "mesas-laterais",
];
CATEGORIES.splice(2, 0, {
  slug: "sala-de-estar",
  label: "Sala de estar",
  shortLabel: "Sala",
  icon: "tv",
  description: "Sofás, painéis, racks e móveis para sua sala.",
  children: livingChildren,
  dbLabels: [
    ...new Set(
      livingChildren.flatMap(
        (slug) => [...CATEGORIES, ...SUBCATEGORIES].find((c) => c.slug === slug)?.dbLabels ?? [],
      ),
    ),
  ],
});
const aliases: Record<string, string> = {
  sala: "sala-de-estar",
  quarto: "dormitorios",
  quartos: "dormitorios",
  racks: "racks-bancadas",
  "racks-paineis": "paineis",
  "paineis-racks": "paineis",
  "salas-jantar": "salas-de-jantar",
  "guarda-roupas": "roupeiros",
};
export const ALL_CATEGORIES = [...CATEGORIES, ...SUBCATEGORIES];
export const getCategory = (slug: string) =>
  ALL_CATEGORIES.find((c) => c.slug === (aliases[slug] ?? slug));
export const getSubcategories = (slug: string): Category[] =>
  (getCategory(slug)?.children ?? []).flatMap((child) => {
    const found = getCategory(child);
    return found ? [found] : [];
  });
export const normalizeCategory = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
export const categoryMatches = (value: string, slug: string) =>
  getCategory(slug)?.dbLabels.some(
    (label) => normalizeCategory(label) === normalizeCategory(value),
  ) ?? false;
export const PRODUCT_CATEGORY_OPTIONS = [...new Set(SUBCATEGORIES.flatMap((c) => c.dbLabels))].sort(
  (a, b) => a.localeCompare(b, "pt-BR"),
);
export type CategorySlug = string;
