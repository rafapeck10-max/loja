import { parseCatalogUrlState, type CatalogSort } from "../../src/lib/catalog-url-state";

export interface PreviewSearch {
  q?: string;
  all?: boolean;
  ofertas?: boolean;
  page?: number;
  sort?: CatalogSort;
  minPrice?: string;
  maxPrice?: string;
  material?: string;
  color?: string;
  feature?: string;
  dimension?: string;
  widthMaxCm?: string;
  heightMaxCm?: string;
  depthClosedMaxCm?: string;
  depthOpenMaxCm?: string;
  returnPage?: number;
  returnCategory?: string;
  returnSearch?: string;
  view?: string;
  area?: string;
}
export function previewSearch(input: Record<string, unknown>): PreviewSearch {
  const positive = (value: unknown) => {
    const n = Number(value);
    return Number.isSafeInteger(n) && n > 0 ? n : undefined;
  };
  const listing = parseCatalogUrlState(input);
  return {
    q: typeof input.q === "string" ? input.q.slice(0, 250) : undefined,
    all: input.all === true || input.all === "true" || undefined,
    ofertas: input.ofertas === true || input.ofertas === "true" || undefined,
    page: positive(input.page),
    sort: input.sort === undefined ? undefined : listing.sort,
    minPrice: input.minPrice === undefined ? undefined : listing.minPrice,
    maxPrice: input.maxPrice === undefined ? undefined : listing.maxPrice,
    material: input.material === undefined ? undefined : listing.material,
    color: input.color === undefined ? undefined : listing.color,
    feature: input.feature === undefined ? undefined : listing.feature,
    dimension: input.dimension === undefined ? undefined : listing.dimension,
    widthMaxCm: input.widthMaxCm === undefined ? undefined : listing.widthMaxCm,
    heightMaxCm: input.heightMaxCm === undefined ? undefined : listing.heightMaxCm,
    depthClosedMaxCm: input.depthClosedMaxCm === undefined ? undefined : listing.depthClosedMaxCm,
    depthOpenMaxCm: input.depthOpenMaxCm === undefined ? undefined : listing.depthOpenMaxCm,
    returnPage: positive(input.returnPage),
    returnCategory: typeof input.returnCategory === "string" ? input.returnCategory : undefined,
    returnSearch:
      typeof input.returnSearch === "string" && input.returnSearch.length <= 700
        ? input.returnSearch
        : undefined,
    view: typeof input.view === "string" ? input.view : undefined,
    area: typeof input.area === "string" ? input.area : undefined,
  };
}
