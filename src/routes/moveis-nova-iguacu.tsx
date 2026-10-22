import { createFileRoute, Link } from "@tanstack/react-router";
import { WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/constants";
import { breadcrumbs, jsonLd, seoHead } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-metadata";

export const Route = createFileRoute("/moveis-nova-iguacu")({
  head: () => ({
    ...seoHead(
      "Móveis em Nova Iguaçu | Sofás, guarda-roupas e mais | Mobi",
      "Encontre móveis para sua casa em Nova Iguaçu: sofás, guarda-roupas, colchões e cozinhas. Compare modelos e medidas e consulte a Mobi pelo WhatsApp.",
      `${SITE_URL}/moveis-nova-iguacu`,
    ),
    scripts: [
      jsonLd(
        breadcrumbs([
          { name: "Início", url: `${SITE_URL}/` },
          { name: "Móveis em Nova Iguaçu", url: `${SITE_URL}/moveis-nova-iguacu` },
        ]),
      ),
    ],
  }),
  component: LocalPage,
});

const departments = [
  {
    slug: "sofas",
    name: "Sofás",
    text: "Compare modelos retráteis, reclináveis, de canto e sofás-cama. Confira a largura e a profundidade do móvel aberto e fechado.",
  },
  {
    slug: "roupeiros",
    name: "Guarda-roupas",
    text: "Confira portas, gavetas, divisão interna e medidas para organizar roupas e acessórios no seu quarto.",
  },
  {
    slug: "colchoes-e-bases",
    name: "Colchões e bases",
    text: "Compare tamanhos e composição e confira se as medidas do colchão combinam com a base da cama.",
  },
  {
    slug: "cozinha",
    name: "Móveis para cozinha",
    text: "Veja cozinhas, armários e balcões. Compare a composição de cada conjunto e o espaço disponível no ambiente.",
  },
  {
    slug: "paineis",
    name: "Painéis e racks",
    text: "Confira a largura do móvel, o espaço da TV e os compartimentos para aparelhos e objetos.",
  },
  {
    slug: "salas-de-jantar",
    name: "Mesas e cadeiras",
    text: "Compare o número de lugares e as medidas da mesa, deixando espaço para circular ao redor das cadeiras.",
  },
];

function LocalPage() {
  return (
    <main className="mobi-wrap py-8 sm:py-12">
      <nav aria-label="Caminho da página" className="mb-6 text-sm text-text-light">
        <Link to="/" search={{}} className="underline">
          Início
        </Link>{" "}
        / Móveis em Nova Iguaçu
      </nav>
      <h1 className="text-3xl text-deep-green sm:text-4xl">
        Móveis em Nova Iguaçu para cada ambiente da casa
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-relaxed text-text-light">
        A Mobi atende Nova Iguaçu e regiões próximas da Baixada Fluminense. Explore o catálogo de
        sofás, guarda-roupas, colchões e móveis para sala, cozinha e quarto. Veja as características
        de cada modelo e fale com a equipe pelo WhatsApp para consultar o atendimento no seu
        endereço.
      </p>
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        className="mobi-primary mt-6 inline-flex"
      >
        Falar com a Mobi: {WHATSAPP_DISPLAY}
      </a>
      <section className="mt-10" aria-labelledby="local-categories">
        <h2 id="local-categories" className="text-2xl text-deep-green">
          Encontre o móvel para seu ambiente
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              <p className="mt-3 text-sm leading-relaxed text-text-light">{department.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="mt-10 max-w-3xl" aria-labelledby="local-checklist">
        <h2 id="local-checklist" className="text-2xl text-deep-green">
          Antes de escolher seu móvel
        </h2>
        <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-relaxed text-text-light">
          <li>
            Meça o local onde o móvel vai ficar e os espaços de abertura de portas, gavetas e partes
            retráteis.
          </li>
          <li>
            Confira também portas, corredores, escadas e elevadores do imóvel para avaliar a
            passagem das peças.
          </li>
          <li>
            Compare as medidas, materiais, cores e peças incluídas na página do produto. Tire
            dúvidas com a Mobi antes de concluir o pedido.
          </li>
          <li>
            Envie o link do produto, seu bairro e CEP pelo WhatsApp para consultar disponibilidade,
            frete e data de entrega.
          </li>
        </ul>
      </section>
      <section className="mt-10 max-w-3xl space-y-5" aria-labelledby="local-contact">
        <h2 id="local-contact" className="text-2xl text-deep-green">
          Atendimento para Nova Iguaçu
        </h2>
        <div>
          <h3 className="text-lg text-deep-green">Como consultar a entrega no meu bairro?</h3>
          <p className="mt-2 text-sm leading-relaxed text-text-light">
            Informe o bairro, o CEP e o produto desejado pelo WhatsApp. A equipe confirma as
            condições para o seu endereço; frete e data são combinados durante o atendimento.
          </p>
        </div>
        <div>
          <h3 className="text-lg text-deep-green">Como encontrar um modelo no catálogo?</h3>
          <p className="mt-2 text-sm leading-relaxed text-text-light">
            Use a busca por nome, material, cor, características ou medidas. Nas categorias, compare
            os modelos e abra a página do produto para conferir os detalhes.
          </p>
        </div>
        <div>
          <h3 className="text-lg text-deep-green">Qual é o horário de atendimento?</h3>
          <p className="mt-2 text-sm leading-relaxed text-text-light">
            Segunda a sexta, das 08h às 18h; sábado, das 09h às 14h. Fale pelo WhatsApp{" "}
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="underline">
              {WHATSAPP_DISPLAY}
            </a>
            .
          </p>
        </div>
        <Link
          to="/"
          search={{ all: true, page: 1 }}
          hash="catalogo"
          className="mobi-primary inline-flex"
        >
          Explorar todo o catálogo
        </Link>
      </section>
    </main>
  );
}
