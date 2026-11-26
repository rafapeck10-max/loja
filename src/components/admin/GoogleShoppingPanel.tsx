import { useMemo, useState } from "react";
import { CheckCircle2, Copy, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  bulkUpdateProductStock,
  syncScrapedStockToProducts,
  type ProdutoAdmin,
} from "@/lib/admin.functions";
import { SITE_URL } from "@/lib/site-metadata";

export function GoogleShoppingPanel({
  password,
  products,
  onUpdated,
  demonstration = false,
}: {
  password: string;
  products: ProdutoAdmin[];
  onUpdated: () => Promise<void> | void;
  demonstration?: boolean;
}) {
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const feedUrl = `${SITE_URL}/google-merchant.tsv`;

  const stats = useMemo(() => {
    const eligible = products.filter(
      (product) =>
        Number(product.preco_atacado ?? 0) > 0 &&
        Number(product.preco_atual ?? 0) > 0 &&
        /^https:\/\//i.test(product.url_imagem?.trim() ?? ""),
    );
    const byStatus = {
      disponivel: 0,
      esgotado: 0,
      nao_verificado: 0,
      revisar: 0,
    };
    const pendingBySupplier = new Map<string, number>();

    for (const product of eligible) {
      const status =
        product.status_estoque === "disponivel" ||
        product.status_estoque === "esgotado" ||
        product.status_estoque === "revisar"
          ? product.status_estoque
          : "nao_verificado";
      byStatus[status] += 1;
      if (status === "nao_verificado") {
        const supplier = product.fornecedor?.trim() || "Sem fornecedor cadastrado";
        pendingBySupplier.set(supplier, (pendingBySupplier.get(supplier) ?? 0) + 1);
      }
    }

    return {
      totalEligible: eligible.length,
      byStatus,
      inFeed: byStatus.disponivel + byStatus.esgotado,
      pendingSuppliers: [...pendingBySupplier.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [products]);

  const copyFeedUrl = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      toast.success("URL do feed copiada.");
    } catch {
      toast.error("Não foi possível copiar a URL agora.");
    }
  };

  const runScrapedSync = async () => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Aplicar a disponibilidade mais recente de scraped_products nos produtos vinculados de public.produtos?",
      )
    ) {
      return;
    }
    setBusyAction("sync-scraped");
    try {
      const result = await syncScrapedStockToProducts({ data: { password } });
      await onUpdated();
      toast.success(
        `Sincronizado: ${result.disponivelCount} disponíveis e ${result.esgotadoCount} esgotados.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao sincronizar disponibilidade.");
    } finally {
      setBusyAction(null);
    }
  };

  const confirmSupplierStock = async (supplier: string, count: number) => {
    if (supplier === "Sem fornecedor cadastrado") {
      toast.error("Defina o fornecedor antes de atualizar o estoque em lote.");
      return;
    }
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Marcar ${count} produto(s) elegível(eis) de "${supplier}" sem verificação como "Disponível" no Google Shopping e na página do produto?`,
      )
    ) {
      return;
    }
    setBusyAction(`supplier:${supplier}`);
    try {
      const result = await bulkUpdateProductStock({
        data: {
          password,
          supplier,
          onlyUnverified: true,
          status: "disponivel",
        },
      });
      await onUpdated();
      toast.success(`${result.updated} produto(s) de ${supplier} marcados como disponíveis.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao atualizar lote.");
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-cacau/15 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-deep-green">
              Feed dinâmico do Google Merchant Center
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-text-light">
              Substitui o envio manual antigo (
              <code className="rounded bg-sand px-1 py-0.5 text-[11px] font-semibold text-deep-green">
                mobi_google_produtos.tsv
              </code>
              ) emitindo apenas produtos com custo, venda, foto HTTPS e disponibilidade confirmada
              (disponível ou esgotado), em total sincronia com o JSON-LD da página.
            </p>
          </div>
          {demonstration && (
            <span className="shrink-0 rounded-full bg-sand px-3 py-1 text-[11px] font-semibold text-cacau">
              Modo demonstração
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2 rounded-lg border border-cacau/15 bg-[#faf7f1] p-3 sm:flex-row sm:items-center">
          <code className="min-w-0 flex-1 break-all text-xs font-semibold text-deep-green">
            {feedUrl}
          </code>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyFeedUrl}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-deep-green bg-white px-3 text-xs font-bold text-deep-green hover:bg-deep-green hover:text-sand"
            >
              <Copy size={14} /> Copiar URL
            </button>
            <a
              href="/google-merchant.tsv"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-deep-green px-3 text-xs font-bold text-sand no-underline hover:opacity-90"
            >
              <ExternalLink size={14} /> Abrir feed TSV
            </a>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-cacau/10 bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-text-light">
            No feed TSV hoje
          </div>
          <div className="mt-1 text-2xl font-bold text-deep-green">{stats.inFeed}</div>
          <div className="mt-1 text-xs text-text-light">de {stats.totalEligible} elegíveis</div>
        </div>
        <div className="rounded-xl border border-cacau/10 bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-text-light">
            Disponível (in_stock)
          </div>
          <div className="mt-1 text-2xl font-bold text-price-green">
            {stats.byStatus.disponivel}
          </div>
        </div>
        <div className="rounded-xl border border-cacau/10 bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-text-light">
            Esgotado (out_of_stock)
          </div>
          <div className="mt-1 text-2xl font-bold text-cacau">{stats.byStatus.esgotado}</div>
        </div>
        <div className="rounded-xl border border-cacau/10 bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-text-light">
            Não verificados
          </div>
          <div className="mt-1 text-2xl font-bold text-[#9a7a39]">
            {stats.byStatus.nao_verificado + stats.byStatus.revisar}
          </div>
          <div className="mt-1 text-xs text-text-light">aguardando confirmação</div>
        </div>
      </section>

      <section className="rounded-xl border border-cacau/15 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-deep-green">
              Atualizar disponibilidade dos móveis
            </h3>
            <p className="mt-1 text-xs text-text-light">
              Importe os sinais já raspados dos fornecedores ou confirme manualmente em lote por
              fornecedor para liberar novos móveis no Google Shopping.
            </p>
          </div>
          <button
            type="button"
            disabled={busyAction !== null}
            onClick={runScrapedSync}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-deep-green bg-[#edf4e9] px-4 text-xs font-bold text-deep-green hover:bg-deep-green hover:text-sand disabled:opacity-60"
          >
            <RefreshCw size={15} className={busyAction === "sync-scraped" ? "animate-spin" : ""} />
            Sincronizar raspagem vinculada
          </button>
        </div>

        {stats.pendingSuppliers.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-cacau/10 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-light">
              Elegíveis sem verificação por fornecedor
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {stats.pendingSuppliers.map(([supplier, count]) => (
                <div
                  key={supplier}
                  className="flex items-center justify-between gap-3 rounded-lg border border-cacau/10 bg-[#faf7f1] p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-cacau">{supplier}</div>
                    <div className="text-xs text-text-light">{count} produto(s) elegível(eis)</div>
                  </div>
                  <button
                    type="button"
                    disabled={busyAction !== null || supplier === "Sem fornecedor cadastrado"}
                    onClick={() => confirmSupplierStock(supplier, count)}
                    className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg bg-deep-green px-3 text-xs font-bold text-sand hover:opacity-90 disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} /> Confirmar disponíveis
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
