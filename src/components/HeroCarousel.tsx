import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface Banner {
  src: string;
  alt: string;
  eyebrow: string;
  title: string;
  subtitle: string;
}

const BANNERS: Banner[] = [
  {
    src: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1400&q=80",
    alt: "Ambiente Mobi com desconto",
    eyebrow: "Coleção Mobi",
    title: "Ambientes que fazem sentido",
    subtitle: "Móveis que combinam com a sua vida.",
  },
  {
    src: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1400&q=80",
    alt: "Sala de estar moderna",
    eyebrow: "Seu lar, seu estilo",
    title: "Conforto para viver melhor",
    subtitle: "Design acolhedor para sua casa.",
  },
  {
    src: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1400&q=80",
    alt: "Quarto ambientado",
    eyebrow: "Móveis Mobi",
    title: "Um novo jeito de morar",
    subtitle: "Peças selecionadas para a Baixada Fluminense.",
  },
];

export function HeroCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((s) => (s + 1) % BANNERS.length);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative w-full overflow-hidden border-b-[4px] border-gold bg-deep-green">
      <div
        className="flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transform: `translateX(-${active * 100}%)` }}
      >
        {BANNERS.map((b) => (
          <div
            key={b.title}
            inert={BANNERS[active] !== b}
            aria-hidden={BANNERS[active] !== b}
            className="relative w-full shrink-0"
          >
            <div className="relative aspect-[4/3] w-full sm:aspect-[16/9] lg:aspect-[21/9]">
              <img src={b.src} alt={b.alt} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-black/5" />
              <div className="absolute inset-x-0 bottom-10 flex justify-start px-5 sm:bottom-12 sm:px-[8%]">
                <div className="max-w-[470px] text-sand">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[2px] text-gold sm:mb-2 sm:text-sm">
                    {b.eyebrow}
                  </p>
                  <h2 className="max-w-[420px] text-3xl leading-[1.08] sm:text-5xl md:text-6xl">
                    {b.title}
                  </h2>
                  <p className="mt-2 max-w-[280px] text-xs leading-relaxed text-sand/85 sm:mt-4 sm:max-w-[320px] sm:text-base">
                    {b.subtitle}
                  </p>
                  <Link
                    to="/"
                    search={{ ofertas: true, all: true, page: 1 }}
                    hash="catalogo"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 text-xs font-bold text-deep-green no-underline transition-transform hover:scale-[1.02] sm:mt-6 sm:gap-3 sm:px-6 sm:py-3.5 sm:text-sm"
                  >
                    Ver ofertas <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="absolute inset-x-0 bottom-5 flex justify-center gap-2">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Ir para banner ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-500 ${
              i === active ? "w-5 bg-gold" : "w-5 bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
