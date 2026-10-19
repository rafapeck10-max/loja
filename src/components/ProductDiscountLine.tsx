import { formatBRL } from "@/lib/constants";
import { hasRealReferencePrice } from "@/lib/price-reference";

interface ProductDiscountLineProps {
  oldPrice: number;
  currentPrice: number;
  reserveSpace?: boolean;
}

export function ProductDiscountLine({
  oldPrice,
  currentPrice,
  reserveSpace = false,
}: ProductDiscountLineProps) {
  if (!hasRealReferencePrice(oldPrice, currentPrice)) {
    return reserveSpace ? <div className="mobi-discount-line" aria-hidden="true" /> : null;
  }

  const discountPercent = Math.round(((oldPrice - currentPrice) / oldPrice) * 100);

  return (
    <div
      className="mobi-discount-line"
      role="group"
      aria-label={`De ${formatBRL(oldPrice)}, desconto de ${discountPercent}%`}
    >
      <s>{formatBRL(oldPrice)}</s>
      <span className="mobi-discount-badge">
        <span aria-hidden="true">↓</span>
        {discountPercent}% OFF
      </span>
    </div>
  );
}
