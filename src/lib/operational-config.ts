import {
  CATEGORIES,
  ALL_CATEGORIES,
  getCategory,
  WHATSAPP_NUMBER,
  formatBRL,
} from "./constants.ts";
import {
  getCatalogColors,
  getCatalogMaterials,
  getCatalogFeatures,
  getCatalogDimensions,
} from "./catalog-search.ts";
import type { EditorProduct } from "./homepage-curation.ts";
import { isEligibleBundleProduct, normalizeProductBundleIds } from "./product-bundles.ts";
export const FILTER_LABELS = {
  material: "Material",
  color: "Cor",
  dimensions: "Medidas",
  features: "Características",
};
export type FilterKey = keyof typeof FILTER_LABELS;
export interface NavigationItem {
  id: string;
  slug: string;
  label: string;
  href: string;
  visible: boolean;
  filters: FilterKey[];
}
export interface NavigationData {
  items: NavigationItem[];
}
export const initialNavigation = (): NavigationData => ({
  items: CATEGORIES.map((c) => ({
    id: c.slug,
    slug: c.slug,
    label: c.label,
    href: `/categoria/${c.slug}`,
    visible: true,
    filters: ["material", "color", "dimensions", "features"],
  })),
});
export function safeMobiLink(value: string) {
  if (typeof value !== "string" || /[\\\s]/.test(value) || /%(?:2f|5c|0a|0d)/i.test(value))
    return false;
  try {
    const u = new URL(value, "https://www.mobimb.com.br");
    if (u.protocol !== "https:" || u.username || u.password) return false;
    if (u.hostname === "wa.me") return u.pathname === `/${WHATSAPP_NUMBER}`;
    if (!["mobimb.com.br", "www.mobimb.com.br"].includes(u.hostname)) return false;
    if (["/", "/links", "/moveis-nova-iguacu"].includes(u.pathname)) return true;
    const category = u.pathname.match(/^\/categoria\/([a-z0-9-]+)$/);
    if (category) return !!getCategory(category[1]);
    if (/^\/ajuda\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(u.pathname)) return true;
    return /^\/produto\/[a-zA-Z0-9_-]+$/.test(u.pathname);
  } catch {
    return false;
  }
}
export function validateNavigation(d: NavigationData): string[] {
  if (!d || !Array.isArray(d.items) || d.items.length !== CATEGORIES.length)
    return ["A árvore deve preservar as categorias existentes."];
  const ids = new Set();
  const errors: string[] = [];
  for (const item of d.items) {
    if (
      !item ||
      ids.has(item.id) ||
      !CATEGORIES.some((c) => c.slug === item.id) ||
      item.slug !== item.id ||
      typeof item.label !== "string" ||
      !item.label.trim() ||
      item.label.length > 80 ||
      typeof item.visible !== "boolean" ||
      !safeMobiLink(item.href) ||
      !Array.isArray(item.filters) ||
      new Set(item.filters).size !== item.filters.length ||
      item.filters.some((k) => !Object.hasOwn(FILTER_LABELS, k))
    )
      errors.push("Categoria, destino ou filtro inválido.");
    ids.add(item?.id);
  }
  return [...new Set(errors)];
}
type FacetProduct = Parameters<typeof getCatalogMaterials>[0];
export function filterCoverage(products: FacetProduct[]) {
  const getters = {
    material: getCatalogMaterials,
    color: getCatalogColors,
    dimensions: (p: FacetProduct) => {
      const dimensions = getCatalogDimensions(p);
      return [
        dimensions.widthCm !== undefined ? "Largura" : "",
        dimensions.heightCm !== undefined ? "Altura" : "",
        dimensions.depthClosedCm !== undefined ? "Profundidade fechada" : "",
        dimensions.depthOpenCm !== undefined ? "Profundidade aberta" : "",
      ].filter(Boolean);
    },
    features: getCatalogFeatures,
  };
  return Object.fromEntries(
    Object.entries(getters).map(([key, get]) => {
      let covered = 0;
      const values = new Map<string, number>();
      for (const p of products) {
        const vs = get(p);
        if (vs.length) covered++;
        for (const v of new Set(vs)) values.set(v, (values.get(v) ?? 0) + 1);
      }
      return [
        key,
        {
          covered,
          missing: products.length - covered,
          total: products.length,
          values: [...values].sort((a, b) => b[1] - a[1]),
        },
      ];
    }),
  ) as Record<
    FilterKey,
    { covered: number; missing: number; total: number; values: [string, number][] }
  >;
}
export interface ContentPage {
  id: string;
  title: string;
  slug: string;
  body: string;
  status: "draft" | "review";
  reviewedAt: string;
  faqs: { question: string; answer: string }[];
  links: { label: string; href: string }[];
}
export interface ContentArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  imageUrl: string;
  imageAlt: string;
  images?: ContentArticleImage[];
  body: string;
  status: "draft" | "review";
  reviewedAt: string;
  featured: boolean;
  relatedProductIds: string[];
}
export interface ContentArticleImage {
  url: string;
  alt: string;
  afterParagraph: number;
}
export interface ContentData {
  pages: ContentPage[];
  articles?: ContentArticle[];
}
export const initialContent = (): ContentData => ({
  articles: [
    {
      id: "sofa-retratil-medidas",
      title: "Sofá retrátil: confira o espaço quando ele estiver aberto",
      slug: "sofa-retratil-medidas",
      category: "Sala",
      excerpt:
        "Meça o local de uso e confira as dimensões aberta e fechada informadas para o modelo escolhido.",
      imageUrl: "",
      imageAlt: "",
      images: [],
      body: "Antes de escolher um sofá retrátil, meça a área onde ele vai ficar e confira as dimensões específicas na página do produto. A medida com o sofá fechado não mostra quanto espaço ele ocupa quando o assento está aberto.\n\nCompare a profundidade aberta com a área livre da sala. Observe também portas, corredores e outros móveis no caminho de circulação. Não use a medida de outro modelo como referência: largura, altura e profundidade variam de um sofá para outro.\n\nSe a página não informar uma medida importante para o seu espaço, envie o link do produto à Mobi pelo WhatsApp e pergunte antes de combinar o pedido. A equipe também pode confirmar disponibilidade e entrega para seu endereço.",
      status: "draft",
      reviewedAt: "",
      featured: true,
      relatedProductIds: [],
    },
    {
      id: "medir-espaco-e-acesso",
      title: "O móvel cabe no cômodo? Meça também o caminho de entrada",
      slug: "medir-espaco-e-acesso",
      category: "Planejamento",
      excerpt:
        "Além do lugar onde o móvel ficará, confira portas, corredores e o acesso até o ambiente.",
      imageUrl: "",
      imageAlt: "",
      images: [],
      body: "Comece pelo espaço em que o móvel será usado. Anote largura, altura e profundidade disponíveis e compare cada medida com a ficha do produto escolhido. Em móveis retráteis ou extensíveis, confira também as dimensões na posição aberta, quando essa informação estiver disponível.\n\nDepois, meça o trajeto até o cômodo: passagem da porta de entrada, corredores, escadas e elevador, se houver. Considere que rodapés, curvas e outros móveis podem reduzir a passagem útil. A embalagem pode ter dimensões diferentes do móvel montado; quando essa informação não estiver na página, confirme com a equipe.\n\nPara evitar dúvida, envie à Mobi o link do móvel e as medidas que você levantou. A equipe pode ajudar a localizar as informações disponíveis, mas a conferência do espaço e dos acessos deve considerar as condições do seu imóvel.",
      status: "draft",
      reviewedAt: "",
      featured: false,
      relatedProductIds: [],
    },
    {
      id: "conferir-ficha-do-produto",
      title: "O que conferir na página do móvel antes de consultar a Mobi",
      slug: "conferir-ficha-do-produto",
      category: "Guia de compra",
      excerpt:
        "Use fotos, medidas, variação e condições exibidas no próprio produto para fazer uma consulta mais objetiva.",
      imageUrl: "",
      imageAlt: "",
      images: [],
      body: "Abra a página do modelo que você está considerando e confira o nome, as fotos e as medidas informadas. Se houver variação de cor ou acabamento, verifique qual opção está selecionada antes de comparar imagens e valores. As informações de montagem, quando presentes, também ajudam a entender os cuidados necessários.\n\nNa parte de preço, observe o valor à vista e, se houver parcelamento, confira tanto o valor das parcelas quanto o total no cartão. As condições podem variar conforme o produto; use os valores exibidos na página escolhida.\n\nQuando falar com a Mobi pelo WhatsApp, envie o link do produto e diga qual informação você quer confirmar — por exemplo, a variação, uma medida ou a entrega para seu CEP. A mensagem é uma consulta: disponibilidade, entrega e condições precisam ser confirmadas pela equipe antes de combinar o pedido.",
      status: "draft",
      reviewedAt: "",
      featured: false,
      relatedProductIds: [],
    },
  ],
  pages: [
    {
      id: "comprar",
      title: "Como comprar na Mobi",
      slug: "como-comprar",
      body: "A Mobi atende pela loja online e pelo WhatsApp. Explore o catálogo, abra a página do produto e confira fotos, medidas e valores antes de escolher. Use o carrinho para organizar os itens e enviar uma consulta à equipe.\n\nA mensagem não aprova a venda nem confirma estoque, entrega ou data. A equipe da Mobi precisa confirmar disponibilidade para o produto e endereço e combinar as condições antes de fechar o pedido.",
      status: "draft",
      reviewedAt: "",
      faqs: [
        {
          question: "Enviar a consulta pelo carrinho confirma o pedido?",
          answer:
            "Não. Depois de revisar o carrinho, você pode abrir o WhatsApp com os dados da consulta. A equipe confirma disponibilidade, entrega e condições antes de combinar o pedido.",
        },
        {
          question: "Onde vejo as medidas e a variação do móvel?",
          answer:
            "Confira a página do produto selecionado. Se alguma informação necessária não estiver disponível, envie o link à Mobi e pergunte antes de fechar.",
        },
        {
          question: "Posso visitar uma loja da Mobi?",
          answer:
            "A Mobi atende online e não tem loja física aberta para visitação. Fale com a equipe pelo WhatsApp.",
        },
      ],
      links: [
        { label: "Explorar todos os móveis", href: "/?all=true#catalogo" },
        { label: "Falar com a Mobi", href: `https://wa.me/${WHATSAPP_NUMBER}` },
      ],
    },
    {
      id: "entrega",
      title: "Entrega e montagem",
      slug: "entrega-e-montagem",
      body: "A Mobi atende online em Nova Iguaçu e regiões próximas. A cobertura, o frete e o prazo dependem do endereço e do produto; consulte a equipe pelo WhatsApp antes de combinar o pedido. Envie o link do móvel e seu bairro, cidade e CEP para facilitar a consulta.\n\nLeia o aviso de montagem na página do produto e siga o manual do fabricante. Não considere a montagem incluída sem essa confirmação. Se precisar de um montador, consulte a Mobi sobre disponibilidade e valores para o seu caso.",
      status: "draft",
      reviewedAt: "",
      faqs: [
        {
          question: "A Mobi entrega no meu endereço?",
          answer:
            "A equipe confirma a cobertura para o endereço e o produto escolhidos. Envie bairro, cidade e CEP pelo WhatsApp.",
        },
        {
          question: "Qual é o valor do frete e o prazo?",
          answer:
            "Frete e prazo são confirmados no atendimento para o endereço e o móvel consultados. A página não substitui essa confirmação.",
        },
        {
          question: "A montagem está incluída?",
          answer:
            "Confira as informações do produto. Se precisar de um montador, pergunte à Mobi sobre disponibilidade e valores; não presuma que o serviço esteja incluído.",
        },
      ],
      links: [
        { label: "Consultar entrega pelo WhatsApp", href: `https://wa.me/${WHATSAPP_NUMBER}` },
      ],
    },
    {
      id: "pagamento",
      title: "Pagamento",
      slug: "pagamento",
      body: "A página do produto mostra o valor à vista e, quando disponível, o parcelamento e o total no cartão. Confira os valores do móvel escolhido antes de enviar a consulta.\n\nNo carrinho, as opções apresentadas são Pix, cartão na entrega e dinheiro na entrega. O pagamento é combinado para a entrega; confirme com a Mobi as condições aplicáveis ao seu pedido antes de finalizar.",
      status: "draft",
      reviewedAt: "",
      faqs: [
        {
          question: "Quais formas de pagamento aparecem no carrinho?",
          answer:
            "O carrinho apresenta Pix, cartão na entrega e dinheiro na entrega. Confira as opções disponíveis para o seu pedido e confirme as condições com a Mobi.",
        },
        {
          question: "Como confiro o parcelamento?",
          answer:
            "Na página do produto, veja o valor da parcela e o total no cartão quando houver parcelamento. Considere os valores do item selecionado e confirme qualquer dúvida com a equipe.",
        },
        {
          question: "Quando o pagamento é feito?",
          answer:
            "A operação atual da Mobi prevê pagamento na entrega. A equipe confirma a forma escolhida ao combinar o pedido.",
        },
      ],
      links: [
        { label: "Consultar condições pelo WhatsApp", href: `https://wa.me/${WHATSAPP_NUMBER}` },
      ],
    },
    {
      id: "contato",
      title: "Fale com a Mobi",
      slug: "contato",
      body: "O atendimento da Mobi é online pelo WhatsApp: (21) 98432-4338. A loja atende Nova Iguaçu e regiões próximas; consulte a equipe para confirmar a cobertura do seu endereço.\n\nPara agilizar a conversa, envie o link ou o nome do móvel, a variação desejada e, se sua dúvida for sobre entrega, o bairro, a cidade e o CEP. A equipe confirma as informações disponíveis antes de combinar o pedido.",
      status: "draft",
      reviewedAt: "",
      faqs: [
        {
          question: "A Mobi tem loja física ou showroom?",
          answer: "Não. A Mobi atende online e não tem loja física ou showroom para visitação.",
        },
        {
          question: "O que devo enviar para consultar um produto?",
          answer:
            "Envie o link ou o nome do móvel e informe a variação que procura. Para consultar entrega, inclua bairro, cidade e CEP.",
        },
      ],
      links: [
        { label: "WhatsApp (21) 98432-4338", href: `https://wa.me/${WHATSAPP_NUMBER}` },
        { label: "Explorar todos os móveis", href: "/?all=true#catalogo" },
      ],
    },
  ],
});
export function validateContent(d: ContentData): string[] {
  if (!d || !Array.isArray(d.pages) || d.pages.length > 40) return ["Conteúdo inválido."];
  const ids = new Set<string>(),
    slugs = new Set<string>();
  for (const p of d.pages) {
    if (
      !p ||
      typeof p.id !== "string" ||
      ids.has(p.id) ||
      slugs.has(p.slug) ||
      typeof p.slug !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug) ||
      typeof p.title !== "string" ||
      !p.title.trim() ||
      p.title.length > 100 ||
      typeof p.body !== "string" ||
      p.body.length > 15000 ||
      !["draft", "review"].includes(p.status) ||
      !Array.isArray(p.faqs) ||
      p.faqs.length > 30 ||
      p.faqs.some(
        (f) =>
          !f ||
          typeof f.question !== "string" ||
          !f.question.trim() ||
          f.question.length > 200 ||
          typeof f.answer !== "string" ||
          !f.answer.trim() ||
          f.answer.length > 2000,
      ) ||
      !Array.isArray(p.links) ||
      p.links.length > 20 ||
      p.links.some((l) => !l || !l.label?.trim() || !safeMobiLink(l.href)) ||
      (p.status === "review" && !Number.isFinite(Date.parse(p.reviewedAt)))
    )
      return ["Revise título, slug único, revisão, perguntas e destinos seguros."];
    ids.add(p.id);
    slugs.add(p.slug);
  }
  const articles = d.articles ?? [];
  if (!Array.isArray(articles) || articles.length > 100) return ["Revise a quantidade de artigos."];
  const articleIds = new Set<string>(),
    articleSlugs = new Set<string>();
  let featuredCount = 0;
  for (const article of articles) {
    if (
      !article ||
      typeof article.id !== "string" ||
      !article.id.trim() ||
      articleIds.has(article.id) ||
      typeof article.slug !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug) ||
      articleSlugs.has(article.slug) ||
      typeof article.title !== "string" ||
      !article.title.trim() ||
      article.title.length > 120 ||
      typeof article.category !== "string" ||
      article.category.length > 60 ||
      typeof article.excerpt !== "string" ||
      article.excerpt.length > 360 ||
      typeof article.imageUrl !== "string" ||
      (article.imageUrl && !/^https:\/\//i.test(article.imageUrl)) ||
      typeof article.imageAlt !== "string" ||
      article.imageAlt.length > 160 ||
      (article.images !== undefined &&
        (!Array.isArray(article.images) ||
          article.images.length > 6 ||
          article.images.some(
            (image) =>
              !image ||
              typeof image.url !== "string" ||
              image.url.length > 2000 ||
              (image.url && !/^https:\/\//i.test(image.url)) ||
              typeof image.alt !== "string" ||
              image.alt.length > 160 ||
              (image.url && !image.alt.trim()) ||
              !Number.isInteger(image.afterParagraph) ||
              image.afterParagraph < 1 ||
              image.afterParagraph > 200,
          ))) ||
      typeof article.body !== "string" ||
      article.body.length > 30000 ||
      !["draft", "review"].includes(article.status) ||
      (article.imageUrl && !article.imageAlt.trim()) ||
      (article.status === "review" &&
        (!article.body.trim() ||
          !Number.isFinite(Date.parse(article.reviewedAt)) ||
          article.images?.some((image) => !image.url.trim() || !image.alt.trim()))) ||
      typeof article.featured !== "boolean" ||
      !Array.isArray(article.relatedProductIds) ||
      article.relatedProductIds.length > 6 ||
      article.relatedProductIds.some(
        (productId) => typeof productId !== "string" || !productId.trim(),
      ) ||
      new Set(article.relatedProductIds).size !== article.relatedProductIds.length
    )
      return ["Revise título, slug, imagem, revisão e vínculos do artigo."];
    articleIds.add(article.id);
    articleSlugs.add(article.slug);
    if (article.status === "review" && article.featured) featuredCount++;
  }
  if (featuredCount > 1) return ["Deixe somente um artigo em destaque na revisão."];
  return [];
}
export interface ServiceData {
  number: string;
  regionMessage: string;
  freightMode: "consult";
  deliveryMessage: string;
  assemblyMessage: string;
  template: string;
}
export const initialService = (): ServiceData => ({
  number: WHATSAPP_NUMBER,
  regionMessage:
    "Atendimento em Nova Iguaçu e Baixada Fluminense. Consulte cobertura para seu endereço.",
  freightMode: "consult",
  deliveryMessage: "Frete e prazo a confirmar com a Mobi para seu endereço.",
  assemblyMessage: "Consulte disponibilidade e condições de montagem com a loja.",
  template:
    "Olá, Mobi! Quero consultar {produto}. Variante: {variante}. Quantidade: {quantidade}. Valor à vista por unidade: {valor}. Por favor, confirme disponibilidade e entrega.",
});
export function validateService(d: ServiceData) {
  if (
    !d ||
    d.number !== WHATSAPP_NUMBER ||
    d.freightMode !== "consult" ||
    [d.regionMessage, d.deliveryMessage, d.assemblyMessage, d.template].some(
      (x) => typeof x !== "string" || !x.trim() || x.length > 2000,
    )
  )
    return ["Use o WhatsApp público da loja e mensagens de consulta válidas."];
  if (!["produto", "variante", "quantidade", "valor"].every((k) => d.template.includes(`{${k}}`)))
    return ["A mensagem deve incluir produto, variante, quantidade e valor revisado."];
  if (
    [...d.template.matchAll(/\{([^}]+)\}/g)].some(
      (m) => !["produto", "variante", "quantidade", "valor"].includes(m[1]),
    )
  )
    return ["Variável de mensagem desconhecida."];
  return [];
}
export function serviceLink(
  d: ServiceData,
  p: { name: string; variant: string; quantity: number; price: number },
) {
  if (
    validateService(d).length ||
    !Number.isSafeInteger(p.quantity) ||
    p.quantity < 1 ||
    p.quantity > 99 ||
    !Number.isFinite(p.price) ||
    p.price <= 0
  )
    throw new Error("Revise os dados antes de abrir a consulta.");
  const values: Record<string, string> = {
    produto: p.name,
    variante: p.variant || "A confirmar",
    quantidade: String(p.quantity),
    valor: formatBRL(p.price),
  };
  return `https://wa.me/${d.number}?text=${encodeURIComponent(d.template.replace(/\{([^}]+)\}/g, (_, k) => values[k]))}`;
}
export interface ProductDraftData {
  changes: Record<string, { basePrice: number; product: EditorProduct }>;
}
export const initialProductDrafts = (): ProductDraftData => ({ changes: {} });
const optionalProductText = (value: unknown) => value == null || typeof value === "string";
const optionalProductList = (value: unknown, check: (item: unknown) => boolean) =>
  value == null || (Array.isArray(value) && value.every(check));
