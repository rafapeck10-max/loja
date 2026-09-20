import { useState } from "react";
import { Minus, Plus, Trash2, X, Truck, Sofa, ArrowLeft } from "lucide-react";
import { useCart, cartItemKey } from "@/lib/cart-context";
import { formatBRL, WHATSAPP_NUMBER } from "@/lib/constants";
import { MAX_INSTALLMENTS } from "@/lib/constants";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

type Step = "cart" | "checkout";

const PAYMENT_OPTIONS = [
  { value: "PIX", label: "PIX", desc: "Preço com desconto à vista" },
  {
    value: "Cartão na entrega",
    label: "Cartão",
    desc: `Preço cheio em até ${MAX_INSTALLMENTS}x, na entrega`,
  },
  { value: "Dinheiro na entrega", label: "Dinheiro", desc: "Pague ao receber e montar" },
];

export function CartDrawer() {
  const { items, total, isOpen, closeCart, updateQuantity, removeItem } = useCart();
  const [step, setStep] = useState<Step>("cart");
  const [form, setForm] = useState({
    nome: "",
    rua: "",
    bairro: "",
    cidade: "Nova Iguaçu - RJ",
    pagamento: PAYMENT_OPTIONS[0].value,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isCardPayment = form.pagamento === "Cartão na entrega";
  const orderTotal = items.reduce(
    (sum, item) =>
      sum + (isCardPayment ? (item.cardPrice ?? item.price) : item.price) * item.quantity,
    0,
  );

  const close = () => {
    closeCart();
    setStep("cart");
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.nome.trim()) errs.nome = "Informe seu nome";
    else if (form.nome.trim().length > 100) errs.nome = "Nome muito longo";
    if (!form.rua.trim()) errs.rua = "Informe rua e número";
    else if (form.rua.trim().length > 200) errs.rua = "Endereço muito longo";
    if (!form.bairro.trim()) errs.bairro = "Informe o bairro";
    else if (form.bairro.trim().length > 100) errs.bairro = "Bairro muito longo";
    if (!form.cidade.trim()) errs.cidade = "Informe a cidade";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const sendToWhatsApp = () => {
    if (!validate()) return;

    let message = "Olá Mobi! Gostaria de fazer um pedido:\n\n";
    items.forEach((item, index) => {
      message += `*${index + 1}. ${item.name}*\n`;
      const opts: string[] = [];
      if (item.color) opts.push(`Cor: ${item.color}`);
      if (item.finish) opts.push(`Pés: ${item.finish}`);
      if (opts.length) message += `   _(${opts.join(", ")})_\n`;
      const itemPrice = isCardPayment ? (item.cardPrice ?? item.price) : item.price;
      message += `   Qtd: ${item.quantity}x | Preço: ${formatBRL(itemPrice)}\n\n`;
      if (isCardPayment) {
        const installments = item.installmentCount ?? MAX_INSTALLMENTS;
        message += `   Cartão: ${installments}x de ${formatBRL((itemPrice * item.quantity) / installments)}\n\n`;
      }
    });
    message += `*Valor Total:* ${formatBRL(orderTotal)}\n\n`;
    message += `*Dados de Entrega:*\n`;
    message += `Nome: ${form.nome.trim()}\n`;
    message += `Rua: ${form.rua.trim()}\n`;
    message += `Bairro: ${form.bairro.trim()}\n`;
    message += `Cidade: ${form.cidade.trim()}\n\n`;
    message += `*Forma de Pagamento:* ${form.pagamento}\n\n`;
    message += `Gostaria de combinar a entrega (Baixada Fluminense).`;

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
    <>
      {/* Overlay */}
      <div
        onClick={close}
        className={`fixed inset-0 z-[1001] bg-black/50 transition-opacity duration-400 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer */}
      <aside
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`fixed right-0 top-0 z-[1002] flex h-full w-full max-w-[420px] flex-col bg-sand shadow-drawer transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gold/30 bg-deep-green px-6 py-5">
          <div className="flex items-center gap-3">
            {step === "checkout" && (
              <button
                onClick={() => setStep("cart")}
                aria-label="Voltar ao carrinho"
                className="text-gold transition-colors hover:text-sand"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h3 className="text-2xl text-gold">
              {step === "cart" ? "Seu Carrinho" : "Finalizar Pedido"}
            </h3>
          </div>
          <button
            onClick={close}
            aria-label="Fechar Carrinho"
            className="text-gold transition-colors hover:text-sand"
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
                </div>
              ) : (
                items.map((item) => {
                  const key = cartItemKey(item);
                  return (
                    <div key={key} className="flex gap-4 border-b border-cacau/10 py-4">
                      <img
                        src={item.img}
                        alt={item.name}
                        className="h-20 w-20 shrink-0 object-cover"
                      />
                      <div className="flex flex-1 flex-col gap-1">
                        <h4 className="font-sans text-sm font-semibold leading-snug text-cacau">
                          {item.name}
                        </h4>
                        {(item.color || item.finish) && (
                          <span className="text-[11px] text-text-light">
                            {[
                              item.color && `Cor: ${item.color}`,
                              item.finish && `Pés: ${item.finish}`,
                            ]
                              .filter(Boolean)
                              .join(" | ")}
                          </span>
                        )}
                        <div className="text-sm font-bold text-price-green">
                          {formatBRL(item.price)} no PIX
                        </div>
                        <div className="text-[11px] text-text-light">
                          ou {item.installmentCount ?? MAX_INSTALLMENTS}x de{" "}
                          {formatBRL(
                            (item.cardPrice ?? item.price) /
                              (item.installmentCount ?? MAX_INSTALLMENTS),
                          )}{" "}
                          no cartão
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <div className="flex items-center gap-3 border border-cacau/15 px-2 py-1">
                            <button
                              aria-label="Diminuir quantidade"
                              onClick={() => updateQuantity(key, -1)}
                              className="text-cacau transition-colors hover:text-gold"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="min-w-4 text-center font-sans text-sm font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              aria-label="Aumentar quantidade"
                              onClick={() => updateQuantity(key, 1)}
                              className="text-cacau transition-colors hover:text-gold"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <button
                            aria-label="Remover item"
                            onClick={() => removeItem(key)}
                            className="text-text-light transition-colors hover:text-destructive"
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
            <div className="border-t border-cacau/10 bg-white px-6 py-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-wide text-cacau">
                  Subtotal:
                </span>
                <span className="text-xl font-bold text-price-green">{formatBRL(total)}</span>
              </div>
              <p className="mb-4 flex items-center justify-center gap-2 text-center text-[11px] font-medium text-text-light">
                <Truck className="h-3.5 w-3.5 text-gold" /> Pague e receba em casa na Baixada
                Fluminense.
              </p>
              <button
                disabled={items.length === 0}
                onClick={() => setStep("checkout")}
                className="w-full bg-deep-green py-4 text-sm font-bold uppercase tracking-[1.5px] text-sand transition-all duration-300 hover:bg-gold hover:text-deep-green disabled:pointer-events-none disabled:opacity-50"
              >
                Concluir Pedido
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Checkout form */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <p className="mb-5 text-xs uppercase tracking-[1.5px] text-text-light">
                Endereço de Entrega
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
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Seu nome"
                    maxLength={100}
                    className={inputClass("nome")}
                  />
                  {errors.nome && <p className="mt-1 text-xs text-destructive">{errors.nome}</p>}
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
                    value={form.rua}
                    onChange={(e) => setForm({ ...form, rua: e.target.value })}
                    placeholder="Ex: Rua das Palmeiras, 123"
                    maxLength={200}
                    className={inputClass("rua")}
                  />
                  {errors.rua && <p className="mt-1 text-xs text-destructive">{errors.rua}</p>}
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
                      value={form.bairro}
                      onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                      placeholder="Seu bairro"
                      maxLength={100}
                      className={inputClass("bairro")}
                    />
                    {errors.bairro && (
                      <p className="mt-1 text-xs text-destructive">{errors.bairro}</p>
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
                      value={form.cidade}
                      onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                      autoComplete="address-level2"
                      maxLength={100}
                      className={inputClass("cidade")}
                    />
                  </div>
                </div>

                {errors.cidade && (
                  <p role="alert" className="text-xs text-destructive">
                    {errors.cidade}
                  </p>
                )}
                <div className="pt-2">
                  <p className="mb-3 text-xs uppercase tracking-[1.5px] text-text-light">
                    Forma de Pagamento
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
            </div>

            {/* Footer */}
            <div className="border-t border-cacau/10 bg-white px-6 py-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-wide text-cacau">
                  Total do Pedido:
                </span>
                <span className="text-xl font-bold text-price-green">{formatBRL(orderTotal)}</span>
              </div>
              <button
                onClick={sendToWhatsApp}
                className="flex w-full items-center justify-center gap-2 bg-whatsapp py-4 text-sm font-bold uppercase tracking-[1.5px] text-white transition-all duration-300 hover:brightness-110"
              >
                <WhatsAppIcon className="h-5 w-5" /> Enviar Pedido no WhatsApp
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
