export interface SupplierIdentity {
  id: string;
  name: string;
  active: boolean;
}

export type SupplierResolution =
  | { status: "matched"; supplierId: string; canonicalName: string }
  | { status: "missing"; sourceName: string }
  | { status: "ambiguous"; sourceName: string };

export function resolveSupplierName(
  sourceName: string | null | undefined,
  suppliers: readonly SupplierIdentity[],
): SupplierResolution {
  const preservedName = typeof sourceName === "string" ? sourceName : "";
  if (!preservedName.trim()) return { status: "missing", sourceName: preservedName };

  const exactMatches = suppliers.filter((supplier) => supplier && supplier.name === preservedName);
  if (exactMatches.length > 1) return { status: "ambiguous", sourceName: preservedName };
  const match = exactMatches[0];
  if (!match || match.active !== true || typeof match.id !== "string" || !match.id.trim())
    return { status: "missing", sourceName: preservedName };

  return {
    status: "matched",
    supplierId: match.id,
    canonicalName: match.name,
  };
}
