import { CATEGORIES, MAX_INSTALLMENTS, categoryMatches } from "./constants.ts";
import { isHomepageProduct } from "./home-curation.ts";
import { hasRealReferencePrice } from "./price-reference.ts";
import type { Produto } from "./products.functions.ts";

/** Single seasonal flag to enable or retire the public Black Friday experience cleanly. */
export const BLACK_FRIDAY_PUBLIC_ENABLED = true;

export const BLACK_FRIDAY_COPY = {
  kicker: "BLACK FRIDAY MOBI · RAÍZES DO LUXO",
  homeTitle: "Black Friday da Mobi",
  homeSubtitle:
    "Condições reais de Black Friday para sua casa: pague somente na entrega e aproveite frete grátis na região atendida.",
  heroTitle: "Black Friday Mobi: Sofás, Quartos e Cozinhas com Pagamento Só na Entrega",
  heroSubtitle: `Seleção especial para Nova Iguaçu e Baixada Fluminense. Confira as medidas, receba com frete grátis em até 7 dias úteis na área atendida e pague somente ao receber — no Pix com desconto, dinheiro ou cartão em até ${MAX_INSTALLMENTS}x.`,
  pillars: [
    {
      title: "Pague somente na entrega",
      detail: `Pix com desconto, dinheiro ou cartão em até ${MAX_INSTALLMENTS}x no recebimento.`,
    },
    {
      title: "Frete grátis no raio de 30 km",
      detail: "Entrega em até 7 dias úteis (exceto Belford Roxo e áreas com restrição de acesso).",
    },
    {
      title: "Compra online sem loja física",
      detail: "Atendimento direto no WhatsApp e garantia legal de 90 dias (CDC).",
    },
  ],
  faqs: [
    {
      question: "As ofertas de Black Friday da Mobi têm pagamento somente na entrega?",
      answer: `Sim. Você escolhe o móvel, registra o pedido no site sem pagar adiantado e acerta somente quando receber em casa: à vista no Pix com desconto, em dinheiro ou no cartão em até ${MAX_INSTALLMENTS}x.`,
    },
    {
      question: "Os descontos exibidos na área Black Friday são reais?",
      answer:
        "Sim. Nossa vitrine destaca os móveis com redução real de preço cadastrada no catálogo, mostrando o valor anterior riscado apenas quando há diferença comercial autêntica e o valor exato de cada parcela no cartão.",
    },
    {
      question: "Qual a área atendida com frete grátis e qual o prazo?",
      answer:
        "O frete é grátis em até 7 dias úteis para localidades elegíveis dentro de um raio de 30 km a partir do bairro Botafogo, em Nova Iguaçu (Nova Iguaçu, Mesquita, Nilópolis, São João de Meriti, Duque de Caxias, Queimados, Japeri, Paracambi, Seropédica e bairros próximos das Zonas Norte e Oeste do Rio). Não realizamos entregas em Belford Roxo nem em ruas com barricadas ou restrição de acesso.",
    },
    {
      question: "Posso ir a uma loja física ver os móveis da Black Friday?",
      answer:
        "Não. A Mobi opera 100% online em Nova Iguaçu, sem showroom ou endereço aberto para visitação, garantindo preços mais competitivos e atendimento direto pelo WhatsApp antes e depois da entrega.",
    },
  ],
} as const;

export interface BlackFridayTabDefinition {
  id: string;
  label: string;
  categorySlug?: string;
}

export const BLACK_FRIDAY_TABS: readonly BlackFridayTabDefinition[] = [
  { id: "ofertas", label: "Ofertas em destaque" },
  { id: "sofas", label: "Sofás", categorySlug: "sofas" },
  { id: "dormitorios", label: "Quartos e Guarda-roupas", categorySlug: "dormitorios" },
  { id: "cozinha", label: "Cozinhas", categorySlug: "cozinha" },
  { id: "sala-de-estar", label: "Sala de Estar", categorySlug: "sala-de-estar" },
  { id: "salas-de-jantar", label: "Mesas e Cadeiras", categorySlug: "salas-de-jantar" },
  { id: "colchoes-e-bases", label: "Colchões e Camas", categorySlug: "colchoes-e-bases" },
] as const;

