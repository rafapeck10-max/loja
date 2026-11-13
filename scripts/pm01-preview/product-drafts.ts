import { parseWorkspace } from "../../src/lib/admin-studio.ts";
import { validateProductDrafts, type ProductDraftData } from "../../src/lib/operational-config.ts";
import type { EditorProduct } from "../../src/lib/homepage-curation.ts";

export function readPreviewProductDrafts(
  raw: string | null,
  source: EditorProduct[],
): ProductDraftData {
  const workspace = raw ? parseWorkspace(raw) : null;
  const next = (workspace?.entries.products ?? { changes: {} }) as ProductDraftData;
  const errors = validateProductDrafts(next, source);
  if (errors.length) throw new Error(errors.join(" "));
  return next;
}

export function overlayPreviewProducts(
  source: EditorProduct[],
  drafts: ProductDraftData,
): EditorProduct[] {
  return source.map((product) => drafts.changes[product.id]?.product ?? product);
}
