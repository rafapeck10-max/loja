export interface ProductColor {
  name: string;
  hex: string;
}

export interface ProductDetail {
  tag: string;
  fullTitle: string;
  category: string;
  images: { src: string; alt: string }[];
  colors: ProductColor[];
  finishes: string[];
  description: string;
  pixPrice?: number;
  specs: { label: string; value: string }[];
}

/**
 * Conteúdo rico das páginas de produto (galeria, cores, acabamentos, specs),
 * migrado do repositório base (produto_mobili.html / data/products.json).
 * Os preços e dados da vitrine vêm da tabela `produtos` no banco.
 */
export const PRODUCT_DETAILS: Record<string, ProductDetail> = {
  "poltrona-velvet": {
    tag: "Coleção Raízes  |  Exclusivo Mobili",
    fullTitle: "Poltrona de Veludo Azul Royal e Base em Ouro",
    category: "Poltronas",
    images: [
      {
        src: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800",
        alt: "Vista Principal",
      },
      {
        src: "https://images.unsplash.com/photo-1506898667547-42e22a46e125?w=800",
        alt: "Detalhe do Tecido",
      },
      {
        src: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
        alt: "Ambientada",
      },
      {
        src: "https://images.unsplash.com/photo-1503602642458-232111445657?w=800",
        alt: "Vista de Perfil",
      },
    ],
    colors: [
      { name: "Azul Royal", hex: "#0b3c5d" },
      { name: "Verde Esmeralda", hex: "#0b5d3c" },
      { name: "Cacau Premium", hex: "#493327" },
      { name: "Areia Soft", hex: "#d1c7bd" },
    ],
    finishes: ["Ouro Fosco", "Champagne", "Preto Carbono"],
    description:
      "A Poltrona Raízes une a opulência do veludo italiano em tom Azul Royal à imponência da sua base estrutural banhada em tonalidade ouro fosco. Uma verdadeira obra de arte do design contemporâneo que traz personalidade e luxo incomparável ao seu espaço de estar ou dormitório. Conforto anatômico premium com espuma D-28 Soft de alta resiliência.",
    specs: [
      {
        label: "Estrutura",
        value: "Madeira 100% reflorestada de eucalipto seco, imune a cupins.",
      },
      {
        label: "Espuma",
        value: "Assento D-28 Soft com molas Bonnel e percintas elásticas italianas.",
      },
      {
        label: "Revestimento",
        value: "Tecido Veludo Italiano Importado de toque ultra macio.",
      },
      {
        label: "Base / Pés",
        value: "Aço maciço estrutural com pintura automotiva termoestabilizada.",
      },
      {
        label: "Dimensões",
        value: "85cm (Altura) x 82cm (Largura) x 80cm (Profundidade).",
      },
      { label: "Peso Suportado", value: "Até 150 kg distribuídos." },
    ],
  },
  "sofa-retratil-grafite": {
    tag: "Coleção Raízes  |  Exclusivo Mobili",
    fullTitle: "Sofá Retrátil Suede Grafite com Assento Modular",
    category: "Sofás",
    images: [
      {
        src: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
        alt: "Vista Principal",
      },
      {
        src: "https://images.unsplash.com/photo-1582582425239-0d84e84ee44a?w=800",
        alt: "Ambientado",
      },
      {
        src: "https://images.unsplash.com/photo-1600188628105-11913eceb743?w=800",
        alt: "Detalhe do Assento",
      },
    ],
    colors: [
      { name: "Cinza Urbano", hex: "#6e7f80" },
      { name: "Bege Soft", hex: "#d1c7bd" },
      { name: "Cacau Premium", hex: "#493327" },
    ],
    finishes: ["Madeira Nobre", "Aço Escovado"],
    description:
      "Sofá modular com mecanismo retrátil, assento em espuma de alta densidade e cobertura em tecido suede premium. Conforto de shopping com preço de fábrica.",
    specs: [
      { label: "Estrutura", value: "Madeira reflorestada com reforço em aço." },
      { label: "Espuma", value: "Assento D-33 de alta densidade e resiliência." },
      { label: "Revestimento", value: "Suede premium anti-manchas." },
      { label: "Dimensões", value: "90cm (Altura) x 230cm (Largura) x 105cm (Profundidade)." },
    ],
  },
  "mesa-jantar-nogueira": {
    tag: "Coleção Raízes  |  Exclusivo Mobili",
    fullTitle: "Mesa de Jantar Nogueira Imperial 6 Lugares",
    category: "Salas de Jantar",
    images: [
      {
        src: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800",
        alt: "Vista Principal",
      },
      {
        src: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800",
        alt: "Ambientada",
      },
    ],
    colors: [
      { name: "Nogueira", hex: "#5c4033" },
      { name: "Off White", hex: "#f2ede4" },
    ],
    finishes: ["Verniz Fosco", "Laca Brilhante"],
    description:
      "Mesa de jantar em madeira nogueira maciça com acabamento imperial. Tampo espesso e base escultural que transforma sua sala de jantar em um ambiente de alto padrão.",
    specs: [
      { label: "Tampo", value: "Madeira nogueira maciça com 4cm de espessura." },
      { label: "Base", value: "Base escultural em madeira torneada." },
      { label: "Dimensões", value: "78cm (Altura) x 180cm (Largura) x 90cm (Profundidade)." },
    ],
  },
  "aparador-buffet-palha": {
    tag: "Coleção Raízes  |  Exclusivo Mobili",
    fullTitle: "Aparador Buffet Palha Natural Trançada",
    category: "Salas de Jantar",
    images: [
      {
        src: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800",
        alt: "Vista Principal",
      },
      {
        src: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800",
        alt: "Ambientado",
      },
    ],
    colors: [
      { name: "Natural", hex: "#c9a878" },
      { name: "Cacau Premium", hex: "#493327" },
    ],
    finishes: ["Pés Dourados", "Pés Madeira"],
    description:
      "Aparador buffet com portas em palha natural trançada à mão. Peça artesanal que une o design orgânico da coleção Raízes ao acabamento sofisticado Mobili.",
    specs: [
      { label: "Estrutura", value: "MDF naval com lâmina de madeira natural." },
      { label: "Portas", value: "Palha natural trançada artesanalmente." },
      { label: "Dimensões", value: "80cm (Altura) x 160cm (Largura) x 45cm (Profundidade)." },
    ],
  },
};

export const FALLBACK_DETAIL: Omit<ProductDetail, "images" | "fullTitle"> = {
  tag: "Coleção Raízes  |  Exclusivo Mobili",
  category: "Coleção Raízes",
  colors: [],
  finishes: [],
  description:
    "Peça exclusiva da coleção Raízes do Luxo, produzida direto da fábrica com acabamento premium e entrega em toda a Baixada Fluminense.",
  specs: [],
};
