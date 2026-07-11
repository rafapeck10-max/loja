export const WHATSAPP_NUMBER = "5521986559996";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
