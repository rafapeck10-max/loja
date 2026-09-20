import { MAX_INSTALLMENTS } from "@/lib/constants";

// InfinitePay — plano inicial, Visa/Mastercard, recebimento em 1 dia útil.
// Atualizado em setembro de 2026. O PIX segue sem taxa para o cliente.
export const INFINITEPAY_INSTALLMENT_RATES = [
  3.15, 5.39, 6.12, 6.85, 7.57, 8.28, 8.99, 9.69, 10.38, 11.06, 11.74, 12.4,
] as const;

export function installmentRate(count: number) {
  return INFINITEPAY_INSTALLMENT_RATES[Math.min(Math.max(count, 1), MAX_INSTALLMENTS) - 1];
}

export function cardTotal(pixPrice: number, installmentCount = MAX_INSTALLMENTS) {
  return pixPrice * (1 + installmentRate(installmentCount) / 100);
}

export function cardInstallment(pixPrice: number, installmentCount = MAX_INSTALLMENTS) {
  return cardTotal(pixPrice, installmentCount) / installmentCount;
}
