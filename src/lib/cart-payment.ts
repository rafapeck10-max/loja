import { CARD_PAYMENT_CONFIG, cardQuote, installmentFromTotal, moneyCents } from "./payment.ts";
import { formatBRL } from "./constants.ts";
import type { RateVerification } from "./payment-config.ts";

export interface CartPaymentInput {
  price: number;
  cardPrice?: number;
  installmentCount?: number;
  cardRateVerification?: RateVerification;
  quantity: number;
}

/** Totais cotados são snapshots: nunca aplicar gross-up novamente a cardPrice. */
export function cartPaymentLine(item: CartPaymentInput) {
  if (!Number.isSafeInteger(item.quantity) || item.quantity < 1)
    throw new RangeError("Quantidade inválida");
  // Quotes already stored keep their total; only the displayed plan follows the new 10x limit.
  const installments = Math.min(
    item.installmentCount ?? CARD_PAYMENT_CONFIG.maxInstallments,
    CARD_PAYMENT_CONFIG.maxInstallments,
  );
  const quote = item.cardPrice == null ? cardQuote(item.price, installments) : null;
  const unitCardTotal = quote?.total ?? moneyCents(item.cardPrice!) / 100;
  const cardTotal = (moneyCents(unitCardTotal) * item.quantity) / 100;
  return {
    installments,
    unitCardTotal,
    unitApproximateInstallment: installmentFromTotal(unitCardTotal, installments),
    pixTotal: (moneyCents(item.price) * item.quantity) / 100,
    cardTotal,
    approximateInstallment: installmentFromTotal(cardTotal, installments),
    rateVerification: quote?.rateVerification ?? item.cardRateVerification,
  };
}

export function orderPaymentSummary(items: readonly CartPaymentInput[]) {
  const lines = items.map(cartPaymentLine);
  return {
    lines,
    pixTotal: lines.reduce((sum, line) => sum + moneyCents(line.pixTotal), 0) / 100,
    cardTotal: lines.reduce((sum, line) => sum + moneyCents(line.cardTotal), 0) / 100,
  };
}

export function quotedCartKey(item: {
  id: string;
  color?: string | null;
  finish?: string | null;
  variant?: string | null;
  price?: number;
  cardPrice?: number;
  installmentCount?: number;
}) {
  // Nova cotação/parcelamento não pode sobrescrever o preço de um item já combinado.
  return JSON.stringify([
    item.id,
    item.color ?? "",
    item.finish ?? "",
    item.variant ?? "",
    item.price,
    item.cardPrice,
    item.installmentCount ?? CARD_PAYMENT_CONFIG.maxInstallments,
  ]);
}

export interface OrderMessageItem extends CartPaymentInput {
  name: string;
  color?: string | null;
  finish?: string | null;
  variant?: string | null;
}
export interface OrderCustomer {
  nome: string;
  rua: string;
  bairro: string;
  cidade: string;
  pagamento: string;
}

export function orderWhatsAppMessage(items: readonly OrderMessageItem[], customer: OrderCustomer) {
  const summary = orderPaymentSummary(items);
  const isCard = customer.pagamento === "Cartão na entrega";
  let message = "Olá Mobi! Gostaria de fazer um pedido:\n\n";
  items.forEach((item, index) => {
    const line = summary.lines[index];
    message += `*${index + 1}. ${item.name}*\n`;
    const options = [
      item.color && `Cor: ${item.color}`,
      item.finish && `Pés: ${item.finish}`,
      item.variant && `Opção: ${item.variant}`,
    ].filter(Boolean);
    if (options.length) message += `   _(${options.join(", ")})_\n`;
    message += `   Qtd: ${item.quantity}x | À vista no Pix ou dinheiro por unidade: ${formatBRL(item.price)}\n`;
    if (isCard) {
      message += `   Cartão: até ${CARD_PAYMENT_CONFIG.maxInstallments}x sem juros; ${line.installments}x de ${formatBRL(line.approximateInstallment)}\n`;
      message += `   Total no cartão (${item.quantity} unidade(s)): ${formatBRL(line.cardTotal)}.\n`;
      if (line.rateVerification === "inferred")
        message +=
          "   Crédito à vista: simulação provisória; confirmar a taxa na conta InfinitePay antes de fechar.\n";
    }
    message += "\n";
  });
  message += `*Valor Total:* ${formatBRL(isCard ? summary.cardTotal : summary.pixTotal)}\n`;
  if (isCard)
    message +=
      "Condição do cartão: até 10x sem juros. A parcela exibida foi arredondada para cima; centavos residuais seguem a operadora e o total informado permanece válido.\n";
  message += `\n*Dados de Entrega:*\nNome: ${customer.nome.trim()}\nEndereço: ${customer.rua.trim()}\nBairro: ${customer.bairro.trim()}\nCidade: ${customer.cidade.trim()}\n\n*Forma de Pagamento:* ${customer.pagamento}\n\nAguardo confirmação do frete e da data de entrega.`;
  return message;
}
