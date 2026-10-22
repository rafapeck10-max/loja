import { CATEGORIES, SUBCATEGORIES, categoryMatches } from "./constants.ts";
import { publicDescription } from "./product-copy.ts";
import { SITE_URL, SOCIAL_IMAGE_URL } from "./site-metadata.ts";

const categoryCopy: Record<string, string> = {
  poltronas:
    "Poltronas para leitura, descanso e composição da sala. Compare modelos, revestimentos, cores e medidas antes de escolher a sua.",
  sofas:
    "Sofás retráteis, reclináveis, fixos, de canto e sofás-cama. Compare largura, profundidade, revestimento e cores para encontrar o modelo para sua sala.",
  "sala-de-estar":
    "Sofás, poltronas, painéis, racks e aparadores para a sala de estar. Confira medidas e acabamentos para combinar os móveis no seu ambiente.",
  paineis:
    "Painéis, racks, homes e bancadas para organizar a TV e os aparelhos da sala. Confira largura, altura, nichos e acabamentos de cada modelo.",
  dormitorios:
    "Guarda-roupas, camas, cabeceiras, cômodas e mesas de cabeceira. Compare medidas e opções de organização para compor seu quarto.",
  cozinha:
    "Cozinhas completas e compactas, armários, balcões, aéreos e fruteiras. Confira dimensões e composição de cada conjunto para planejar sua cozinha.",
  "salas-de-jantar":
    "Mesas, cadeiras, conjuntos de jantar, aparadores e cristaleiras. Compare dimensões, acabamentos e número de lugares para o seu espaço.",
  "colchoes-e-bases":
    "Colchões, bases, camas box e baús. Confira tamanho, altura e composição de cada produto para combinar colchão e base no seu quarto.",
  decoracao:
    "Mesas laterais, peças de decoração e complementos para a casa. Veja materiais, cores e dimensões para combinar com os móveis do ambiente.",
  "poltronas-decorativas":
    "Poltronas decorativas para complementar a sala ou criar um canto de leitura. Confira revestimentos, cores, altura e largura de cada modelo.",
  "sofas-individuais":
    "Sofás para a sala em diferentes medidas e revestimentos. Compare modelos retráteis, reclináveis e fixos e confira o espaço necessário para cada um.",
  "sofas-cama":
    "Sofás-cama para sentar, descansar e receber visitas. Confira as medidas do móvel fechado e aberto e as características de cada revestimento.",
  "conjuntos-estofados":
    "Sofás fixos e conjuntos de estofados para organizar os lugares da sala. Compare composição, largura e revestimento de cada conjunto.",
  "sofas-de-canto":
    "Sofás de canto para aproveitar a disposição da sala. Confira as dimensões dos módulos, o formato e o revestimento de cada conjunto.",
  "paineis-para-tvs":
    "Painéis para TV em diferentes larguras e acabamentos. Confira altura, espaço para os aparelhos e orientações de cada modelo antes da instalação.",
  "racks-bancadas":
    "Racks e bancadas para apoiar a TV e organizar aparelhos e objetos. Compare largura, altura, portas, nichos e acabamento.",
  homes:
    "Homes e estantes para TV com diferentes composições de painel, bancada e nichos. Confira as medidas e os detalhes de cada conjunto.",
  "bancadas-suspensas":
    "Bancadas e painéis suspensos para o ambiente da TV. Veja medidas, compartimentos e orientações de montagem de cada produto.",
  "conjuntos-paineis-racks":
    "Conjuntos de painel e rack para compor o ambiente da TV. Compare a largura das peças, os espaços de armazenamento e os acabamentos.",
  cabeceiras:
    "Cabeceiras para compor a cama e o quarto. Compare medidas, revestimentos e cores e confira a compatibilidade com o tamanho da sua cama.",
  comodas:
    "Cômodas e sapateiras para organizar roupas e calçados. Confira dimensões, gavetas, portas e acabamentos de cada móvel.",
  "mesas-de-cabeceira":
    "Mesas de cabeceira para manter objetos ao lado da cama. Compare altura, largura, gavetas, nichos e acabamentos.",
  penteadeiras:
    "Penteadeiras e camarins para organizar maquiagem e acessórios. Confira medidas, gavetas e quais peças acompanham cada modelo.",
  roupeiros:
    "Guarda-roupas para organizar roupas e acessórios. Compare dimensões, portas, gavetas e divisão interna para escolher o móvel para seu quarto.",
  "modulados-quarto":
    "Móveis modulados para compor o quarto. Confira as medidas de cada módulo, os acabamentos e as peças que fazem parte de cada conjunto.",
  "livreiros-multiusos":
    "Livreiros e armários multiuso para organizar livros e objetos. Compare prateleiras, portas, altura e largura de cada modelo.",
  "camas-casal":
    "Camas de casal em diferentes modelos e acabamentos. Confira as medidas da estrutura e o tamanho de colchão indicado em cada produto.",
  "camas-solteiro":
    "Camas de solteiro para o quarto. Compare dimensões, materiais e acabamento e confira o tamanho de colchão indicado para cada modelo.",
  "camas-com-bau":
    "Camas com baú para combinar descanso e armazenamento. Confira as medidas, a abertura do baú e a composição de cada produto.",
  beliches:
    "Beliches e camas auxiliares para organizar mais lugares no quarto. Confira altura, dimensões, composição e orientações de uso de cada modelo.",
  bicamas:
    "Bicamas com cama auxiliar para aproveitar o espaço do quarto. Veja as medidas fechadas e abertas e quais peças acompanham cada produto.",
  "travesseiros-enxoval":
    "Travesseiros em diferentes medidas e composições. Confira o material, o tamanho e as características informadas em cada produto.",
  "cozinhas-completas":
    "Cozinhas completas com diferentes composições de armários, balcões e aéreos. Confira medidas, materiais e quais módulos acompanham cada conjunto.",
  "cozinhas-compactas":
    "Cozinhas compactas para organizar utensílios em espaços menores. Compare largura, altura e a composição de módulos de cada modelo.",
  "kits-cozinha":
    "Kits de cozinha para organizar louças e utensílios. Confira medidas, quantidade de portas, gavetas e acabamento de cada kit.",
  "armarios-cozinha":
    "Armários e cozinhas moduladas para organizar seu ambiente. Confira as medidas dos módulos, os materiais e as peças incluídas em cada produto.",
  "balcoes-aereos":
    "Balcões, aéreos e nichos para complementar a cozinha. Compare medidas e confira se tampo, pia e demais acessórios acompanham cada modelo.",
  fruteiras:
    "Fruteiras para organizar frutas e utensílios na cozinha. Compare dimensões, cestos, prateleiras e portas de cada modelo.",
  "mesas-de-jantar":
    "Mesas de jantar em diferentes tamanhos e acabamentos. Confira largura, comprimento, altura e composição do tampo antes de escolher.",
  "conjuntos-mesa-cadeiras":
    "Conjuntos de mesa com cadeiras para a sala de jantar. Compare número de lugares, medidas da mesa e revestimento dos assentos.",
  cadeiras:
    "Cadeiras para compor a mesa e a sala de jantar. Confira medidas, estrutura, revestimento e cores de cada modelo.",
  banquetas:
    "Banquetas para bancadas e ambientes de convivência. Compare altura do assento, dimensões, materiais e acabamento.",
  aparadores:
    "Aparadores e buffets para apoiar objetos e organizar a sala de jantar. Confira largura, portas, gavetas e acabamento de cada móvel.",
  cristaleiras:
    "Cristaleiras para organizar louças e objetos de decoração. Compare dimensões, prateleiras, portas e os detalhes de acabamento.",
  colchoes:
    "Colchões de solteiro, casal e queen. Confira as medidas, altura e composição informadas em cada modelo para combinar com sua base.",
  bases:
    "Bases e baús para compor a cama. Compare largura, comprimento, altura e revestimento e confira a compatibilidade com seu colchão.",
  "cama-box":
    "Camas box e colchobox em diferentes tamanhos. Confira medidas, composição e quais peças estão incluídas em cada produto.",
  "colchoes-caixas":
    "Colchões e caixas avulsos para compor a cama. Confira o conteúdo de cada conjunto e as dimensões de cada peça antes da compra.",
  "decoracao-acessorios":
    "Peças de decoração para complementar a casa. Confira cores, materiais e medidas e escolha os detalhes que combinam com seu ambiente.",
  complementos:
    "Complementos para organizar e equipar a casa. Veja a função, as dimensões e a composição informadas na página de cada produto.",
  "mesas-laterais":
    "Mesas laterais para apoiar objetos ao lado do sofá ou da poltrona. Compare altura, largura, materiais e acabamento.",
};

