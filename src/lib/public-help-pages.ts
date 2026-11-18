import { MAX_INSTALLMENTS, WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from "./constants.ts";
import type { ContentPage } from "./operational-config.ts";

export const PUBLIC_HELP_PAGES: readonly ContentPage[] = [
  {
    id: "comprar",
    title: "Como comprar na Mobi",
    slug: "como-comprar",
    body: "A Mobi atende online a partir de Nova Iguaçu, sem loja física aberta ao público.\n\nEscolha os móveis no catálogo, confira fotos, medidas e valores (à vista no Pix/dinheiro ou no cartão) e adicione ao carrinho. No checkout do site você informa seu endereço de entrega, seleciona a forma de pagamento na entrega e gera seu protocolo de pedido.\n\nO frete é grátis nas localidades atendidas dentro de um raio de até 30 km a partir do bairro Botafogo, em Nova Iguaçu (exceto Belford Roxo e áreas com barricadas ou restrição de acesso). Nossa equipe confirma disponibilidade, elegibilidade do endereço e janela de entrega pelo WhatsApp.",
    status: "review",
    reviewedAt: "2026-11-18T09:00:00Z",
    faqs: [
      {
        question: "Como funciona a finalização do pedido?",
        answer:
          "Você registra o pedido diretamente no carrinho da loja e recebe um protocolo para acompanhamento. A cobrança não é feita antecipadamente no site: o pagamento acontece somente na entrega.",
      },
      {
        question: "A Mobi tem loja física para visitar?",
        answer:
          "Não. A operação é 100% online para manter preços competitivos com frete grátis na região atendida (até 30 km de Botafogo, Nova Iguaçu, exceto Belford Roxo e áreas com restrição de acesso).",
      },
    ],
    links: [
      { label: "Explorar todos os móveis", href: "/?all=true#catalogo" },
      { label: "Falar no WhatsApp", href: `https://wa.me/${WHATSAPP_NUMBER}` },
    ],
  },
  {
    id: "entrega",
    title: "Entrega e montagem",
    slug: "entrega-e-montagem",
    body: "Entregamos com frete grátis nas localidades atendidas dentro de um raio de até 30 km a partir do bairro Botafogo, em Nova Iguaçu – RJ: Nova Iguaçu, Mesquita, Nilópolis, São João de Meriti, Duque de Caxias, Queimados, Japeri, Paracambi, Seropédica e bairros próximos das Zonas Norte e Oeste do Rio de Janeiro (como Anchieta, Pavuna, Irajá, Madureira, Méier, Penha, Ilha do Governador, Realengo, Bangu, Campo Grande e Jacarepaguá).\n\nExceções de cobertura: não realizamos entregas em Belford Roxo nem em endereços situados em áreas de risco, vias com barricadas/bloqueios ou locais com restrição de acesso e segurança para a equipe de entrega. A elegibilidade do logradouro e a janela de entrega são confirmadas pelo WhatsApp após o registro do pedido.\n\nOs móveis seguem embalados de fábrica para montagem por profissional qualificado conforme o manual do fabricante. Caso precise de indicação de montador na região, solicite orientação pelo WhatsApp antes ou após a entrega.",
    status: "review",
    reviewedAt: "2026-11-18T09:00:00Z",
    faqs: [
      {
        question: "Como confirmo se meu CEP tem entrega com frete grátis e qual o prazo?",
        answer:
          "Registre seu pedido no site ou informe seu endereço completo, bairro e CEP pelo WhatsApp para confirmarmos a cobertura dentro do raio de 30 km de Botafogo (Nova Iguaçu), sem restrições de acesso, e informarmos a janela de entrega.",
      },
      {
        question: "A montagem está incluída no preço?",
        answer:
          "Não presuma montagem inclusa. Móveis entregues em caixa devem ser montados por montador qualificado seguindo o manual do fabricante; podemos indicar profissionais na região sob consulta.",
      },
    ],
    links: [
      {
        label: "Consultar entrega pelo WhatsApp",
        href: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá, Mobi! Quero confirmar prazo e frete de entrega.")}`,
      },
    ],
  },
  {
    id: "pagamento",
    title: "Pagamento",
    slug: "pagamento",
    body: `A Mobi trabalha com pagamento somente na entrega: Pix com valor à vista reduzido, dinheiro na entrega ou cartão de crédito em até ${MAX_INSTALLMENTS}x (consulte o valor da parcela e o total no cartão na página de cada produto).\n\nNenhuma senha ou cobrança antecipada de cartão é solicitada pela loja virtual antes do recebimento.`,
    status: "review",
    reviewedAt: "2026-11-18T09:00:00Z",
    faqs: [
      {
        question: "Quais formas de pagamento estão disponíveis?",
        answer: `Pix à vista, dinheiro na entrega e cartão de crédito na entrega em até ${MAX_INSTALLMENTS}x.`,
      },
      {
        question: "Por que o valor no cartão difere do Pix?",
        answer:
          "O preço em destaque em verde é o valor com desconto para pagamento à vista no Pix ou dinheiro. Na mesma página informamos o valor exato da parcela e o total no cartão.",
      },
    ],
    links: [{ label: "Explorar catálogo", href: "/?all=true#catalogo" }],
  },
  {
    id: "trocas-e-garantia",
    title: "Trocas, devolução e garantia",
    slug: "trocas-e-garantia",
    body: "Conforme o artigo 49 do Código de Defesa do Consumidor, pedidos realizados online contam com prazo de 7 dias corridos após o recebimento para desistência ou troca em caso de compra à distância.\n\nTodos os móveis possuem garantia legal de 90 dias para defeitos de fabricação (CDC, art. 26). Danos decorrentes exclusivamente de montagem incorreta ou fora das instruções do fabricante podem não ser cobertos pela garantia.\n\nPara solicitar devolução, troca ou assistência, entre em contato pelo WhatsApp informando o código do pedido.",
    status: "review",
    reviewedAt: "2026-11-18T09:00:00Z",
    faqs: [
      {
        question: "Qual o prazo de devolução por arrependimento?",
        answer: "7 dias corridos contados a partir da entrega, mantendo a integridade do produto.",
      },
      {
        question: "Como acionar a garantia de 90 dias?",
        answer: `Envie fotos do ocorrido e o código do pedido pelo WhatsApp ${WHATSAPP_DISPLAY} para nossa equipe orientar a solução junto ao fabricante.`,
      },
    ],
    links: [
      {
        label: "Solicitar atendimento pelo WhatsApp",
        href: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá, Mobi! Preciso de atendimento sobre troca, devolução ou garantia.")}`,
      },
    ],
  },
  {
    id: "contato",
    title: "Fale com a Mobi",
    slug: "contato",
    body: `Nosso atendimento ao cliente é 100% online pelo WhatsApp ${WHATSAPP_DISPLAY}, de segunda a sexta (08h às 18h) e sábado (09h às 14h).\n\nNão possuímos loja física ou showroom para visitação.`,
    status: "review",
    reviewedAt: "2026-11-18T09:00:00Z",
    faqs: [
      {
        question: "Quais dados agilizar o atendimento?",
        answer:
          "Informe o nome ou link do móvel, o código do pedido (quando já registrado) e seu bairro/cidade.",
      },
    ],
    links: [{ label: `WhatsApp ${WHATSAPP_DISPLAY}`, href: `https://wa.me/${WHATSAPP_NUMBER}` }],
  },
];

const SLUG_ALIASES: Record<string, string> = {
  entrega: "entrega-e-montagem",
};

export function findPublicHelpPage(slug: string): ContentPage | undefined {
  const canonical = SLUG_ALIASES[slug] ?? slug;
  return PUBLIC_HELP_PAGES.find((page) => page.slug === canonical);
}
