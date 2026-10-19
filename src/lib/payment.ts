import { MAX_INSTALLMENTS } from "@/lib/constants";

// InfinitePay, plano atual: débito das taxas sobre o total da transação.
// O valor do cartão é arredondado para cima ao real seguinte, como na loja publicada.
export const INFINITEPAY_INSTALLMENT_RATES = [
  12.1, 12.1, 12.1, 12.1, 12.1, 12.1, 12.1, 12.1, 12.1, 12.1,
] as const;

function moneyCents(amount: number) {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new RangeError("Valor monetário inválido");
  }
  const cents = Math.round((amount + Number.EPSILON) * 100);
  if (!Number.isSafeInteger(cents)) {
    throw new RangeError("Valor monetário fora do limite");
  }
  return cents;
}

function feeBasisPoints(feePercent: number) {
  if (!Number.isFinite(feePercent) || feePercent < 0 || feePercent >= 100) {
    throw new RangeError("Taxa deve estar entre 0 e menos de 100%");
  }
  return Math.round(feePercent * 100);
}

export function installmentRate(count: number) {
  const normalizedCount = Math.min(Math.max(Math.trunc(count), 1), MAX_INSTALLMENTS);
  return INFINITEPAY_INSTALLMENT_RATES[normalizedCount - 1];
}

function quotedCardTotal(pixPrice: number, feePercent: number) {
  const baseCents = moneyCents(pixPrice);
  const rate = feeBasisPoints(feePercent);
  const numerator = BigInt(baseCents) * 10_000n;
  const denominator = BigInt(10_000 - rate) * 100n;
  const total = (numerator + denominator - 1n) / denominator;
  if (total > BigInt(Math.floor(Number.MAX_SAFE_INTEGER / 100))) {
    throw new RangeError("Total no cartão fora do limite");
  }
  return Number(total);
}

export function cardTotal(pixPrice: number, installmentCount = MAX_INSTALLMENTS) {
  return quotedCardTotal(pixPrice, installmentRate(installmentCount));
}

export function installmentFromTotal(cardPrice: number, installmentCount: number) {
  const count = Math.min(Math.max(Math.trunc(installmentCount), 1), MAX_INSTALLMENTS);
  return Math.ceil(moneyCents(cardPrice) / count) / 100;
}

export function cardInstallment(pixPrice: number, installmentCount = MAX_INSTALLMENTS) {
  return installmentFromTotal(cardTotal(pixPrice, installmentCount), installmentCount);
}
