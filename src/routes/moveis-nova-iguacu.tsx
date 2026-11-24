import { createFileRoute, Link } from "@tanstack/react-router";
import { CepCoverageChecker } from "@/components/CepCoverageChecker";
import { MAX_INSTALLMENTS, WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/constants";
import { REGIONAL_STORE_PAGES } from "@/lib/regional-pages";
import { breadcrumbs, jsonLd, seoHead } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-metadata";

const localFaqs = [
  {
    question: "A Mobi tem loja física em Nova Iguaçu para visitação?",
    answer:
      "Não. A Mobi é uma loja online com atendimento direto pelo WhatsApp, sem endereço físico ou showroom aberto ao público.",
  },
  {
    question: "O pagamento é feito mesmo só na entrega?",
    answer: `Sim. Você registra o pedido no site sem cobrança antecipada e paga somente no recebimento: Pix com desconto à vista, dinheiro na entrega ou cartão de crédito em até ${MAX_INSTALLMENTS}x.`,
  },
  {
    question: "Quais regiões têm entrega com frete grátis?",
    answer:
      "Entregamos com frete grátis em até 7 dias úteis em localidades num raio de até 30 km a partir de Nova Iguaçu (Nova Iguaçu, Mesquita, Nilópolis, São João de Meriti, Duque de Caxias, Queimados, Japeri, Paracambi, Seropédica e bairros próximos das Zonas Norte e Oeste do Rio de Janeiro). Não realizamos entregas em Belford Roxo nem em áreas com barricadas ou restrição de acesso.",
  },
  {
    question: "Como consultar prazo e elegibilidade do meu bairro?",
    answer:
      "Conclua seu pedido no carrinho ou informe produto, bairro e CEP pelo WhatsApp para nossa equipe confirmar a disponibilidade e agendar a entrega.",
  },
];

export const Route = createFileRoute("/moveis-nova-iguacu")({
  head: () => ({
    ...seoHead(
      "Móveis em Nova Iguaçu com Pagamento na Entrega e Frete Grátis | Mobi",
      "Compre móveis em Nova Iguaçu sem pagar adiantado: sofás, guarda-roupas, colchões e cozinhas com pagamento na entrega e frete grátis em até 7 dias úteis.",
      `${SITE_URL}/moveis-nova-iguacu`,
    ),
    scripts: [
      jsonLd(
        breadcrumbs([
          { name: "Início", url: `${SITE_URL}/` },
          { name: "Móveis em Nova Iguaçu", url: `${SITE_URL}/moveis-nova-iguacu` },
        ]),
      ),
      jsonLd({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: localFaqs.map((faq) => ({
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
  component: LocalPage,
});

const departments = [
  {
    slug: "sofas",
    name: "Sofás",
    text: "Compare modelos retráteis, reclináveis, de canto e sofás-cama com largura e profundidade abertas e fechadas.",
  },
  {
    slug: "roupeiros",
    name: "Guarda-roupas",
    text: "Confira portas, gavetas, divisão interna e medidas para organizar o quarto com aproveitamento real.",
  },
  {
    slug: "colchoes-e-bases",
    name: "Colchões e bases",
    text: "Compare tamanhos de solteiro, casal e queen e confira a compatibilidade com sua base ou baú.",
  },
  {
    slug: "cozinha",
    name: "Móveis para cozinha",
    text: "Veja cozinhas completas, kits, armários e balcões em MDF e MDP para medir antes de receber em casa.",
  },
  {
    slug: "paineis",
    name: "Painéis e racks",
    text: "Confira a largura da parede, suporte para TV e compartimentos para aparelhos e decoração.",
  },
  {
    slug: "salas-de-jantar",
    name: "Mesas e cadeiras",
    text: "Compare quantidade de lugares, tampo e medidas da mesa respeitando o espaço de circulação.",
  },
];

function LocalPage() {
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
        <span>Móveis em Nova Iguaçu</span>
      </nav>
      <h1 className="text-3xl text-deep-green sm:text-4xl">
        Móveis em Nova Iguaçu com pagamento na entrega e frete grátis
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-relaxed text-text-light">
        A Mobi é uma loja online que atende Nova Iguaçu e regiões próximas em um raio de até 30 km,
        sem loja física para visitação. Você escolhe sofás, guarda-roupas, colchões e móveis para
        sala, cozinha e quarto direto pelo site, com{" "}
        <strong className="font-semibold text-deep-green">pagamento somente na entrega</strong> (Pix
        com desconto, dinheiro ou cartão em até {MAX_INSTALLMENTS}x) e{" "}
        <strong className="font-semibold text-deep-green">frete grátis em até 7 dias úteis</strong>{" "}
        nas áreas elegíveis.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link to="/" search={{ all: true, page: 1 }} hash="catalogo" className="mobi-primary">
          Ver catálogo completo
        </Link>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-deep-green px-5 py-2.5 text-sm font-semibold text-deep-green transition-colors hover:bg-deep-green hover:text-sand"
        >
          WhatsApp: {WHATSAPP_DISPLAY}
        </a>
        <Link
          to="/moveis-pagamento-na-entrega"
          className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-deep-green underline underline-offset-4"
        >
          Entenda o pagamento na entrega
        </Link>
      </div>

      <section className="mt-9" aria-labelledby="local-categories">
        <h2 id="local-categories" className="text-2xl text-deep-green">
          Categorias mais buscadas em Nova Iguaçu e região
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((department) => (
            <article key={department.slug} className="rounded-xl border border-deep-green/15 p-5">
              <h3 className="text-lg text-deep-green">
                <Link
                  to="/categoria/$slug"
                  params={{ slug: department.slug }}
                  search={{ page: 1 }}
                  className="underline underline-offset-4"
                >
                  {department.name}
                </Link>
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-text-light">{department.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-9 max-w-3xl" aria-labelledby="local-coverage">
        <h2 id="local-coverage" className="text-2xl text-deep-green">
          Cidades e regiões atendidas com frete grátis
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-text-light">
          Atendemos com frete grátis em até 7 dias úteis endereços dentro do raio operacional de 30
          km a partir de Nova Iguaçu: Nova Iguaçu, Mesquita, Nilópolis, São João de Meriti, Duque de
          Caxias, Queimados, Japeri, Paracambi, Seropédica e bairros próximos das Zonas Norte e
          Oeste do Rio de Janeiro.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-text-light">
          <strong className="font-semibold text-deep-green">Exceções:</strong> não entregamos em
          Belford Roxo nem em ruas com barricadas, bloqueios ou restrição de acesso e segurança para
          a equipe de entrega. Confira todos os detalhes em{" "}
          <Link to="/ajuda/$slug" params={{ slug: "entrega-e-montagem" }} className="underline">
            Entrega e montagem
          </Link>
          .
        </p>
        <div className="mt-4 max-w-xl">
          <CepCoverageChecker />
        </div>
      </section>

      <section className="mt-9 max-w-3xl" aria-labelledby="local-other-cities">
        <h2 id="local-other-cities" className="text-xl text-deep-green">
          Outras cidades atendidas com frete grátis
        </h2>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {REGIONAL_STORE_PAGES.map((item) => (
            <Link
              key={item.slug}
              to={item.path}
              className="inline-flex min-h-11 items-center text-deep-green underline underline-offset-4"
            >
              {item.cityName}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-9 max-w-3xl" aria-labelledby="local-checklist">
        <h2 id="local-checklist" className="text-2xl text-deep-green">
          Antes de fechar seu pedido
        </h2>
        <ul className="mt-3 list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-text-light">
          <li>Meça o espaço do ambiente e a abertura de portas, gavetas e assentos retráteis.</li>
          <li>
            Confira passagem por portões, corredores, escadas e elevadores até o cômodo final.
          </li>
          <li>
            Os móveis seguem embalados de fábrica para montagem conforme o manual por profissional
            qualificado.
          </li>
        </ul>
      </section>

      <section className="mt-9 max-w-3xl space-y-4" aria-labelledby="local-faq">
        <h2 id="local-faq" className="text-2xl text-deep-green">
          Dúvidas frequentes
        </h2>
        {localFaqs.map((faq) => (
          <div key={faq.question} className="rounded-xl border border-deep-green/12 p-4">
            <h3 className="text-base font-semibold text-deep-green">{faq.question}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-text-light">{faq.answer}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
