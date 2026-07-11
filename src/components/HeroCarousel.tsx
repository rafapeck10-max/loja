import { useEffect, useState } from "react";

interface Banner {
  src: string;
  alt: string;
  title: string;
  subtitle: string;
}

const BANNERS: Banner[] = [
  {
    src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&q=80",
    alt: "Ambiente Mobili com desconto",
    title: "Itens com até 30% OFF",
    subtitle: "Descubra a Coleção Mobili",
  },
  {
    src: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1400&q=80",
    alt: "Sala de estar moderna",
    title: "Ambientes que inspiram",
    subtitle: "Dicas de decoração premium para sua casa",
  },
  {
    src: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1400&q=80",
    alt: "Quarto ambientado",
    title: "Refúgio de conforto",
    subtitle: "Dormitórios completos direto da fábrica",
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
    <section className="relative w-full overflow-hidden border-b-[5px] border-gold bg-deep-green">
      <div
        className="flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transform: `translateX(-${active * 100}%)` }}
      >
        {BANNERS.map((b) => (
          <div key={b.src} className="relative w-full shrink-0">
            <div className="relative aspect-[4/5] w-full sm:aspect-[16/9] lg:aspect-[21/9]">
              <img src={b.src} alt={b.alt} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-16 flex justify-center px-6 sm:bottom-20">
                <div className="max-w-[520px] border border-gold/40 bg-sand/95 px-6 py-5 text-center backdrop-blur-sm sm:px-8 sm:py-6">
                  <h2 className="text-xl leading-tight text-deep-green sm:text-2xl md:text-3xl">
                    Mobili <span className="text-gold">|</span> {b.title}
                  </h2>
                  <p className="mt-2 text-xs uppercase tracking-[2px] text-cacau sm:text-sm">
                    {b.subtitle}
                  </p>
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
            className={`h-1 rounded-full transition-all duration-500 ${
              i === active ? "w-8 bg-deep-green" : "w-4 bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
