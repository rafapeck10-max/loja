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
