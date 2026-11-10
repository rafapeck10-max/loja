export interface PreviewSearch {
  q?: string;
  all?: boolean;
  ofertas?: boolean;
  page?: number;
  returnPage?: number;
  returnCategory?: string;
  view?: string;
  area?: string;
}
export function previewSearch(input: Record<string, unknown>): PreviewSearch {
  const positive = (value: unknown) => {
    const n = Number(value);
    return Number.isSafeInteger(n) && n > 0 ? n : undefined;
  };
  return {
    q: typeof input.q === "string" ? input.q.slice(0, 250) : undefined,
    all: input.all === true || input.all === "true" || undefined,
    ofertas: input.ofertas === true || input.ofertas === "true" || undefined,
    page: positive(input.page),
    returnPage: positive(input.returnPage),
    returnCategory: typeof input.returnCategory === "string" ? input.returnCategory : undefined,
    view: typeof input.view === "string" ? input.view : undefined,
    area: typeof input.area === "string" ? input.area : undefined,
  };
}
