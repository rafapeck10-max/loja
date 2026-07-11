export const WHATSAPP_NUMBER = "5521986559996";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export const CATEGORIES = [
  { label: "Sofás", slug: "sofas" },
  { label: "Poltronas", slug: "poltronas" },
  { label: "Salas de Jantar", slug: "salas-de-jantar" },
  { label: "Dormitórios", slug: "dormitorios" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