const optionalCatalogDimension = (value: unknown) =>
  value == null ||
  (typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 10000);
function validDraftVariation(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const option = value as Record<string, unknown>;
  return (
    typeof option.name === "string" &&
    Boolean(option.name.trim()) &&
    typeof option.sku === "string" &&
    Boolean(option.sku.trim()) &&
    [option.supplier_price, option.sale_price].every(
      (price) =>
        price == null || (typeof price === "number" && Number.isFinite(price) && price >= 0),
    )
  );
}
export function validateProductDrafts(d: ProductDraftData, source: EditorProduct[]): string[] {
  if (!d || !d.changes || Array.isArray(d.changes) || typeof d.changes !== "object")
    return ["Rascunho de produto inválido."];
  const errors: string[] = [];
  const sourceById = new Map(
    source.map((product) => [product.id, d.changes[product.id]?.product ?? product]),
  );
  for (const [id, entry] of Object.entries(d.changes)) {
    const base = source.find((p) => p.id === id),
      p = entry?.product;
    if (!base || entry?.basePrice !== Number(base.preco_atual))
      errors.push("O preço-base mudou. Compare o cadastro antes de salvar.");
    if (
      !entry ||
      typeof entry !== "object" ||
      Array.isArray(entry) ||
      !p ||
      typeof p !== "object" ||
      Array.isArray(p)
    ) {
      errors.push("Rascunho de produto inválido.");
      continue;
    }
    if (
      !p ||
      p.id !== id ||
      typeof p.nome !== "string" ||
      !p.nome.trim() ||
      p.nome.length > 150 ||
      typeof p.preco_atual !== "number" ||
      !Number.isFinite(p.preco_atual) ||
      Number(p.preco_atual) <= 0 ||
      typeof p.preco_atacado !== "number" ||
      !Number.isFinite(p.preco_atacado) ||
      Number(p.preco_atacado) <= 0 ||
      typeof p.url_imagem !== "string" ||
      !/^https:\/\//i.test(p.url_imagem) ||
      typeof p.categoria !== "string" ||
      !p.categoria.trim()
    )
      errors.push("Revise identificação, preço, custo, categoria e imagem HTTPS.");
    if (
      ![p.descricao, p.medidas, p.slug, p.sku].every(optionalProductText) ||
      !optionalProductList(
        p.imagens,
        (image) => typeof image === "string" && /^https:\/\//i.test(image),
      ) ||
      !optionalProductList(
        p.cores,
        (color) => typeof color === "string" && Boolean(color.trim()),
      ) ||
      !optionalProductList(
        p.materiais,
        (material) =>
          typeof material === "string" && Boolean(material.trim()) && material.length <= 80,
      ) ||
      !optionalProductList(
        p.caracteristicas,
        (feature) => typeof feature === "string" && Boolean(feature.trim()) && feature.length <= 80,
      ) ||
      ![p.width_cm, p.height_cm, p.depth_closed_cm, p.depth_open_cm].every(
        optionalCatalogDimension,
      ) ||
      !optionalProductList(p.variacoes_preco, validDraftVariation)
    )
      errors.push(
        "Revise os textos, fotos, cores e opções do produto. Os dados do rascunho têm formato inválido.",
      );
    try {
      const bundleIds = normalizeProductBundleIds(p?.compre_junto_ids, { selfId: id });
      if (
        bundleIds.some((relatedId) => {
          const related = sourceById.get(relatedId);
          return !related || !isEligibleBundleProduct(related);
        })
      )
        errors.push(
          "Compre junto exige complementos com preço, custo e foto HTTPS válidos, sem indicação de indisponibilidade.",
        );
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Seleção do Compre junto inválida.");
    }
  }
  return [...new Set(errors)];
}
export const navigationChildren = (slug: string) => {
  const c = getCategory(slug);
  return (c?.children ?? []).flatMap((id) => ALL_CATEGORIES.find((c) => c.slug === id) ?? []);
};
