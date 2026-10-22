import { CATEGORIES, SUBCATEGORIES, categoryMatches } from "./constants.ts";
import { SITE_URL } from "./site-metadata.ts";

export interface SitemapProduct {
  slug: string;
  categoria: string;
  url_imagem?: string;
}
export const SITEMAP_BATCH_SIZE = 500;

export async function collectSitemapProducts(
  readPage: (offset: number, end: number) => Promise<SitemapProduct[]>,
) {
  const products: SitemapProduct[] = [];
  for (let offset = 0; ; offset += SITEMAP_BATCH_SIZE) {
    const batch = await readPage(offset, offset + SITEMAP_BATCH_SIZE - 1);
    products.push(...batch);
    if (batch.length < SITEMAP_BATCH_SIZE) return products;
  }
}

export function buildSitemap(products: SitemapProduct[]) {
  const categories = [...CATEGORIES, ...SUBCATEGORIES].filter((category) =>
    products.some((product) => categoryMatches(product.categoria, category.slug)),
  );
  const paths = new Set([
    "/",
    ...categories.map((category) => `/categoria/${encodeURIComponent(category.slug)}`),
    ...products
      .filter((product) => product.slug?.trim())
      .map((product) => `/produto/${encodeURIComponent(product.slug)}`),
  ]);
  if (paths.size > 50_000) throw new Error("Sitemap requires an index above 50,000 URLs");
  const escape = (value: string) =>
    value.replace(
      /[<>&"']/g,
      (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[char]!,
    );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...[...paths].map((path) => `  <url><loc>${escape(SITE_URL + path)}</loc></url>`),
    "</urlset>",
  ].join("\n");
}
