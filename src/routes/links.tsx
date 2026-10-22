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
  "group grid min-h-[76px] grid-cols-[32px_1fr_20px] items-center gap-3 rounded-full border border-[#dfc18d]/80 px-5 py-4 text-[#edd4a9] no-underline transition-colors hover:bg-[#edd4a9] hover:text-[#073f3b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#edd4a9] sm:min-h-[82px] sm:px-6";

function LinksPage() {
  const [shareStatus, setShareStatus] = useState("");
  async function sharePage() {
    const url = `${SITE_URL}/links`;
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
    <div className="min-h-dvh bg-[#073f3b] px-5 pb-10 pt-6 text-[#edd4a9] sm:px-8 sm:pt-9">
      <div className="mx-auto w-full max-w-[480px]">
        <div className="flex min-h-11 justify-end">
          <button
            type="button"
            onClick={() => void sharePage()}
            aria-label="Compartilhar página da Mobi"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dfc18d]/40 text-[#edd4a9] transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#edd4a9]"
          >
            {shareStatus === "Link copiado!" ? (
              <Check className="h-5 w-5" />
            ) : (
              <Share2 className="h-5 w-5" />
            )}
          </button>
        </div>
        <header className="text-center">
          <div className="mx-auto flex h-[112px] w-[112px] items-center justify-center rounded-full bg-[#2e3f32] p-4 shadow-lg sm:h-[124px] sm:w-[124px]">
            <MobiliLogo className="h-auto w-full" />
          </div>
          <h1 className="mt-5 text-[32px] font-bold tracking-tight text-[#edd4a9] sm:text-4xl">
            Mobi Móveis
          </h1>
          <p className="mx-auto mt-3 max-w-[340px] text-[17px] leading-relaxed text-[#edd4a9] sm:text-lg">
            Móveis que combinam com a sua vida.
            <br />
            Nova Iguaçu e região.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram da Mobi — abre em nova aba"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#edd4a9] transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#edd4a9]"
            >
              <Instagram className="h-7 w-7" />
            </a>
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook da Mobi — abre em nova aba"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#edd4a9] transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#edd4a9]"
            >
              <Facebook className="h-7 w-7" />
            </a>
          </div>
        </header>
        <nav aria-label="Links oficiais da Mobi" className="mt-7 grid gap-4 sm:mt-9">
          <Link to="/" search={{ all: true, page: 1 }} hash="catalogo" className={linkClass}>
            <Globe className="h-7 w-7" aria-hidden="true" />
            <span className="text-center text-[15px] font-semibold uppercase leading-snug tracking-wide sm:text-base">
              Escolha seu móvel aqui
            </span>
            <ArrowUpRight className="h-4 w-4 opacity-70" aria-hidden="true" />
          </Link>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className={linkClass}>
            <WhatsAppIcon className="h-7 w-7" />
            <span className="text-center text-[15px] font-semibold uppercase leading-snug tracking-wide sm:text-base">
              Fale com a Mobi
              <br />
              pelo WhatsApp
            </span>
            <ArrowUpRight className="h-4 w-4 opacity-70" aria-hidden="true" />
          </a>
          <a href={FACEBOOK_URL} target="_blank" rel="noreferrer" className={linkClass}>
            <Facebook className="h-7 w-7" aria-hidden="true" />
            <span className="text-center text-[15px] font-semibold uppercase leading-snug tracking-wide sm:text-base">
              Acompanhe a Mobi no Facebook
            </span>
            <ArrowUpRight className="h-4 w-4 opacity-70" aria-hidden="true" />
          </a>
          <Link to="/moveis-nova-iguacu" className={linkClass}>
            <MapPin className="h-7 w-7" aria-hidden="true" />
            <span className="text-center text-[15px] font-semibold uppercase leading-snug tracking-wide sm:text-base">
              Atendimento em
              <br />
              Nova Iguaçu
            </span>
            <ArrowUpRight className="h-4 w-4 opacity-70" aria-hidden="true" />
          </Link>
        </nav>
        <p
          role="status"
          aria-live="polite"
          className="mt-4 min-h-5 text-center text-xs text-[#edd4a9]"
        >
          {shareStatus}
        </p>
        <footer className="mt-6 text-center text-xs leading-relaxed text-[#edd4a9]/80">
          Atendimento online · Mobi
        </footer>
      </div>
    </div>
  );
}
