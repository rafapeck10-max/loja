import { breadcrumbs, jsonLd, seoHead } from "./seo.ts";
import { SITE_URL } from "./site-metadata.ts";

export interface RegionalFaq {
  question: string;
  answer: string;
}

export interface RegionalStorePage {
  slug:
    | "moveis-duque-de-caxias"
    | "moveis-nilopolis"
    | "moveis-mesquita"
    | "moveis-queimados"
    | "moveis-sao-joao-de-meriti"
    | "moveis-zona-oeste-rj";
  path: `/${RegionalStorePage["slug"]}`;
  cityName: string;
  title: string;
  metaDescription: string;
  h1: string;
  intro: string;
  neighborhoods: string;
  cepRangeSummary: string;
  faqs: RegionalFaq[];
}

export const REGIONAL_STORE_PAGES: readonly RegionalStorePage[] = [
  {
    slug: "moveis-duque-de-caxias",
    path: "/moveis-duque-de-caxias",
    cityName: "Duque de Caxias",
    title: "Móveis em Duque de Caxias com Pagamento na Entrega e Frete Grátis | Mobi",
    metaDescription:
      "Compre móveis em Duque de Caxias sem pagar antes: sofás, guarda-roupas, colchões e cozinhas com pagamento na entrega e frete grátis em até 7 dias úteis.",
    h1: "Móveis em Duque de Caxias com pagamento na entrega e frete grátis",
    intro:
      "A Mobi é uma loja online com atendimento pelo WhatsApp que entrega em Duque de Caxias e regiões próximas (raio de até 30 km de Nova Iguaçu), sem loja física para visitação. Você escolhe pelo site e paga somente ao receber em casa.",
    neighborhoods:
      "Centro, Jardim 25 de Agosto, Vila São Luís, Parque Duque, Centenário, Gramacho, Parque Lafaiete e Santa Cruz da Serra",
    cepRangeSummary: "Faixa principal atendida: CEP 25000 a 25499.",
    faqs: [
      {
        question: "A Mobi entrega móveis em Duque de Caxias com frete grátis?",
        answer:
          "Sim. Endereços elegíveis em Duque de Caxias (faixa CEP 25000 a 25499) têm frete grátis e prazo estimado de até 7 dias úteis, sujeito à confirmação de acesso livre na rua.",
      },
      {
        question: "Posso pagar os móveis só quando chegar em Duque de Caxias?",
        answer:
          "Sim. Não cobramos antecipado: você paga na entrega via Pix com desconto à vista, dinheiro ou cartão em até 10x.",
      },
      {
        question: "A Mobi tem loja física em Duque de Caxias?",
        answer:
          "Não. A Mobi atende exclusivamente online, sem showroom ou ponto de retirada presencial, reduzindo custos para manter preços competitivos.",
      },
      {
        question: "Como saber se minha rua em Duque de Caxias é atendida?",
        answer:
          "Digite seu CEP no verificador abaixo antes de concluir o pedido. Não entregamos em Belford Roxo nem em ruas com barricadas ou restrição de acesso.",
      },
    ],
  },
  {
    slug: "moveis-nilopolis",
    path: "/moveis-nilopolis",
    cityName: "Nilópolis",
    title: "Móveis em Nilópolis com Pagamento na Entrega e Frete Grátis | Mobi",
    metaDescription:
      "Móveis com entrega gratuita em Nilópolis: sofás retráteis, guarda-roupas, colchões e cozinhas completas pagando somente na entrega, em até 10x.",
    h1: "Móveis em Nilópolis com pagamento na entrega e frete grátis",
    intro:
      "A Mobi entrega móveis direto na sua casa em Nilópolis dentro do raio de até 30 km a partir de Nova Iguaçu, com atendimento 100% online pelo WhatsApp, sem loja física para visitação e sem pagamento adiantado.",
    neighborhoods: "Centro, Olinda, Cabral, Nova Cidade, Manoel Reis e Paiol de Pólvora",
    cepRangeSummary: "Faixa principal atendida: CEP 26500 a 26549.",
    faqs: [
      {
        question: "Quanto custa o frete para entregar móveis em Nilópolis?",
        answer:
          "O frete é grátis para endereços elegíveis em Nilópolis (CEP 26500 a 26549), com prazo estimado de até 7 dias úteis.",
      },
      {
        question: "Quais formas de pagamento a Mobi aceita na entrega em Nilópolis?",
        answer:
          "Você escolhe pagar somente no recebimento: Pix com desconto à vista, dinheiro ou cartão em até 10x.",
      },
      {
        question: "Onde fica a loja física da Mobi em Nilópolis?",
        answer:
          "A Mobi é uma loja online, sem endereço físico para visitação ou retirada. Todo o atendimento e o agendamento de entrega acontecem pelo site e WhatsApp.",
      },
      {
        question: "Há alguma restrição de entrega na região?",
        answer:
          "Consulte seu CEP abaixo. Não realizamos entregas em Belford Roxo nem em vias com barricadas ou restrição de acesso.",
      },
    ],
  },
  {
    slug: "moveis-mesquita",
    path: "/moveis-mesquita",
    cityName: "Mesquita",
    title: "Móveis em Mesquita com Pagamento na Entrega e Frete Grátis | Mobi",
    metaDescription:
      "Compre sofás, guarda-roupas, mesas e cozinhas em Mesquita com frete grátis em até 7 dias úteis e pagamento somente na entrega.",
    h1: "Móveis em Mesquita com pagamento na entrega e frete grátis",
    intro:
      "Atendemos toda a região elegível de Mesquita com frete grátis a partir da nossa operação em Nova Iguaçu (raio de até 30 km). Pedido online, entrega em casa e pagamento somente na entrega.",
    neighborhoods: "Centro, Edson Passos, Juscelino, Cosmorama, Banco de Areia e Rocha Sobrinho",
    cepRangeSummary: "Faixa principal atendida: CEP 26550 a 26599.",
    faqs: [
      {
        question: "Qual o prazo de entrega da Mobi em Mesquita?",
        answer:
          "O prazo estimado é de até 7 dias úteis com frete grátis para os CEPs atendidos de Mesquita (26550 a 26599), sempre confirmado pela equipe no WhatsApp.",
      },
      {
        question: "Preciso dar sinal para comprar um sofá ou guarda-roupa em Mesquita?",
        answer:
          "Não. Todo o catálogo da Mobi funciona com pagamento somente na entrega: Pix com desconto, dinheiro ou cartão em até 10x.",
      },
      {
        question: "A Mobi possui loja aberta ao público em Mesquita?",
        answer:
          "Não. A operação é 100% online, com entregas diretas no endereço informado pelo cliente.",
      },
      {
        question: "Os móveis vão montados?",
        answer:
          "Os móveis seguem embalados de fábrica para preservação no transporte e devem ser montados por profissional qualificado seguindo o manual. Se precisar, indicamos montador parceiro.",
      },
    ],
  },
  {
    slug: "moveis-queimados",
    path: "/moveis-queimados",
    cityName: "Queimados",
    title: "Móveis em Queimados com Pagamento na Entrega e Frete Grátis | Mobi",
    metaDescription:
      "Loja online de móveis para Queimados com frete grátis em até 7 dias úteis, pagamento na entrega em até 10x e catálogo completo para sala, quarto e cozinha.",
    h1: "Móveis em Queimados com pagamento na entrega e frete grátis",
    intro:
      "Queimados faz parte da área de cobertura gratuita da Mobi dentro do raio de até 30 km a partir de Nova Iguaçu. Escolha seus móveis online, confirme seu CEP e pague somente ao receber.",
    neighborhoods: "Centro, Fanchem, Belmonte, Vila Camarim, São Roque e Jardim Alzira",
    cepRangeSummary: "Faixa principal atendida: CEP 26300 a 26399.",
    faqs: [
      {
        question: "A Mobi cobra frete para Queimados?",
        answer:
          "Não para endereços elegíveis dentro da faixa CEP 26300 a 26399, onde a entrega é gratuita em até 7 dias úteis e sujeita à confirmação de acesso livre na rua.",
      },
      {
        question: "Como funciona o pagamento na entrega em Queimados?",
        answer:
          "Você faz o pedido pelo site ou WhatsApp sem cobrança antecipada e paga somente no momento da entrega em Pix, dinheiro ou cartão em até 10x.",
      },
      {
        question: "Existe showroom ou depósito aberto em Queimados?",
        answer:
          "Não. A Mobi trabalha exclusivamente como loja online, sem endereço físico para visitação ou retirada.",
      },
      {
        question: "Posso confirmar o prazo do meu bairro em Queimados antes de comprar?",
        answer:
          "Sim. Use o verificador de CEP nesta página ou nos produtos para validar cobertura na hora.",
      },
    ],
  },
  {
    slug: "moveis-sao-joao-de-meriti",
    path: "/moveis-sao-joao-de-meriti",
    cityName: "São João de Meriti",
    title: "Móveis em São João de Meriti com Pagamento na Entrega e Frete Grátis | Mobi",
    metaDescription:
      "Compre móveis em São João de Meriti sem pagar antes: sofás, guarda-roupas, camas e cozinhas com entrega grátis em até 7 dias úteis e pagamento na entrega.",
    h1: "Móveis em São João de Meriti com pagamento na entrega e frete grátis",
    intro:
      "A Mobi atende São João de Meriti pelo atendimento online, com entrega gratuita em endereços elegíveis dentro do raio de até 30 km de Nova Iguaçu e pagamento somente no ato da entrega.",
    neighborhoods:
      "Centro, Vilar dos Teles, Coelho da Rocha, São Mateus, Jardim Meriti, Parque Araruama e Éden",
    cepRangeSummary: "Faixa principal atendida: CEP 25500 a 25599.",
    faqs: [
      {
        question: "Entrega grátis em São João de Meriti inclui Vilar dos Teles e Coelho da Rocha?",
        answer:
          "Sim. A faixa CEP 25500 a 25599 está coberta pelo frete grátis em até 7 dias úteis, desde que a via tenha acesso livre para entrega.",
      },
      {
        question: "Belford Roxo, que fica ao lado, também é atendido?",
        answer:
          "Não. Por critério operacional, não realizamos entregas em Belford Roxo nem em áreas com barricadas ou restrição de acesso.",
      },
      {
        question: "Consigo parcelar no cartão ao receber em São João de Meriti?",
        answer:
          "Sim. Aceitamos cartão na entrega em até 10x, além de Pix com desconto à vista e dinheiro.",
      },
      {
        question: "A Mobi tem loja física em São João de Meriti?",
        answer:
          "Não. A Mobi é uma loja 100% online, sem atendimento presencial ou retirada em loja.",
      },
    ],
  },
  {
    slug: "moveis-zona-oeste-rj",
    path: "/moveis-zona-oeste-rj",
    cityName: "Zona Oeste e bairros próximos do Rio",
    title:
      "Móveis na Zona Oeste do Rio (Campo Grande e Jacarepaguá) com Pagamento na Entrega | Mobi",
    metaDescription:
      "Móveis com entrega gratuita para Campo Grande, Jacarepaguá e bairros próximos da Zona Norte/Oeste do Rio: pagamento somente na entrega em até 10x.",
    h1: "Móveis na Zona Oeste do Rio com pagamento na entrega e frete grátis",
    intro:
      "Dentro do raio de até 30 km de Nova Iguaçu, a Mobi atende regiões de Campo Grande, Jacarepaguá e bairros próximos das Zonas Oeste e Norte do Rio de Janeiro com frete grátis e pagamento somente no recebimento.",
    neighborhoods:
      "Campo Grande, Taquara, Freguesia, Pechincha, Anil, Tanque e faixas próximas das Zonas Norte e Oeste",
    cepRangeSummary:
      "Faixas cobertas no município do Rio: CEP 23000–23099 (Campo Grande), 22710–22785 (Jacarepaguá) e 20010–21949 (Zona Norte / proximidades).",
    faqs: [
      {
        question: "Quais bairros do Rio de Janeiro têm frete grátis na Mobi?",
        answer:
          "As faixas atendidas automaticamente no site cobrem Campo Grande (CEP 23000 a 23099), parte de Jacarepaguá (22710 a 22785) e bairros próximos da Zona Norte/Centro (20010 a 21949). Confirme seu CEP abaixo.",
      },
      {
        question: "Qual o prazo e como funciona o pagamento na entrega no Rio?",
        answer:
          "O prazo estimado é de até 7 dias úteis após confirmação da rota, com pagamento somente na entrega por Pix com desconto à vista, dinheiro ou cartão em até 10x.",
      },
      {
        question: "A Mobi atende ruas com restrição de acesso na Zona Oeste ou Zona Norte?",
        answer:
          "Não realizamos entregas em vias com barricadas, bloqueios ou restrição de acesso para a equipe, além de não atendermos Belford Roxo.",
      },
      {
        question: "A Mobi tem loja física no Rio de Janeiro?",
        answer:
          "Não. A Mobi opera exclusivamente online, atendendo via site e WhatsApp sem showroom físico.",
      },
    ],
  },
] as const;

export const REGIONAL_PAGE_PATHS = REGIONAL_STORE_PAGES.map((page) => page.path);

export function getRegionalPage(slug: RegionalStorePage["slug"]): RegionalStorePage {
  const found = REGIONAL_STORE_PAGES.find((page) => page.slug === slug);
  if (!found) throw new Error(`Página regional desconhecida: ${slug}`);
  return found;
}

export function buildRegionalPageHead(page: RegionalStorePage) {
  return {
    ...seoHead(page.title, page.metaDescription, `${SITE_URL}${page.path}`),
    scripts: [
      jsonLd(
        breadcrumbs([
          { name: "Início", url: `${SITE_URL}/` },
          { name: `Móveis em ${page.cityName}`, url: `${SITE_URL}${page.path}` },
        ]),
      ),
      jsonLd({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: page.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      }),
    ],
  };
}
