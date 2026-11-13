import { categoryMatches } from "./constants.ts";
import { productMeasurements } from "./product-measurements.ts";

interface SearchProduct {
  nome: string;
  categoria: string;
  descricao?: string | null;
  medidas?: string | null;
  cores?: string[] | null;
  materiais?: string[] | null;
  caracteristicas?: string[] | null;
  width_cm?: number | null;
  height_cm?: number | null;
  depth_closed_cm?: number | null;
  depth_open_cm?: number | null;
  variacoes_preco?: Array<{ name?: string | null }> | null;
}

export interface CatalogDimensions {
  widthCm?: number;
  heightCm?: number;
  depthClosedCm?: number;
  depthOpenCm?: number;
}

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const dimensionPattern = /(\d{1,4}(?:[.,]\d{1,2})?)\s*(mm|cm|m)\b/gi;
const stopWords = new Set([
  "a",
  "as",
  "ao",
  "aos",
  "com",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "na",
  "nas",
  "no",
  "nos",
  "o",
  "os",
  "para",
  "por",
  "um",
  "uma",
  "uns",
  "umas",
  "tecido",
  "tecidos",
  "material",
  "materiais",
  "cor",
  "cores",
  "medida",
  "medidas",
  "tamanho",
  "largura",
  "altura",
  "profundidade",
  "comprimento",
]);

const materialOptions = [
  { label: "Linho", terms: ["linho", "linhos"] },
  { label: "Veludo", terms: ["veludo", "velvet"] },
  { label: "Suede", terms: ["suede"] },
  {
    label: "Couro sintético",
    terms: ["corino", "courino", "couro sintetico", "couro ecologico", "eco couro"],
  },
  { label: "Couro natural", terms: ["couro natural", "couro legitimo", "couro genuino"] },
  { label: "Madeira", terms: ["madeira", "madeira macica"] },
  { label: "MDF", terms: ["mdf"] },
  { label: "MDP", terms: ["mdp"] },
  { label: "Metal / aço", terms: ["metal", "aco", "ferro"] },
  { label: "Vidro", terms: ["vidro"] },
  { label: "Tecido", terms: ["tecido", "tecidos"] },
] as const;

const knownColors = [
  { label: "Off-white", terms: ["off white", "offwhite"] },
  { label: "Cinza claro", terms: ["cinza claro"] },
  { label: "Cinza escuro", terms: ["cinza escuro"] },
  { label: "Bege claro", terms: ["bege claro"] },
  { label: "Bege escuro", terms: ["bege escuro"] },
  { label: "Caramelo", terms: ["caramelo"] },
  { label: "Terracota", terms: ["terracota"] },
  { label: "Cappuccino", terms: ["cappuccino", "capuccino", "cappucino"] },
  { label: "Café", terms: ["cafe"] },
  { label: "Gelo", terms: ["gelo"] },
  { label: "Bronze", terms: ["bronze"] },
  { label: "Marfim", terms: ["marfim"] },
  { label: "Oliva", terms: ["oliva"] },
  { label: "Caqui", terms: ["caqui", "kaki", "khaki"] },
  { label: "Cru", terms: ["cru"] },
  { label: "Juta", terms: ["juta"] },
  { label: "Inox", terms: ["inox"] },
  { label: "Rubi", terms: ["rubi"] },
  { label: "Grafite", terms: ["grafite"] },
  { label: "Chumbo", terms: ["chumbo"] },
  { label: "Areia", terms: ["areia"] },
  { label: "Tabaco", terms: ["tabaco"] },
  { label: "Natural", terms: ["natural"] },
  { label: "Bege", terms: ["bege"] },
  { label: "Cinza", terms: ["cinza"] },
  { label: "Branco", terms: ["branco", "branca"] },
  { label: "Preto", terms: ["preto", "preta"] },
  { label: "Marrom", terms: ["marrom"] },
  { label: "Azul", terms: ["azul"] },
  { label: "Verde", terms: ["verde"] },
  { label: "Rosa", terms: ["rosa"] },
  { label: "Vermelho", terms: ["vermelho", "vermelha"] },
  { label: "Amarelo", terms: ["amarelo", "amarela"] },
] as const;

const broaderColors: Record<string, string> = {
  "bege claro": "Bege",
  "bege escuro": "Bege",
  "cinza claro": "Cinza",
  "cinza escuro": "Cinza",
};

