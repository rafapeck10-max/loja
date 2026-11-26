import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatBRL } from "@/lib/constants";
import {
  listAdminOrders,
  updateAdminOrderStatus,
  type OrderStatus,
  type StoreOrderRecord,
} from "@/lib/orders.functions";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

const STATUS_LABELS: Record<OrderStatus, string> = {
  novo: "Novo",
  em_atendimento: "Em atendimento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

function phoneToWhatsApp(phone: string): string {
  const digits = phone.replace(/\D+/g, "");
  const full = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${full}`;
}

export function StoreOrdersPanel({ password }: { password: string }) {
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const {
    data: orders = [],
    isPending,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-store-orders"],
    queryFn: () => listAdminOrders({ data: { password } }),
  });

  const filtered = useMemo(
    () =>
      statusFilter === "all" ? orders : orders.filter((order) => order.status === statusFilter),
    [orders, statusFilter],
  );

  const changeStatus = async (order: StoreOrderRecord, status: OrderStatus) => {
    setUpdatingId(order.id);
    try {
      await updateAdminOrderStatus({ data: { password, id: order.id, status } });
      await refetch();
      toast.success(`Pedido ${order.codigo} marcado como "${STATUS_LABELS[status]}".`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível atualizar o status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section aria-labelledby="store-orders-title">
      <header className="aw-editor-toolbar admin-page-header">
        <div>
          <h1 id="store-orders-title">Pedidos do site</h1>
          <p className="admin-page-subtitle">
            Acompanhe os pedidos enviados pela loja e atualize o status de atendimento.
          </p>
        </div>
        <button type="button" onClick={() => refetch()} disabled={isFetching} className="aw-action">
          <RefreshCw size={15} className={isFetching ? "ov-spin" : ""} aria-hidden="true" />
          {isFetching ? "Atualizando…" : "Atualizar"}
        </button>
      </header>

      <div className="admin-workbench">
        <div className="admin-workbench-filters">
          <div
            className="pricing-filter-pills"
            role="group"
            aria-label="Filtrar pedidos por status"
          >
            {(["all", "novo", "em_atendimento", "concluido", "cancelado"] as const).map(
              (status) => {
                const count =
                  status === "all"
                    ? orders.length
                    : orders.filter((item) => item.status === status).length;
                return (
                  <button
                    key={status}
                    type="button"
                    aria-pressed={statusFilter === status}
                    onClick={() => setStatusFilter(status)}
                    className="pricing-filter-pill"
                  >
                    <span>{status === "all" ? "Todos" : STATUS_LABELS[status]}</span>
                    <b>{count}</b>
                  </button>
                );
              },
            )}
          </div>
        </div>

        {isError && (
          <div
            role="alert"
            className="m-4 rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
          >
            {error instanceof Error ? error.message : "Não foi possível carregar os pedidos."}
          </div>
        )}

        {isPending ? (
          <div className="scraped-empty-box">Carregando pedidos do site…</div>
        ) : filtered.length === 0 ? (
          <div className="scraped-empty-box">Nenhum pedido registrado para este filtro ainda.</div>
        ) : (
          <div className="grid gap-3 p-5">
            {filtered.map((order) => (
              <article
                key={order.id}
                className="rounded-lg border border-cacau/15 bg-white p-4 sm:p-5"
              >
                <div className="flex flex-col gap-3 border-b border-cacau/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-base text-deep-green">{order.codigo}</strong>
                      <span className="rounded bg-[#faf7f1] px-2.5 py-0.5 text-[11px] font-semibold text-cacau">
                        {order.forma_pagamento}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-text-light">
                      {new Date(order.created_at).toLocaleString("pt-BR")} · {order.cliente_nome} ·{" "}
                      {order.cliente_telefone}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label={`Status do pedido ${order.codigo}`}
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(event) => changeStatus(order, event.target.value as OrderStatus)}
                      className="min-h-11 rounded-md border border-cacau/20 bg-white px-3 text-xs font-semibold text-cacau"
                    >
                      {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((key) => (
                        <option key={key} value={key}>
                          {STATUS_LABELS[key]}
                        </option>
                      ))}
                    </select>
                    <a
                      href={phoneToWhatsApp(order.cliente_telefone)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-whatsapp px-3 text-xs font-bold text-white no-underline hover:brightness-110"
                    >
                      <WhatsAppIcon className="h-4 w-4" /> WhatsApp
                    </a>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="space-y-1 text-xs text-cacau">
                    <div>
                      <strong>Entrega:</strong> {order.endereco_rua}, {order.endereco_bairro} —{" "}
                      {order.endereco_cidade}
                      {order.endereco_cep ? ` · CEP ${order.endereco_cep}` : ""}
                    </div>
                    <ul className="mt-2 list-disc space-y-1 pl-4">
                      {(Array.isArray(order.itens) ? order.itens : []).map((item, idx) => (
                        <li key={`${item.id}-${idx}`}>
                          <strong>
                            {item.quantity}× {item.nome}
                          </strong>{" "}
                          ({formatBRL(item.unitPix)} Pix / {order.parcelas}× total{" "}
                          {formatBRL(item.unitCard)})
                          {[
                            item.color && `Cor: ${item.color}`,
                            item.finish && `Pés: ${item.finish}`,
                            item.variant && `Opção: ${item.variant}`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-md border border-cacau/10 bg-[#faf7f1] px-4 py-3 text-right">
                    <div className="text-[11px] uppercase text-text-light">Total no Pix</div>
                    <div className="text-lg font-bold text-price-green">
                      {formatBRL(Number(order.total_pix))}
                    </div>
                    <div className="mt-1 text-[11px] text-text-light">
                      Cartão ({order.parcelas}x): {formatBRL(Number(order.total_cartao))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
