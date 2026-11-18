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
  const urlEntries = new Map<string, string | undefined>();
  for (const staticPath of [
    "/",
    "/moveis-nova-iguacu",
    "/ajuda",
    "/ajuda/como-comprar",
    "/ajuda/entrega",
    "/ajuda/pagamento",
    "/ajuda/trocas-e-garantia",
    "/inspiracao",
  ]) {
    urlEntries.set(staticPath, undefined);
  }
  for (const category of categories) {
    urlEntries.set(`/categoria/${encodeURIComponent(category.slug)}`, undefined);
  }
  for (const product of products) {
    if (!product.slug?.trim()) continue;
    const path = `/produto/${encodeURIComponent(product.slug)}`;
    if (urlEntries.has(path)) continue;
    const validImage =
      product.url_imagem && /^https?:\/\//i.test(product.url_imagem.trim())
        ? product.url_imagem.trim()
        : undefined;
    urlEntries.set(path, validImage);
  }
  if (urlEntries.size > 50_000) throw new Error("Sitemap requires an index above 50,000 URLs");
  const escape = (value: string) =>
    value.replace(
      /[<>&"']/g,
      (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[char]!,
    );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...[...urlEntries].map(([path, image]) =>
      image
        ? `  <url><loc>${escape(SITE_URL + path)}</loc><image:image><image:loc>${escape(image)}</image:loc></image:image></url>`
        : `  <url><loc>${escape(SITE_URL + path)}</loc></url>`,
    ),
    "</urlset>",
  ].join("\n");
}