const featureOptions = [
  { label: "Retrátil", terms: ["retratil", "retrateis"] },
  { label: "Reclinável", terms: ["reclinavel", "reclinaveis"] },
  { label: "Com baú", terms: ["bau"] },
  { label: "Com chaise", terms: ["chaise"] },
  { label: "Bicama", terms: ["bicama"] },
  { label: "Cama box", terms: ["cama box"] },
  { label: "Extensível", terms: ["extensivel"] },
  { label: "Com espelho", terms: ["espelho", "espelhado"] },
  { label: "Portas de correr", terms: ["porta de correr", "portas de correr"] },
  { label: "Com gavetas", terms: ["gaveta", "gavetas"] },
  { label: "Modulado", terms: ["modulado", "modulada", "modulados", "moduladas"] },
] as const;

const families: Record<string, readonly string[]> = {
  sofa: ["sofas"],
  sofas: ["sofas"],
  estofado: ["sofas"],
  estofados: ["sofas"],
  roupeiro: ["roupeiros"],
  roupeiros: ["roupeiros"],
  cama: ["camas-casal", "camas-solteiro", "camas-com-bau", "beliches", "bicamas", "cama-box"],
  camas: ["camas-casal", "camas-solteiro", "camas-com-bau", "beliches", "bicamas", "cama-box"],
};

function sourceText(product: SearchProduct) {
  return [
    product.nome,
    product.categoria,
    product.descricao,
    product.medidas,
    ...(product.cores ?? []),
    ...(product.materiais ?? []),
    ...(product.caracteristicas ?? []),
    ...structuredDimensionLabels(product),
    ...(product.variacoes_preco ?? []).map((variation) => variation.name),
  ]
    .filter(Boolean)
    .join(" ");
}

function hasPhrase(text: string, phrase: string) {
  const normalizedText = " " + normalize(text) + " ";
  const normalizedPhrase = normalize(phrase);
  return normalizedPhrase ? normalizedText.includes(" " + normalizedPhrase + " ") : false;
}

function getDimensionCm(value: number, unit: string) {
  const normalizedUnit = unit.toLowerCase();
  return Math.round(value * (normalizedUnit === "m" ? 100 : normalizedUnit === "mm" ? 0.1 : 1));
}

function getDimensionValues(value: string) {
  const found = new Set<number>();
  for (const match of value.matchAll(dimensionPattern)) {
    const numericValue = Number(match[1].replace(",", "."));
    if (Number.isFinite(numericValue) && numericValue > 0)
      found.add(getDimensionCm(numericValue, match[2]));
  }
  return [...found];
}

function getDimensionSources(product: SearchProduct) {
  return [
    product.nome,
    product.descricao,
    product.medidas,
    ...structuredDimensionLabels(product),
    ...(product.variacoes_preco ?? []).map((variation) => variation.name),
  ].filter((value): value is string => Boolean(value));
}

function structuredDimensionLabels(product: SearchProduct) {
  return [
    product.width_cm != null ? `Largura: ${product.width_cm} cm` : "",
    product.height_cm != null ? `Altura: ${product.height_cm} cm` : "",
    product.depth_closed_cm != null ? `Profundidade fechada: ${product.depth_closed_cm} cm` : "",
    product.depth_open_cm != null ? `Profundidade aberta: ${product.depth_open_cm} cm` : "",
  ].filter(Boolean);
}

function explicitValues(values: string[] | null | undefined) {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];
}

function knownLabels(
  text: string,
  options: ReadonlyArray<{ label: string; terms: readonly string[] }>,
) {
  return options
    .filter((option) => option.terms.some((term) => hasPhrase(text, term)))
    .map((option) => option.label);
}

function formatDimension(value: string, unit: string) {
  return value.replace(".", ",") + " " + unit.toLowerCase();
}

function getLabeledDimensions(value: string) {
  const pattern =
    /\b(largura|altura|profundidade|comprimento|di[aâ]metro)\s*[:=-]?\s*(\d{1,4}(?:[.,]\d{1,2})?)\s*(mm|cm|m)\b/gi;
  return [...value.matchAll(pattern)].map((match) => {
    const label = match[1][0].toUpperCase() + match[1].slice(1).toLowerCase();
    return {
      label,
      cm: getDimensionCm(Number(match[2].replace(",", ".")), match[3]),
      text: label + ": " + formatDimension(match[2], match[3]),
    };
  });
}

