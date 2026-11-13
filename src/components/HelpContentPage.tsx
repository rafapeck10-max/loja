import type { ContentPage } from "@/lib/operational-config";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { MobiliLogo } from "@/components/MobiliLogo";
import { useHomeConfiguration } from "@/components/HomeConfigurationContext";
import { WHATSAPP_NUMBER } from "@/lib/constants";

export function HelpContentPage({ page }: { page: ContentPage }) {
  const configuration = useHomeConfiguration();
  const relatedPages = (configuration?.content?.pages ?? []).filter(
    (candidate) => candidate.id !== page.id,
  );
  const paragraphs = page.body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-[#26392c]">
      <div className="border-b border-[#e9e3d8] bg-white">
        <header className="mx-auto flex min-h-[76px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
          <Link to="/" search={{}} aria-label="Mobi — voltar ao início">
            <MobiliLogo className="h-11 w-[106px]" />
          </Link>
          <Link
            to="/ajuda"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#304a32] underline underline-offset-4"
          >
            <ArrowLeft size={16} aria-hidden="true" /> Central de ajuda
          </Link>
        </header>
      </div>
      <div className="mx-auto grid max-w-6xl gap-7 px-4 py-7 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <aside
          className="order-1 rounded-xl border border-[#e5dfd4] bg-white p-4 lg:order-2"
          aria-label="Mais informações de ajuda"
        >
          <h2 className="text-sm font-semibold">Outros assuntos</h2>
          <nav className="mt-2 divide-y divide-[#e9e3d8]">
            {relatedPages.map((candidate) => (
              <Link
                key={candidate.id}
                to="/ajuda/$slug"
                params={{ slug: candidate.slug }}
                className="flex min-h-11 items-center text-sm text-[#526352] underline-offset-4 hover:underline"
              >
                {candidate.title}
              </Link>
            ))}
            <Link
              to="/ajuda"
              className="flex min-h-11 items-center text-sm font-semibold text-[#304a32] underline-offset-4 hover:underline"
            >
              Buscar nas orientações
            </Link>
          </nav>
          <div className="mt-4 border-t border-[#e9e3d8] pt-4">
            <p className="text-xs leading-5 text-[#687268]">
              Atendimento online. Envie uma pergunta à equipe quando quiser iniciar a conversa.
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Olá, Mobi! Tenho uma dúvida sobre: ${page.title}.`)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#304a32] px-4 text-sm font-semibold text-white"
            >
              <MessageCircle size={17} aria-hidden="true" /> Falar com a Mobi
            </a>
          </div>
        </aside>

        <article className="order-2 min-w-0 lg:order-1">
          <nav className="mb-6 text-sm text-[#687268]" aria-label="Caminho da página">
            <Link to="/" search={{}} className="underline underline-offset-4">
              Início
            </Link>{" "}
            /{" "}
            <Link to="/ajuda" className="underline underline-offset-4">
              Ajuda
            </Link>{" "}
            / <span aria-current="page">{page.title}</span>
          </nav>
          <header className="max-w-3xl">
            <span className="mobi-eyebrow">INFORMAÇÕES DA MOBI</span>
            <h1 className="mt-2 text-3xl text-deep-green sm:text-4xl">{page.title}</h1>
            <p className="mt-2 text-xs text-[#777f75]">
              Revisado em{" "}
              {new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "long",
                timeZone: "America/Sao_Paulo",
              }).format(new Date(page.reviewedAt))}
            </p>
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="mt-4 text-sm leading-7 text-text-light sm:text-base">
                {paragraph}
              </p>
            ))}
          </header>
          {page.faqs.length > 0 && (
            <section className="mt-8 max-w-3xl" aria-labelledby="mobi-help-faq-title">
              <h2 id="mobi-help-faq-title" className="text-xl text-deep-green">
                Perguntas frequentes
              </h2>
              <div className="mt-3 divide-y divide-deep-green/15 border-y border-deep-green/15">
                {page.faqs.map((faq, index) => (
                  <details key={`${faq.question}-${index}`} className="py-3">
                    <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-deep-green">
                      {faq.question}
                    </summary>
                    <p className="pb-2 text-sm leading-6 text-text-light">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}
          {page.links.length > 0 && (
            <nav className="mt-8 flex max-w-3xl flex-wrap gap-x-6 gap-y-2" aria-label="Links úteis">
              {page.links.map((link, index) => (
                <a
                  key={`${link.href}-${index}`}
                  href={link.href}
                  className="inline-flex min-h-11 items-center text-sm font-semibold text-deep-green underline underline-offset-4"
                  {...(link.href.startsWith("https://")
                    ? { target: "_blank", rel: "noreferrer" }
                    : {})}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}
        </article>
      </div>
    </div>
  );
}
