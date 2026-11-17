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

function numericSearchValue(value: string): number | string | undefined {
  if (!value) return undefined;
  if (/^\d+(?:\.\d+)?$/.test(value)) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return value;
}

export function catalogUrlSearch(
  state: CatalogFilterState,
  page = 1,
  defaultSort: CatalogSort = "recommended",
) {
  return {
    page: page > 1 ? page : undefined,
    sort: state.sort === defaultSort ? undefined : state.sort,
    minPrice: numericSearchValue(state.minPrice),
    maxPrice: numericSearchValue(state.maxPrice),
    material: state.material === "all" ? undefined : state.material,
    color: state.color === "all" ? undefined : state.color,
    feature: state.feature === "all" ? undefined : state.feature,
    dimension: state.dimension || undefined,
    widthMaxCm: numericSearchValue(state.widthMaxCm),
    heightMaxCm: numericSearchValue(state.heightMaxCm),
    depthClosedMaxCm: numericSearchValue(state.depthClosedMaxCm),
    depthOpenMaxCm: numericSearchValue(state.depthOpenMaxCm),
  };
}

export type CatalogSearchParams = Partial<ReturnType<typeof catalogUrlSearch>>;

export interface CatalogReturnState extends CatalogUrlState {
  q?: string;
  ofertas?: boolean;
  all?: boolean;
}

export function parseCatalogReturnSearch(value: string | undefined): CatalogReturnState {
  if (!value || value.length > 700) return parseCatalogUrlState({});
  const raw = Object.fromEntries(new URLSearchParams(value));
  const base = parseCatalogUrlState(raw);
  const q = boundedText(raw.q, 120) || undefined;
  const ofertas = raw.ofertas === "true" ? true : undefined;
  const all = raw.all === "true" ? true : undefined;
  return {
    ...base,
    ...(q ? { q } : {}),
    ...(ofertas ? { ofertas } : {}),
    ...(all ? { all } : {}),
  };
}

export function serializeCatalogReturnSearch(
  state: CatalogFilterState,
  page = 1,
  root?: { q?: string; offers?: boolean; all?: boolean },
) {
  const search = new URLSearchParams();
  if (root?.q?.trim()) search.set("q", root.q.trim());
  if (root?.offers) search.set("ofertas", "true");
  if (root?.all) search.set("all", "true");
  const params = catalogUrlSearch(state, page, root?.q?.trim() ? "relevant" : "recommended");
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  return search.toString();
}

export function normalizeCatalogReturnSearch(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 700) return undefined;
  const parsed = parseCatalogReturnSearch(value);
  const normalized = serializeCatalogReturnSearch(parsed, parsed.page, {
    q: parsed.q,
    offers: parsed.ofertas,
    all: parsed.all,
  });
  return normalized || undefined;
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
