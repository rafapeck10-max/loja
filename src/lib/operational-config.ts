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
  getCatalogDimensionLabel,
} from "./catalog-search.ts";
import type { EditorProduct } from "./homepage-curation.ts";
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
    dimensions: (p: FacetProduct) =>
      getCatalogDimensionLabel(p) ? [getCatalogDimensionLabel(p)] : [],
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
export interface ContentData {
  pages: ContentPage[];
}
export const initialContent = (): ContentData => ({
  pages: [
    {
      id: "comprar",
      title: "Como comprar na Mobi",
      slug: "como-comprar",
      body: "Escolha o móvel e consulte disponibilidade, medidas e condições com a Mobi pelo WhatsApp. A confirmação ocorre no atendimento.",
      status: "draft",
      reviewedAt: "",
      faqs: [],
      links: [{ label: "Explorar móveis", href: "/?all=true#catalogo" }],
    },
    {
      id: "entrega",
      title: "Entrega e montagem",
      slug: "entrega-e-montagem",
      body: "Consulte as condições para seu endereço com a loja antes de confirmar a compra. Prazo, frete e montagem dependem de confirmação no atendimento.",
      status: "draft",
      reviewedAt: "",
      faqs: [],
      links: [],
    },
    {
      id: "pagamento",
      title: "Pagamento",
      slug: "pagamento",
      body: "Confira o valor à vista e o total no cartão apresentados para o móvel. Confirme as condições com a Mobi no atendimento.",
      status: "draft",
      reviewedAt: "",
      faqs: [],
      links: [],
    },
    {
      id: "contato",
      title: "Fale com a Mobi",
      slug: "contato",
      body: "Móveis para Nova Iguaçu e Baixada Fluminense. Fale com a loja para conferir modelos e condições.",
      status: "draft",
      reviewedAt: "",
      faqs: [],
      links: [{ label: "WhatsApp da Mobi", href: `https://wa.me/${WHATSAPP_NUMBER}` }],
    },
  ],
});
export function validateContent(d: ContentData): string[] {
  if (!d || !Array.isArray(d.pages) || d.pages.length > 40) return ["Conteúdo inválido."];
  const ids = new Set(),
    slugs = new Set();
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
export function validateProductDrafts(d: ProductDraftData, source: EditorProduct[]): string[] {
  if (!d || !d.changes || Array.isArray(d.changes) || typeof d.changes !== "object")
    return ["Rascunho de produto inválido."];
  const errors: string[] = [];
  for (const [id, entry] of Object.entries(d.changes)) {
    const base = source.find((p) => p.id === id),
      p = entry?.product;
    if (!base || entry.basePrice !== Number(base.preco_atual))
      errors.push("O preço-base mudou. Compare o cadastro antes de salvar.");
    if (
      !p ||
      p.id !== id ||
      typeof p.nome !== "string" ||
      !p.nome.trim() ||
      p.nome.length > 150 ||
      !Number.isFinite(Number(p.preco_atual)) ||
      Number(p.preco_atual) <= 0 ||
      !Number.isFinite(Number(p.preco_atacado)) ||
      Number(p.preco_atacado) <= 0 ||
      !/^https:\/\//i.test(p.url_imagem ?? "") ||
      typeof p.categoria !== "string" ||
      !p.categoria.trim()
    )
      errors.push("Revise identificação, preço, custo, categoria e imagem HTTPS.");
  }
  return [...new Set(errors)];
}
export const navigationChildren = (slug: string) => {
  const c = getCategory(slug);
  return (c?.children ?? []).flatMap((id) => ALL_CATEGORIES.find((c) => c.slug === id) ?? []);
};