function extractQuery(query: string) {
  const dimensions = getDimensionValues(query);
  const withoutDimensions = query.replace(dimensionPattern, " ");
  const words = normalize(withoutDimensions)
    .replace(/\bguarda roupas?\b/g, "roupeiro")
    .split(" ")
    .filter(Boolean);
  const terms = [...new Set(words.filter((word) => !stopWords.has(word)))];
  const intentWords = new Set(words.filter((word) => stopWords.has(word)));
  return { terms, dimensions, intentWords };
}

function hasIntentProductMatch(product: SearchProduct, intentWords: Set<string>) {
  if (
    [...intentWords].some((word) =>
      ["tecido", "tecidos", "material", "materiais"].includes(word),
    ) &&
    getCatalogMaterials(product).length === 0
  )
    return false;
  if (
    [...intentWords].some((word) => ["cor", "cores"].includes(word)) &&
    getCatalogColors(product).length === 0
  )
    return false;
  if (
    [...intentWords].some((word) =>
      ["medida", "medidas", "tamanho", "largura", "altura", "profundidade", "comprimento"].includes(
        word,
      ),
    ) &&
    Object.values(getCatalogDimensions(product)).every((value) => value === undefined)
  )
    return false;
  return true;
}

export function getCatalogMaterials(product: SearchProduct) {
  const values = explicitValues(product.materiais);
  const text = values.join(" ");
  const known = knownLabels(text, materialOptions);
  const normalizedKnown = new Set(known.map(normalize));
  return [...known, ...values.filter((value) => !normalizedKnown.has(normalize(value)))];
}

export function getCatalogColors(product: SearchProduct) {
  const values = explicitValues(product.cores);
  const text = values.join(" ");
  const known = knownLabels(text, knownColors);
  const normalizedKnown = new Set(known.map(normalize));
  const all = [
    ...new Set([...known, ...values.filter((value) => !normalizedKnown.has(normalize(value)))]),
  ];
  return all.filter((color) => {
    const normalized = normalize(color);
    return !all.some(
      (candidate) =>
        normalize(candidate) !== normalized && normalize(candidate).startsWith(normalized + " "),
    );
  });
}

export function getCatalogColorFilterValues(product: SearchProduct) {
  const values: string[] = [];
  for (const color of getCatalogColors(product)) {
    if (!values.includes(color)) values.push(color);
    const broader = broaderColors[normalize(color)];
    if (broader && !values.includes(broader)) values.push(broader);
  }
  return values;
}

export function getCatalogFeatures(product: SearchProduct) {
  const values = explicitValues(product.caracteristicas);
  const text = values.join(" ");
  const known = knownLabels(text, featureOptions);
  const normalizedKnown = new Set(known.map(normalize));
  return [...known, ...values.filter((value) => !normalizedKnown.has(normalize(value)))];
}

export function getCatalogDimensionLabel(product: SearchProduct) {
  const explicitDimensions = structuredDimensionLabels(product);
  if (explicitDimensions.length) return explicitDimensions.join(" · ");
  if (product.medidas?.trim()) return product.medidas.trim();
  const sources = getDimensionSources(product).filter((value) => value !== product.medidas);
  const labeled = sources.flatMap(getLabeledDimensions);
  const uniqueLabeled = labeled.filter(
    (item, index) =>
      labeled.findIndex(
        (candidate) => candidate.cm === item.cm && candidate.label === item.label,
      ) === index,
  );
  if (uniqueLabeled.length)
    return uniqueLabeled
      .slice(0, 2)
      .map((item) => item.text)
      .join(" · ");

  const seen = new Set<number>();
  const phrases: string[] = [];
  for (const source of sources) {
    for (const match of source.matchAll(dimensionPattern)) {
      const cm = getDimensionCm(Number(match[1].replace(",", ".")), match[2]);
      if (seen.has(cm)) continue;
      seen.add(cm);
      phrases.push(formatDimension(match[1], match[2]));
      if (phrases.length === 2) return phrases.join(" · ");
    }
  }
  return phrases.join(" · ");
}

