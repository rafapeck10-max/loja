import type { ReactNode } from "react";
import { ImageWithFallback } from "./ImageWithFallback";
import type { HomepageBanner } from "../lib/homepage-banners";
import { isSafeBannerDestination, type BannerResponsiveMedia } from "../lib/banner-drafts";
interface BannerSlideProps {
  banner: HomepageBanner;
  responsiveMedia?: BannerResponsiveMedia;
  children?: ReactNode;
  previewViewport?: "desktop" | "mobile";
}
/** Shared composition: editable copy and an intact product photo, or an uploaded complete artwork. */
export function BannerSlide({
  banner,
  responsiveMedia,
  children,
  previewViewport,
}: BannerSlideProps) {
  const showText = responsiveMedia?.showText ?? true;
  const desktop = responsiveMedia?.desktop ?? banner.image_url;
  const mobile = responsiveMedia?.mobile;
  const alt = responsiveMedia?.alt ?? banner.title;
  const href = isSafeBannerDestination(banner.cta_href) ? banner.cta_href : undefined;
  return (
    <section
      className={`mobi-hero ${showText ? "mobi-hero-product" : "mobi-hero-art"}`}
      data-preview-format={previewViewport}
      aria-label={
        previewViewport
          ? `Prévia ${previewViewport === "mobile" ? "celular" : "computador"}`
          : undefined
      }
    >
      {showText && (
        <div className="mobi-hero-copy">
          {banner.eyebrow && <span className="mobi-eyebrow">{banner.eyebrow}</span>}
          <h1>{banner.title}</h1>
          {banner.subtitle && <p>{banner.subtitle}</p>}
          {banner.cta_label &&
            (href ? (
              <a href={href} className="mobi-gold">
                {banner.cta_label}
                <span aria-hidden="true">↗</span>
              </a>
            ) : (
              <span className="mobi-gold" aria-disabled="true">
                {banner.cta_label}
              </span>
            ))}
          {children}
        </div>
      )}
      <picture className="mobi-hero-media">
        {!previewViewport && <source media="(max-width:767px)" srcSet={mobile || desktop} />}
        <ImageWithFallback
          src={previewViewport === "mobile" ? mobile || desktop : desktop}
          alt={alt}
          className="mobi-hero-image"
          fetchPriority="high"
        />
      </picture>
      {!showText && (
        <>
          {href && <a className="mobi-hero-art-link" href={href} aria-label={alt} />} {children}
        </>
      )}
    </section>
  );
}
