import { createFileRoute, Link } from "@tanstack/react-router";
import { MAX_INSTALLMENTS, WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/constants";
import { breadcrumbs, jsonLd, seoHead } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-metadata";

const deliveryPaymentFaqs = [
  {
    question: "Como funciona comprar móveis com pagamento somente na entrega na Mobi?",
    answer:
      "Você escolhe os móveis no site, informa seu endereço no carrinho e conclui o pedido sem digitar cartão nem fazer pagamento antecipado. Nossa equipe confirma disponibilidade, elegibilidade do logradouro e agendamento pelo WhatsApp, e você paga somente quando o móvel chegar.",
  },
  {
    question: "Quais formas de pagamento na entrega são aceitas?",
    answer: `Aceitamos Pix com desconto à vista, dinheiro na entrega e cartão de crédito na entrega em até ${MAX_INSTALLMENTS}x (com o valor exato da parcela e do total exibidos na página de cada móvel).`,
  },
  {
    question: "O frete é grátis para Nova Iguaçu e Baixada Fluminense?",
    answer:
      "Sim, o frete é grátis em até 7 dias úteis para localidades elegíveis dentro do raio de até 30 km de Nova Iguaçu (incluindo Nova Iguaçu, Mesquita, Nilópolis, São João de Meriti, Duque de Caxias, Queimados, Japeri, Paracambi, Seropédica e bairros próximos das Zonas Norte e Oeste do Rio), exceto Belford Roxo e áreas com barricadas ou restrição de acesso.",
  },
  {
    question: "Tenho direito a devolução ou troca se comprar sem loja física?",
    answer:
      "Sim. Conforme o Código de Defesa do Consumidor, você conta com 7 dias corridos após o recebimento para devolução ou troca em compras online, além da garantia legal de 90 dias para defeitos de fabricação.",
  },
];

export const Route = createFileRoute("/moveis-pagamento-na-entrega")({
  head: () => ({
    ...seoHead(
      "Móveis com Pagamento na Entrega em Nova Iguaçu e RJ – Frete Grátis | Mobi",
      "Compre móveis pagando somente na entrega em Nova Iguaçu e região: Pix, dinheiro ou cartão até 10x, frete grátis em até 7 dias úteis e compra 100% online.",
      `${SITE_URL}/moveis-pagamento-na-entrega`,
    ),
    scripts: [
      jsonLd(
        breadcrumbs([
          { name: "Início", url: `${SITE_URL}/` },
          {
            name: "Móveis com pagamento na entrega",
            url: `${SITE_URL}/moveis-pagamento-na-entrega`,
          },
        ]),
      ),
      jsonLd({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: deliveryPaymentFaqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      }),
    ],
  }),
  component: PayOnDeliveryPage,
});

const steps = [
  {
    title: "1. Escolha no catálogo",
    text: "Compare fotos, medidas completas, cores, valor à vista no Pix e parcelamento em até 10x em cada página.",
  },
  {
    title: "2. Registre sem pagar antes",
    text: "Adicione ao carrinho, preencha nome, WhatsApp, endereço e escolha como quer pagar na entrega para gerar seu protocolo.",
  },
  {
    title: "3. Confirmação de rota e data",
    text: "Nossa equipe valida disponibilidade e cobertura dentro do raio de 30 km de Nova Iguaçu pelo WhatsApp antes de sair para entrega.",
  },
  {
    title: "4. Pague só ao receber",
    text: "O pagamento no Pix, dinheiro ou cartão na maquininha acontece na entrega do móvel embalado de fábrica.",
  },
];

function PayOnDeliveryPage() {
  return (
    <div className="mobi-wrap py-8 sm:py-10">
      <nav
        aria-label="Caminho da página"
        className="mb-5 flex flex-wrap items-center gap-2 text-sm text-text-light"
      >
        <Link to="/" search={{}} className="inline-flex min-h-11 items-center underline">
          Início
        </Link>
        <span aria-hidden="true">/</span>
        <span>Móveis com pagamento na entrega</span>
      </nav>

      <h1 className="text-3xl text-deep-green sm:text-4xl">
        Móveis com pagamento na entrega em Nova Iguaçu e região
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-relaxed text-text-light">
        Na Mobi você compra móveis sem risco e sem cobrança antecipada pela internet: pague somente
        quando receber o pedido em casa, no Pix com desconto à vista, em dinheiro ou no cartão em
        até {MAX_INSTALLMENTS}x, com frete grátis em até 7 dias úteis na área atendida.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link to="/" search={{ all: true, page: 1 }} hash="catalogo" className="mobi-primary">
          Explorar móveis no catálogo
        </Link>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-deep-green px-5 py-2.5 text-sm font-semibold text-deep-green transition-colors hover:bg-deep-green hover:text-sand"
        >
          Tirar dúvida no WhatsApp ({WHATSAPP_DISPLAY})
        </a>
      </div>

      <section className="mt-9" aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="text-2xl text-deep-green">
          Como funciona passo a passo
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <article key={step.title} className="rounded-xl border border-deep-green/15 p-5">
              <h3 className="text-base font-semibold text-deep-green">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-light">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-9 max-w-3xl" aria-labelledby="delivery-rules">
        <h2 id="delivery-rules" className="text-2xl text-deep-green">
          Área de entrega com frete grátis (raio de 30 km)
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-text-light">
          Entregamos com frete grátis em até 7 dias úteis a partir de Nova Iguaçu para: Nova Iguaçu,
          Mesquita, Nilópolis, São João de Meriti, Duque de Caxias, Queimados, Japeri, Paracambi,
          Seropédica e bairros próximos das Zonas Norte e Oeste do Rio de Janeiro.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-text-light">
          Operação 100% online, sem loja física aberta ao público. Não realizamos entregas em
          Belford Roxo nem em áreas com barricadas ou restrição de acesso. Veja mais detalhes em{" "}
          <Link to="/ajuda/$slug" params={{ slug: "pagamento" }} className="underline">
            Formas de pagamento
          </Link>{" "}
          e{" "}
          <Link to="/ajuda/$slug" params={{ slug: "trocas-e-garantia" }} className="underline">
            Trocas e garantia (7 dias / 90 dias)
          </Link>
          .
        </p>
      </section>

      <section className="mt-9 max-w-3xl space-y-4" aria-labelledby="pay-delivery-faq">
        <h2 id="pay-delivery-faq" className="text-2xl text-deep-green">
          Perguntas frequentes sobre pagamento na entrega
        </h2>
        {deliveryPaymentFaqs.map((faq) => (
          <div key={faq.question} className="rounded-xl border border-deep-green/12 p-4">
            <h3 className="text-base font-semibold text-deep-green">{faq.question}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-text-light">{faq.answer}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