/** Only labeled values from the catalog's measurements field qualify for dimension filters. */
export function getCatalogDimensions(product: SearchProduct): CatalogDimensions {
  const values: CatalogDimensions = {
    ...(Number.isFinite(product.width_cm) && Number(product.width_cm) > 0
      ? { widthCm: Number(product.width_cm) }
      : {}),
    ...(Number.isFinite(product.height_cm) && Number(product.height_cm) > 0
      ? { heightCm: Number(product.height_cm) }
      : {}),
    ...(Number.isFinite(product.depth_closed_cm) && Number(product.depth_closed_cm) > 0
      ? { depthClosedCm: Number(product.depth_closed_cm) }
      : {}),
    ...(Number.isFinite(product.depth_open_cm) && Number(product.depth_open_cm) > 0
      ? { depthOpenCm: Number(product.depth_open_cm) }
      : {}),
  };
  for (const measure of productMeasurements(product.medidas ?? null)) {
    const match = measure.value.match(/^(\d+(?:[.,]\d+)?)\s*(mm|cm|m)$/i);
    if (!match) continue;
    const amount = Number(match[1].replace(",", "."));
    const unit = match[2].toLowerCase();
    const cm = amount * (unit === "m" ? 100 : unit === "mm" ? 0.1 : 1);
    if (!Number.isFinite(cm) || cm <= 0 || cm > 10000) continue;
    if (measure.label === "Largura" && values.widthCm === undefined) values.widthCm = cm;
    if (measure.label === "Altura" && values.heightCm === undefined) values.heightCm = cm;
    if (measure.label === "Profundidade fechada" && values.depthClosedCm === undefined)
      values.depthClosedCm = cm;
    if (measure.label === "Profundidade aberta" && values.depthOpenCm === undefined)
      values.depthOpenCm = cm;
  }
  return values;
}

export function matchesCatalogDimensionLimits(
  product: SearchProduct,
  limits: Pick<CatalogDimensions, "widthCm" | "heightCm" | "depthClosedCm" | "depthOpenCm">,
) {
  const dimensions = getCatalogDimensions(product);
  return (Object.entries(limits) as [keyof CatalogDimensions, number | undefined][]).every(
    ([key, maximum]) =>
      maximum === undefined || (dimensions[key] !== undefined && dimensions[key]! <= maximum),
  );
}

export function matchesCatalogMaterials(product: SearchProduct, material: string) {
  return material === "all" || getCatalogMaterials(product).some((value) => value === material);
}

export function matchesCatalogColors(product: SearchProduct, color: string) {
  return color === "all" || getCatalogColorFilterValues(product).includes(color);
}

export function matchesCatalogFeatures(product: SearchProduct, feature: string) {
  return feature === "all" || getCatalogFeatures(product).some((value) => value === feature);
}

export function matchesCatalogDimensions(product: SearchProduct, query: string) {
  if (!query.trim()) return true;
  const dimensions = getDimensionValues(query);
  if (!dimensions.length) return false;
  const productDimensions = new Set(
    Object.values(getCatalogDimensions(product)).filter((value) => value !== undefined),
  );
  return dimensions.every((dimension) => productDimensions.has(dimension));
}

export function matchesCatalogSearch(product: SearchProduct, query: string): boolean {
  const { terms, dimensions, intentWords } = extractQuery(query);
  const text = normalize(sourceText(product));
  const categoryMatchesForTerm = (term: string) =>
    families[term]?.some((slug) => categoryMatches(product.categoria, slug)) ?? false;
  if (!terms.length && !dimensions.length && intentWords.size === 0) return true;
  if (!hasIntentProductMatch(product, intentWords)) return false;
  return (
    terms.every((term) => (families[term] ? categoryMatchesForTerm(term) : text.includes(term))) &&
    (!dimensions.length ||
      matchesCatalogDimensions(product, dimensions.map((cm) => cm + "cm").join(" ")))
  );
}

export function catalogSearchScore(product: SearchProduct, query: string) {
  const { terms, dimensions } = extractQuery(query);
  const title = normalize(product.nome);
  const description = normalize(product.descricao ?? "");
  const details = normalize(
    [
      product.medidas,
      ...(product.cores ?? []),
      ...(product.materiais ?? []),
      ...(product.caracteristicas ?? []),
      ...structuredDimensionLabels(product),
    ]
      .filter(Boolean)
      .join(" "),
  );
  const variations = normalize((product.variacoes_preco ?? []).map((item) => item.name).join(" "));
  let score = 0;
  for (const term of terms) {
    if (families[term] && families[term].some((slug) => categoryMatches(product.categoria, slug))) {
      score += 5;
      continue;
    }
    if (title.includes(term)) score += 12;
    else if (details.includes(term)) score += 9;
    else if (variations.includes(term)) score += 8;
    else if (description.includes(term)) score += 4;
    else if (normalize(product.categoria).includes(term)) score += 2;
  }
  score += dimensions.length * 10;
  return score;
}
