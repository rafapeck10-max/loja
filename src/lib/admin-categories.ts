// Filter-only aliases. Catalog records, product IDs and public URLs are never rewritten.
export function adminCategoryKey(value: string): string {
  const key = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  return ({ sofa: "sofas", banqueta: "banquetas" } as Record<string, string>)[key] ?? key;
}
export function adminCategoryOptions(categories: readonly string[]): string[] {
  const unique = new Map<string, string>();
  for (const value of categories) {
    if (!value.trim()) continue;
    const key = adminCategoryKey(value);
    const label = key === "sofas" ? "Sofás" : key === "banquetas" ? "Banquetas" : value;
    if (!unique.has(key)) unique.set(key, label);
  }
  return [...unique.values()].sort((a, b) => a.localeCompare(b, "pt-BR"));
}
