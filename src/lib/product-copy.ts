/** Remove supplier logistics from public copy without changing catalog records. */
export function publicDescription(description: string) {
  return description
    .replace(/Códigos por cor na SR:[^\n]*/gi, "")
    .split("\n")
    .filter(
      (line) =>
        !/^\s*(fornecedor|link do fornecedor|origem|custo|preço de atacado)\s*:/i.test(line),
    )
    .join("\n")
    .replace(/\s+(Medidas:|Variações de cor:)/g, "\n\n$1")
    .replace(/ +((?:PESO|COR|[A-ZÀ-Ú]{4,})(?: [A-ZÀ-Ú]+)*):/g, (_, label) => "\n" + label + ":")
    .trim();
}
