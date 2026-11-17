import { cleanCatalogMeasurementText } from "./catalog-search.ts";
import { productMeasurements, type ProductMeasure } from "./product-measurements.ts";

export type DescriptionBlock =
  { kind: "paragraph"; text: string } | { kind: "list"; items: string[] };

export interface ParsedProductCopy {
  blocks: DescriptionBlock[];
  extractedMeasurements: ProductMeasure[];
  disclaimers: string[];
  fullText: string;
}

const SUPPLIER_LINE_RE =
  /^\s*(fornecedor|link do fornecedor|origem|custo|pre[cç]o de atacado|c[oó]digos por cor na sr)\s*:/i;

const AVAILABILITY_HEADER_RE = /^\s*disponibilidade(?:\s+no\s+fornecedor)?\s*:/i;

const AVAILABILITY_ENTRY_RE = /\b(?:dispon[ií]vel|indispon[ií]vel|esgotad[oa])\b(?:\s+x\d+)?\s*$/i;

const STANDALONE_SECTION_HEADER_RE =
  /^(?:descri[cç][aã]o(?:\s+do\s+produto)?|caracter[ií]sticas(?:\s+(?:do\s+produto|principais|gerais))?|especifica[cç][oõ]es(?:\s+t[eé]cnicas)?|ficha\s+t[eé]cnica|detalhes(?:\s+do\s+produto)?|sobre\s+o\s+produto|informa[cç][oõ]es\s+(?:do\s+produto|t[eé]cnicas))\s*[:.-]*$/i;

const MEASUREMENT_HEADER_RE =
  /^(?:medidas(?:\s+d[oaes]\s+[\wÀ-ÿ.-]+(?:\s+[\wÀ-ÿ.-]+)?)?|dimens[oõ]es(?:\s+d[oaes]\s+[\wÀ-ÿ.-]+(?:\s+[\wÀ-ÿ.-]+)?)?|medidas(?:\s+fechad[oa]|\s+abert[oa])?(?:\s+e\s+especifica[cç][oõ]es)?)\s*[:-]*$/i;

const DISCLAIMER_RE =
  /^(?:itens decorativos(?: e outros produtos)? n[aã]o inclusos\.?|as imagens s[aã]o meramente ilustrativas[^\n]*|n[aã]o acompanha (?:itens|objetos) de decora[cç][aã]o[^\n]*|produtos de decora[cç][aã]o n[aã]o acompanh[^\n]*|objetos decorativos n[aã]o inclusos\.?)$/i;

const BULLET_PREFIX_RE = /^(?:[•▪▸‣⁃–—*]\s*|-\s+)/;

