export type RateVerification = "confirmed" | "inferred";

// Desconto da operadora sobre o TOTAL da transação, não acréscimo sobre o Pix.
// Exclusivo da maquininha Visa neste plano. Revalidar ao mudar plano/canal/bandeira.
export const CARD_PAYMENT_CONFIG = {
  id: "infinitepay-maquininha-instantanea-visa-2026-10-14",
  provider: "InfinitePay",
  channel: "maquininha",
  plan: "Liquidação Instantânea",
  brand: "Visa",
  maxInstallments: 10,
  rates: [
    // Deduzida de R$ 1.324,73 para receber R$ 1.252,00. Ainda a confirmar na conta.
    { installments: 1, feePercent: 5.49, verification: "inferred" },
    // Confirmada diretamente pelo responsável da loja em 14/10/2026.
    { installments: 2, feePercent: 10.89, verification: "confirmed" },
    // Confirmadas nas simulações da maquininha fornecidas pelo responsável.
    { installments: 3, feePercent: 11.99, verification: "confirmed" },
    { installments: 4, feePercent: 12.59, verification: "confirmed" },
    { installments: 5, feePercent: 13.29, verification: "confirmed" },
    { installments: 6, feePercent: 13.99, verification: "confirmed" },
    { installments: 7, feePercent: 14.99, verification: "confirmed" },
    { installments: 8, feePercent: 15.59, verification: "confirmed" },
    { installments: 9, feePercent: 16.19, verification: "confirmed" },
    { installments: 10, feePercent: 12.1, verification: "confirmed" },
  ],
} as const;
