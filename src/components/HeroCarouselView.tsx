import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { BannerSlide } from "./BannerSlide";
import { initialBannerData } from "../lib/banner-drafts";
import type { HomeBanner } from "../lib/home-configuration";
import { visibleHomeBanners } from "../lib/home-banner-state";

export function HeroCarouselView({ banners }: { banners?: readonly HomeBanner[] }) {
  const [active, setActive] = useState(0),
    [paused, setPaused] = useState(false),
    [reduced, setReduced] = useState(true),
    [now, setNow] = useState(() => new Date());
  const slides = visibleHomeBanners(banners ?? initialBannerData().banners, now);
  const index = slides.length ? active % slides.length : 0;
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(media.matches);
    change();
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (slides.length < 2 || paused || reduced) return;
    const t = setInterval(() => setActive((v) => (v + 1) % slides.length), 6500);
    return () => clearInterval(t);
  }, [slides.length, paused, reduced]);
  if (!slides.length) return null;
  const banner = slides[index];
  return (
    <div
      className="mobi-home-carousel"
      aria-roledescription="carrossel"
      aria-label="Destaques da Mobi"
      onFocusCapture={() => setPaused(true)}
    >
      <BannerSlide
        banner={{ ...banner, updated_at: "" }}
        responsiveMedia={{
          desktop: banner.image_url,
          mobile: banner.mobile_image_url,
          alt: banner.alt,
          showText: banner.show_text,
        }}
      />
      {slides.length > 1 && (
        <div className="mobi-carousel-controls">
          <button
            aria-label="Banner anterior"
            onClick={() => {
              setPaused(true);
              setActive((index + slides.length - 1) % slides.length);
            }}
          >
            <ChevronLeft size={19} />
          </button>
          <div className="mobi-carousel-indicators">
            {slides.map((s, i) => (
              <button
                key={s.id}
                aria-label={`Mostrar banner ${i + 1}: ${s.title}`}
                aria-pressed={i === index}
                onClick={() => {
                  setActive(i);
                  setPaused(true);
                }}
              >
                <span />
              </button>
            ))}
          </div>
          <button
            aria-label="Próximo banner"
            onClick={() => {
              setPaused(true);
              setActive((index + 1) % slides.length);
            }}
          >
            <ChevronRight size={19} />
          </button>
          {!reduced && (
            <button
              aria-label={paused ? "Retomar banners" : "Pausar banners"}
              onClick={() => setPaused((v) => !v)}
            >
              {paused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