function decodeLineBreaks(value: string) {
  return value.replace(/\\r\\n|\\n|`n|\r\n|\r/g, "\n").replace(/\u2800+/g, " ");
}

function normalizeComparable(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isAvailabilityTail(line: string) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return (
    AVAILABILITY_ENTRY_RE.test(trimmed) ||
    /(?:[-:]\s*(?:dispon[ií]vel|indispon[ií]vel|esgotad[oa])|\b(?:DISPON[IÍ]VEL|DISPONIVEL|INDISPON[IÍ]VEL|INDISPONIVEL|ESGOTAD[OA])\b(?:\s+x\d+)?)/i.test(
      trimmed,
    )
  );
}

/** Remove supplier logistics from public copy without changing catalog records. */
export function publicDescription(description: string) {
  const lines = decodeLineBreaks(description ?? "").split("\n");
  const kept: string[] = [];
  let skippingAvailability = false;

  for (const line of lines) {
    const cleanedLine = line.replace(/Códigos por cor na SR:[^\n]*/gi, "").trimEnd();
    const trimmed = cleanedLine.trim();

    if (AVAILABILITY_HEADER_RE.test(trimmed)) {
      skippingAvailability = true;
      continue;
    }
    if (skippingAvailability) {
      if (!trimmed) {
        skippingAvailability = false;
        continue;
      }
      if (isAvailabilityTail(trimmed)) continue;
      skippingAvailability = false;
    }
    if (SUPPLIER_LINE_RE.test(trimmed)) continue;
    kept.push(trimmed);
  }

  return kept
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+(Varia[cç][oõ]es de cor:)/gi, "\n\n$1")
    .trim();
}

function isPureDimensionLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (MEASUREMENT_HEADER_RE.test(trimmed)) return true;
  if (trimmed.length > 140) return false;

  const remainder = trimmed
    .replace(
      /\b(?:mesa|cadeira|a[eé]reo|balc[aã]o|paneleiro|m[oó]dulo(?:\s+\w+)?|painel|rack|bancada|base|colch[aã]o|cabec(?:eira)?|medidas?|dimens[oõ]es|altura|alt(?=\b|\.|\d)|largura|larg(?=\b|\.|\d)|profundidade(?:\s+(?:total|fechad[oa]|abert[oa]|do\s+assento))?|prof(?=\b|\.|\d)|comprimento|comp(?=\b|\.|\d)|di[aâ]metro|total|aproximad[oa]|fechad[oa]|abert[oa]|volumes?|caixas?)\b/gi,
      " ",
    )
    .replace(/\d+(?:[.,]\d{1,3})?\s*(?:mm|cm|m|kg|g|caixas?)?\b/gi, " ")
    .replace(/[\s:;,.\-|/x×()+]+/gi, "")
    .trim();

  return /\d/.test(trimmed) && remainder.length <= 2;
}

function stripLeadingNoiseLines(text: string, nome: string) {
  const normalizedTitle = normalizeComparable(nome);
  const lines = text.split("\n");
  while (lines.length > 0) {
    const head = lines[0].trim();
    if (!head) {
      lines.shift();
      continue;
    }
    if (STANDALONE_SECTION_HEADER_RE.test(head)) {
      lines.shift();
      continue;
    }
    const normalizedHead = normalizeComparable(head);
    if (normalizedTitle && normalizedHead && normalizedHead === normalizedTitle) {
      lines.shift();
      continue;
    }
    break;
  }
  return lines.join("\n").trim();
}

function rescueCopyFromMedidas(medidas: string | null | undefined, existingCopy: string): string {
  const raw = decodeLineBreaks(medidas ?? "").trim();
  if (!raw) return "";
  const cleanedMeasures = cleanCatalogMeasurementText(raw);
  const normalizedExisting = normalizeComparable(existingCopy);

  const paragraphs = raw
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  const extraCopy: string[] = [];
  for (const part of paragraphs) {
    if (SUPPLIER_LINE_RE.test(part) || AVAILABILITY_HEADER_RE.test(part)) continue;
    const isJustCleanedMeasure =
      cleanedMeasures && normalizeComparable(cleanedMeasures).includes(normalizeComparable(part));
    if (isJustCleanedMeasure) continue;
    if (MEASUREMENT_HEADER_RE.test(part) || part.split("\n").every(isPureDimensionLine)) continue;
    const normalizedPart = normalizeComparable(part);
    if (normalizedPart.length < 15) continue;
    if (normalizedExisting.includes(normalizedPart.slice(0, 60))) continue;
    extraCopy.push(part);
  }

  if (extraCopy.length === 0 && raw.length > 120) {
    const beforeMedidas = raw.split(/\b(?:medidas|dimens[oõ]es)\s*:/i)[0]?.trim() ?? "";
    if (
      beforeMedidas.length > 40 &&
      !normalizedExisting.includes(normalizeComparable(beforeMedidas).slice(0, 50))
    ) {
      extraCopy.push(beforeMedidas);
    }
  }

  return extraCopy.join("\n\n");
}

function isShortHeadingParagraph(part: string) {
  if (part.includes("\n") || BULLET_PREFIX_RE.test(part)) return false;
  if (part.length > 42 || part.split(/\s+/).length > 6) return false;
  if (/[.!?]$/.test(part)) return false;
  return /^[A-Za-zÀ-ÿ0-9]/.test(part);
}

/** Structure cleaned copy for PDP display and fallback dimensions without mutating catalog filters. */
export function parseProductPublicCopy({
  nome = "",
  descricao = "",
  medidas = null,
}: {
  nome?: string | null;
  descricao?: string | null;
  medidas?: string | null;
}): ParsedProductCopy {
  const cleaned = publicDescription(descricao ?? "");
  const extractedMeasurements = productMeasurements(cleaned);
  const rescued = rescueCopyFromMedidas(medidas, cleaned);
  const combinedRaw = [cleaned, rescued].filter(Boolean).join("\n\n");
  const withoutLeading = stripLeadingNoiseLines(combinedRaw, nome ?? "");

  const hasAnyMeasurements =
    extractedMeasurements.length > 0 || Boolean(cleanCatalogMeasurementText(medidas));

  const rawParagraphs = withoutLeading
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  const disclaimers: string[] = [];
  const filteredParagraphs: string[] = [];

  for (const part of rawParagraphs) {
    const keptLines: string[] = [];
    for (const rawLine of part.split("\n")) {
      const trimmedLine = rawLine.trim();
      if (!trimmedLine) continue;
      if (STANDALONE_SECTION_HEADER_RE.test(trimmedLine)) continue;
      if (DISCLAIMER_RE.test(trimmedLine)) {
        if (!disclaimers.includes(trimmedLine)) disclaimers.push(trimmedLine);
        continue;
      }
      if (hasAnyMeasurements && isPureDimensionLine(trimmedLine)) continue;
      keptLines.push(trimmedLine);
    }
    if (keptLines.length > 0) filteredParagraphs.push(keptLines.join("\n"));
  }

  const mergedParagraphs: string[] = [];
  for (let i = 0; i < filteredParagraphs.length; i += 1) {
    const current = filteredParagraphs[i];
    const next = filteredParagraphs[i + 1];
    if (
      next &&
      isShortHeadingParagraph(current) &&
      !next.split("\n").every((line) => BULLET_PREFIX_RE.test(line))
    ) {
      mergedParagraphs.push(`${current.replace(/:\s*$/, "")}: ${next}`);
      i += 1;
      continue;
    }
    mergedParagraphs.push(current);
  }

  const blocks: DescriptionBlock[] = [];
  for (const part of mergedParagraphs) {
    const lines = part
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const bulletLines = lines.filter((line) => BULLET_PREFIX_RE.test(line));
    if (bulletLines.length > 0 && bulletLines.length === lines.length) {
      blocks.push({
        kind: "list",
        items: lines.map((line) => line.replace(BULLET_PREFIX_RE, "").trim()).filter(Boolean),
      });
      continue;
    }
    if (bulletLines.length >= 2) {
      let currentText: string[] = [];
      let currentBullets: string[] = [];
      const flushText = () => {
        if (currentText.length) {
          blocks.push({ kind: "paragraph", text: currentText.join("\n") });
          currentText = [];
        }
      };
      const flushBullets = () => {
        if (currentBullets.length) {
          blocks.push({ kind: "list", items: currentBullets });
          currentBullets = [];
        }
      };
      for (const line of lines) {
        if (BULLET_PREFIX_RE.test(line)) {
          flushText();
          const cleanedItem = line.replace(BULLET_PREFIX_RE, "").trim();
          if (cleanedItem) currentBullets.push(cleanedItem);
        } else {
          flushBullets();
          currentText.push(line);
        }
      }
      flushText();
      flushBullets();
      continue;
    }
    blocks.push({ kind: "paragraph", text: lines.join("\n") });
  }

  const fullText = blocks
    .map((block) =>
      block.kind === "list" ? block.items.map((item) => `• ${item}`).join("\n") : block.text,
    )
    .join("\n\n")
    .trim();

  return {
    blocks,
    extractedMeasurements,
    disclaimers,
    fullText,
  };
}