export function categoryDescription(slug: string) {
  return (
    categoryCopy[slug] ??
    "Catálogo de móveis da Mobi: modelos, medidas e acabamentos de cada produto."
  );
}

export function categoryUrl(slug: string, page = 1) {
  return `${SITE_URL}/categoria/${encodeURIComponent(slug)}${page > 1 ? `?page=${page}` : ""}`;
}

export function seoHead(title: string, description: string, url: string, image = SOCIAL_IMAGE_URL) {
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

export function jsonLd(value: unknown) {
  return { type: "application/ld+json", children: JSON.stringify(value).replace(/</g, "\\u003c") };
}

export function breadcrumbs(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

function plainText(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function excerpt(value: string, limit: number) {
  if (value.length <= limit) return value;
  return `${value
    .slice(0, limit - 1)
    .replace(/\s+\S*$/, "")
    .replace(/[\s,;:.]+$/, "")}…`;
}

interface SeoProduct {
  nome: string;
  slug: string;
  categoria: string;
  descricao: string;
  medidas: string | null;
  cores: string[] | null;
  imagem_url: string;
  imagens: string[];
  sku: string | null;
  preco_novo: number;
  variacoes_preco: Array<{ sale_price: number | null }>;
}

export function productSeo(product: SeoProduct) {
  const name = plainText(product.nome);
  const details = [
    excerpt(name, 110),
    product.medidas ? `Medidas: ${plainText(product.medidas)}` : "",
    product.cores?.length ? `Cores: ${product.cores.map(plainText).join(", ")}` : "",
  ].filter(Boolean);
  const facts = details.join(". ");
  let copy = plainText(publicDescription(product.descricao)).replace(/^descrição\s*:?\s*/i, "");
  if (copy.toLocaleLowerCase("pt-BR").startsWith(name.toLocaleLowerCase("pt-BR"))) {
    copy = copy.slice(name.length).replace(/^[\s.,:;–—-]+/, "");
  }
  if (facts.length < 140 && copy) details.push(copy);
  const description = excerpt(details.join(". ").replace(/\.{2,}/g, "."), 210);
  const url = `${SITE_URL}/produto/${encodeURIComponent(product.slug)}`;
  const prices = product.variacoes_preco
    .map((v) => v.sale_price)
    .filter(
      (price): price is number => typeof price === "number" && Number.isFinite(price) && price > 0,
    );
  const image = [...new Set([product.imagem_url, ...product.imagens])].filter((src) =>
    /^https?:\/\//i.test(src),
  );
  const category =
    SUBCATEGORIES.find((cat) => categoryMatches(product.categoria, cat.slug)) ??
    CATEGORIES.find((cat) => categoryMatches(product.categoria, cat.slug));
  const offer = {
    url,
    priceCurrency: "BRL",
    seller: { "@id": `${SITE_URL}/#organization` },
    ...(prices.length > 1
      ? {
          "@type": "AggregateOffer",
          lowPrice: Math.min(...prices),
          highPrice: Math.max(...prices),
          offerCount: prices.length,
        }
      : { "@type": "Offer", price: prices[0] ?? product.preco_novo }),
  };
  return {
    title: `${name} | Mobi`,
    description,
    url,
    image: product.imagem_url,
    structured: {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${url}#product`,
      name,
      description,
      url,
      image,
      category: product.categoria,
      ...(product.sku ? { sku: product.sku.split("|")[0].trim() } : {}),
      ...(product.cores?.length ? { color: product.cores.join(", ") } : {}),
      ...(Number.isFinite(product.preco_novo) && product.preco_novo > 0 ? { offers: offer } : {}),
    },
    breadcrumb: breadcrumbs([
      { name: "Início", url: `${SITE_URL}/` },
      ...(category ? [{ name: category.label, url: categoryUrl(category.slug) }] : []),
      { name, url },
    ]),
  };
}
