import { z } from "zod";
import { safeMobiLink } from "./operational-config.ts";
import { PAGE_SECTIONS } from "./pages-shelves.ts";
const text = z.string().max(2000);
const id = z.string().min(1).max(100);
const settings = z
  .object({
    novidade: z.enum(["automatico", "incluir", "ocultar"]),
    sala: z.enum(["automatico", "incluir", "ocultar"]),
    descoberta: z.boolean(),
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
    sections: z.array(section).max(7),
    sectionIds: z
      .object({
        weekly: z.array(id).max(4),
        discovery: z.array(id).max(4),
        new: z.array(id).max(4),
        room: z.array(id).max(4),
      })
      .strict(),
    curation: z
      .object({ weeklyIds: z.array(id).max(4), settings: z.record(id, settings) })
      .strict()
      .optional(),
    banners: z.array(banner).max(12),
    navigation: z
      .array(
        z
          .object({
            id,
            label: z.string().min(1).max(80),
            href: z.string().refine(safeMobiLink),
            visible: z.boolean(),
          })
          .strict(),
      )
      .max(9),
    service: z
      .object({ regionMessage: text, deliveryMessage: text, assemblyMessage: text })
      .strict(),
  })
  .strict();
