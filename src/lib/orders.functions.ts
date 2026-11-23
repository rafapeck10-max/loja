import { createServerFn } from "@tanstack/react-start";
import { randomBytes } from "node:crypto";
import type { Database, Json } from "@/integrations/supabase/types";
import { orderPaymentSummary, orderWhatsAppMessage } from "./cart-payment.ts";
import { MAX_INSTALLMENTS, WHATSAPP_NUMBER } from "./constants.ts";
import { cardQuote } from "./payment.ts";

export type OrderStatus = "novo" | "em_atendimento" | "concluido" | "cancelado";

export interface StoreOrderLineInput {
  id: string;
  quantity: number;
  color?: string | null;
  finish?: string | null;
  variant?: string | null;
}

export interface CreateStoreOrderInput {
  nome: string;
  telefone: string;
  rua: string;
  bairro: string;
  cidade: string;
  cep?: string;
  pagamento: "PIX" | "Cartão na entrega" | "Dinheiro na entrega";
  observacoes?: string;
  items: StoreOrderLineInput[];
}

export interface StoreOrderRecord {
  id: string;
  codigo: string;
  cliente_nome: string;
  cliente_telefone: string;
  endereco_rua: string;
  endereco_bairro: string;
  endereco_cidade: string;
  endereco_cep: string | null;
  forma_pagamento: string;
  itens: Array<{
    id: string;
    nome: string;
    slug: string;
    quantity: number;
    unitPix: number;
    unitCard: number;
    color?: string | null;
    finish?: string | null;
    variant?: string | null;
  }>;
  total_pix: number;
  total_cartao: number;
  parcelas: number;
  status: OrderStatus;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

const ALLOWED_PAYMENTS = new Set(["PIX", "Cartão na entrega", "Dinheiro na entrega"]);
const ALLOWED_ORDER_STATUSES = new Set<OrderStatus>([
  "novo",
  "em_atendimento",
  "concluido",
  "cancelado",
]);

function generateOrderCode(now: Date): string {
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const suffix = randomBytes(2).toString("hex").toUpperCase();
  return `MOBI-${yyyy}${mm}${dd}-${suffix}`;
}

function resolveAuthoritativeVariationPrice(
  variationsJson: Json,
  variantName: string | null | undefined,
): number | null {
  if (!variantName || !Array.isArray(variationsJson)) return null;
  const target = variantName.trim();
  for (const entry of variationsJson) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const candidate = entry as { name?: unknown; sale_price?: unknown };
    if (String(candidate.name ?? "").trim() === target) {
      const price = Number(candidate.sale_price);
      if (Number.isFinite(price) && price > 0) return price;
    }
  }
  return null;
}

