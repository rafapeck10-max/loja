import { Link } from "@tanstack/react-router";
import { CepCoverageChecker } from "@/components/CepCoverageChecker";
import { MAX_INSTALLMENTS, WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/constants";
import { trackWhatsAppClick } from "@/lib/analytics";
import { REGIONAL_STORE_PAGES, type RegionalStorePage } from "@/lib/regional-pages";

const DEPARTMENTS = [
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
] as const;

export function RegionalStoreLanding({ page }: { page: RegionalStorePage }) {
  const otherRegions = REGIONAL_STORE_PAGES.filter((item) => item.slug !== page.slug);

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
        <span>Móveis em {page.cityName}</span>
      </nav>
      <h1 className="text-3xl text-deep-green sm:text-4xl">{page.h1}</h1>
      <p className="mt-4 max-w-3xl text-base leading-relaxed text-text-light">
        {page.intro}{" "}
        <strong className="font-semibold text-deep-green">Pagamento somente na entrega</strong> (Pix
        com desconto à vista, dinheiro ou cartão em até {MAX_INSTALLMENTS}x) e{" "}
        <strong className="font-semibold text-deep-green">frete grátis em até 7 dias úteis</strong>{" "}
        nas áreas elegíveis.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link to="/" search={{ all: true, page: 1 }} hash="catalogo" className="mobi-primary">
          Ver catálogo completo
        </Link>
        <a
          href={`${WHATSAPP_URL}?text=${encodeURIComponent(`Olá! Estou em ${page.cityName} e gostaria de consultar móveis com pagamento na entrega.`)}`}
          target="_blank"
          rel="noreferrer"
          onClick={() => trackWhatsAppClick({ source: page.slug })}
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
          Categorias mais buscadas em {page.cityName}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEPARTMENTS.map((department) => (
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
          Cobertura em {page.cityName} e confirmação por CEP
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-text-light">
          Atendemos bairros como {page.neighborhoods}. {page.cepRangeSummary}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-text-light">
          <strong className="font-semibold text-deep-green">Exceções operacionais:</strong> não
          realizamos entregas em Belford Roxo nem em ruas com barricadas, bloqueios ou restrição de
          acesso. Consulte seu CEP abaixo ou veja{" "}
          <Link to="/ajuda/$slug" params={{ slug: "entrega-e-montagem" }} className="underline">
            Entrega e montagem
          </Link>
          .
        </p>
        <div className="mt-4 max-w-xl">
          <CepCoverageChecker />
        </div>
      </section>

      <section className="mt-9 max-w-3xl space-y-4" aria-labelledby="local-faq">
        <h2 id="local-faq" className="text-2xl text-deep-green">
          Dúvidas frequentes em {page.cityName}
        </h2>
        {page.faqs.map((faq) => (
          <div key={faq.question} className="rounded-xl border border-deep-green/12 p-4">
            <h3 className="text-base font-semibold text-deep-green">{faq.question}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-text-light">{faq.answer}</p>
          </div>
        ))}
      </section>

      <section className="mt-9 max-w-3xl" aria-labelledby="local-other-cities">
        <h2 id="local-other-cities" className="text-xl text-deep-green">
          Outras localidades atendidas no raio de 30 km
        </h2>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <Link
            to="/moveis-nova-iguacu"
            className="inline-flex min-h-11 items-center text-deep-green underline underline-offset-4"
          >
            Nova Iguaçu
          </Link>
          {otherRegions.map((item) => (
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
    </div>
  );
}
