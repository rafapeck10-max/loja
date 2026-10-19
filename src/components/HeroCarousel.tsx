import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { getHomepageBanners } from "@/lib/homepage-banners.functions";
import { DEFAULT_HOMEPAGE_BANNERS, HOMEPAGE_BANNERS_QUERY_KEY } from "@/lib/homepage-banners";
export const MOBI_HERO = DEFAULT_HOMEPAGE_BANNERS[0].image_url;

export function HeroCarousel() {
  const [active, setActive] = useState(0);
  const { data } = useQuery({ queryKey: HOMEPAGE_BANNERS_QUERY_KEY, queryFn: getHomepageBanners });
  const activeBanners = data?.filter((banner) => banner.active) ?? [];
  const slides = activeBanners.length ? activeBanners : DEFAULT_HOMEPAGE_BANNERS;
  const currentIndex = active % slides.length;
  const banner = slides[currentIndex];

  useEffect(() => {
    const timer = setInterval(() => setActive((value) => (value + 1) % slides.length), 6500);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="mobi-hero">
      <ImageWithFallback
        src={banner.image_url}
        alt={banner.title}
        className="mobi-hero-image"
        fetchPriority="high"
      />
      <div className="mobi-hero-content mobi-wrap">
        <span className="mobi-eyebrow">{banner.eyebrow}</span>
        <h1>{banner.title}</h1>
        <p>{banner.subtitle}</p>
        <a href={banner.cta_href} className="mobi-gold">
          {banner.cta_label}
        </a>
        <div className="mobi-dots">
          {slides.map((slide, index) => (
            <button
              key={slide.position}
              type="button"
              aria-label={`Mostrar banner ${index + 1}: ${slide.title}`}
              aria-pressed={index === currentIndex}
              className={index === currentIndex ? "active" : ""}
              onClick={() => setActive(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
