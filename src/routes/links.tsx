import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ExternalLink } from "lucide-react";
import { MobiliLogo } from "@/components/MobiliLogo";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { WHATSAPP_URL } from "@/lib/constants";

export const Route = createFileRoute("/links")({
  head: () => ({
    meta: [
      { title: "Mobi | Links oficiais" },
      {
        name: "description",
        content: "Acesse a loja Mobi ou fale com a nossa equipe pelo WhatsApp.",
      },
    ],
  }),
  component: LinksPage,
});

function LinksPage() {
  return (
    <main className="flex min-h-[calc(100dvh-9rem)] items-center justify-center px-4 py-12 sm:px-8 sm:py-16">
      <section className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-deep-green p-5 shadow-premium">
          <MobiliLogo className="h-auto w-full" />
        </div>
        <h1 className="text-2xl text-deep-green sm:text-3xl">Mobi</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-text-light">
          Móveis para transformar sua casa. Conforto, design e qualidade em Nova Iguaçu e região.
        </p>

        <div className="mt-8 grid gap-3">
          <Link
            to="/"
            search={{}}
            className="flex min-h-14 items-center justify-between gap-3 bg-deep-green px-5 text-sm font-bold text-sand no-underline transition-colors hover:bg-gold hover:text-deep-green"
          >
            <span className="flex items-center gap-3">
              <MobiliLogo className="h-7 w-16" />
              Conheça a loja Mobi
            </span>
            <ArrowRight className="h-5 w-5 shrink-0" />
          </Link>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-14 items-center justify-between gap-3 border border-price-green bg-white px-5 text-sm font-bold text-price-green no-underline transition-colors hover:bg-price-green hover:text-white"
          >
            <span className="flex items-center gap-3">
              <WhatsAppIcon className="h-6 w-6 shrink-0" />
              Fale com a Mobi pelo WhatsApp
            </span>
            <ExternalLink className="h-4 w-4 shrink-0" />
          </a>
        </div>

        <p className="mt-8 text-xs text-text-light">
          Pagamento somente na entrega · Até 12x no cartão
        </p>
      </section>
    </main>
  );
}