export function blackFridayDiscountPercent(oldPrice: number, currentPrice: number): number | null {
  if (!hasRealReferencePrice(oldPrice, currentPrice)) return null;
  const percent = Math.round(((oldPrice - currentPrice) / oldPrice) * 100);
  return percent >= 1 ? percent : null;
}

export function productBlackFridayDiscount(product: Produto): number | null {
  const hasPricedVariations = (product.variacoes_preco ?? []).some(
    (variation) => variation.sale_price != null && variation.sale_price > 0,
  );
  if (hasPricedVariations) return null;
  return blackFridayDiscountPercent(product.preco_antigo, product.preco_novo);
}

function compareByOrderAndId(a: Produto, b: Produto): number {
  const orderDiff = (a.ordem ?? Number.MAX_SAFE_INTEGER) - (b.ordem ?? Number.MAX_SAFE_INTEGER);
  if (orderDiff !== 0) return orderDiff;
  return String(a.id).localeCompare(String(b.id), "pt-BR");
}

function compareDealsFirst(a: Produto, b: Produto): number {
  const discountA = productBlackFridayDiscount(a) ?? 0;
  const discountB = productBlackFridayDiscount(b) ?? 0;
  if (discountB !== discountA) return discountB - discountA;
  return compareByOrderAndId(a, b);
}

function categoryKey(category: string): string {
  const match = CATEGORIES.find(
    (item) => item.slug !== "sala-de-estar" && categoryMatches(category, item.slug),
  );
  return match?.slug ?? category.trim().toLowerCase();
}

function eligibleBlackFridayPool(products: readonly Produto[]): Produto[] {
  return products.filter(
    (product) => isHomepageProduct(product) && product.status_estoque !== "esgotado",
  );
}

/** Picks up to 4 Black Friday cards prioritizing authentic price reductions across distinct furniture categories. */
export function selectBlackFridayHomeProducts(products: readonly Produto[], limit = 4): Produto[] {
  if (limit <= 0) return [];
  const eligible = eligibleBlackFridayPool(products);
  const realDeals = eligible
    .filter((product) => productBlackFridayDiscount(product) !== null)
    .sort(compareDealsFirst);
  const fallbackPool = eligible
    .filter((product) => productBlackFridayDiscount(product) === null)
    .sort(compareByOrderAndId);

  const selected: Produto[] = [];
  const selectedIds = new Set<string>();
  const usedCategories = new Set<string>();

  const pushIfUnusedCategory = (pool: readonly Produto[]) => {
    for (const product of pool) {
      if (selected.length >= limit) break;
      if (selectedIds.has(product.id)) continue;
      const key = categoryKey(product.categoria);
      if (usedCategories.has(key)) continue;
      selected.push(product);
      selectedIds.add(product.id);
      usedCategories.add(key);
    }
  };

  const fillRemaining = (pool: readonly Produto[]) => {
    for (const product of pool) {
      if (selected.length >= limit) break;
      if (selectedIds.has(product.id)) continue;
      selected.push(product);
      selectedIds.add(product.id);
    }
  };

  pushIfUnusedCategory(realDeals);
  fillRemaining(realDeals);
  pushIfUnusedCategory(fallbackPool);
  fillRemaining(fallbackPool);

  return selected;
}

export function selectBlackFridayTabProducts(
  products: readonly Produto[],
  tabId: string,
): { items: Produto[]; realDealCount: number } {
  const eligible = eligibleBlackFridayPool(products);
  const tab = BLACK_FRIDAY_TABS.find((item) => item.id === tabId) ?? BLACK_FRIDAY_TABS[0];

  if (!tab.categorySlug) {
    const realDeals = eligible
      .filter((product) => productBlackFridayDiscount(product) !== null)
      .sort(compareDealsFirst);
    if (realDeals.length > 0) {
      return { items: realDeals, realDealCount: realDeals.length };
    }
    const fallback = [...eligible].sort(compareByOrderAndId).slice(0, 24);
    return { items: fallback, realDealCount: 0 };
  }

  const scoped = eligible
    .filter((product) => categoryMatches(product.categoria, tab.categorySlug!))
    .sort(compareDealsFirst);
  const realDealCount = scoped.filter(
    (product) => productBlackFridayDiscount(product) !== null,
  ).length;
  return { items: scoped, realDealCount };
}
