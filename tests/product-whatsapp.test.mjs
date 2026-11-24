import test from "node:test";
import assert from "node:assert/strict";
import {
  buildProductWhatsappMessage,
  buildProductWhatsappUrl,
} from "../src/lib/product-whatsapp.ts";

test("builds context-aware WhatsApp message with variant, Pix/10x price, and eligible CEP", () => {
  const msg = buildProductWhatsappMessage({
    productName: "Roupeiro Santiago Plus",
    variant: "Com espelho",
    pixPrice: 909,
    installmentCount: 10,
    installmentValue: 103.5,
    cardTotal: 1035,
    cepResult: {
      status: "eligible",
      cep: "26210-000",
      digits: "26210000",
      freeShipping: true,
      deadlineLabel: "até 7 dias úteis",
      address: {
        bairro: "Centro",
        localidade: "Nova Iguaçu",
        uf: "RJ",
      },
      addressResolved: true,
      message: "Frete grátis",
    },
  });

  assert.match(msg, /Roupeiro Santiago Plus/);
  assert.match(msg, /Opção: Com espelho/);
  assert.match(msg, /R\$\s*909,00/);
  assert.match(msg, /10x de R\$\s*103,50/);
  assert.match(msg, /CEP consultado: 26210-000/);
  assert.match(msg, /Centro, Nova Iguaçu - RJ/);
  assert.match(msg, /frete grátis em até 7 dias úteis/);

  const url = buildProductWhatsappUrl({ productName: "Roupeiro Santiago Plus" });
  assert.match(url, /^https:\/\/wa\.me\/5521984324338\?text=/);
});

test("ignores invalid or not_found CEP snapshots in WhatsApp message", () => {
  const msg = buildProductWhatsappMessage({
    productName: "Sofá Roma",
    color: "Cinza",
    cepResult: {
      status: "not_found",
      cep: "26015-999",
      digits: "26015999",
      freeShipping: false,
      address: null,
      addressResolved: false,
      message: "CEP não encontrado",
    },
  });

  assert.match(msg, /Cor: Cinza/);
  assert.doesNotMatch(msg, /CEP consultado/);
});
