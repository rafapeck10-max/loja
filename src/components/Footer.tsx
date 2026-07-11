import { Instagram, Facebook, Music2, CreditCard, Lock, Shield } from "lucide-react";
import { MobiliLogo } from "@/components/MobiliLogo";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

export function Footer() {
  return (
    <footer className="border-t-[3px] border-gold bg-deep-green text-sand">
      <div className="mx-auto grid max-w-[1300px] gap-10 px-[5%] py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h4 className="mb-4 text-lg uppercase tracking-[2px] text-gold">Experiência Mobili</h4>
          <p className="text-sm leading-relaxed opacity-85">
            Nascida da paixão pelo design, a Mobili entrega conforto de shopping com preço de
            fábrica na Baixada Fluminense.
          </p>
          <div className="mt-5 flex gap-4 text-gold">
            <a aria-label="Instagram" href="#" className="transition-colors hover:text-sand">
              <Instagram className="h-5 w-5" />
            </a>
            <a aria-label="Facebook" href="#" className="transition-colors hover:text-sand">
              <Facebook className="h-5 w-5" />
            </a>
            <a aria-label="TikTok" href="#" className="transition-colors hover:text-sand">
              <Music2 className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-lg uppercase tracking-[2px] text-gold">Atendimento</h4>
          <p className="text-sm opacity-85">Segunda a Sexta: 08h - 18h</p>
          <p className="text-sm opacity-85">Sábado: 09h - 14h</p>
          <p className="mt-4 flex items-center gap-2 text-sm font-bold text-gold">
            <WhatsAppIcon className="h-4 w-4" /> WhatsApp: (21) 98655-9996
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-lg uppercase tracking-[2px] text-gold">Pagamento Seguro</h4>
          <p className="text-sm opacity-85">
            Aceitamos as principais bandeiras. Pague apenas na entrega.
          </p>
          <div className="mt-4 flex gap-4 text-gold">
            <CreditCard className="h-7 w-7" aria-label="Cartões" />
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-label="PIX">
              <path d="M11.917 0.702a2.6 2.6 0 0 1 3.677 0l2.802 2.802h-1.42c-.87 0-1.687.339-2.302.954l-2.185 2.185a.68.68 0 0 1-.963 0L9.34 4.458a3.24 3.24 0 0 0-2.302-.954H5.9L8.24 1.164zm-6.44 4.34c.575 0 1.115.224 1.522.63l2.185 2.186a1.78 1.78 0 0 0 2.518 0l2.186-2.185a2.14 2.14 0 0 1 1.522-.631h2.52l2.365 2.366a2.6 2.6 0 0 1 0 3.677l-2.365 2.366h-2.52c-.575 0-1.115-.224-1.522-.631l-2.186-2.186a1.822 1.822 0 0 0-2.518 0l-2.185 2.186a2.14 2.14 0 0 1-1.522.63H3.16L.702 11.085a2.6 2.6 0 0 1 0-3.677L3.16 5.042zm12.03 9.508c.87 0 1.687-.34 2.302-.955l1.42-.001-2.958 2.959-.001.001-2.676 2.676a2.6 2.6 0 0 1-3.677 0l-2.678-2.678-.83-.83h1.639c.87 0 1.687-.339 2.302-.954l2.185-2.185a.68.68 0 0 1 .963 0l2.185 2.185z" />
            </svg>
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-lg uppercase tracking-[2px] text-gold">Selo de Segurança</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm opacity-85">
              <Lock className="h-4 w-4 text-gold" /> <span>Criptografado SSL</span>
            </div>
            <div className="flex items-center gap-2 text-sm opacity-85">
              <Shield className="h-4 w-4 text-gold" /> <span>Google Safe</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gold/15 px-[5%] py-8 text-center">
        <div className="mb-4 flex justify-center">
          <MobiliLogo className="h-[25px]" />
        </div>
        <p className="text-xs opacity-70">
          © 2026 Mobili Móveis e Interiores. Todos os direitos reservados. Nova Iguaçu - RJ.
        </p>
      </div>
    </footer>
  );
}
