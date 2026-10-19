import { CARD_PAYMENT_CONFIG } from "./payment-config.ts";
export { CARD_PAYMENT_CONFIG } from "./payment-config.ts";

export const INFINITEPAY_INSTALLMENT_RATES = CARD_PAYMENT_CONFIG.rates.map(
  (rate) => rate.feePercent,
);

export function moneyCents(amount: number) {
  if (!Number.isFinite(amount) || amount < 0) throw new RangeError("Valor monetário inválido");
  const cents = Math.round((amount + Number.EPSILON) * 100);
  if (!Number.isSafeInteger(cents)) throw new RangeError("Valor monetário fora do limite");
  return cents;
}

export function roundMoney(amount: number) {
  return moneyCents(amount) / 100;
}

function feeBasisPoints(feePercent: number) {
  if (!Number.isFinite(feePercent) || feePercent < 0 || feePercent >= 100) {
    throw new RangeError("Taxa deve estar entre 0 e menos de 100%");
  }
  return Math.round(feePercent * 100);
}

export function installmentTerms(count: number) {
  if (!Number.isInteger(count) || count < 1 || count > CARD_PAYMENT_CONFIG.maxInstallments) {
    throw new RangeError("Quantidade de parcelas inválida");
  }
  return CARD_PAYMENT_CONFIG.rates[count - 1];
}

export function installmentRate(count: number) {
  return installmentTerms(count).feePercent;
}

/** Use somente sobre o preço BASE/Pix; um total já cotado nunca passa por esta função. */
export function grossUpTotal(pixPrice: number, feePercent: number) {
  const baseCents = moneyCents(pixPrice);
  const rate = feeBasisPoints(feePercent);
  const numerator = BigInt(baseCents) * 10000n;
  const denominator = BigInt(10000 - rate) * 100n;
  const totalReais = (numerator + denominator - 1n) / denominator;
  if (totalReais > BigInt(Math.floor(Number.MAX_SAFE_INTEGER / 100))) {
    throw new RangeError("Total no cartão fora do limite");
  }
  return Number(totalReais);
}

export function netAfterFee(chargedTotal: number, feePercent: number) {
  return (
    Math.round((moneyCents(chargedTotal) * (10000 - feeBasisPoints(feePercent))) / 10000) / 100
  );
}

/** Exibe a parcela arredondando para cima ao centavo; o total continua sendo a autoridade. */
export function installmentFromTotal(chargedTotal: number, count: number) {
  installmentTerms(count);
  return Math.ceil(moneyCents(chargedTotal) / count) / 100;
}

export function cardQuote(pixPrice: number, count: number = CARD_PAYMENT_CONFIG.maxInstallments) {
  const terms = installmentTerms(count);
  const total = grossUpTotal(pixPrice, terms.feePercent);
  return {
    configId: CARD_PAYMENT_CONFIG.id,
    pixPrice: roundMoney(pixPrice),
    count,
    feePercent: terms.feePercent,
    rateVerification: terms.verification,
    total,
    approximateInstallment: installmentFromTotal(total, count),
  };
}

export function cardTotal(pixPrice: number, count: number = CARD_PAYMENT_CONFIG.maxInstallments) {
  return cardQuote(pixPrice, count).total;
}

export function cardInstallment(
  pixPrice: number,
  count: number = CARD_PAYMENT_CONFIG.maxInstallments,
) {
  return cardQuote(pixPrice, count).approximateInstallment;
}
