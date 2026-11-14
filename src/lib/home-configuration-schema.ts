import { z } from "zod";
import { safeMobiLink } from "./operational-config.ts";
import { PAGE_SECTIONS } from "./pages-shelves.ts";
import { isBrasiliaDate } from "./campaigns.ts";
const text = z.string().max(2000);
const id = z.string().min(1).max(100);
const settings = z
  .object({
    novidade: z.enum(["automatico", "incluir", "ocultar"]),
    sala: z.enum(["automatico", "incluir", "ocultar"]),
    descoberta: z.boolean(),
  })
  .strict();
const shelfSelection = z
  .object({
    mode: z.enum(["automatico", "manual"]),
    productIds: z
      .array(id)
      .max(4)
      .refine((values) => new Set(values).size === values.length),
  })
  .strict();
const section = z
  .object({
    id: z.string(),
    type: z.string(),
    title: z.string().max(80),
    subtitle: z.string().max(240),
    enabled: z.boolean(),
  })
  .strict()
  .refine((s) => PAGE_SECTIONS.some((d) => d.id === s.id && d.type === s.type));
const blackFridayCampaign = z
  .object({
    id,
    startsAt: z.string().refine(isBrasiliaDate),
    endsAt: z.string().refine(isBrasiliaDate),
    productIds: z.array(id).min(1).max(1000),
    source: z.literal("local-preview"),
  })
  .strict()
  .refine(
    (campaign) =>
      Date.parse(campaign.endsAt) > Date.parse(campaign.startsAt) &&
      new Set(campaign.productIds).size === campaign.productIds.length,
  );
const contentPage = z
  .object({
    id,
    title: z.string().min(1).max(100),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(100),
    body: z.string().max(15000),
    status: z.literal("review"),
    reviewedAt: z
      .string()
      .max(50)
      .refine((value) => Number.isFinite(Date.parse(value))),
    faqs: z
      .array(
        z
          .object({ question: z.string().min(1).max(200), answer: z.string().min(1).max(2000) })
          .strict(),
      )
      .max(30),
    links: z
      .array(
        z
          .object({ label: z.string().min(1).max(100), href: z.string().refine(safeMobiLink) })
          .strict(),
      )
      .max(20),
  })
  .strict();
const contentArticleImage = z
  .object({
    url: z
      .string()
      .max(2000)
      .refine((value) => !value || /^https:\/\//i.test(value)),
    alt: z.string().max(160),
    afterParagraph: z.number().int().min(1).max(200),
  })
  .strict();
const contentArticle = z
  .object({
    id,
    title: z.string().min(1).max(120),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(100),
    category: z.string().max(60),
    excerpt: z.string().max(360),
    imageUrl: z
      .string()
      .max(2000)
      .refine((value) => !value || /^https:\/\//i.test(value)),
    imageAlt: z.string().max(160),
    images: z.array(contentArticleImage).max(6).optional(),
    body: z.string().min(1).max(30000),
    status: z.literal("review"),
    reviewedAt: z
      .string()
      .max(50)
      .refine((value) => Number.isFinite(Date.parse(value))),
    featured: z.boolean(),
    relatedProductIds: z.array(id).max(6),
  })
  .strict();
const reviewedContent = z
  .object({
    pages: z.array(contentPage).max(40),
    articles: z.array(contentArticle).max(100).optional(),
  })
  .strict()
  .superRefine((content, ctx) => {
    const ids = new Set<string>();
    const slugs = new Set<string>();
    for (const page of content.pages) {
      if (ids.has(page.id)) ctx.addIssue({ code: "custom", message: "ID de página repetido." });
      if (slugs.has(page.slug))
        ctx.addIssue({ code: "custom", message: "Endereço de ajuda repetido." });
      ids.add(page.id);
      slugs.add(page.slug);
    }
    const articleIds = new Set<string>();
    const articleSlugs = new Set<string>();
    let featuredCount = 0;
    for (const article of content.articles ?? []) {
      if (articleIds.has(article.id))
        ctx.addIssue({ code: "custom", message: "ID de artigo repetido." });
      if (articleSlugs.has(article.slug))
        ctx.addIssue({ code: "custom", message: "Endereço de artigo repetido." });
      articleIds.add(article.id);
      articleSlugs.add(article.slug);
      if (article.featured) featuredCount++;
      for (const image of article.images ?? []) {
        if (!image.url.trim() || !image.alt.trim())
          ctx.addIssue({ code: "custom", message: "Imagem editorial incompleta." });
      }
    }
    if (featuredCount > 1)
      ctx.addIssue({ code: "custom", message: "Há mais de um artigo editorial em destaque." });
  });
const banner = z
  .object({
    id,
    position: z.number().int().positive(),
    image_url: z.string().max(2_000_000),
    mobile_image_url: z.string().max(2_000_000),
    alt: text,
    show_text: z.boolean(),
    eyebrow: text,
    title: text,
    subtitle: text,
    cta_label: text,
    cta_href: z.string().refine(safeMobiLink),
    active: z.boolean(),
    starts_at: z.string(),
    ends_at: z.string(),
  })
  .strict();
export const homeConfigurationSchema = z
  .object({
    schemaVersion: z.literal(1),
    sections: z.array(section).min(7).max(8),
    sectionIds: z
      .object({
        weekly: z.array(id).max(4),
        discovery: z.array(id).max(4),
        new: z.array(id).max(4),
        room: z.array(id).max(4),
      })
      .strict(),
    blackFridayCampaigns: z.array(blackFridayCampaign).max(100).optional(),
    curation: z
      .object({ weeklyIds: z.array(id).max(4), settings: z.record(id, settings) })
      .strict()
      .optional(),
    shelves: z.object({ new: shelfSelection, room: shelfSelection }).strict().optional(),
    banners: z.array(banner).max(12),
    navigation: z
      .array(
        z
          .object({
            id,
            label: z.string().min(1).max(80),
            href: z.string().refine(safeMobiLink),
            visible: z.boolean(),
            filters: z
              .array(z.enum(["material", "color", "dimensions", "features"]))
              .max(4)
              .optional(),
          })
          .strict(),
      )
      .max(9),
    content: reviewedContent.optional(),
    service: z
      .object({ regionMessage: text, deliveryMessage: text, assemblyMessage: text })
      .strict(),
  })
  .strict();
