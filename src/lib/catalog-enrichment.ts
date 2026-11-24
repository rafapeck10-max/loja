import { getCatalogColors, isNoiseColorToken } from "./catalog-search.ts";
import { productMeasurements } from "./product-measurements.ts";

export interface MedidasExtractionResult {
  medidas: string | null;
  extractedCount: number;
  anomaly?: string;
}

const MIN_DIMENSION_CM = 3;
const MAX_DIMENSION_CM = 500;

interface ParsedDim {
  rawValue: string;
  unit: "mm" | "cm" | "m";
  cm: number;
}

function toCentimetres(value: string, unit: string): ParsedDim | null {
  const numeric = Number(value.replace(",", "."));
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  const normalizedUnit = unit.toLowerCase() as "mm" | "cm" | "m";
  const multiplier = normalizedUnit === "m" ? 100 : normalizedUnit === "mm" ? 0.1 : 1;
  return {
    rawValue: value.replace(".", ","),
    unit: normalizedUnit,
    cm: numeric * multiplier,
  };
}

function formatMeasure(value: ParsedDim): string {
  return `${value.rawValue} ${value.unit}`;
}

/** Isolates the primary product specification block before nested component dimensions (mirrors, shelves, niches). */
function isolatePrimaryDimensionBlock(raw: string): string {
  const normalized = raw
    .replace(/\\r\\n|\\n|`n|\r\n/g, "\n")
    .replace(/\u2800+/g, " ")
    .trim();
  const medidasIndex = normalized.search(/\bmedidas?\b/i);
  const scanOffset = medidasIndex >= 0 ? medidasIndex : 0;
  const tail = normalized.slice(scanOffset);
  const componentCutoff =
    /\b(?:espelho|tampo|recorte|nichos?|prateleiras?|fornos?|gavetas?|assentop?|bra[cç]o|m[oó]dulos?|a[eé]reo|balc[aã]o|paneleiro|cama\s+auxiliar|medidas?\s+internas?|medidas?\s+cadeira)\b\s*[:-]|\bestrado\b[^\n]{0,30}\balt|\+\s*painel\b/i;
  const cutRel = tail.search(componentCutoff);
  return cutRel > 0 ? normalized.slice(0, scanOffset + cutRel) : normalized;
}

function checkSanity(
  label: string,
  parsed: ParsedDim,
): { ok: true } | { ok: false; anomaly: string } {
  if (parsed.cm < MIN_DIMENSION_CM || parsed.cm > MAX_DIMENSION_CM) {
    return { ok: false, anomaly: `out_of_bounds:${label}:${parsed.rawValue}${parsed.unit}` };
  }
  return { ok: true };
}

function pickConsistent(
  label: string,
  matches: ParsedDim[],
): { value: ParsedDim | null; anomaly?: string } {
  if (matches.length === 0) return { value: null };
  const first = matches[0];
  const sanityFirst = checkSanity(label, first);
  if (!sanityFirst.ok) return { value: null, anomaly: sanityFirst.anomaly };
  for (let i = 1; i < matches.length; i += 1) {
    const sanityOther = checkSanity(label, matches[i]);
    if (!sanityOther.ok) return { value: null, anomaly: sanityOther.anomaly };
    if (Math.abs(matches[i].cm - first.cm) > 1.0) {
      return { value: null, anomaly: `conflicting:${label}` };
    }
  }
  return { value: first };
}

export function extractMedidasFromDescription(
  descricao: string | null | undefined,
): MedidasExtractionResult {
  if (!descricao?.trim()) return { medidas: null, extractedCount: 0 };

  const block = isolatePrimaryDimensionBlock(descricao);

  const heightMatches: ParsedDim[] = [];
  for (const m of block.matchAll(
    /\b(?:altura(?![A-Za-zÀ-ÿ0-9_])|alt(?![A-Za-zÀ-ÿ_]))\.?(?:\s+total)?\s*(?:\([^)]*\))?\s*[:-]?\s*(?<![\d.,])(\d+(?:[.,]\d{1,3})?)\s*(mm|cm|m)(?![A-Za-zÀ-ÿ0-9_])/gi,
  )) {
    const parsed = toCentimetres(m[1], m[2]);
    if (parsed) heightMatches.push(parsed);
  }

  const widthMatches: ParsedDim[] = [];
  let widthLabel: "Largura" | "Comprimento" = "Largura";
  for (const m of block.matchAll(
    /\b(largura(?![A-Za-zÀ-ÿ0-9_])|larg(?![A-Za-zÀ-ÿ_])|comprimento(?![A-Za-zÀ-ÿ0-9_])|comp(?![A-Za-zÀ-ÿ_]))\.?(?:\s+total)?\s*(?:\([^)]*\))?\s*[:-]?\s*(?<![\d.,])(\d+(?:[.,]\d{1,3})?)\s*(mm|cm|m)(?![A-Za-zÀ-ÿ0-9_])/gi,
  )) {
    const parsed = toCentimetres(m[2], m[3]);
    if (parsed) {
      widthMatches.push(parsed);
      widthLabel = m[1].toLowerCase().startsWith("larg") ? "Largura" : "Comprimento";
    }
  }

  const depthClosedMatches: ParsedDim[] = [];
  for (const m of block.matchAll(
    /\b(?:profundidade|prof|porf)\.?\s*fechad[oa]\s*[:-]?\s*(?<![\d.,])(\d+(?:[.,]\d{1,3})?)\s*(mm|cm|m)(?![A-Za-zÀ-ÿ0-9_])/gi,
  )) {
    const parsed = toCentimetres(m[1], m[2]);
    if (parsed) depthClosedMatches.push(parsed);
  }

  const depthOpenMatches: ParsedDim[] = [];
  for (const m of block.matchAll(
    /\b(?:profundidade|prof|porf)\.?\s*abert[oa]\s*[:-]?\s*(?<![\d.,])(\d+(?:[.,]\d{1,3})?)\s*(mm|cm|m)(?![A-Za-zÀ-ÿ0-9_])/gi,
  )) {
    const parsed = toCentimetres(m[1], m[2]);
    if (parsed) depthOpenMatches.push(parsed);
  }

  const depthPlainMatches: ParsedDim[] = [];
  if (depthClosedMatches.length === 0 && depthOpenMatches.length === 0) {
    for (const m of block.matchAll(
      /\b(?:profundidade(?![A-Za-zÀ-ÿ0-9_])|prof(?![A-Za-zÀ-ÿ_])|porf(?![A-Za-zÀ-ÿ_]))\.?\s*(?:\([^)]*\))?\s*[:-]?\s*(?<![\d.,])(\d+(?:[.,]\d{1,3})?)\s*(mm|cm|m)(?![A-Za-zÀ-ÿ0-9_])/gi,
    )) {
      const parsed = toCentimetres(m[1], m[2]);
      if (parsed) depthPlainMatches.push(parsed);
    }
  }

  const height = pickConsistent("Altura", heightMatches);
  if (height.anomaly) return { medidas: null, extractedCount: 0, anomaly: height.anomaly };

  const width = pickConsistent(widthLabel, widthMatches);
  if (width.anomaly) return { medidas: null, extractedCount: 0, anomaly: width.anomaly };

  const depthClosed = pickConsistent("Profundidade fechada", depthClosedMatches);
  if (depthClosed.anomaly) {
    return { medidas: null, extractedCount: 0, anomaly: depthClosed.anomaly };
  }

  const depthOpen = pickConsistent("Profundidade aberta", depthOpenMatches);
  if (depthOpen.anomaly) return { medidas: null, extractedCount: 0, anomaly: depthOpen.anomaly };

  const depthPlain = pickConsistent("Profundidade", depthPlainMatches);
  if (depthPlain.anomaly) return { medidas: null, extractedCount: 0, anomaly: depthPlain.anomaly };

  const parts: string[] = [];
  let expectedMeasures = 0;

  if (height.value) {
    parts.push(`Altura: ${formatMeasure(height.value)}`);
    expectedMeasures += 1;
  }
  if (width.value) {
    parts.push(`${widthLabel}: ${formatMeasure(width.value)}`);
    expectedMeasures += 1;
  }
  if (depthClosed.value && depthOpen.value) {
    parts.push(
      `Profundidade: ${formatMeasure(depthClosed.value)} fechada / ${formatMeasure(depthOpen.value)} aberta`,
    );
    expectedMeasures += 2;
  } else if (depthClosed.value) {
    parts.push(`Profundidade: ${formatMeasure(depthClosed.value)} fechada`);
    expectedMeasures += 1;
  } else if (depthOpen.value) {
    parts.push(`Profundidade: ${formatMeasure(depthOpen.value)} aberta`);
    expectedMeasures += 1;
  } else if (depthPlain.value) {
    parts.push(`Profundidade: ${formatMeasure(depthPlain.value)}`);
    expectedMeasures += 1;
  }

  if (expectedMeasures < 2) {
    return { medidas: null, extractedCount: expectedMeasures };
  }

  const formatted = parts.join(" · ");
  const verified = productMeasurements(formatted);
  if (verified.length < expectedMeasures) {
    return {
      medidas: null,
      extractedCount: 0,
      anomaly: "parser_verification_mismatch",
    };
  }

  return { medidas: formatted, extractedCount: verified.length };
}

const NON_COLOR_WORDS = new Set([
  "acabamento",
  "acesso",
  "alem",
  "alteracao",
  "alteracoes",
  "bancada",
  "cabeceira",
  "cantoneira",
  "colchao",
  "corredica",
  "corredicas",
  "detalhe",
  "detalhes",
  "eslovenia",
  "estrutura",
  "facil",
  "final",
  "foto",
  "fotos",
  "ilustracao",
  "imagem",
  "imagens",
  "kit",
  "lateral",
  "laterais",
  "linho",
  "mdf",
  "mdp",
  "modulo",
  "nichos",
  "pes",
  "personalidade",
  "podem",
  "praticidade",
  "produto",
  "roupeiro",
  "sofa",
  "sofrer",
  "suede",
  "tampo",
  "tecido",
  "telescopica",
  "telescopicas",
  "tv",
  "variar",
  "varios",
  "veludo",
]);

function normalizeColorToken(raw: string): string | null {
  let token = raw
    .trim()
    .replace(/^[:-\s]+|[:-\s]+$/g, "")
    .replace(/\bof\s+white\b/gi, "Off White")
    .replace(/\bbranco-branco\b/gi, "Branco")
    .replace(/\s+\d{1,3}$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!token || token.length < 3 || token.length > 26) return null;
  if (token.split(/\s+/).length > 3) return null;
  if (isNoiseColorToken(token)) return null;
  const asciiWords = token
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/\s+/);
  if (asciiWords.some((word) => NON_COLOR_WORDS.has(word))) return null;
  if (token === token.toUpperCase() || token === token.toLowerCase()) {
    token = token.replace(
      /\S+/g,
      (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    );
  }
  return token;
}

export function extractColorsFromDescription(
  descricao: string | null | undefined,
  nome?: string | null,
  categoria?: string | null,
): string[] {
  const found = new Set<string>();
  const text = (descricao ?? "").replace(/\\r\\n|\\n|`n|\r\n/g, "\n");

  if (text.trim()) {
    // Match singular "Côr/Cor" only (never plural "cores" from disclaimers like "as cores podem sofrer").
    for (const match of text.matchAll(
      /(?<![A-Za-zÀ-ÿ])c[oô]r(?![A-Za-zÀ-ÿ])\s*(?::|-|\s+(?=[A-ZÀ-Ý]))\s*([^\n;]+?)(?=(?:\s*,\s*da\s+|\s*-\s*\d|\s+medidas\b|\s+estrutura\b|\s+tecido\b|\s+acabamento\b|\n|\.|;|$))/gi,
    )) {
      const rawSegment = match[1].trim();
      if (!rawSegment) continue;
      for (const part of rawSegment.split(/\s*\/\s*|\s+e\s+|\s*\.\s*(?=[A-Za-zÀ-ÿ])/)) {
        const normalized = normalizeColorToken(part);
        if (normalized) found.add(normalized);
      }
    }
  }

  if (found.size === 0 && nome?.trim()) {
    // Reuse Mobi's canonical catalog color vocabulary without duplicating the color table.
    for (const color of getCatalogColors({ nome: "", categoria: categoria ?? "", cores: [nome] })) {
      const normalized = normalizeColorToken(color);
      if (normalized) found.add(normalized);
    }
  }

  return [...found];
}
