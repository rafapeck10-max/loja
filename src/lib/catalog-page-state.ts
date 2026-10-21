export const CATALOG_BATCH_SIZE = 24;

export function catalogVisibleCountForPage(page: number | undefined) {
  const safePage = Number.isSafeInteger(page) && (page ?? 0) > 0 ? (page as number) : 1;
  return safePage * CATALOG_BATCH_SIZE;
}

export function catalogPageForVisibleCount(count: number) {
  const safeCount = Number.isSafeInteger(count) && count > 0 ? count : CATALOG_BATCH_SIZE;
  return Math.max(1, Math.ceil(safeCount / CATALOG_BATCH_SIZE));
}