export const createStoreOrder = createServerFn({ method: "POST" })
  .validator((input: CreateStoreOrderInput) => {
    const nome = String(input?.nome ?? "").trim();
    const telefone = String(input?.telefone ?? "").trim();
    const rua = String(input?.rua ?? "").trim();
    const bairro = String(input?.bairro ?? "").trim();
    const cidade = String(input?.cidade ?? "").trim();
    const cep = String(input?.cep ?? "").trim();
    const pagamento = String(input?.pagamento ?? "").trim();
    const observacoes = String(input?.observacoes ?? "").trim();

    if (nome.length < 2 || nome.length > 120) throw new Error("Informe um nome válido.");
    if (telefone.replace(/\D+/g, "").length < 10 || telefone.length > 30) {
      throw new Error("Informe um WhatsApp ou telefone válido com DDD.");
    }
    if (rua.length < 3 || rua.length > 220) throw new Error("Informe rua e número válidos.");
    if (bairro.length < 2 || bairro.length > 120) throw new Error("Informe o bairro.");
    if (cidade.length < 2 || cidade.length > 120) throw new Error("Informe a cidade.");
    if (cep.length > 16) throw new Error("CEP inválido.");
    if (!ALLOWED_PAYMENTS.has(pagamento)) {
      throw new Error("Selecione uma forma de pagamento na entrega.");
    }
    if (observacoes.length > 1000) throw new Error("Observações muito longas.");
    if (!Array.isArray(input?.items) || input.items.length < 1 || input.items.length > 50) {
      throw new Error("Adicione pelo menos 1 móvel válido ao carrinho.");
    }

    const items = input.items.map((item) => {
      const id = String(item?.id ?? "").trim();
      const quantity = Number(item?.quantity);
      if (!id || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99) {
        throw new Error("Revise os itens e quantidades do pedido.");
      }
      return {
        id,
        quantity,
        color: item?.color ? String(item.color).slice(0, 80) : null,
        finish: item?.finish ? String(item.finish).slice(0, 80) : null,
        variant: item?.variant ? String(item.variant).slice(0, 120) : null,
      };
    });

    return {
      nome,
      telefone,
      rua,
      bairro,
      cidade,
      cep,
      pagamento: pagamento as CreateStoreOrderInput["pagamento"],
      observacoes,
      items,
    };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const productIds = [...new Set(data.items.map((item) => item.id))];
    const { data: rows, error: productsError } = await supabaseAdmin
      .from("produtos")
      .select(
        "id, nome, slug, preco_atual, preco_atacado, url_imagem, variacoes_preco, status_estoque",
      )
      .in("id", productIds);

    if (productsError) throw new Error(productsError.message);
    const byId = new Map((rows ?? []).map((row) => [row.id, row]));

    const resolvedItems = data.items.map((item) => {
      const row = byId.get(item.id);
      if (
        !row ||
        !(Number(row.preco_atacado) > 0) ||
        !(Number(row.preco_atual) > 0) ||
        !/^https?:\/\//i.test(row.url_imagem ?? "")
      ) {
        throw new Error("Um dos itens selecionados não está disponível no catálogo.");
      }
      if (row.status_estoque === "esgotado") {
        throw new Error(`O produto "${row.nome}" está indisponível no momento.`);
      }
      const unitPix =
        resolveAuthoritativeVariationPrice(row.variacoes_preco, item.variant) ??
        Number(row.preco_atual);
      const quote = cardQuote(unitPix, MAX_INSTALLMENTS);
      return {
        id: row.id,
        nome: row.nome,
        slug: row.slug,
        quantity: item.quantity,
        unitPix,
        unitCard: quote.total,
        cardRateVerification: quote.rateVerification,
        color: item.color,
        finish: item.finish,
        variant: item.variant,
      };
    });

    const summary = orderPaymentSummary(
      resolvedItems.map((item) => ({
        price: item.unitPix,
        cardPrice: item.unitCard,
        installmentCount: MAX_INSTALLMENTS,
        cardRateVerification: item.cardRateVerification,
        quantity: item.quantity,
      })),
    );

    const now = new Date();
    const codigo = generateOrderCode(now);
    const insertRow: Database["public"]["Tables"]["pedidos"]["Insert"] = {
      codigo,
      cliente_nome: data.nome,
      cliente_telefone: data.telefone,
      endereco_rua: data.rua,
      endereco_bairro: data.bairro,
      endereco_cidade: data.cidade,
      endereco_cep: data.cep || null,
      forma_pagamento: data.pagamento,
      itens: resolvedItems.map(
        ({ id, nome, slug, quantity, unitPix, unitCard, color, finish, variant }) => ({
          id,
          nome,
          slug,
          quantity,
          unitPix,
          unitCard,
          color,
          finish,
          variant,
        }),
      ) as unknown as Json,
      total_pix: summary.pixTotal,
      total_cartao: summary.cardTotal,
      parcelas: MAX_INSTALLMENTS,
      status: "novo",
      observacoes: data.observacoes || null,
    };

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("pedidos")
      .insert(insertRow)
      .select("codigo, created_at, total_pix, total_cartao, forma_pagamento")
      .single();

    if (insertError || !inserted) {
      throw new Error(insertError?.message ?? "Não foi possível registrar o pedido.");
    }

    const baseMessage = orderWhatsAppMessage(
      resolvedItems.map((item) => ({
        name: item.nome,
        price: item.unitPix,
        cardPrice: item.unitCard,
        installmentCount: MAX_INSTALLMENTS,
        cardRateVerification: item.cardRateVerification,
        quantity: item.quantity,
        color: item.color,
        finish: item.finish,
        variant: item.variant,
      })),
      {
        nome: data.nome,
        rua: data.rua,
        bairro: data.bairro,
        cidade: data.cidade,
        pagamento: data.pagamento,
      },
    );
    const fullMessage = [
      `Protocolo do pedido: ${inserted.codigo}`,
      `Telefone: ${data.telefone}`,
      data.cep ? `CEP: ${data.cep}` : "",
      data.observacoes ? `Observações de entrega: ${data.observacoes}` : "",
      "",
      baseMessage,
    ]
      .filter((line, index, arr) => line !== "" || (index > 0 && arr[index - 1] !== ""))
      .join("\n");

    return {
      ok: true as const,
      codigo: inserted.codigo,
      createdAt: inserted.created_at,
      totalPix: Number(inserted.total_pix),
      totalCartao: Number(inserted.total_cartao),
      formaPagamento: inserted.forma_pagamento,
      whatsappUrl: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(fullMessage)}`,
    };
  });

export const listAdminOrders = createServerFn({ method: "POST" })
  .validator((input: { password: string }) => ({ password: String(input?.password ?? "") }))
  .handler(async ({ data }): Promise<StoreOrderRecord[]> => {
    const { verifyAdminSecret } = await import("./admin-auth.server");
    verifyAdminSecret(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("pedidos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as StoreOrderRecord[];
  });

export const updateAdminOrderStatus = createServerFn({ method: "POST" })
  .validator((input: { password: string; id: string; status: string }) => {
    const id = String(input?.id ?? "").trim();
    const status = String(input?.status ?? "").trim() as OrderStatus;
    if (!id) throw new Error("ID do pedido obrigatório.");
    if (!ALLOWED_ORDER_STATUSES.has(status)) throw new Error("Status inválido.");
    return { password: String(input?.password ?? ""), id, status };
  })
  .handler(async ({ data }) => {
    const { verifyAdminSecret } = await import("./admin-auth.server");
    verifyAdminSecret(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("pedidos")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
