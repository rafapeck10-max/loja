export type ProductMeasure = {
  label: string;
  value: string;
  icon: "horizontal" | "vertical" | "ruler";
};

/** Read only explicitly labelled dimensions. Ambiguous text stays available in its original form. */
export function productMeasurements(value: string | null): ProductMeasure[] {
  if (!value?.trim()) return [];
  const measures = new Map<string, ProductMeasure>();
  const canonicalValues = new Map<string, number>();
  let conflicting = false;
  const add = (label: string, number: string, unit: string, icon: ProductMeasure["icon"]) => {
    const amount = Number(number.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) return;
    const normalizedUnit = unit.toLowerCase();
    const centimetres = amount * (normalizedUnit === "m" ? 100 : normalizedUnit === "mm" ? 0.1 : 1);
    const previous = canonicalValues.get(label);
    if (previous !== undefined && Math.abs(previous - centimetres) > 0.0001) conflicting = true;
    if (!measures.has(label)) {
      canonicalValues.set(label, centimetres);
      measures.set(label, { label, value: `${number.replace(".", ",")} ${normalizedUnit}`, icon });
    }
  };

  for (const match of value.matchAll(
    /\b(largura|comprimento)\s*(?:\([^)]*\))?\s*[:-]?\s*(\d+(?:[.,]\d+)?)\s*(mm|cm|m)\b/gi,
  )) {
    add(
      match[1].toLowerCase() === "largura" ? "Largura" : "Comprimento",
      match[2],
      match[3],
      "horizontal",
    );
  }
  for (const match of value.matchAll(
    /\baltura\s*(?:\([^)]*\))?\s*[:-]?\s*(\d+(?:[.,]\d+)?)\s*(mm|cm|m)\b/gi,
  )) {
    add("Altura", match[1], match[2], "vertical");
  }

  const depths = value.matchAll(
    /\bprofundidade\b\s*[:-]?\s*([\s\S]*?)(?=;|\n|\b(?:largura|altura|comprimento|peso|profundidade)\b|$)/gi,
  );
  for (const [, depth] of depths) {
    // A period can be a decimal separator. Qualifiers may precede or follow the value.
    const opened =
      depth.match(/(\d+(?:[.,]\d+)?)\s*(mm|cm|m)\b\s*\(?\s*abert[oa]\b/i) ??
      depth.match(/\babert[oa]\b[^\d]{0,8}(\d+(?:[.,]\d+)?)\s*(mm|cm|m)\b/i);
    const closed =
      depth.match(/(\d+(?:[.,]\d+)?)\s*(mm|cm|m)\b\s*\(?\s*fechad[oa]\b/i) ??
      depth.match(/\bfechad[oa]\b[^\d]{0,8}(\d+(?:[.,]\d+)?)\s*(mm|cm|m)\b/i);
    if (closed) add("Profundidade fechada", closed[1], closed[2], "ruler");
    if (opened) add("Profundidade aberta", opened[1], opened[2], "ruler");
    if (!closed && !opened) {
      for (const single of depth.matchAll(/(\d+(?:[.,]\d+)?)\s*(mm|cm|m)\b/gi)) {
        add("Profundidade", single[1], single[2], "ruler");
      }
    }
  }
  return conflicting ? [] : [...measures.values()];
}
