import type { CartItem } from "./cart-context";

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    item.id.trim().length > 0 &&
    typeof item.name === "string" &&
    typeof item.img === "string" &&
    typeof item.price === "number" &&
    Number.isFinite(item.price) &&
    item.price >= 0 &&
    Number.isSafeInteger(Math.round(item.price * 100)) &&
    typeof item.quantity === "number" &&
    Number.isSafeInteger(item.quantity) &&
    item.quantity > 0 &&
    Number.isSafeInteger(Math.round(item.price * 100) * item.quantity) &&
    (item.cardPrice == null ||
      (typeof item.cardPrice === "number" &&
        Number.isFinite(item.cardPrice) &&
        item.cardPrice >= 0 &&
        Number.isSafeInteger(Math.round(item.cardPrice * 100) * item.quantity))) &&
    (item.installmentCount == null ||
      (typeof item.installmentCount === "number" &&
        Number.isInteger(item.installmentCount) &&
        item.installmentCount > 0)) &&
    [item.color, item.finish, item.variant].every(
      (option) => option == null || typeof option === "string",
    )
  );
}

/** Browser storage is untrusted. Keep valid quotes without recalculating their prices. */
export function readStoredCart(raw: string | null): { items: CartItem[]; recovered: boolean } {
  if (!raw) return { items: [], recovered: false };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { items: [], recovered: true };
    const items = parsed.filter(isCartItem);
    return { items, recovered: items.length !== parsed.length };
  } catch {
    return { items: [], recovered: true };
  }
}
