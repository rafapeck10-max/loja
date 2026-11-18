import {
  cleanCatalogMeasurementText,
  getCatalogColors,
  getCatalogMaterials,
} from "./catalog-search.ts";
import { parseProductPublicCopy, publicDescription } from "./product-copy.ts";
import { normalizeHttpUrl, structuredSku } from "./seo.ts";
import { SITE_URL } from "./site-metadata.ts";

export interface MerchantFeedProduct {
  id: string;
  nome: string;
  slug: string;
  categoria: string;
  descricao: string;
  medidas: string | null;
  cores: string[] | null;
  url_imagem: string;
  imagens: string[];
  sku: string | null;
  preco_atacado: number | null;
  preco_atual: number;
  variacoes_preco: Array<{ sale_price?: number | null }> | unknown;
  status_estoque: string;
}

const FEED_HEADERS = [
  "id",
  "title",
  "description",
  "link",
  "image_link",
  "additional_image_link",
  "availability",
  "price",
  "condition",
  "identifier_exists",
  "brand",
  "mpn",
  "product_type",
  "color",
  "material",
] as const;

function sanitizeTsvCell(value: string, maxLength?: number): string {
  const normalized = value
    .replace(/<[^>]*>/g, " ")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[\t\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!maxLength || normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).replace(/\s+\S*$/, "")}…`;
}

function buildFeedDescription(product: MerchantFeedProduct): string {
  const parsed = parseProductPublicCopy({
    nome: product.nome,
    descricao: product.descricao,
    medidas: product.medidas,
  });
  const cleanedMeasures = cleanCatalogMeasurementText(product.medidas);
  const extractedMeasures = parsed.extractedMeasurements
    .map((item) => `${item.label} ${item.value}`)
    .join("; ");
  const measuresSummary = cleanedMeasures || extractedMeasures;
  const copy = parsed.blocks.length
    ? parsed.blocks
        .map((block) => (block.kind === "list" ? block.items.join(", ") : block.text))
        .join(" ")
    : publicDescription(product.descricao);
  const parts = [product.nome, measuresSummary ? `Medidas: ${measuresSummary}` : "", copy].filter(
    Boolean,
  );
  return sanitizeTsvCell(parts.join(". "), 5000);
}

function effectiveVariationPrices(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) =>
      entry && typeof entry === "object" && !Array.isArray(entry)
        ? Number((entry as { sale_price?: unknown }).sale_price)
        : NaN,
    )
    .filter((price) => Number.isFinite(price) && price > 0);
}

export function buildMerchantFeedTsv(products: ReadonlyArray<MerchantFeedProduct>): string {
  const rows: string[] = [FEED_HEADERS.join("\t")];
  for (const product of products) {
    if (product.status_estoque !== "disponivel" && product.status_estoque !== "esgotado") continue;
    if (!(Number(product.preco_atacado) > 0)) continue;
    const variationPrices = effectiveVariationPrices(product.variacoes_preco);
    const effectivePrice =
      variationPrices.length > 0 ? Math.min(...variationPrices) : Number(product.preco_atual);
    if (!Number.isFinite(effectivePrice) || effectivePrice <= 0) continue;
    const primaryImage = normalizeHttpUrl(product.url_imagem, true) ?? "";
    if (!primaryImage || !product.slug?.trim()) continue;

    const additionalImages = [
      ...new Set(
        (Array.isArray(product.imagens) ? product.imagens : [])
          .map((src) => normalizeHttpUrl(String(src ?? ""), true))
          .filter(
            (src): src is string =>
              typeof src === "string" &&
              src !== primaryImage &&
              !src.includes(",") &&
              !src.includes("\t"),
          ),
      ),
    ].slice(0, 10);

    const sku = structuredSku(product.sku);
    const colors = getCatalogColors({
      nome: product.nome,
      categoria: product.categoria,
      cores: product.cores,
      descricao: product.descricao,
      medidas: product.medidas,
    });
    const materials = getCatalogMaterials({
      nome: product.nome,
      categoria: product.categoria,
      descricao: product.descricao,
    });

    rows.push(
      [
        sanitizeTsvCell(product.id, 50),
        sanitizeTsvCell(product.nome, 150),
        buildFeedDescription(product),
        `${SITE_URL}/produto/${encodeURIComponent(product.slug)}`,
        primaryImage,
        additionalImages.join(","),
        product.status_estoque === "disponivel" ? "in_stock" : "out_of_stock",
        `${effectivePrice.toFixed(2)} BRL`,
        "new",
        sku ? "yes" : "no",
        sku ? "Mobi" : "",
        sku ?? "",
        sanitizeTsvCell(product.categoria, 150),
        sanitizeTsvCell(colors.slice(0, 3).join("/"), 100),
        sanitizeTsvCell(materials.slice(0, 3).join("/"), 200),
      ].join("\t"),
    );
  }
  return rows.join("\n");
}
