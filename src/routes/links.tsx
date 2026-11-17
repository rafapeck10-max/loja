import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe, Instagram, Facebook, MapPin, Share2, ArrowUpRight, Check } from "lucide-react";
import { MobiliLogo } from "@/components/MobiliLogo";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { WHATSAPP_URL } from "@/lib/constants";
import { seoHead } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-metadata";

export const Route = createFileRoute("/links")({
  head: () =>
    seoHead(
      "Mobi | Loja e atendimento em Nova Iguaçu",
      "Links oficiais da Mobi: acesse o catálogo de móveis ou fale pelo WhatsApp sobre atendimento e entrega em Nova Iguaçu e região.",
      `${SITE_URL}/links`,
    ),
  component: LinksPage,
});

const INSTAGRAM_URL = "https://www.instagram.com/lojamobimb/";
const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61592444327378";
const linkClass =
  "group flex min-h-[72px] w-full items-center gap-4 rounded-2xl border border-[#c0a264]/45 bg-white/[0.035] px-5 py-4 text-left text-white no-underline shadow-sm transition duration-200 hover:border-[#c0a264]/80 hover:bg-white/[0.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c0a264] sm:min-h-[76px]";

function LinksPage() {
  const [shareStatus, setShareStatus] = useState("");
  async function sharePage() {
    const url = SITE_URL + "/links";
    try {
      if (navigator.share) await navigator.share({ title: "Mobi | Links oficiais", url });
      else {
        await navigator.clipboard.writeText(url);
        setShareStatus("Link copiado!");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareStatus("Copie o endereço desta página para compartilhar.");
    }
  }
  return (
    <div className="relative isolate min-h-dvh bg-[#252F27] px-5 pb-10 pt-5 text-white sm:px-8 sm:pt-7">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(192, 162, 100, 0.16), transparent 50%)" }}
        aria-hidden="true"
      />
      <div className="relative mx-auto w-full max-w-[440px]">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void sharePage()}
            aria-label="Compartilhar página da Mobi"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#c0a264]/35 text-[#c0a264] transition hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c0a264]"
          >
            {shareStatus === "Link copiado!" ? (
              <Check className="h-5 w-5" />
            ) : (
              <Share2 className="h-5 w-5" />
            )}
          </button>
        </div>

        <header className="mt-1 text-center">
          <div className="mx-auto flex h-[112px] w-[112px] items-center justify-center rounded-full border border-[#c0a264]/25 bg-[#303a31] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.22)] sm:h-[124px] sm:w-[124px]">
            <MobiliLogo className="h-auto w-full" />
          </div>
          <h1 className="mt-5 text-[32px] font-bold tracking-tight text-white sm:text-4xl">
            Mobi Móveis
          </h1>
          <p className="mx-auto mt-2 max-w-[340px] text-[16px] leading-relaxed text-white/85 sm:text-lg">
            Móveis que combinam com a sua vida.
          </p>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c0a264]">
            Loja online · Nova Iguaçu e região
          </p>
        </header>

        <nav aria-label="Links oficiais da Mobi" className="mt-7 grid gap-3 sm:mt-8">
          <Link
            to="/"
            className="group flex min-h-[76px] w-full items-center gap-4 rounded-2xl bg-[#c0a264] px-5 py-4 text-left text-[#252F27] no-underline shadow-[0_10px_28px_rgba(0,0,0,0.18)] transition hover:bg-[#d0b477] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#252F27]/10">
              <Globe className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold uppercase tracking-wide sm:text-base">
                Acesse a loja Mobi
              </span>
              <span className="mt-1 block text-xs font-medium text-[#252F27]/75 sm:text-[13px]">
                Conheça a página inicial e nossos móveis
              </span>
            </span>
            <ArrowUpRight className="h-5 w-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>

          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className={linkClass}>
            <WhatsAppIcon className="h-6 w-6 shrink-0 text-[#c0a264]" />
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold uppercase tracking-wide sm:text-base">
                Fale com a Mobi
              </span>
              <span className="mt-1 block text-xs text-white/65 sm:text-[13px]">
                Atendimento direto pelo WhatsApp
              </span>
            </span>
            <ArrowUpRight className="h-5 w-5 shrink-0 text-[#c0a264]/80 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </a>

          <Link to="/moveis-nova-iguacu" className={linkClass}>
            <MapPin className="h-6 w-6 shrink-0 text-[#c0a264]" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold uppercase tracking-wide sm:text-base">
                Entrega e atendimento
              </span>
              <span className="mt-1 block text-xs text-white/65 sm:text-[13px]">
                Nova Iguaçu e região
              </span>
            </span>
            <ArrowUpRight className="h-5 w-5 shrink-0 text-[#c0a264]/80 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </nav>

        <section aria-label="Redes sociais da Mobi" className="mt-7">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
            Siga a Mobi
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram da Mobi — abre em nova aba"
              className="flex min-h-[54px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] text-sm font-semibold text-white/90 transition hover:border-[#c0a264]/50 hover:bg-white/[0.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c0a264]"
            >
              <Instagram className="h-5 w-5 text-[#c0a264]" aria-hidden="true" />
              Instagram
            </a>
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook da Mobi — abre em nova aba"
              className="flex min-h-[54px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] text-sm font-semibold text-white/90 transition hover:border-[#c0a264]/50 hover:bg-white/[0.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c0a264]"
            >
              <Facebook className="h-5 w-5 text-[#c0a264]" aria-hidden="true" />
              Facebook
            </a>
          </div>
        </section>

        <p
          role="status"
          aria-live="polite"
          className="mt-4 min-h-5 text-center text-xs text-[#c0a264]"
        >
          {shareStatus}
        </p>
        <footer className="mt-4 text-center text-xs text-white/45">
          Atendimento online · Mobi
        </footer>
      </div>
    </div>
  );
}
