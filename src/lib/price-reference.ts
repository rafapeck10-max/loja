/**
 * The former admin flow fabricated a comparison price by adding 15% to the
 * current price. That is not a real promotion and should not be shown as one.
 */
export function isGeneratedReferencePrice(oldPrice: number, currentPrice: number): boolean {
  if (!Number.isFinite(oldPrice) || !Number.isFinite(currentPrice) || currentPrice <= 0) {
    return false;
  }

  return Math.round(oldPrice * 100) === Math.round(currentPrice * 115);
}

export function hasRealReferencePrice(oldPrice: number, currentPrice: number): boolean {
  return (
    Number.isFinite(oldPrice) &&
    Number.isFinite(currentPrice) &&
    oldPrice > currentPrice &&
    !isGeneratedReferencePrice(oldPrice, currentPrice)
  );
}
export function getBlackFridayDisplayDiscountPercent(productKey: string): number { let hash = 2166136261; for (let i = 0; i < productKey.length; i += 1) { hash ^= productKey.charCodeAt(i); hash = Math.imul(hash, 16777619); } return 8 + ((hash >>> 0) % 15); }
export function resolveDisplayOldPrice({ oldPrice, currentPrice, productKey, isBlackFriday }: { oldPrice: number; currentPrice: number; productKey?: string; isBlackFriday?: boolean; }): number { if (!Number.isFinite(currentPrice) || currentPrice <= 0) return 0; if (hasRealReferencePrice(oldPrice, currentPrice) && Math.round(((oldPrice - currentPrice) / oldPrice) * 100) >= 1) return oldPrice; if (!isBlackFriday || !productKey) return 0; let targetPercent = getBlackFridayDisplayDiscountPercent(productKey); let computed = Math.round((currentPrice / (1 - targetPercent / 100)) * 100) / 100; if (isGeneratedReferencePrice(computed, currentPrice)) { targetPercent += 1; computed = Math.round((currentPrice / (1 - targetPercent / 100)) * 100) / 100; } return computed; }
