export const CATALOG_SORTS = ["recommended", "relevant", "low", "high", "new"] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

export interface CatalogFilterState {
  sort: CatalogSort;
  minPrice: string;
  maxPrice: string;
  material: string;
  color: string;
  feature: string;
  dimension: string;
  widthMaxCm: string;
  heightMaxCm: string;
  depthClosedMaxCm: string;
  depthOpenMaxCm: string;
}

export interface CatalogUrlState extends CatalogFilterState {
  page: number;
}

export const DEFAULT_CATALOG_FILTERS: CatalogFilterState = {
  sort: "recommended",
  minPrice: "",
  maxPrice: "",
  material: "all",
  color: "all",
  feature: "all",
  dimension: "",
  widthMaxCm: "",
  heightMaxCm: "",
  depthClosedMaxCm: "",
  depthOpenMaxCm: "",
};

function boundedText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  const text = value.trim();
  const hasControlCharacter = Array.from(text).some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });
  return text.length <= maxLength && !hasControlCharacter ? text : "";
}

function priceText(value: unknown) {
  const text = boundedText(typeof value === "number" ? String(value) : value, 12);
  return text && /^\d{1,7}(?:[.,]\d{0,2})?$/.test(text) ? text : "";
}

function dimensionLimitText(value: unknown) {
  const text = priceText(value);
  if (!text) return "";
  const number = Number(text.replace(",", "."));
  return Number.isFinite(number) && number > 0 && number <= 10000 ? text : "";
}

function pageNumber(value: unknown) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function parseCatalogUrlState(search: object): CatalogUrlState {
  const params = search as Record<string, unknown>;
  const sort = boundedText(params.sort, 20);
  return {
    page: pageNumber(params.page),
    sort: CATALOG_SORTS.includes(sort as CatalogSort) ? (sort as CatalogSort) : "recommended",
    minPrice: priceText(params.minPrice ?? params.min),
    maxPrice: priceText(params.maxPrice ?? params.max),
    material: boundedText(params.material, 80) || "all",
    color: boundedText(params.color, 80) || "all",
    feature: boundedText(params.feature, 80) || "all",
    dimension: boundedText(params.dimension, 50),
    widthMaxCm: dimensionLimitText(params.widthMaxCm),
    heightMaxCm: dimensionLimitText(params.heightMaxCm),
    depthClosedMaxCm: dimensionLimitText(params.depthClosedMaxCm),
    depthOpenMaxCm: dimensionLimitText(params.depthOpenMaxCm),
  };
}

export function catalogUrlSearch(
  state: CatalogFilterState,
  page = 1,
  defaultSort: CatalogSort = "recommended",
) {
  return {
    page: page > 1 ? page : undefined,
    sort: state.sort === defaultSort ? undefined : state.sort,
    minPrice: state.minPrice || undefined,
    maxPrice: state.maxPrice || undefined,
    material: state.material === "all" ? undefined : state.material,
    color: state.color === "all" ? undefined : state.color,
    feature: state.feature === "all" ? undefined : state.feature,
    dimension: state.dimension || undefined,
    widthMaxCm: state.widthMaxCm || undefined,
    heightMaxCm: state.heightMaxCm || undefined,
    depthClosedMaxCm: state.depthClosedMaxCm || undefined,
    depthOpenMaxCm: state.depthOpenMaxCm || undefined,
  };
}

export function serializeCatalogUrlState(
  state: CatalogFilterState,
  page = 1,
  defaultSort: CatalogSort = "recommended",
) {
  const search = new URLSearchParams();
  const params = catalogUrlSearch(state, page, defaultSort);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  return search.toString();
}

export function parseCatalogUrlString(value: string | undefined): CatalogUrlState {
  if (!value || value.length > 700) return parseCatalogUrlState({});
  return parseCatalogUrlState(Object.fromEntries(new URLSearchParams(value)));
}

export function priceToCents(value: string) {
  if (!value.trim()) return undefined;
  const normalized = value.replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) : undefined;
}

export function isValidCatalogPriceRange(state: CatalogFilterState) {
  const min = priceToCents(state.minPrice);
  const max = priceToCents(state.maxPrice);
  return min === undefined || max === undefined || min <= max;
}
