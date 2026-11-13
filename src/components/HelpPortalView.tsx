import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CreditCard, Headphones, MapPin, Search, Truck } from "lucide-react";
import { MobiliLogo } from "@/components/MobiliLogo";
import { useHomeConfiguration } from "@/components/HomeConfigurationContext";
import { WHATSAPP_NUMBER } from "@/lib/constants";

const topics = [
  {
    title: "Encontrar um móvel",
    description: "Veja as categorias e compare os modelos disponíveis no catálogo.",
    icon: Search,
    kind: "catalog" as const,
  },
  {
    title: "Entrega e prazo",
    description: "Consulte a cobertura para seu endereço antes de confirmar.",
    icon: Truck,
    message: "Olá, Mobi! Quero consultar entrega e prazo para o meu endereço.",
  },
  {
    title: "Pagamento",
    description: "Confirme as condições do produto escolhido com a equipe.",
    icon: CreditCard,
    message: "Olá, Mobi! Quero confirmar as condições de pagamento de um produto.",
  },
  {
    title: "Falar com a Mobi",
    description: "Atendimento online pelo WhatsApp. Não temos loja física para visitação.",
    icon: Headphones,
    message: "Olá, Mobi! Preciso de ajuda para escolher um móvel.",
  },
];

function helpLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function HelpPortalView({ revisionId = null }: { revisionId?: number | null }) {
  const configuration = useHomeConfiguration();
  const pages = configuration?.content?.pages;
  const [query, setQuery] = useState("");
  const normalizedQuery = query
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  const matches = useMemo(() => {
    const availablePages = pages ?? [];
    if (!normalizedQuery) return availablePages;
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);
    return availablePages.filter((page) => {
      const text = [
        page.title,
        page.body,
        ...page.faqs.flatMap((faq) => [faq.question, faq.answer]),
      ]
        .join(" ")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      return terms.every((term) => text.includes(term));
    });
  }, [normalizedQuery, pages]);

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-[#26392c]">
      {revisionId !== null && (
        <div className="border-b border-gold/30 bg-[#f3f4ed] px-4 py-2 text-center text-xs text-deep-green">
          Prévia de ajuda local · revisão {revisionId} · não publicado
        </div>
      )}
      <div className="border-b border-[#e9e3d8] bg-white">
        <header className="mx-auto flex min-h-[76px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
          <Link to="/" search={{}} aria-label="Mobi — voltar ao início">
            <MobiliLogo className="h-11 w-[106px]" />
          </Link>
          <Link
            to="/"
            search={{ all: true, page: 1 }}
            hash="catalogo"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#304a32] underline underline-offset-4"
          >
            Voltar à loja <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </header>
      </div>

      <section className="bg-[#304a32] px-4 py-10 text-[#fffefa] sm:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d9bd7a]">
            Atendimento online · sem loja física
          </span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Como podemos ajudar?
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
            Busque nas orientações da Mobi ou escolha o assunto para conversar com a equipe.
          </p>
          <label className="mx-auto mt-6 flex max-w-2xl items-center gap-3 rounded-xl border border-white/20 bg-white px-4 text-[#26392c] shadow-lg">
            <Search size={19} className="shrink-0 text-[#667466]" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ex.: entrega, pagamento, medidas"
              aria-label="Buscar nas orientações da Mobi"
              className="min-h-14 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#7b8177]"
            />
          </label>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
        <section aria-labelledby="mobi-help-topics">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a7a39]">
                Atendimento Mobi
              </span>
              <h2 id="mobi-help-topics" className="mt-1 text-xl font-semibold sm:text-2xl">
                Escolha um assunto
              </h2>
            </div>
            <span className="hidden items-center gap-1 text-xs text-[#6c746a] sm:inline-flex">
              <MapPin size={14} aria-hidden="true" /> Consulte sua região com a equipe
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {topics.map((topic) => {
              const Icon = topic.icon;
              const card = (
                <>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#f1f2eb] text-[#304a32]">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-sm font-semibold">{topic.title}</strong>
                    <span className="mt-1 block text-xs leading-5 text-[#687268]">
                      {topic.description}
                    </span>
                  </span>
                  <ArrowRight size={16} className="shrink-0 text-[#9a7a39]" aria-hidden="true" />
                </>
              );
              return topic.kind === "catalog" ? (
                <Link
                  key={topic.title}
                  to="/"
                  search={{ all: true, page: 1 }}
                  hash="catalogo"
                  className="flex min-h-[104px] items-center gap-3 rounded-xl border border-[#e5dfd4] bg-white p-4 transition-colors hover:border-[#c5a059]"
                >
                  {card}
                </Link>
              ) : (
                <a
                  key={topic.title}
                  href={helpLink(topic.message)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-[104px] items-center gap-3 rounded-xl border border-[#e5dfd4] bg-white p-4 transition-colors hover:border-[#c5a059]"
                >
                  {card}
                </a>
              );
            })}
          </div>
        </section>

        <section className="mt-9" aria-labelledby="mobi-help-articles">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 id="mobi-help-articles" className="text-xl font-semibold sm:text-2xl">
              {normalizedQuery ? "Orientações encontradas" : "Informações da Mobi"}
            </h2>
            <span className="text-xs text-[#687268]" aria-live="polite">
              {matches.length} {matches.length === 1 ? "artigo" : "artigos"}
            </span>
          </div>
          {matches.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {matches.map((page) => (
                <Link
                  key={page.id}
                  to="/ajuda/$slug"
                  params={{ slug: page.slug }}
                  className="group rounded-xl border border-[#e5dfd4] bg-white p-5 transition-colors hover:border-[#c5a059]"
                >
                  <strong className="text-base font-semibold group-hover:underline group-hover:underline-offset-4">
                    {page.title}
                  </strong>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#687268]">{page.body}</p>
                  {page.faqs.length > 0 && (
                    <span className="mt-3 block text-xs text-[#687268]">
                      {page.faqs.length} {page.faqs.length === 1 ? "pergunta" : "perguntas"}{" "}
                      frequentes
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#cfc7b7] bg-white p-6 text-center">
              <h3 className="font-semibold">
                {normalizedQuery
                  ? "Não encontrei uma orientação com esse termo."
                  : "As orientações estão sendo organizadas."}
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#687268]">
                A equipe atende online. Se precisar de uma resposta específica, abra o WhatsApp e
                envie sua pergunta quando estiver pronto.
              </p>
              <a
                href={helpLink(
                  normalizedQuery
                    ? `Olá, Mobi! Preciso de ajuda sobre: ${query.trim()}.`
                    : "Olá, Mobi! Preciso de ajuda com uma compra.",
                )}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#304a32] px-5 text-sm font-semibold text-white"
              >
                Consultar a Mobi pelo WhatsApp
              </a>
            </div>
          )}
        </section>
        <p className="mt-8 border-t border-[#e5dfd4] pt-4 text-xs leading-5 text-[#737a70]">
          Mobi é uma loja online. Não há atendimento presencial, showroom ou retirada em loja.
        </p>
      </main>
    </div>
  );
}
