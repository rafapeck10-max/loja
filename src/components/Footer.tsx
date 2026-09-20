import { CreditCard, Truck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { MobiliLogo } from "@/components/MobiliLogo";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { PixIcon } from "@/components/PixIcon";
import { WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-gold/40 bg-deep-green text-sand">
      <div className="mx-auto grid max-w-[1300px] gap-5 px-4 py-7 sm:grid-cols-3 sm:gap-8 sm:px-8 sm:py-10">
        <section>
          <Link
            to="/"
            search={{}}
            aria-label="Mobi — voltar ao início"
            className="mb-3 inline-flex"
          >
            <MobiliLogo className="h-[46px] w-[106px]" />
          </Link>
          <p className="max-w-sm text-sm leading-relaxed text-sand/85">
            Móveis que combinam com a sua vida. Atendemos Nova Iguaçu e regiões próximas.
          </p>
          <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-gold">
            <Truck className="h-5 w-5 shrink-0" /> Pague somente na entrega
          </p>
        </section>
        <section className="border-t border-white/10 pt-4 sm:border-0 sm:pt-0">
          <h2 className="mb-2 text-sm text-gold">Fale com a Mobi</h2>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-sand underline underline-offset-4"
          >
            <WhatsAppIcon className="h-5 w-5 shrink-0" /> {WHATSAPP_DISPLAY}
          </a>
          <p className="mt-1 text-xs leading-6 text-sand/80">
            Segunda a sexta: 08h às 18h
            <br />
            Sábado: 09h às 14h
          </p>
        </section>
        <section className="border-t border-white/10 pt-4 sm:border-0 sm:pt-0">
          <h2 className="mb-2 text-sm text-gold">Pagamento na entrega</h2>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <span className="flex items-center gap-2">
              <PixIcon className="h-6 w-6 shrink-0 text-gold" /> PIX com desconto
            </span>
            <span className="flex items-center gap-2">
              <CreditCard className="h-6 w-6 shrink-0 text-gold" /> Cartão até 12x
            </span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-sand/80">
            Consulte as parcelas na página do produto. Frete e data de entrega combinados pelo
            WhatsApp.
          </p>
        </section>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-sand/70">
        © {new Date().getFullYear()} Mobi. Todos os direitos reservados.
      </div>
    </footer>
  );
}
