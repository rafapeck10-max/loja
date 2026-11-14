import { formatBRL } from "@/lib/constants";
import { roundMoney } from "@/lib/payment";
import { ProductDiscountLine } from "./ProductDiscountLine";
import type { cardQuote } from "@/lib/payment";
import "./product-price-display.css";

export function ProductPriceDisplay({
  price,
  oldPrice,
  payment,
  layout = "detail",
}: {
  price: number;
  oldPrice: number;
  payment: ReturnType<typeof cardQuote>;
  layout?: "card" | "detail";
}) {
  const isCardLayout = layout === "card";
  const pixSaving = payment.total > price ? roundMoney(payment.total - price) : 0;
  const pixSavingLabel = `${formatBRL(pixSaving)} a menos no Pix em relação ao total no cartão em até ${payment.count}x`;
  return (
    <div className={`mobi-price-display${isCardLayout ? " mobi-price-display--card" : ""}`}>
      <ProductDiscountLine oldPrice={oldPrice} currentPrice={price} />
      <div className="mobi-price-display-main">
        <strong className="mobi-price-display-value">{formatBRL(price)}</strong>
        <span className="mobi-price-display-method">
          {isCardLayout ? "no Pix ou dinheiro" : "no Pix"}
        </span>
        {!isCardLayout && pixSaving > 0 && (
          <span
            className="mobi-price-display-saving"
            title={pixSavingLabel}
            aria-label={pixSavingLabel}
          >
            −{formatBRL(pixSaving)}
          </span>
        )}
      </div>
      {isCardLayout ? (
        <>
          {pixSaving > 0 && (
            <p className="mobi-price-display-saving-note" title={pixSavingLabel}>
              Economize {formatBRL(pixSaving)} no Pix
            </p>
          )}
          <div className="mobi-price-display-card">
            <span>
              Cartão: {payment.count}x de{" "}
              <strong>{formatBRL(payment.approximateInstallment)}</strong>
            </span>
            <span className="mobi-price-display-card-total">
              Total <strong>{formatBRL(payment.total)}</strong>
            </span>
          </div>
        </>
      ) : (
        <>
          <p className="mobi-price-display-cash">Mesmo valor em dinheiro</p>
          <p className="mobi-price-display-card">
            {formatBRL(payment.total)} no cartão em até {payment.count}x de{" "}
            <strong>{formatBRL(payment.approximateInstallment)}</strong>
          </p>
        </>
      )}
    </div>
  );
}
