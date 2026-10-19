import assert from "node:assert/strict";
import { test } from "node:test";
import { CARD_PAYMENT_CONFIG, cardQuote, netAfterFee } from "../src/lib/payment.ts";
import { cartPaymentLine, orderPaymentSummary, orderWhatsAppMessage } from "../src/lib/cart-payment.ts";

test("a taxa aprovada preserva 10 parcelas e o exemplo de R$ 1.000", () => {
  const quote = cardQuote(1000);
  assert.equal(CARD_PAYMENT_CONFIG.maxInstallments, 10);
  assert.equal(quote.feePercent, 12.1);
  assert.equal(quote.total, 1138);
  assert.equal(quote.approximateInstallment, 113.8);
  assert.ok(netAfterFee(quote.total, quote.feePercent) >= 1000);
});

test("produto e carrinho usam o mesmo total sem aplicar a taxa duas vezes", () => {
  const quote = cardQuote(1699);
  assert.equal(quote.total, 1933);
  assert.equal(quote.approximateInstallment, 193.3);
  const item = { name: "Sofá", price: 1699, cardPrice: quote.total, installmentCount: 10, quantity: 2 };
  const line = cartPaymentLine(item);
  assert.equal(line.cardTotal, 3866);
  assert.equal(line.approximateInstallment, 386.6);
  assert.equal(orderPaymentSummary([item]).pixTotal, 3398);
  const message = orderWhatsAppMessage([item], {
    nome: "Teste", rua: "Teste", bairro: "Teste", cidade: "Teste", pagamento: "Cartão na entrega",
  });
  assert.match(message, /386,60/);
  assert.match(message, /3\.866,00/);
});

test("uma cotação já salva no carrinho mantém o valor combinado", () => {
  const oldQuote = cartPaymentLine({ price: 1699, cardPrice: 2045, installmentCount: 10, quantity: 1 });
  assert.equal(oldQuote.cardTotal, 2045);
  assert.equal(oldQuote.approximateInstallment, 204.5);
});
