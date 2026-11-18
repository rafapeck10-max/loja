/** Whole percent, rounded down so the displayed economy never exceeds the actual one. */
export function pixSavingPercent(pixPrice: number, cardTotal: number): number {
  if (
    !Number.isFinite(pixPrice) ||
    !Number.isFinite(cardTotal) ||
    pixPrice <= 0 ||
    cardTotal <= pixPrice
  )
    return 0;
  const pixCents = Math.round(pixPrice * 100);
  const cardCents = Math.round(cardTotal * 100);
  return Math.floor(((cardCents - pixCents) / cardCents) * 100);
}
