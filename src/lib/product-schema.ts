const CURATION_COLUMNS = [
  "vitrine_semana_ordem",
  "vitrine_novidade",
  "vitrine_sala",
  "vitrine_descoberta",
];

/** Supabase can return a PostgrestError object rather than an Error instance. */
export function isMissingProductColumn(error: unknown, column: string): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as { code?: unknown; message?: unknown; details?: unknown };
  const message = [value.message, value.details]
    .filter((part) => typeof part === "string")
    .join(" ");
  const escaped = column.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!new RegExp(`\\b${escaped}\\b`, "i").test(message)) return false;
  return (
    value.code === "42703" ||
    value.code === "PGRST204" ||
    /column[^\n]*(?:does not exist|schema cache)|could not find[^\n]*column/i.test(message)
  );
}

export function isMissingCurationSchema(error: unknown): boolean {
  return CURATION_COLUMNS.some((column) => isMissingProductColumn(error, column));
}

export interface OptionalProductColumns {
  withCuration: boolean;
  withBundles: boolean;
}

/** Retry only the optional feature named by the database, preserving the other feature. */
export async function readWithOptionalProductColumns<T>(
  read: (columns: OptionalProductColumns) => Promise<T>,
  initial: OptionalProductColumns = { withCuration: true, withBundles: true },
): Promise<{ value: T } & OptionalProductColumns> {
  const columns = { ...initial };
  while (true) {
    try {
      return { value: await read({ ...columns }), ...columns };
    } catch (error) {
      if (columns.withBundles && isMissingProductColumn(error, "compre_junto_ids")) {
        columns.withBundles = false;
      } else if (columns.withCuration && isMissingCurationSchema(error)) {
        columns.withCuration = false;
      } else {
        throw error;
      }
    }
  }
}
