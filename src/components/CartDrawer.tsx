import * as Dialog from "@radix-ui/react-dialog";
import { Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { CheckCircle2, Minus, Plus, Trash2, X, Truck, Sofa, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useCart, cartItemKey } from "@/lib/cart-context";
import { formatBRL, WHATSAPP_NUMBER } from "@/lib/constants";
import { MAX_INSTALLMENTS } from "@/lib/constants";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { cartPaymentLine, orderPaymentSummary, orderWhatsAppMessage } from "@/lib/cart-payment";
import {
  formatCep,
  lookupCepWithCoverage,
  normalizeCepDigits,
  readSavedCep,
  saveLastCep,
  type CepCoverageResult,
} from "@/lib/delivery-coverage";
import { createStoreOrder } from "@/lib/orders.functions";

type Step = "cart" | "checkout" | "confirmed";

const PAYMENT_OPTIONS = [
  { value: "PIX", label: "PIX", desc: "Preço com desconto à vista" },
  {
    value: "Cartão na entrega",
    label: "Cartão",
    desc: `Até ${MAX_INSTALLMENTS}x `,
  },
  { value: "Dinheiro na entrega", label: "Dinheiro", desc: "Pague ao receber e montar" },
] as const;

export function CartDrawer() {
  const opener = useRef<HTMLElement | null>(null);
  const { items, total, isOpen, closeCart, updateQuantity, removeItem, clearCart } = useCart();
  const [step, setStep] = useState<Step>("cart");
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    codigo: string;
    totalPix: number;
    totalCartao: number;
    formaPagamento: string;
    whatsappUrl: string;
  } | null>(null);
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    rua: "",
    bairro: "",
    cidade: "Nova Iguaçu - RJ",
    cep: "",
    observacoes: "",
    pagamento: PAYMENT_OPTIONS[0].value as (typeof PAYMENT_OPTIONS)[number]["value"],
  });
  const [cepCoverage, setCepCoverage] = useState<CepCoverageResult | null>(null);
  const [checkingCep, setCheckingCep] = useState(false);
  const lastAutoStreetRef = useRef("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isCardPayment = form.pagamento === "Cartão na entrega";
  const summary = orderPaymentSummary(items);
  const orderTotal = isCardPayment ? summary.cardTotal : summary.pixTotal;
  const close = () => {
    closeCart();
    setStep("cart");
    setConfirmedOrder(null);
    setSubmitting(false);
  };

  const handleCepLookup = async (rawCep: string) => {
    const formatted = formatCep(rawCep);
    setForm((prev) => ({ ...prev, cep: formatted }));
    const digits = normalizeCepDigits(rawCep);
    if (digits.length < 8) {
      setCepCoverage(null);
      return;
    }
    setCheckingCep(true);
    try {
      const resolved = await lookupCepWithCoverage(digits);
      setCepCoverage(resolved);
      if (resolved.status !== "invalid" && resolved.status !== "not_found") {
        saveLastCep(digits);
      }
      if (resolved.address) {
        const cityUf = resolved.address.localidade
          ? `${resolved.address.localidade}${resolved.address.uf ? ` - ${resolved.address.uf}` : ""}`
          : "";
        setForm((prev) => {
          const canUpdateRua =
            Boolean(resolved.address?.logradouro) &&
            (!prev.rua.trim() || prev.rua.trim() === lastAutoStreetRef.current);
          if (canUpdateRua && resolved.address?.logradouro) {
            lastAutoStreetRef.current = resolved.address.logradouro;
          }
          return {
            ...prev,
            ...(canUpdateRua && resolved.address?.logradouro
              ? { rua: resolved.address.logradouro }
              : {}),
            ...(resolved.address?.bairro ? { bairro: resolved.address.bairro } : {}),
            ...(cityUf ? { cidade: cityUf } : {}),
          };
        });
      }
    } finally {
      setCheckingCep(false);
    }
  };

  const openCheckout = () => {
    setStep("checkout");
    if (!form.cep.trim()) {
      const saved = readSavedCep();
      if (saved) void handleCepLookup(saved);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.nome.trim() || form.nome.trim().length < 2) errs.nome = "Informe seu nome";
    else if (form.nome.trim().length > 100) errs.nome = "Nome muito longo";
    if (form.telefone.replace(/\D+/g, "").length < 10) {
      errs.telefone = "Informe seu WhatsApp ou telefone com DDD";
    }
    if (!form.rua.trim() || form.rua.trim().length < 3) errs.rua = "Informe rua e número";
    else if (form.rua.trim().length > 200) errs.rua = "Endereço muito longo";
    if (!form.bairro.trim() || form.bairro.trim().length < 2) errs.bairro = "Informe o bairro";
    else if (form.bairro.trim().length > 100) errs.bairro = "Bairro muito longo";
    if (!form.cidade.trim() || form.cidade.trim().length < 2) errs.cidade = "Informe a cidade";
    setErrors(errs);
    const firstInvalid = Object.keys(errs)[0];
    if (firstInvalid) document.getElementById(`checkout-${firstInvalid}`)?.focus();
    return Object.keys(errs).length === 0;
  };

  const confirmOnSiteOrder = async () => {
    if (!validate() || submitting || items.length === 0) return;
    setSubmitting(true);
    try {
      const result = await createStoreOrder({
        data: {
          nome: form.nome.trim(),
          telefone: form.telefone.trim(),
          rua: form.rua.trim(),
          bairro: form.bairro.trim(),
          cidade: form.cidade.trim(),
          cep: form.cep.trim() || undefined,
          observacoes: form.observacoes.trim() || undefined,
          pagamento: form.pagamento,
          items: items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            color: item.color ?? null,
            finish: item.finish ?? null,
            variant: item.variant ?? null,
          })),
        },
      });
      setConfirmedOrder({
        codigo: result.codigo,
        totalPix: result.totalPix,
        totalCartao: result.totalCartao,
        formaPagamento: result.formaPagamento,
        whatsappUrl: result.whatsappUrl,
      });
      clearCart();
      setStep("confirmed");
      toast.success(`Pedido ${result.codigo} registrado!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível registrar o pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  const sendToWhatsApp = () => {
    if (!validate()) return;

    const baseMessage = orderWhatsAppMessage(items, form);
    const extraLines = [
      form.cep.trim() ? `CEP: ${form.cep.trim()}` : "",
      form.observacoes.trim() ? `Observações de entrega: ${form.observacoes.trim()}` : "",
    ].filter(Boolean);
    const message = extraLines.length ? `${baseMessage}\n${extraLines.join("\n")}` : baseMessage;

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const inputClass = (field: string) =>
    `w-full border bg-white px-4 py-3 font-sans text-sm text-cacau outline-none transition-colors placeholder:text-text-light/60 focus:border-gold ${
      errors[field] ? "border-destructive" : "border-cacau/15"
    }`;

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[1001] bg-black/50" />
        <Dialog.Content
          aria-describedby="mobi-cart-description"
          onOpenAutoFocus={() => {
            opener.current = document.activeElement as HTMLElement;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            opener.current?.focus();
          }}
          className="fixed right-0 top-0 z-[1002] flex h-full w-full max-w-[420px] flex-col bg-sand shadow-drawer"
        >
          <Dialog.Description id="mobi-cart-description" className="sr-only">
            Revise os móveis e as condições antes de consultar o pedido com a Mobi.
          </Dialog.Description>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gold/30 bg-deep-green px-6 py-5">
            <div className="flex items-center gap-3">
              {step === "checkout" && (
                <button
                  onClick={() => setStep("cart")}
                  aria-label="Voltar ao carrinho"
                  className="flex min-h-11 min-w-11 items-center justify-center text-gold transition-colors hover:text-sand"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <Dialog.Title className="text-2xl text-gold">
                {step === "cart"
                  ? "Seu Carrinho"
                  : step === "checkout"
                    ? "Finalizar Pedido"
                    : "Pedido Registrado"}
              </Dialog.Title>
            </div>
            <button
              onClick={close}
              aria-label="Fechar Carrinho"
              className="flex min-h-11 min-w-11 items-center justify-center text-gold transition-colors hover:text-sand"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {step === "cart" ? (
            <>
              {/* Items */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {items.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-text-light">
                    <Sofa className="h-14 w-14 text-gold/50" />
                    <p className="text-sm font-medium">Seu carrinho está vazio.</p>
                    <Link
                      to="/"
                      search={{ all: true, page: 1 }}
                      hash="catalogo"
                      onClick={close}
                      className="mt-2 inline-flex min-h-11 items-center justify-center bg-deep-green px-5 text-xs font-bold uppercase tracking-[1.2px] text-sand no-underline transition-colors hover:bg-gold hover:text-deep-green"
                    >
                      Explorar catálogo
                    </Link>
                  </div>
                ) : (
                  items.map((item) => {
                    const key = cartItemKey(item);
                    const payment = cartPaymentLine(item);
                    return (
                      <div key={key} className="flex gap-4 border-b border-cacau/10 py-4">
                        <ImageWithFallback
                          src={item.img}
                          alt={item.name}
                          className="h-20 w-20 shrink-0 bg-white object-contain"
                        />
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <h4 className="break-words font-sans text-sm font-semibold leading-snug text-cacau">
                            {item.name}
                          </h4>
                          {(item.color || item.finish || item.variant) && (
                            <span className="text-[11px] text-text-light">
                              {[
                                item.color && `Cor: ${item.color}`,
                                item.finish && `Pés: ${item.finish}`,
                                item.variant && `Opção: ${item.variant}`,
                              ]
                                .filter(Boolean)
                                .join(" | ")}
                            </span>
                          )}
                          <div className="text-sm font-bold text-price-green">
                            {formatBRL(item.price)} à vista no Pix ou dinheiro
                          </div>
                          <div className="text-[11px] text-text-light">
                            Cartão: até {MAX_INSTALLMENTS}x
                            <br />
                            {payment.installments}x de{" "}
                            {formatBRL(payment.unitApproximateInstallment)}
                            {" por unidade"}
                            <br />
                            Total no cartão por unidade: {formatBRL(payment.unitCardTotal)}
                            {payment.rateVerification === "inferred" && (
                              <p>Crédito à vista: simulação provisória; confirmar taxa na conta.</p>
                            )}
                          </div>
                          <div className="mt-1 flex items-center justify-between">
                            <div className="flex items-center rounded border border-cacau/15">
                              <button
                                aria-label="Diminuir quantidade"
                                onClick={() => updateQuantity(key, -1)}
                                className="flex h-11 w-11 items-center justify-center text-cacau transition-colors hover:text-gold"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="min-w-4 text-center font-sans text-sm font-semibold">
                                {item.quantity}
                              </span>
                              <button
                                aria-label="Aumentar quantidade"
                                onClick={() => updateQuantity(key, 1)}
                                className="flex h-11 w-11 items-center justify-center text-cacau transition-colors hover:text-gold"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <button
                              aria-label="Remover item"
                              onClick={() => removeItem(key)}
                              className="flex h-11 w-11 shrink-0 items-center justify-center text-text-light transition-colors hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="border-t border-cacau/10 bg-white px-6 py-5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-semibold uppercase tracking-wide text-cacau">
                      Subtotal no Pix:
                    </span>
                    <span className="text-xl font-bold text-price-green">{formatBRL(total)}</span>
                  </div>
                  <div className="mb-3 flex items-center justify-between text-xs text-text-light">
                    <span>No cartão em até {MAX_INSTALLMENTS}x:</span>
                    <strong className="text-cacau">{formatBRL(summary.cardTotal)}</strong>
                  </div>
                  <p className="mb-4 flex items-center justify-center gap-2 text-center text-[11px] font-medium text-text-light">
                    <Truck className="h-3.5 w-3.5 shrink-0 text-gold" /> Frete grátis no raio de 30
                    km de Nova Iguaçu · Pague somente na entrega.
                  </p>
                  <button
                    onClick={openCheckout}
                    className="w-full bg-deep-green py-4 text-sm font-bold uppercase tracking-[1.5px] text-sand transition-all duration-300 hover:bg-gold hover:text-deep-green"
                  >
                    Concluir Pedido
                  </button>
                </div>
              )}
            </>
          ) : step === "checkout" ? (
            <>
              {/* Checkout form */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <p className="mb-5 text-xs uppercase tracking-[1.5px] text-text-light">
                  Dados e Endereço de Entrega
                </p>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="checkout-nome"
                      className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cacau"
                    >
                      Nome completo
                    </label>
                    <input
                      id="checkout-nome"
                      autoComplete="name"
                      aria-invalid={Boolean(errors.nome)}
                      aria-describedby={errors.nome ? "checkout-nome-error" : undefined}
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      placeholder="Seu nome"
                      maxLength={100}
                      className={inputClass("nome")}
                    />
                    {errors.nome && (
                      <p
                        id="checkout-nome-error"
                        role="alert"
                        className="mt-1 text-xs text-destructive"
                      >
                        {errors.nome}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="checkout-telefone"
                      className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cacau"
                    >
                      WhatsApp / Telefone *
                    </label>
                    <input
                      id="checkout-telefone"
                      type="tel"
                      autoComplete="tel"
                      aria-invalid={Boolean(errors.telefone)}
                      aria-describedby={errors.telefone ? "checkout-telefone-error" : undefined}
                      value={form.telefone}
                      onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                      placeholder="(21) 99999-9999"
                      maxLength={30}
                      className={inputClass("telefone")}
                    />
                    {errors.telefone && (
                      <p
                        id="checkout-telefone-error"
                        role="alert"
                        className="mt-1 text-xs text-destructive"
                      >
                        {errors.telefone}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="checkout-cep"
                      className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cacau"
                    >
                      CEP (preenche o endereço e confirma o frete grátis)
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="checkout-cep"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        value={form.cep}
                        onChange={(e) => {
                          const next = formatCep(e.target.value);
                          setForm((prev) => ({ ...prev, cep: next }));
                          if (normalizeCepDigits(next).length === 8) {
                            void handleCepLookup(next);
                          } else {
                            setCepCoverage(null);
                          }
                        }}
                        placeholder="26000-000"
                        maxLength={9}
                        className={inputClass("cep")}
                      />
                      <button
                        type="button"
                        disabled={checkingCep}
                        onClick={() => void handleCepLookup(form.cep)}
                        className="min-h-11 shrink-0 border border-deep-green/25 bg-white px-4 text-xs font-bold uppercase tracking-wide text-deep-green transition-colors hover:bg-deep-green hover:text-sand disabled:opacity-60"
                      >
                        {checkingCep ? "..." : "Buscar"}
                      </button>
                    </div>
                    {cepCoverage && (
                      <p
                        role="status"
                        className={`mt-2 rounded border px-3 py-2 text-xs leading-relaxed ${
                          cepCoverage.status === "eligible"
                            ? "border-price-green/30 bg-[#edf4e9] text-deep-green"
                            : cepCoverage.status === "excluded_belford_roxo" ||
                                cepCoverage.status === "invalid" ||
                                cepCoverage.status === "not_found"
                              ? "border-[#c45b47]/35 bg-[#fdf2ef] text-[#7a2e1d]"
                              : "border-gold/40 bg-gold/10 text-cacau"
                        }`}
                      >
                        {cepCoverage.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="checkout-rua"
                      className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cacau"
                    >
                      Rua e número
                    </label>
                    <input
                      id="checkout-rua"
                      autoComplete="street-address"
                      aria-invalid={Boolean(errors.rua)}
                      aria-describedby={errors.rua ? "checkout-rua-error" : undefined}
                      value={form.rua}
                      onChange={(e) => setForm({ ...form, rua: e.target.value })}
                      placeholder="Ex: Rua das Palmeiras, 123"
                      maxLength={200}
                      className={inputClass("rua")}
                    />
                    {errors.rua && (
                      <p
                        id="checkout-rua-error"
                        role="alert"
                        className="mt-1 text-xs text-destructive"
                      >
                        {errors.rua}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="checkout-bairro"
                        className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cacau"
                      >
                        Bairro
                      </label>
                      <input
                        id="checkout-bairro"
                        autoComplete="address-level3"
                        aria-invalid={Boolean(errors.bairro)}
                        aria-describedby={errors.bairro ? "checkout-bairro-error" : undefined}
                        value={form.bairro}
                        onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                        placeholder="Seu bairro"
                        maxLength={100}
                        className={inputClass("bairro")}
                      />
                      {errors.bairro && (
                        <p
                          id="checkout-bairro-error"
                          role="alert"
                          className="mt-1 text-xs text-destructive"
                        >
                          {errors.bairro}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="checkout-cidade"
                        className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cacau"
                      >
                        Cidade
                      </label>
                      <input
                        id="checkout-cidade"
                        aria-invalid={Boolean(errors.cidade)}
                        aria-describedby={errors.cidade ? "checkout-cidade-error" : undefined}
                        value={form.cidade}
                        onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                        autoComplete="address-level2"
                        maxLength={100}
                        className={inputClass("cidade")}
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="checkout-observacoes"
                      className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cacau"
                    >
                      Complemento / observações de entrega (opcional)
                    </label>
                    <input
                      id="checkout-observacoes"
                      value={form.observacoes}
                      onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                      placeholder="Ex.: Apto 202, sem elevador, preferência manhã"
                      maxLength={300}
                      className={inputClass("observacoes")}
                    />
                  </div>

                  {errors.cidade && (
                    <p id="checkout-cidade-error" role="alert" className="text-xs text-destructive">
                      {errors.cidade}
                    </p>
                  )}
                  <div className="pt-2">
                    <p className="mb-3 text-xs uppercase tracking-[1.5px] text-text-light">
                      Forma de Pagamento na Entrega
                    </p>
                    <div className="space-y-2">
                      {PAYMENT_OPTIONS.map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex cursor-pointer items-center gap-3 border px-4 py-3 transition-colors ${
                            form.pagamento === opt.value
                              ? "border-gold bg-gold/10"
                              : "border-cacau/15 bg-white hover:border-gold/50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="pagamento"
                            value={opt.value}
                            checked={form.pagamento === opt.value}
                            onChange={() => setForm({ ...form, pagamento: opt.value })}
                            className="accent-[#C5A059]"
                          />
                          <span>
                            <span className="block text-sm font-bold text-cacau">{opt.label}</span>
                            <span className="block text-xs text-text-light">{opt.desc}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                {isCardPayment && (
                  <div className="mb-3 mt-4 space-y-2 text-xs text-text-light">
                    {items.map((item, index) => {
                      const line = summary.lines[index];
                      return (
                        <p key={cartItemKey(item)}>
                          {item.name} · {item.quantity} unidade(s): até {MAX_INSTALLMENTS}x no
                          cartão; {line.installments}x de {formatBRL(line.approximateInstallment)}.{" "}
                          Total no cartão: {formatBRL(line.cardTotal)}.
                          {line.rateVerification === "inferred" &&
                            " Crédito à vista provisório: confirmar taxa na conta."}
                        </p>
                      );
                    })}
                    <p>
                      A parcela exibida foi arredondada para cima; centavos residuais seguem a
                      operadora e o total informado permanece válido.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-cacau/10 bg-white px-6 py-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold uppercase tracking-wide text-cacau">
                    {isCardPayment ? "Total no cartão:" : "Total do Pedido:"}
                  </span>
                  <span className="text-xl font-bold text-price-green">
                    {formatBRL(orderTotal)}
                  </span>
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={confirmOnSiteOrder}
                    className="min-h-12 w-full bg-deep-green py-3.5 text-sm font-bold uppercase tracking-[1.2px] text-sand transition-colors hover:bg-gold hover:text-deep-green disabled:opacity-60"
                  >
                    {submitting ? "Registrando pedido…" : "Confirmar Pedido (Pagar na Entrega)"}
                  </button>
                  <button
                    type="button"
                    onClick={sendToWhatsApp}
                    className="flex min-h-11 w-full items-center justify-center gap-2 border border-whatsapp bg-white py-2.5 text-xs font-bold uppercase tracking-[1.2px] text-whatsapp transition-colors hover:bg-whatsapp/10"
                  >
                    <WhatsAppIcon className="h-4 w-4" /> Apenas tirar dúvida no WhatsApp
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col justify-between overflow-y-auto px-6 py-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl border border-price-green/25 bg-[#edf4e9] p-4 text-deep-green">
                  <CheckCircle2 className="h-7 w-7 shrink-0 text-price-green" aria-hidden="true" />
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide">
                      Protocolo registrado
                    </div>
                    <strong className="text-xl">{confirmedOrder?.codigo}</strong>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-cacau">
                  Recebemos seu pedido com pagamento na entrega ({confirmedOrder?.formaPagamento}).
                  Nossa equipe confirmará disponibilidade, frete e horário de entrega pelo WhatsApp{" "}
                  <strong>{form.telefone}</strong>.
                </p>
                {confirmedOrder && (
                  <div className="rounded-xl border border-cacau/10 bg-white p-4 text-sm text-cacau">
                    <div className="flex justify-between py-1">
                      <span>Valor à vista (Pix / dinheiro)</span>
                      <strong className="text-price-green">
                        {formatBRL(confirmedOrder.totalPix)}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Total no cartão ({MAX_INSTALLMENTS}x)</span>
                      <strong>{formatBRL(confirmedOrder.totalCartao)}</strong>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 space-y-2 border-t border-cacau/10 pt-5">
                {confirmedOrder && (
                  <a
                    href={confirmedOrder.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-12 w-full items-center justify-center gap-2 bg-whatsapp py-3.5 text-sm font-bold uppercase tracking-[1.2px] text-white no-underline hover:brightness-110"
                  >
                    <WhatsAppIcon className="h-5 w-5" /> Enviar protocolo no WhatsApp
                  </a>
                )}
                <button
                  type="button"
                  onClick={close}
                  className="min-h-11 w-full border border-cacau/20 bg-white py-3 text-xs font-bold uppercase tracking-[1.2px] text-cacau hover:bg-sand"
                >
                  Voltar à loja
                </button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
