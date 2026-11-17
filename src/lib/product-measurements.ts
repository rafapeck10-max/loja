export type ProductMeasure = {
  label: string;
  value: string;
  icon: "horizontal" | "vertical" | "ruler";
};

/** Read only explicitly labelled dimensions. Ambiguous text stays available in its original form. */
export function productMeasurements(value: string | null): ProductMeasure[] {
  if (!value?.trim()) return [];
  const text = value.replace(/\\r\\n|\\n|`n|\r\n/g, "\n").replace(/\u2800+/g, " ");
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

  for (const match of text.matchAll(
    /\b(largura(?![A-Za-zÀ-ÿ0-9_])|larg(?![A-Za-zÀ-ÿ_])|comprimento(?![A-Za-zÀ-ÿ0-9_])|comp(?![A-Za-zÀ-ÿ_]))\.?\s*(?:\([^)]*\))?\s*[:-]?\s*(?<![\d.,])(\d+(?:[.,]\d{1,3})?)\s*(mm|cm|m)(?![A-Za-zÀ-ÿ0-9_])/gi,
  )) {
    const token = match[1].toLowerCase();
    add(token.startsWith("larg") ? "Largura" : "Comprimento", match[2], match[3], "horizontal");
  }
  for (const match of text.matchAll(
    /\b(?:altura(?![A-Za-zÀ-ÿ0-9_])|alt(?![A-Za-zÀ-ÿ_]))\.?\s*(?:\([^)]*\))?\s*[:-]?\s*(?<![\d.,])(\d+(?:[.,]\d{1,3})?)\s*(mm|cm|m)(?![A-Za-zÀ-ÿ0-9_])/gi,
  )) {
    add("Altura", match[1], match[2], "vertical");
  }

  const depths = text.matchAll(
    /\b(?:profundidade(?![A-Za-zÀ-ÿ0-9_])|prof(?![A-Za-zÀ-ÿ_]))\.?\s*[:-]?\s*([\s\S]*?)(?=;|\||\n|\b(?:largura(?![A-Za-zÀ-ÿ0-9_])|larg(?![A-Za-zÀ-ÿ_])|altura(?![A-Za-zÀ-ÿ0-9_])|alt(?![A-Za-zÀ-ÿ_])|comprimento(?![A-Za-zÀ-ÿ0-9_])|comp(?![A-Za-zÀ-ÿ_])|peso\b|profundidade(?![A-Za-zÀ-ÿ0-9_])|prof(?![A-Za-zÀ-ÿ_])|estrutura\b|material\b|tampo\b|cor(?:es)?\b|c[oô]r\b)|$)/gi,
  );
  for (const [, depth] of depths) {
    // A period can be a decimal separator. Qualifiers may precede or follow the value.
    const opened =
      depth.match(
        /(?<![\d.,])(\d+(?:[.,]\d{1,3})?)\s*(mm|cm|m)(?![A-Za-zÀ-ÿ0-9_])\s*\(?\s*abert[oa]\b/i,
      ) ??
      depth.match(
        /\babert[oa]\b[^\d]{0,8}(?<![\d.,])(\d+(?:[.,]\d{1,3})?)\s*(mm|cm|m)(?![A-Za-zÀ-ÿ0-9_])/i,
      );
    const closed =
      depth.match(
        /(?<![\d.,])(\d+(?:[.,]\d{1,3})?)\s*(mm|cm|m)(?![A-Za-zÀ-ÿ0-9_])\s*\(?\s*fechad[oa]\b/i,
      ) ??
      depth.match(
        /\bfechad[oa]\b[^\d]{0,8}(?<![\d.,])(\d+(?:[.,]\d{1,3})?)\s*(mm|cm|m)(?![A-Za-zÀ-ÿ0-9_])/i,
      );
    if (closed) add("Profundidade fechada", closed[1], closed[2], "ruler");
    if (opened) add("Profundidade aberta", opened[1], opened[2], "ruler");
    if (!closed && !opened) {
      const primary = depth.match(
        /^\s*(?:\([^)]*\))?\s*[:-]?\s*(?<![\d.,])(\d+(?:[.,]\d{1,3})?)\s*(mm|cm|m)(?![A-Za-zÀ-ÿ0-9_])/i,
      );
      if (primary) {
        add("Profundidade", primary[1], primary[2], "ruler");
        const rest = depth.slice(primary[0].length);
        const extra = rest.match(
          /^\s*(?:\/|\bou\b|\be\b)\s*(?<![\d.,])(\d+(?:[.,]\d{1,3})?)\s*(mm|cm|m)(?![A-Za-zÀ-ÿ0-9_])/i,
        );
        if (extra) add("Profundidade", extra[1], extra[2], "ruler");
      }
    }
  }
  return conflicting ? [] : [...measures.values()];
}
